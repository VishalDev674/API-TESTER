"""
Shadow API Tester — Stress Tester
Simulates 500 concurrent users hitting an API endpoint.
"""
import asyncio
import time
import httpx
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy import select
from database import AsyncSessionLocal
from models import APIEndpoint, StressTestRun
from services.websocket_manager import ws_manager
from config import settings


class StressTester:
    """Simulates 500 concurrent users for stress testing."""

    def __init__(self):
        self._running = False
        self._current_run_id: Optional[int] = None
        self._abort = False

    async def start(self, endpoint_id: Optional[int] = None, concurrency: int = 500) -> Dict[str, Any]:
        """Start a stress test run."""
        if self._running:
            return {"error": "Stress test already running", "run_id": self._current_run_id}

        self._running = True
        self._abort = False

        async with AsyncSessionLocal() as db:
            # Get target endpoint
            if endpoint_id:
                result = await db.execute(
                    select(APIEndpoint).where(APIEndpoint.id == endpoint_id)
                )
                endpoint = result.scalar_one_or_none()
                if not endpoint:
                    self._running = False
                    return {"error": f"Endpoint {endpoint_id} not found"}
                target_url = endpoint.url
                target_method = endpoint.method
                target_headers = endpoint.headers or {}
                target_name = endpoint.name
            else:
                # Default to mock API
                target_url = "http://127.0.0.1:8000/mock/users"
                target_method = "GET"
                target_headers = {}
                target_name = "Mock Users API"

            # Create stress test run record
            run = StressTestRun(
                total_pings=concurrency,
                status="running",
            )
            db.add(run)
            await db.commit()
            await db.refresh(run)
            self._current_run_id = run.id

        await ws_manager.broadcast("ai_thoughts", {
            "message": f"STRESS TEST INITIATED: {concurrency} concurrent users targeting [{target_name}]",
            "level": "warning",
        })

        await ws_manager.broadcast("stress", {
            "status": "started",
            "run_id": self._current_run_id,
            "concurrency": concurrency,
            "target": target_name,
        })

        # Run the stress test
        start_time = time.perf_counter()
        results = await self._execute_stress(
            target_url, target_method, target_headers, concurrency
        )
        duration = time.perf_counter() - start_time

        # Calculate stats
        successes = sum(1 for r in results if r["success"])
        failures = len(results) - successes
        response_times = [r["time_ms"] for r in results if r["time_ms"] is not None]
        avg_ms = sum(response_times) / len(response_times) if response_times else 0
        min_ms = min(response_times) if response_times else 0
        max_ms = max(response_times) if response_times else 0

        # Update DB
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(StressTestRun).where(StressTestRun.id == self._current_run_id)
            )
            run = result.scalar_one()
            run.success_count = successes
            run.fail_count = failures
            run.avg_response_ms = round(avg_ms, 2)
            run.min_response_ms = round(min_ms, 2)
            run.max_response_ms = round(max_ms, 2)
            run.duration_seconds = round(duration, 2)
            run.status = "aborted" if self._abort else "completed"
            run.completed_at = datetime.now(timezone.utc)
            db.add(run)
            await db.commit()

        self._running = False

        summary = {
            "status": "completed",
            "run_id": self._current_run_id,
            "total": concurrency,
            "success": successes,
            "failed": failures,
            "avg_ms": round(avg_ms, 2),
            "min_ms": round(min_ms, 2),
            "max_ms": round(max_ms, 2),
            "duration_s": round(duration, 2),
        }

        await ws_manager.broadcast("stress", summary)
        await ws_manager.broadcast("ai_thoughts", {
            "message": f"STRESS TEST COMPLETE: {successes}/{concurrency} succeeded "
                       f"({round(successes/concurrency*100, 1)}%) in {round(duration, 2)}s. "
                       f"Avg: {round(avg_ms, 1)}ms, Max: {round(max_ms, 1)}ms",
            "level": "analysis",
        })

        return summary

    async def _execute_stress(
        self, url: str, method: str, headers: Dict, concurrency: int
    ) -> list:
        """Fire off concurrent requests in batches to avoid Windows FD limits."""
        BATCH_SIZE = 50  # Stay well under Windows' 512 FD select() limit
        all_results = []

        async with httpx.AsyncClient(
            timeout=settings.SHADOW_TIMEOUT_SECONDS,
            limits=httpx.Limits(max_connections=50, max_keepalive_connections=25),
        ) as client:

            async def single_ping(index: int) -> Dict:
                if self._abort:
                    return {"index": index, "success": False, "time_ms": None, "error": "Aborted"}

                start = time.perf_counter()
                try:
                    resp = await client.request(method=method, url=url, headers=headers)
                    elapsed = (time.perf_counter() - start) * 1000
                    success = resp.status_code < 400

                    # Broadcast individual ping result for matrix visualization
                    await ws_manager.broadcast("stress_ping", {
                        "index": index,
                        "success": success,
                        "status_code": resp.status_code,
                        "time_ms": round(elapsed, 2),
                    })

                    return {
                        "index": index,
                        "success": success,
                        "status_code": resp.status_code,
                        "time_ms": round(elapsed, 2),
                        "error": None,
                    }
                except Exception as e:
                    elapsed = (time.perf_counter() - start) * 1000
                    await ws_manager.broadcast("stress_ping", {
                        "index": index,
                        "success": False,
                        "status_code": None,
                        "time_ms": round(elapsed, 2),
                        "error": str(e)[:100],
                    })
                    return {
                        "index": index,
                        "success": False,
                        "status_code": None,
                        "time_ms": round(elapsed, 2),
                        "error": str(e),
                    }

            # Process in batches to avoid too-many-FDs on Windows
            for batch_start in range(0, concurrency, BATCH_SIZE):
                if self._abort:
                    break
                batch_end = min(batch_start + BATCH_SIZE, concurrency)
                tasks = [single_ping(i) for i in range(batch_start, batch_end)]
                results = await asyncio.gather(*tasks, return_exceptions=True)

                for i, r in enumerate(results):
                    if isinstance(r, Exception):
                        all_results.append({
                            "index": batch_start + i,
                            "success": False,
                            "time_ms": None,
                            "error": str(r),
                        })
                    else:
                        all_results.append(r)

        return all_results

    def abort(self):
        """Abort the current stress test."""
        self._abort = True

    @property
    def is_running(self) -> bool:
        return self._running

    @property
    def current_run_id(self) -> Optional[int]:
        return self._current_run_id


# Singleton
stress_tester = StressTester()
