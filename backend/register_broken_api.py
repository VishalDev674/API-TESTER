import asyncio
from database import AsyncSessionLocal
from models import APIEndpoint
from config import settings

async def add_broken_endpoint():
    async with AsyncSessionLocal() as db:
        new_ep = APIEndpoint(
            name="Critical Infrastructure API",
            url=f"http://127.0.0.1:{settings.PORT}/mock/broken",
            method="GET",
            expected_status=200,
            is_active=True,
            is_mock=True,
        )
        db.add(new_ep)
        await db.commit()
        print(f"Added broken endpoint: {new_ep.url}")

if __name__ == "__main__":
    asyncio.run(add_broken_endpoint())
