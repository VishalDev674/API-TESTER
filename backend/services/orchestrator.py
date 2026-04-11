import asyncio
import httpx
import time
import json
from typing import Dict, Any, List, Optional
from services.websocket_manager import ws_manager
from services.healer import auto_healer
from config import settings

class WorkflowEngine:
    """
    Intelligent Orchestration Engine for API Workflows.
    Manages node execution, error classification, and autonomous healing.
    """

    def __init__(self):
        self.active_workflows = {}
        # Simple circuit breaker state (node_id -> failure_count)
        self._circuit_breaker = {}
        self.MAX_RETRY = 3

    async def orchestrate(self, workflow: Dict[str, Any], initial_input: Dict[str, Any] = None):
        """
        Main entry point for executing an API workflow.
        workflow: { "id": "wf_1", "nodes": [...] }
        """
        workflow_id = workflow.get("id", "temp_wf")
        nodes = {n["id"]: n for n in workflow.get("nodes", [])}
        current_node_id = workflow.get("startNode")
        
        context = initial_input or {}
        workflow_logs = []

        await self._log(workflow_id, f"🚀 Initializing workflow: {workflow_id}")

        while current_node_id:
            node = nodes.get(current_node_id)
            if not node:
                break

            await self._log(workflow_id, f"📍 Executing Node: [{current_node_id}] ({node['type']})")
            
            try:
                # 1. Execute the node
                result = await self.execute_node(node, context)
                
                # 2. Update context with result
                context[node["id"]] = result
                
                # 3. Transition to next node
                current_node_id = node.get("onSuccess")
                await self._log(workflow_id, f"✅ Node [{node['id']}] SUCCEEDED. Moving to next.")

            except OrchestrationError as e:
                await self._log(workflow_id, f"⚠️ Node [{node['id']}] FAILED: {e.error_type} - {e.message}", level="error")
                
                # 4. Handle Healing / Error Transition
                healing_success = await self.handle_healing(node, context, e)
                
                if healing_success:
                    await self._log(workflow_id, f"✨ Auto-healing SUCCESSFUL for [{node['id']}]. Continuing...")
                    # Continue based on node logic (usually same node or retry)
                    # For this simple engine, we'll try to re-execute or follow onError
                    if node.get("onSuccess"):
                        current_node_id = node.get("onSuccess")
                    else:
                        break
                else:
                    await self._log(workflow_id, f"❌ Auto-healing FAILED for [{node['id']}]. Escalating error.", level="critical")
                    current_node_id = node.get("onError")
                    if not current_node_id:
                        await self._log(workflow_id, "☠️ Workflow TERMINATED: No error handler defined.")
                        break

        await self._log(workflow_id, "🏁 Workflow execution COMPLETE.")
        return context

    async def execute_node(self, node: Dict[str, Any], context: Dict[str, Any]):
        """Executes an individual node logic (Request, Transformation, etc)."""
        node_id = node["id"]
        
        # Check Circuit Breaker
        if self._circuit_breaker.get(node_id, 0) >= 5:
            raise OrchestrationError("CIRCUIT_OPEN", "Circuit breaker active for this node.")

        if node["type"] == "request":
            return await self._execute_request(node, context)
        elif node["type"] == "transform":
            return self._execute_transform(node, context)
        else:
            raise OrchestrationError("UNKNOWN_NODE_TYPE", f"Type {node['type']} is not supported.")

    async def _execute_request(self, node: Dict[str, Any], context: Dict[str, Any]):
        """Performs a structured API request with error classification."""
        config = node.get("config", {})
        method = config.get("method", "GET")
        url = config.get("url")
        
        # Simple variable replacement (e.g., {{node_id.data}})
        if "{{" in url:
             for key, val in context.items():
                 # Handle basic field extraction (simple mock logic)
                 if isinstance(val, dict):
                     for k2, v2 in val.items():
                         url = url.replace(f"{{{{{key}.{k2}}}}}", str(v2))

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.request(
                    method=method,
                    url=url,
                    headers=config.get("headers"),
                    json=config.get("body")
                )
                
                # Classify Errors
                if resp.status_code >= 500:
                    raise OrchestrationError("SERVER_ERROR", "Target service returned 500+", resp.status_code)
                elif resp.status_code == 429:
                    raise OrchestrationError("RATE_LIMITED", "API rate limit exceeded", 429)
                elif resp.status_code >= 400:
                    raise OrchestrationError("CLIENT_ERROR", f"API returned {resp.status_code}", resp.status_code)
                
                return resp.json()

        except httpx.TimeoutException:
            raise OrchestrationError("TIMEOUT", "Request timed out")
        except Exception as e:
            raise OrchestrationError("CONNECTION_FAILED", str(e))

    def _execute_transform(self, node: Dict[str, Any], context: Dict[str, Any]):
        """Simple data transformation node."""
        # Logic here for hackathon level data mapping
        return {"transformed": True, "timestamp": time.time()}

    async def handle_healing(self, node: Dict[str, Any], context: Dict[str, Any], error: 'OrchestrationError'):
        """
        Auto-Healing Module: Retry with backoff, Fallback switching.
        """
        node_id = node["id"]
        
        # 1. Exponential Backoff Retry
        if error.error_type in ["TIMEOUT", "SERVER_ERROR", "RATE_LIMITED"]:
            for attempt in range(1, self.MAX_RETRY + 1):
                backoff = attempt * 2 # 2s, 4s, 6s
                await ws_manager.broadcast("ai_thoughts", {
                    "message": f"[HEAL] Orchestrator retrying Node [{node_id}] in {backoff}s (Attempt {attempt}/{self.MAX_RETRY})",
                    "level": "heal"
                })
                await asyncio.sleep(backoff)
                
                try:
                    await self.execute_node(node, context)
                    return True # Recovery success
                except OrchestrationError:
                    continue
        
        # 2. API Fallback Switching
        fallback_url = node.get("config", {}).get("fallbackUrl")
        if fallback_url:
            await ws_manager.broadcast("ai_thoughts", {
                "message": f"[HEAL] Switching Node [{node_id}] to Fallback API: {fallback_url}",
                "level": "warning"
            })
            node["config"]["url"] = fallback_url
            try:
                await self.execute_node(node, context)
                return True
            except OrchestrationError:
                pass

        # Update circuit breaker on ultimate failure
        self._circuit_breaker[node_id] = self._circuit_breaker.get(node_id, 0) + 1
        return False

    async def _log(self, workflow_id: str, message: str, level: str = "info"):
        """Broadcasts orchestration logs to the UI."""
        await ws_manager.broadcast("ai_thoughts", {
            "message": f"[ORCHESTRATOR][{workflow_id}] {message}",
            "level": level
        })

class OrchestrationError(Exception):
    def __init__(self, error_type: str, message: str, status_code: Optional[int] = None):
        self.error_type = error_type
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

# Singleton
orchestrator = WorkflowEngine()
