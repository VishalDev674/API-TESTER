"""
Shadow API Tester — Built-in Mock API Server
Provides 2 demo endpoints with configurable failure modes for testing the auto-healer.
"""
import asyncio
import random
import time
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/mock", tags=["Mock API"])

# --- Mock Data ---
MOCK_USERS = [
    {"user_id": 1, "name": "Ada Lovelace", "email": "ada@shadow.io", "role": "admin", "status": "active"},
    {"user_id": 2, "name": "Alan Turing", "email": "alan@shadow.io", "role": "engineer", "status": "active"},
    {"user_id": 3, "name": "Grace Hopper", "email": "grace@shadow.io", "role": "devops", "status": "active"},
    {"user_id": 4, "name": "Linus Torvalds", "email": "linus@shadow.io", "role": "engineer", "status": "inactive"},
    {"user_id": 5, "name": "Margaret Hamilton", "email": "margaret@shadow.io", "role": "lead", "status": "active"},
]

MOCK_PRODUCTS = [
    {"product_id": 101, "name": "Shadow Shield Pro", "price": 299.99, "category": "security", "in_stock": True},
    {"product_id": 102, "name": "Quantum Firewall X", "price": 499.99, "category": "security", "in_stock": True},
    {"product_id": 103, "name": "Neural API Gateway", "price": 199.99, "category": "networking", "in_stock": False},
    {"product_id": 104, "name": "Zero-Day Patcher", "price": 149.99, "category": "tools", "in_stock": True},
]

# Schema-mutated versions (for testing auto-schema detection)
MUTATED_USERS = [
    {"uid": u["user_id"], "full_name": u["name"], "email_addr": u["email"], "access_level": u["role"], "is_active": u["status"] == "active"}
    for u in MOCK_USERS
]


@router.get("/users")
async def get_mock_users(
    fail: str = Query(None, description="Failure mode: timeout, 500, schema, random"),
    delay_ms: int = Query(0, description="Artificial delay in milliseconds"),
):
    """Mock Users API — supports configurable failure injection."""
    # Artificial delay
    if delay_ms > 0:
        await asyncio.sleep(delay_ms / 1000)

    # Failure modes
    if fail == "timeout":
        await asyncio.sleep(30)  # Will trigger timeout on client
        return JSONResponse(content={"users": MOCK_USERS})

    elif fail == "500":
        raise HTTPException(status_code=500, detail="Internal Server Error — simulated failure")

    elif fail == "schema":
        # Return mutated schema: user_id -> uid, name -> full_name, etc.
        return JSONResponse(content={
            "users": MUTATED_USERS,
            "total": len(MUTATED_USERS),
            "api_version": "2.0.0-breaking",
        })

    elif fail == "random":
        # 30% chance of random failure
        roll = random.random()
        if roll < 0.1:
            await asyncio.sleep(30)
        elif roll < 0.2:
            raise HTTPException(status_code=500, detail="Random 500 error")
        elif roll < 0.3:
            return JSONResponse(content={"users": MUTATED_USERS, "total": len(MUTATED_USERS)})

    # Normal response
    return JSONResponse(content={
        "users": MOCK_USERS,
        "total": len(MOCK_USERS),
        "api_version": "1.0.0",
    })


@router.get("/products")
async def get_mock_products(
    fail: str = Query(None, description="Failure mode: timeout, 500, schema, random"),
    delay_ms: int = Query(0, description="Artificial delay in milliseconds"),
):
    """Mock Products API — supports configurable failure injection."""
    if delay_ms > 0:
        await asyncio.sleep(delay_ms / 1000)

    if fail == "timeout":
        await asyncio.sleep(30)
        return JSONResponse(content={"products": MOCK_PRODUCTS})

    elif fail == "500":
        raise HTTPException(status_code=503, detail="Service Unavailable — simulated failure")

    elif fail == "schema":
        mutated = [
            {"id": p["product_id"], "title": p["name"], "cost": p["price"], "type": p["category"], "available": p["in_stock"]}
            for p in MOCK_PRODUCTS
        ]
        return JSONResponse(content={"items": mutated, "count": len(mutated)})

    elif fail == "random":
        roll = random.random()
        if roll < 0.15:
            await asyncio.sleep(30)
        elif roll < 0.3:
            raise HTTPException(status_code=502, detail="Bad Gateway")

    return JSONResponse(content={
        "products": MOCK_PRODUCTS,
        "total": len(MOCK_PRODUCTS),
        "api_version": "1.0.0",
    })


@router.get("/broken")
async def get_mock_broken():
    """Consistently broken API to test detection and self-healing flow."""
    raise HTTPException(
        status_code=500, 
        detail="CRITICAL_FAILURE: Database connection pool exhausted. Sector 7G overflow."
    )


@router.get("/health")
async def mock_health():
    """Health check for mock API."""
    return {"status": "healthy", "service": "shadow-mock-api", "timestamp": time.time()}
