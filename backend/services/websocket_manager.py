"""
Shadow API Tester — WebSocket Manager
Central hub for real-time communication with the React dashboard.
"""
import json
import asyncio
from typing import Dict, List, Set
from fastapi import WebSocket
from datetime import datetime, timezone


class WebSocketManager:
    """Manages WebSocket connections and broadcasts messages to all clients."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connections.append(websocket)
        print(f"[WS] Client connected. Total: {len(self.active_connections)}")

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
        print(f"[WS] Client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, channel: str, data: dict):
        """Broadcast a message to all connected clients on a specific channel."""
        message = json.dumps({
            "channel": channel,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        async with self._lock:
            dead = []
            for conn in self.active_connections:
                try:
                    await conn.send_text(message)
                except Exception:
                    dead.append(conn)
            for conn in dead:
                self.active_connections.remove(conn)

    async def send_personal(self, websocket: WebSocket, channel: str, data: dict):
        """Send a message to a specific client."""
        message = json.dumps({
            "channel": channel,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        try:
            await websocket.send_text(message)
        except Exception:
            await self.disconnect(websocket)

    @property
    def client_count(self):
        return len(self.active_connections)


# Singleton instance
ws_manager = WebSocketManager()
