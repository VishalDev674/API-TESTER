"""
Shadow API Tester — Pydantic Schemas
"""
from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict, Any, List
from datetime import datetime


# --- API Endpoint Schemas ---
class EndpointCreate(BaseModel):
    name: str
    url: str
    method: str = "GET"
    headers: Dict[str, str] = {}
    body: Optional[Dict[str, Any]] = None
    expected_schema: Optional[Dict[str, Any]] = None
    expected_status: int = 200


class EndpointUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    method: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    body: Optional[Dict[str, Any]] = None
    expected_schema: Optional[Dict[str, Any]] = None
    expected_status: Optional[int] = None
    is_active: Optional[bool] = None


class EndpointResponse(BaseModel):
    id: int
    name: str
    url: str
    method: str
    headers: Dict[str, str]
    body: Optional[Dict[str, Any]]
    expected_schema: Optional[Dict[str, Any]]
    expected_status: int
    is_active: bool
    is_mock: bool
    last_status: Optional[int] = None
    last_response_ms: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Ping Result Schemas ---
class PingResultResponse(BaseModel):
    id: int
    endpoint_id: int
    status_code: Optional[int]
    response_time_ms: Optional[float]
    success: bool
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Heal Event Schemas ---
class HealEventResponse(BaseModel):
    id: int
    endpoint_id: int
    failure_type: str
    heal_step: str
    heal_result: str
    ai_analysis: Optional[str]
    details: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Dashboard Stats ---
class DashboardStats(BaseModel):
    total_pings: int
    success_rate: float
    active_heals: int
    avg_response_ms: float
    total_endpoints: int
    active_endpoints: int
    uptime_percent: float
    pings_last_hour: int


# --- Stress Test ---
class StressTestRequest(BaseModel):
    endpoint_id: Optional[int] = None
    concurrency: int = 500


class StressTestResponse(BaseModel):
    id: int
    total_pings: int
    success_count: int
    fail_count: int
    avg_response_ms: Optional[float]
    min_response_ms: Optional[float]
    max_response_ms: Optional[float]
    duration_seconds: Optional[float]
    status: str
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


# --- WebSocket Messages ---
class WSMessage(BaseModel):
    channel: str  # pings, heals, ai_thoughts, system_metrics, stress
    data: Dict[str, Any]
