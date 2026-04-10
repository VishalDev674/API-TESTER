"""
Shadow API Tester — Stress Test Router
"""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import StressTestRun
from schemas import StressTestRequest, StressTestResponse
from services.stress_tester import stress_tester
from typing import List
import asyncio

router = APIRouter(prefix="/api/stress", tags=["Stress Test"])


@router.post("/start")
async def start_stress_test(req: StressTestRequest):
    """Start a 500-user stress test simulation."""
    if stress_tester.is_running:
        return {"error": "Stress test already running", "run_id": stress_tester.current_run_id}

    # Run in background task so the response returns immediately
    asyncio.create_task(stress_tester.start(
        endpoint_id=req.endpoint_id,
        concurrency=req.concurrency,
    ))

    return {
        "status": "initiated",
        "concurrency": req.concurrency,
        "message": "Stress test starting. Watch the Ping Matrix for real-time results.",
    }


@router.get("/status")
async def stress_test_status():
    """Get current stress test status."""
    return {
        "running": stress_tester.is_running,
        "run_id": stress_tester.current_run_id,
    }


@router.post("/stop")
async def stop_stress_test():
    """Abort the current stress test."""
    if not stress_tester.is_running:
        return {"error": "No stress test running"}
    stress_tester.abort()
    return {"status": "aborting"}


@router.get("/history", response_model=List[StressTestResponse])
async def stress_test_history(db: AsyncSession = Depends(get_db)):
    """Get stress test run history."""
    result = await db.execute(
        select(StressTestRun).order_by(StressTestRun.created_at.desc()).limit(20)
    )
    return result.scalars().all()
