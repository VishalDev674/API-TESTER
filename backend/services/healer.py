"""
Shadow API Tester — Auto-Healer
3-step healing sequence: Retry -> Parameter Adjustment -> Mock Fallback
"""
import asyncio
import httpx
import json
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from models import HealEvent, APIEndpoint
from services.ai_engine import ai_engine
from services.schema_detector import schema_detector
from services.websocket_manager import ws_manager
from config import settings


class AutoHealer:
    """Implements the 3-step auto-healing sequence for failed API pings."""

    def __init__(self):
        self.active_heals: Dict[int, str] = {}  # endpoint_id -> current_step

    async def heal(
        self,
        db: AsyncSession,
        endpoint: APIEndpoint,
        failure_type: str,
        status_code: Optional[int] = None,
        error_message: Optional[str] = None,
        response_body: Optional[str] = None,
        response_time_ms: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Execute the 3-step healing sequence."""
        endpoint_id = endpoint.id
        self.active_heals[endpoint_id] = "retry"

        await ws_manager.broadcast("heals", {
            "endpoint_id": endpoint_id,
            "endpoint_name": endpoint.name,
            "step": "started",
            "failure_type": failure_type,
        })

        # --- Step 1: Retry ---
        await ws_manager.broadcast("ai_thoughts", {
            "message": f"[HEAL] Step 1/3: Retrying [{endpoint.name}] with exponential backoff...",
            "level": "heal",
        })
        retry_result = await self._retry(endpoint)
        if retry_result["success"]:
            await self._log_heal(db, endpoint_id, failure_type, "retry", "success", "Retry succeeded")
            del self.active_heals[endpoint_id]
            return retry_result

        # --- Step 2: Parameter Adjustment ---
        self.active_heals[endpoint_id] = "param_adjust"
        await ws_manager.broadcast("ai_thoughts", {
            "message": f"[HEAL] Step 2/3: Adjusting parameters for [{endpoint.name}]...",
            "level": "heal",
        })
        adjust_result = await self._adjust_params(endpoint)
        if adjust_result["success"]:
            await self._log_heal(db, endpoint_id, failure_type, "param_adjust", "success", "Parameter adjustment fixed the issue")
            del self.active_heals[endpoint_id]
            return adjust_result

        # --- Step 3: Mock Fallback ---
        self.active_heals[endpoint_id] = "mock_fallback"
        await ws_manager.broadcast("ai_thoughts", {
            "message": f"[HEAL] Step 3/3: Falling back to Mock API for [{endpoint.name}]...",
            "level": "warning",
        })
        mock_result = await self._mock_fallback(endpoint)

        # Run AI RCA in background
        ai_analysis = await ai_engine.analyze_failure(
            endpoint.name, endpoint.url, status_code,
            error_message, response_body, response_time_ms,
            endpoint.expected_schema,
        )

        await self._log_heal(
            db, endpoint_id, failure_type, "mock_fallback",
            "success" if mock_result["success"] else "failed",
            json.dumps(ai_analysis),
            details=ai_analysis,
        )

        if endpoint_id in self.active_heals:
            del self.active_heals[endpoint_id]
        return mock_result

    async def heal_schema(
        self,
        db: AsyncSession,
        endpoint: APIEndpoint,
        actual_response: Any,
    ) -> Optional[Dict]:
        """Handle schema mismatch healing."""
        self.active_heals[endpoint.id] = "schema_detect"

        new_schema = await schema_detector.detect_and_heal(
            endpoint.name, endpoint.expected_schema, actual_response,
        )

        if new_schema:
            # Auto-update the endpoint's expected schema
            endpoint.expected_schema = new_schema
            endpoint.updated_at = datetime.now(timezone.utc)
            db.add(endpoint)
            await db.commit()

            await self._log_heal(
                db, endpoint.id, "schema_mismatch", "schema_auto_fix", "success",
                f"Schema auto-updated for {endpoint.name}",
                details={"new_schema": new_schema},
            )

            await ws_manager.broadcast("heals", {
                "endpoint_id": endpoint.id,
                "endpoint_name": endpoint.name,
                "step": "schema_auto_fix",
                "result": "success",
            })

        if endpoint.id in self.active_heals:
            del self.active_heals[endpoint.id]

        return new_schema

    async def _retry(self, endpoint: APIEndpoint) -> Dict:
        """Retry with exponential backoff (up to 3 attempts)."""
        for attempt in range(1, settings.MAX_RETRIES + 1):
            backoff = 2 ** (attempt - 1)  # 1s, 2s, 4s
            await asyncio.sleep(backoff)

            await ws_manager.broadcast("ai_thoughts", {
                "message": f"  Retry attempt {attempt}/{settings.MAX_RETRIES} (backoff: {backoff}s)...",
                "level": "info",
            })

            try:
                async with httpx.AsyncClient(timeout=settings.SHADOW_TIMEOUT_SECONDS) as client:
                    resp = await client.request(
                        method=endpoint.method,
                        url=endpoint.url,
                        headers=endpoint.headers or {},
                        json=endpoint.body if endpoint.method in ("POST", "PUT", "PATCH") else None,
                    )
                    if resp.status_code < 400:
                        return {"success": True, "step": "retry", "attempt": attempt, "status_code": resp.status_code}
            except Exception as e:
                continue

        return {"success": False, "step": "retry", "error": "All retries exhausted"}

    async def _adjust_params(self, endpoint: APIEndpoint) -> Dict:
        """Try adjusting request parameters to fix the issue."""
        adjustments = [
            # Try adding common headers
            {"Accept": "application/json", "Content-Type": "application/json"},
            # Try with longer timeout
            {"User-Agent": "ShadowAPITester/1.0"},
            # Try with no custom headers (clean request)
            {},
        ]

        for i, headers in enumerate(adjustments):
            await ws_manager.broadcast("ai_thoughts", {
                "message": f"  Adjustment {i+1}/{len(adjustments)}: trying header set {list(headers.keys()) or ['clean']}",
                "level": "info",
            })

            try:
                merged_headers = {**(endpoint.headers or {}), **headers}
                async with httpx.AsyncClient(timeout=settings.SHADOW_TIMEOUT_SECONDS * 2) as client:
                    resp = await client.request(
                        method=endpoint.method,
                        url=endpoint.url,
                        headers=merged_headers,
                        json=endpoint.body if endpoint.method in ("POST", "PUT", "PATCH") else None,
                    )
                    if resp.status_code < 400:
                        return {"success": True, "step": "param_adjust", "adjustment": i + 1, "status_code": resp.status_code}
            except Exception:
                continue

        return {"success": False, "step": "param_adjust", "error": "All adjustments failed"}

    async def _mock_fallback(self, endpoint: APIEndpoint) -> Dict:
        """Fall back to the built-in mock API."""
        try:
            mock_url = "http://127.0.0.1:8000/mock/users"
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(mock_url)
                if resp.status_code == 200:
                    await ws_manager.broadcast("ai_thoughts", {
                        "message": f"  Mock fallback successful. Real endpoint [{endpoint.name}] needs manual attention.",
                        "level": "warning",
                    })
                    return {"success": True, "step": "mock_fallback", "status_code": 200, "mock": True}
        except Exception as e:
            pass

        return {"success": False, "step": "mock_fallback", "error": "Mock API also failed"}

    async def _log_heal(
        self, db: AsyncSession, endpoint_id: int,
        failure_type: str, step: str, result: str,
        analysis: Optional[str] = None,
        details: Optional[Dict] = None,
    ):
        """Log a heal event to the database."""
        event = HealEvent(
            endpoint_id=endpoint_id,
            failure_type=failure_type,
            heal_step=step,
            heal_result=result,
            ai_analysis=analysis,
            details=details,
        )
        db.add(event)
        await db.commit()

    @property
    def active_heal_count(self) -> int:
        return len(self.active_heals)


# Singleton
auto_healer = AutoHealer()
