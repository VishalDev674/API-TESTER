"""
Shadow API Tester — API Endpoints Router (CRUD)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import APIEndpoint
from schemas import EndpointCreate, EndpointUpdate, EndpointResponse
from services.healer import auto_healer
from typing import List

router = APIRouter(prefix="/api/endpoints", tags=["Endpoints"])


@router.post("/{endpoint_id}/reset-circuit")
async def reset_circuit(endpoint_id: int):
    """Manually reset the circuit breaker for an endpoint."""
    auto_healer.reset_circuit_breaker(endpoint_id)
    return {"status": "circuit reset", "endpoint_id": endpoint_id}


@router.get("/", response_model=List[EndpointResponse])
async def list_endpoints(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(APIEndpoint).order_by(APIEndpoint.created_at.desc()))
    return result.scalars().all()


@router.post("/", response_model=EndpointResponse)
async def create_endpoint(data: EndpointCreate, db: AsyncSession = Depends(get_db)):
    endpoint = APIEndpoint(**data.model_dump())
    db.add(endpoint)
    await db.commit()
    await db.refresh(endpoint)
    return endpoint


@router.get("/{endpoint_id}", response_model=EndpointResponse)
async def get_endpoint(endpoint_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(APIEndpoint).where(APIEndpoint.id == endpoint_id)
    )
    endpoint = result.scalar_one_or_none()
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    return endpoint


@router.put("/{endpoint_id}", response_model=EndpointResponse)
async def update_endpoint(
    endpoint_id: int,
    data: EndpointUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(APIEndpoint).where(APIEndpoint.id == endpoint_id)
    )
    endpoint = result.scalar_one_or_none()
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(endpoint, key, value)

    db.add(endpoint)
    await db.commit()
    await db.refresh(endpoint)
    return endpoint


@router.delete("/{endpoint_id}")
async def delete_endpoint(endpoint_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(APIEndpoint).where(APIEndpoint.id == endpoint_id)
    )
    endpoint = result.scalar_one_or_none()
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")

    await db.delete(endpoint)
    await db.commit()
    return {"detail": "Endpoint deleted", "id": endpoint_id}
