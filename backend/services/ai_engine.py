"""
Shadow API Tester — AI Engine (Root Cause Analysis)
Integrates with Gemini API (primary) or Ollama (fallback) for intelligent failure analysis.
"""
import json
import asyncio
import traceback
from typing import Optional, Dict, Any
from config import settings
from services.websocket_manager import ws_manager


class AIEngine:
    """AI-powered Root Cause Analysis engine for failed API pings."""

    def __init__(self):
        self.provider = settings.AI_PROVIDER
        self._gemini_model = None
        self._ollama_available = False
        self._initialized = False

    async def initialize(self):
        """Initialize the AI provider."""
        if self._initialized:
            return

        if self.provider == "gemini" and settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self._gemini_model = genai.GenerativeModel("gemini-2.0-flash")
                self._initialized = True
                await self._broadcast_thought("AI Engine initialized with Gemini 2.0 Flash", "info")
                return
            except Exception as e:
                await self._broadcast_thought(f"Gemini init failed: {e}. Falling back to Ollama...", "warning")

        # Try Ollama fallback
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                resp = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=5)
                if resp.status_code == 200:
                    self._ollama_available = True
                    self.provider = "ollama"
                    self._initialized = True
                    await self._broadcast_thought(f"AI Engine initialized with Ollama ({settings.OLLAMA_MODEL})", "info")
                    return
        except Exception:
            pass

        # Fallback to rule-based analysis
        self.provider = "rules"
        self._initialized = True
        await self._broadcast_thought("AI Engine running in rule-based mode (no LLM available)", "warning")

    async def analyze_failure(
        self,
        endpoint_name: str,
        url: str,
        status_code: Optional[int],
        error_message: Optional[str],
        response_body: Optional[str],
        response_time_ms: Optional[float],
        expected_schema: Optional[Dict],
    ) -> Dict[str, Any]:
        """Perform Root Cause Analysis on a failed ping."""
        if not self._initialized:
            await self.initialize()

        await self._broadcast_thought(
            f"Analyzing failure for [{endpoint_name}] at {url}...", "info"
        )

        prompt = self._build_rca_prompt(
            endpoint_name, url, status_code, error_message,
            response_body, response_time_ms, expected_schema
        )

        try:
            if self.provider == "gemini" and self._gemini_model:
                result = await self._gemini_analyze(prompt)
            elif self.provider == "ollama":
                result = await self._ollama_analyze(prompt)
            else:
                result = self._rule_based_analyze(
                    status_code, error_message, response_time_ms
                )

            await self._broadcast_thought(
                f"RCA Complete for [{endpoint_name}]: {result.get('cause', 'Unknown')} "
                f"(Severity: {result.get('severity', 'unknown')}, Confidence: {result.get('confidence', 0)}%)",
                "analysis"
            )
            return result

        except Exception as e:
            await self._broadcast_thought(f"AI analysis error: {str(e)}", "error")
            return self._rule_based_analyze(status_code, error_message, response_time_ms)

    async def analyze_schema_change(
        self,
        endpoint_name: str,
        old_schema: Dict,
        new_response: Dict,
    ) -> Dict[str, Any]:
        """Analyze a schema change and suggest the new expected schema."""
        await self._broadcast_thought(
            f"Detected schema mismatch for [{endpoint_name}]... analyzing new structure", "warning"
        )

        prompt = f"""You are an API schema analysis expert. An API endpoint's response structure has changed.

ENDPOINT: {endpoint_name}

OLD EXPECTED SCHEMA:
{json.dumps(old_schema, indent=2)}

NEW ACTUAL RESPONSE:
{json.dumps(new_response, indent=2)}

Analyze the changes and respond in this exact JSON format:
{{
    "changes": [
        {{"old_field": "field_name", "new_field": "new_name", "change_type": "renamed|removed|added|type_changed"}}
    ],
    "new_schema": {{...the new expected schema...}},
    "breaking": true/false,
    "summary": "Brief description of changes",
    "auto_fix_safe": true/false
}}

Respond with ONLY the JSON, no markdown formatting."""

        try:
            if self.provider == "gemini" and self._gemini_model:
                response = await asyncio.to_thread(
                    self._gemini_model.generate_content, prompt
                )
                text = response.text.strip()
                if text.startswith("```"):
                    text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
                result = json.loads(text)
            elif self.provider == "ollama":
                result = await self._ollama_raw(prompt)
            else:
                result = self._rule_based_schema_analysis(old_schema, new_response)

            await self._broadcast_thought(
                f"Schema analysis complete: {result.get('summary', 'Changes detected')}. "
                f"Auto-fix safe: {result.get('auto_fix_safe', False)}",
                "heal"
            )
            return result

        except Exception as e:
            await self._broadcast_thought(f"Schema analysis error: {e}", "error")
            return self._rule_based_schema_analysis(old_schema, new_response)

    def _build_rca_prompt(self, name, url, status, error, body, time_ms, schema):
        return f"""You are an expert API reliability engineer performing Root Cause Analysis.

FAILED API PING:
- Endpoint: {name}
- URL: {url}
- Status Code: {status}
- Error: {error}
- Response Time: {time_ms}ms
- Response Body (truncated): {str(body)[:500] if body else 'None'}
- Expected Schema: {json.dumps(schema) if schema else 'Not defined'}

Analyze this failure and respond in this exact JSON format:
{{
    "cause": "Brief root cause description",
    "severity": "critical|high|medium|low",
    "recommendation": "What to do to fix it",
    "confidence": 85,
    "category": "timeout|server_error|schema_mismatch|network|dns|auth|rate_limit|unknown"
}}

Respond with ONLY the JSON, no markdown."""

    async def _gemini_analyze(self, prompt: str) -> Dict:
        response = await asyncio.to_thread(
            self._gemini_model.generate_content, prompt
        )
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        return json.loads(text)

    async def _ollama_analyze(self, prompt: str) -> Dict:
        import httpx
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                }
            )
            result = resp.json()
            return json.loads(result["response"])

    async def _ollama_raw(self, prompt: str) -> Dict:
        import httpx
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                }
            )
            result = resp.json()
            return json.loads(result["response"])

    def _rule_based_analyze(self, status, error, time_ms):
        """Fallback rule-based analysis when no LLM is available."""
        if time_ms and time_ms > 10000:
            return {
                "cause": "Request timeout — server took too long to respond",
                "severity": "high",
                "recommendation": "Check server health, network latency, or increase timeout threshold",
                "confidence": 90,
                "category": "timeout",
            }
        elif status and 500 <= status < 600:
            causes = {
                500: "Internal Server Error — server-side crash or unhandled exception",
                502: "Bad Gateway — upstream server unreachable",
                503: "Service Unavailable — server overloaded or in maintenance",
                504: "Gateway Timeout — upstream response too slow",
            }
            return {
                "cause": causes.get(status, f"Server error ({status})"),
                "severity": "critical" if status == 500 else "high",
                "recommendation": "Check server logs, restart service if persistent",
                "confidence": 85,
                "category": "server_error",
            }
        elif error and "timeout" in str(error).lower():
            return {
                "cause": "Connection timeout — target host unreachable or slow",
                "severity": "high",
                "recommendation": "Verify target is online, check DNS and firewall",
                "confidence": 80,
                "category": "timeout",
            }
        elif error and ("connection" in str(error).lower() or "refused" in str(error).lower()):
            return {
                "cause": "Connection refused — target server is down or blocking requests",
                "severity": "critical",
                "recommendation": "Verify the server is running and accepting connections",
                "confidence": 85,
                "category": "network",
            }
        else:
            return {
                "cause": f"Unknown failure (status: {status}, error: {error})",
                "severity": "medium",
                "recommendation": "Manual investigation recommended",
                "confidence": 40,
                "category": "unknown",
            }

    def _rule_based_schema_analysis(self, old_schema, new_response) -> Dict:
        """Simple field-diff based schema analysis."""
        old_keys = set(self._extract_keys(old_schema)) if old_schema else set()
        new_keys = set(self._extract_keys(new_response)) if new_response else set()
        removed = old_keys - new_keys
        added = new_keys - old_keys
        changes = []
        for r in removed:
            changes.append({"old_field": r, "new_field": None, "change_type": "removed"})
        for a in added:
            changes.append({"old_field": None, "new_field": a, "change_type": "added"})
        return {
            "changes": changes,
            "new_schema": new_response,
            "breaking": len(removed) > 0,
            "summary": f"{len(removed)} fields removed, {len(added)} fields added",
            "auto_fix_safe": len(removed) == 0,
        }

    def _extract_keys(self, obj, prefix=""):
        keys = []
        if isinstance(obj, dict):
            for k, v in obj.items():
                full_key = f"{prefix}.{k}" if prefix else k
                keys.append(full_key)
                keys.extend(self._extract_keys(v, full_key))
        elif isinstance(obj, list) and obj:
            keys.extend(self._extract_keys(obj[0], f"{prefix}[]"))
        return keys

    async def _broadcast_thought(self, message: str, level: str = "info"):
        """Send AI thought to the dashboard's AI Thought Stream."""
        await ws_manager.broadcast("ai_thoughts", {
            "message": message,
            "level": level,
        })


# Singleton
ai_engine = AIEngine()
