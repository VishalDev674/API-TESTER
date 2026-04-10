"""
Shadow API Tester — Adaptive Rate Limiter
Monitors CPU/RAM and throttles shadow tests to maintain system stability.
"""
import psutil
import asyncio
from dataclasses import dataclass
from config import settings
from services.websocket_manager import ws_manager


@dataclass
class SystemMetrics:
    cpu_percent: float
    ram_percent: float
    ram_used_gb: float
    ram_total_gb: float
    throttle_level: str  # "normal", "throttled", "paused"
    shadow_interval: float


class AdaptiveRateLimiter:
    """Monitors system resources and dynamically adjusts shadow test frequency."""

    def __init__(self):
        self.base_interval = settings.SHADOW_INTERVAL_SECONDS
        self.current_interval = self.base_interval
        self.throttle_level = "normal"
        self._running = False

    def get_metrics(self) -> SystemMetrics:
        cpu = psutil.cpu_percent(interval=0.1)
        ram = psutil.virtual_memory()
        return SystemMetrics(
            cpu_percent=cpu,
            ram_percent=ram.percent,
            ram_used_gb=round(ram.used / (1024 ** 3), 2),
            ram_total_gb=round(ram.total / (1024 ** 3), 2),
            throttle_level=self.throttle_level,
            shadow_interval=self.current_interval,
        )

    def calculate_interval(self, cpu: float, ram: float) -> float:
        """Dynamically adjust the shadow test interval based on system load."""
        if cpu > settings.CPU_PAUSE_THRESHOLD or ram > 95:
            self.throttle_level = "paused"
            return 3600.0  # Effectively paused (1 hour interval)
        elif cpu > settings.CPU_THROTTLE_THRESHOLD or ram > settings.RAM_THROTTLE_THRESHOLD:
            self.throttle_level = "throttled"
            # Scale interval: higher load = longer interval
            load_factor = max(cpu, ram) / 100
            return self.base_interval * (1 + load_factor * 4)  # Up to 5x slower
        else:
            self.throttle_level = "normal"
            return self.base_interval

    async def update(self):
        """Update rate limiter based on current system metrics."""
        metrics = self.get_metrics()
        self.current_interval = self.calculate_interval(
            metrics.cpu_percent, metrics.ram_percent
        )
        # Broadcast system metrics to dashboard
        await ws_manager.broadcast("system_metrics", {
            "cpu_percent": metrics.cpu_percent,
            "ram_percent": metrics.ram_percent,
            "ram_used_gb": metrics.ram_used_gb,
            "ram_total_gb": metrics.ram_total_gb,
            "throttle_level": self.throttle_level,
            "shadow_interval": round(self.current_interval, 2),
        })
        return metrics

    async def monitor_loop(self):
        """Background loop that continuously monitors system resources."""
        self._running = True
        while self._running:
            await self.update()
            await asyncio.sleep(2)  # Check every 2 seconds

    def stop(self):
        self._running = False

    @property
    def should_pause(self) -> bool:
        return self.throttle_level == "paused"


# Singleton
rate_limiter = AdaptiveRateLimiter()
