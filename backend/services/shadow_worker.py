"""
Shadow API Tester — Shadow Worker
24/7 background worker that tests APIs on a shadow thread.
"""
import asyncio
import time
import json
import httpx
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import AsyncSessionLocal
from models import APIEndpoint, PingResult
from services.healer import auto_healer
from services.schema_detector import schema_detector
from services.rate_limiter import rate_limiter
from services.websocket_manager import ws_manager
from config import settings


class ShadowWorker:
    """Background worker that continuously shadow-tests all registered API endpoints."""

    def __init__(self):
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self.total_pings = 0
        self.success_count = 0

    async def start(self):
        """Start the shadow worker loop."""
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._run_loop())
        await ws_manager.broadcast("ai_thoughts", {
            "message": "Shadow Worker activated. Beginning 24/7 background API monitoring...",
            "level": "info",
        })

    async def stop(self):
        """Stop the shadow worker."""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        await ws_manager.broadcast("ai_thoughts", {
            "message": "Shadow Worker deactivated.",
            "level": "warning",
        })

    async def _run_loop(self):
        """Main worker loop — runs on a shadow thread, never touches production data."""
        while self._running:
            try:
                # Check rate limiter
                if rate_limiter.should_pause:
                    await ws_manager.broadcast("ai_thoughts", {
                        "message": "Shadow Worker PAUSED — system resources critical. Waiting for relief...",
                        "level": "warning",
                    })
                    await asyncio.sleep(5)
                    continue

                async with AsyncSessionLocal() as db:
                    # Fetch all active endpoints
                    result = await db.execute(
                        select(APIEndpoint).where(APIEndpoint.is_active == True)
                    )
                    endpoints = result.scalars().all()

                    if not endpoints:
                        await asyncio.sleep(rate_limiter.current_interval)
                        continue

                # Shadow test each endpoint with its own session
                tasks = [self._test_endpoint_safe(ep) for ep in endpoints]
                await asyncio.gather(*tasks, return_exceptions=True)

                # Wait for next cycle based on rate limiter
                await asyncio.sleep(rate_limiter.current_interval)

            except asyncio.CancelledError:
                break
            except Exception as e:
                await ws_manager.broadcast("ai_thoughts", {
                    "message": f"Shadow Worker error: {str(e)}",
                    "level": "error",
                })
                await asyncio.sleep(5)

    async def _test_endpoint_safe(self, endpoint: APIEndpoint):
        """Wrapper that provides its own DB session per endpoint test."""
        async with AsyncSessionLocal() as db:
            # Re-attach endpoint to this session to avoid detached instance errors
            merged_ep = await db.merge(endpoint)
            await self._test_endpoint(db, merged_ep)

    async def _test_endpoint(self, db: AsyncSession, endpoint: APIEndpoint):
        """Test a single API endpoint."""
        start = time.perf_counter()
        status_code = None
        response_body = None
        error_message = None
        success = False

        try:
            async with httpx.AsyncClient(timeout=settings.SHADOW_TIMEOUT_SECONDS) as client:
                resp = await client.request(
                    method=endpoint.method,
                    url=endpoint.url,
                    headers=endpoint.headers or {},
                    json=endpoint.body if endpoint.method in ("POST", "PUT", "PATCH") else None,
                )
                elapsed_ms = (time.perf_counter() - start) * 1000
                status_code = resp.status_code
                response_body = resp.text[:2000]  # Truncate for storage
                success = resp.status_code < 400

                # Check for schema mismatch on successful responses
                if success and endpoint.expected_schema:
                    try:
                        actual = resp.json()
                        schema_match, diffs = schema_detector.compare_schemas(
                            endpoint.expected_schema, actual
                        )
                        if not schema_match:
                            success = False
                            error_message = f"Schema mismatch: {len(diffs)} differences"
                            # Trigger schema healing
                            await auto_healer.heal_schema(db, endpoint, actual)
                    except json.JSONDecodeError:
                        pass

        except httpx.TimeoutException:
            elapsed_ms = (time.perf_counter() - start) * 1000
            error_message = "Request timed out"
        except httpx.ConnectError as e:
            elapsed_ms = (time.perf_counter() - start) * 1000
            error_message = f"Connection error: {str(e)}"
        except Exception as e:
            elapsed_ms = (time.perf_counter() - start) * 1000
            error_message = str(e)

        # Update endpoint status
        endpoint.last_status = status_code
        endpoint.last_response_ms = round(elapsed_ms, 2)
        endpoint.updated_at = datetime.now(timezone.utc)

        # Log ping result
        ping = PingResult(
            endpoint_id=endpoint.id,
            status_code=status_code,
            response_time_ms=round(elapsed_ms, 2),
            success=success,
            error_message=error_message,
            response_body=response_body[:500] if response_body else None,
        )
        db.add(ping)
        await db.commit()

        self.total_pings += 1
        if success:
            self.success_count += 1

        # Broadcast ping result
        await ws_manager.broadcast("pings", {
            "endpoint_id": endpoint.id,
            "endpoint_name": endpoint.name,
            "status_code": status_code,
            "response_time_ms": round(elapsed_ms, 2),
            "success": success,
            "error": error_message,
        })

        # Trigger healing if failed (skip if already handled by schema healer)
        if not success and not (error_message or "").startswith("Schema mismatch"):
            # Skip if this endpoint is already being healed (prevent parallel loops)
            if endpoint.id in auto_healer.active_heals:
                await ws_manager.broadcast("ai_thoughts", {
                    "message": f"[GUARD] Skipping heal for [{endpoint.name}] — already in active healing pipeline.",
                    "level": "info",
                })
                return

            failure_type = "timeout" if "timeout" in (error_message or "").lower() else \
                           "5xx" if status_code and status_code >= 500 else \
                           "connection_error"
            await auto_healer.heal(
                db, endpoint, failure_type,
                status_code, error_message,
                response_body, elapsed_ms,
            )

    @property
    def is_running(self) -> bool:
        return self._running


# Singleton
shadow_worker = ShadowWorker()
