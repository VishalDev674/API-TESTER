"""
Shadow API Tester — Dashboard Router (Stats, History, Analytics)
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone, timedelta
from database import get_db
from models import APIEndpoint, PingResult, HealEvent
from schemas import DashboardStats, PingResultResponse, HealEventResponse
from services.healer import auto_healer
from services.rate_limiter import rate_limiter
from services.shadow_worker import shadow_worker
from typing import List

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get aggregated dashboard statistics."""
    # Total pings
    total = await db.execute(select(func.count(PingResult.id)))
    total_pings = total.scalar() or 0

    # Success rate
    successes = await db.execute(
        select(func.count(PingResult.id)).where(PingResult.success == True)
    )
    success_count = successes.scalar() or 0
    success_rate = (success_count / total_pings * 100) if total_pings > 0 else 100.0

    # Active heals
    active_heals = auto_healer.active_heal_count

    # Average response time
    avg_resp = await db.execute(
        select(func.avg(PingResult.response_time_ms)).where(PingResult.response_time_ms.isnot(None))
    )
    avg_ms = avg_resp.scalar() or 0

    # Endpoint counts
    total_eps = await db.execute(select(func.count(APIEndpoint.id)))
    active_eps = await db.execute(
        select(func.count(APIEndpoint.id)).where(APIEndpoint.is_active == True)
    )

    # Pings in last hour
    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
    recent = await db.execute(
        select(func.count(PingResult.id)).where(PingResult.created_at >= one_hour_ago)
    )

    # Uptime (based on last 100 pings)
    last_100 = await db.execute(
        select(PingResult.success)
        .order_by(PingResult.created_at.desc())
        .limit(100)
    )
    last_100_results = last_100.scalars().all()
    uptime = (sum(1 for s in last_100_results if s) / len(last_100_results) * 100) if last_100_results else 100.0

    return DashboardStats(
        total_pings=total_pings,
        success_rate=round(success_rate, 2),
        active_heals=active_heals,
        avg_response_ms=round(avg_ms, 2),
        total_endpoints=total_eps.scalar() or 0,
        active_endpoints=active_eps.scalar() or 0,
        uptime_percent=round(uptime, 2),
        pings_last_hour=recent.scalar() or 0,
    )


@router.get("/history", response_model=List[PingResultResponse])
async def get_ping_history(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    endpoint_id: int = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get paginated ping history."""
    query = select(PingResult).order_by(PingResult.created_at.desc())
    if endpoint_id:
        query = query.where(PingResult.endpoint_id == endpoint_id)
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/heals", response_model=List[HealEventResponse])
async def get_heal_events(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Get heal event history."""
    result = await db.execute(
        select(HealEvent)
        .order_by(HealEvent.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/system")
async def get_system_info():
    """Get current system metrics and worker status."""
    metrics = rate_limiter.get_metrics()
    return {
        "cpu_percent": metrics.cpu_percent,
        "ram_percent": metrics.ram_percent,
        "ram_used_gb": metrics.ram_used_gb,
        "ram_total_gb": metrics.ram_total_gb,
        "throttle_level": metrics.throttle_level,
        "shadow_interval": metrics.shadow_interval,
        "shadow_worker_running": shadow_worker.is_running,
        "total_pings": shadow_worker.total_pings,
        "success_count": shadow_worker.success_count,
    }


@router.post("/worker/start")
async def start_worker():
    """Start the shadow worker."""
    await shadow_worker.start()
    return {"status": "started"}


@router.post("/worker/stop")
async def stop_worker():
    """Stop the shadow worker."""
    await shadow_worker.stop()
    return {"status": "stopped"}
