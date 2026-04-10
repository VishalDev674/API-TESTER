"""
Shadow API Tester — Main Application Entry Point
"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import init_db, AsyncSessionLocal
from models import APIEndpoint
from services.shadow_worker import shadow_worker
from services.rate_limiter import rate_limiter
from services.ai_engine import ai_engine
from services.websocket_manager import ws_manager
from routers import api_endpoints, dashboard, ws
from mock_api import router as mock_router
from sqlalchemy import select


async def seed_demo_endpoints():
    """Seed the database with 2 demo mock endpoints on first run."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(APIEndpoint).where(APIEndpoint.is_mock == True))
        existing = result.scalars().all()
        if existing:
            return  # Already seeded

        demo_endpoints = [
            APIEndpoint(
                name="Mock Users API",
                url=f"http://127.0.0.1:{settings.PORT}/mock/users",
                method="GET",
                expected_schema={
                    "users": [
                        {"user_id": 1, "name": "string", "email": "string", "role": "string", "status": "string"}
                    ],
                    "total": 5,
                    "api_version": "1.0.0",
                },
                expected_status=200,
                is_active=True,
                is_mock=True,
            ),
            APIEndpoint(
                name="Mock Products API",
                url=f"http://127.0.0.1:{settings.PORT}/mock/products",
                method="GET",
                expected_schema={
                    "products": [
                        {"product_id": 101, "name": "string", "price": 0.0, "category": "string", "in_stock": True}
                    ],
                    "total": 4,
                    "api_version": "1.0.0",
                },
                expected_status=200,
                is_active=True,
                is_mock=True,
            ),
        ]

        for ep in demo_endpoints:
            db.add(ep)
        await db.commit()
        print("[INIT] Seeded 2 demo mock endpoints")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown events."""
    # Startup
    print("=" * 60)
    print("   SHADOW API TESTER — Initializing...")
    print("=" * 60)

    await init_db()
    print("[DB] SQLite database initialized with WAL mode")

    await seed_demo_endpoints()

    await ai_engine.initialize()

    # Start background services
    asyncio.create_task(rate_limiter.monitor_loop())
    print("[RATE] Adaptive rate limiter started")

    await shadow_worker.start()
    print("[SHADOW] Shadow worker started")

    print("=" * 60)
    print(f"   Server running at http://127.0.0.1:{settings.PORT}")
    print(f"   Dashboard at http://localhost:5173")
    print("=" * 60)

    yield

    # Shutdown
    print("\n[SHUTDOWN] Stopping services...")
    await shadow_worker.stop()
    rate_limiter.stop()
    print("[SHUTDOWN] Complete.")


# Create FastAPI application
app = FastAPI(
    title="Shadow API Tester",
    description="AI-powered self-healing API testing platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(mock_router)
app.include_router(api_endpoints.router)
app.include_router(dashboard.router)
# Stress router removed — replaced by Incident Response panel
app.include_router(ws.router)


@app.get("/")
async def root():
    return {
        "name": "Shadow API Tester",
        "version": "1.0.0",
        "status": "operational",
        "shadow_worker": shadow_worker.is_running,
        "connected_clients": ws_manager.client_count,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
