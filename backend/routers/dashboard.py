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


@router.get("/analytics")
async def get_analytics(
    hours: int = Query(24, ge=1, le=168),
    buckets: int = Query(30, ge=6, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get time-series analytics data for charts."""
    now = datetime.now(timezone.utc)
    start_time = now - timedelta(hours=hours)
    bucket_seconds = (hours * 3600) / buckets

    # Fetch all pings in the time range
    result = await db.execute(
        select(
            PingResult.created_at,
            PingResult.response_time_ms,
            PingResult.success,
            PingResult.status_code,
            PingResult.endpoint_id,
        )
        .where(PingResult.created_at >= start_time)
        .order_by(PingResult.created_at.asc())
    )
    rows = result.all()

    # Build time buckets
    timeline = []
    for i in range(buckets):
        bucket_start = start_time + timedelta(seconds=i * bucket_seconds)
        bucket_end = start_time + timedelta(seconds=(i + 1) * bucket_seconds)

        bucket_pings = [
            r for r in rows
            if bucket_start <= (r.created_at.replace(tzinfo=timezone.utc) if r.created_at.tzinfo is None else r.created_at) < bucket_end
        ]

        total = len(bucket_pings)
        successes = sum(1 for p in bucket_pings if p.success)
        failures = total - successes
        response_times = [p.response_time_ms for p in bucket_pings if p.response_time_ms is not None]
        avg_ms = round(sum(response_times) / len(response_times), 2) if response_times else 0
        min_ms = round(min(response_times), 2) if response_times else 0
        max_ms = round(max(response_times), 2) if response_times else 0
        p95_ms = 0
        if response_times:
            sorted_rt = sorted(response_times)
            p95_idx = int(len(sorted_rt) * 0.95)
            p95_ms = round(sorted_rt[min(p95_idx, len(sorted_rt) - 1)], 2)

        timeline.append({
            "time": bucket_start.isoformat(),
            "label": bucket_start.strftime("%H:%M"),
            "total": total,
            "success": successes,
            "failure": failures,
            "avg_ms": avg_ms,
            "min_ms": min_ms,
            "max_ms": max_ms,
            "p95_ms": p95_ms,
            "success_rate": round((successes / total * 100), 1) if total > 0 else 100,
        })

    # Per-endpoint summary
    endpoint_ids = set(r.endpoint_id for r in rows)
    endpoints_summary = []
    for eid in endpoint_ids:
        ep_pings = [r for r in rows if r.endpoint_id == eid]
        ep_rts = [p.response_time_ms for p in ep_pings if p.response_time_ms is not None]
        ep_name_result = await db.execute(
            select(APIEndpoint.name).where(APIEndpoint.id == eid)
        )
        ep_name = ep_name_result.scalar() or f"Endpoint #{eid}"
        endpoints_summary.append({
            "id": eid,
            "name": ep_name,
            "total_pings": len(ep_pings),
            "success_count": sum(1 for p in ep_pings if p.success),
            "avg_ms": round(sum(ep_rts) / len(ep_rts), 2) if ep_rts else 0,
        })

    return {
        "timeline": timeline,
        "endpoints": sorted(endpoints_summary, key=lambda x: x["total_pings"], reverse=True),
        "period_hours": hours,
        "total_pings": len(rows),
        "overall_success_rate": round(
            sum(1 for r in rows if r.success) / len(rows) * 100, 1
        ) if rows else 100,
    }


@router.get("/incidents")
async def get_incidents(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get recent incidents with full error-to-resolution flow for the Incident Response panel."""
    # Get recent failed pings
    failed_pings = await db.execute(
        select(PingResult)
        .where(PingResult.success == False)
        .order_by(PingResult.created_at.desc())
        .limit(limit)
    )
    pings = failed_pings.scalars().all()

    incidents = []
    for ping in pings:
        # Get the endpoint info
        ep_result = await db.execute(
            select(APIEndpoint).where(APIEndpoint.id == ping.endpoint_id)
        )
        endpoint = ep_result.scalar_one_or_none()

        # Get associated heal events (within a 5-minute window after this ping)
        heal_result = await db.execute(
            select(HealEvent)
            .where(
                and_(
                    HealEvent.endpoint_id == ping.endpoint_id,
                    HealEvent.created_at >= ping.created_at,
                    HealEvent.created_at <= ping.created_at + timedelta(minutes=5),
                )
            )
            .order_by(HealEvent.created_at.asc())
        )
        heals = heal_result.scalars().all()

        # Parse AI analysis from the heal event if available
        ai_rca = None
        for h in heals:
            if h.ai_analysis:
                try:
                    import json
                    ai_rca = json.loads(h.ai_analysis) if isinstance(h.ai_analysis, str) else h.ai_analysis
                except (json.JSONDecodeError, TypeError):
                    ai_rca = {"cause": h.ai_analysis, "severity": "unknown", "recommendation": "See details", "confidence": 0}
                break

        resolved = any(h.heal_result == "success" for h in heals)
        resolution_step = next(
            (h.heal_step for h in heals if h.heal_result == "success"), None
        )

        incidents.append({
            "id": ping.id,
            "endpoint_name": endpoint.name if endpoint else "Unknown",
            "endpoint_url": endpoint.url if endpoint else "",
            "method": endpoint.method if endpoint else "GET",
            "status_code": ping.status_code,
            "error_message": ping.error_message,
            "response_time_ms": ping.response_time_ms,
            "detected_at": ping.created_at.isoformat(),
            "heal_steps": [
                {
                    "step": h.heal_step,
                    "result": h.heal_result,
                    "failure_type": h.failure_type,
                    "ai_analysis": h.ai_analysis,
                    "details": h.details,
                    "timestamp": h.created_at.isoformat(),
                }
                for h in heals
            ],
            "ai_rca": ai_rca,
            "resolved": resolved,
            "resolution_step": resolution_step,
        })

    return incidents
