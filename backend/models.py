"""
Shadow API Tester — Database Models
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


def utcnow():
    return datetime.now(timezone.utc)


class APIEndpoint(Base):
    __tablename__ = "api_endpoints"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    url = Column(String(1024), nullable=False)
    method = Column(String(10), default="GET")
    headers = Column(JSON, default=dict)
    body = Column(JSON, nullable=True)
    expected_schema = Column(JSON, nullable=True)
    expected_status = Column(Integer, default=200)
    is_active = Column(Boolean, default=True)
    is_mock = Column(Boolean, default=False)
    last_status = Column(Integer, nullable=True)
    last_response_ms = Column(Float, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    pings = relationship("PingResult", back_populates="endpoint", cascade="all, delete-orphan")
    heals = relationship("HealEvent", back_populates="endpoint", cascade="all, delete-orphan")


class PingResult(Base):
    __tablename__ = "ping_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    endpoint_id = Column(Integer, ForeignKey("api_endpoints.id"), nullable=False)
    status_code = Column(Integer, nullable=True)
    response_time_ms = Column(Float, nullable=True)
    success = Column(Boolean, default=False)
    error_message = Column(Text, nullable=True)
    response_body = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    endpoint = relationship("APIEndpoint", back_populates="pings")


class HealEvent(Base):
    __tablename__ = "heal_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    endpoint_id = Column(Integer, ForeignKey("api_endpoints.id"), nullable=False)
    failure_type = Column(String(50), nullable=False)  # timeout, 5xx, schema_mismatch
    heal_step = Column(String(50), nullable=False)  # retry, param_adjust, mock_fallback, schema_auto_fix
    heal_result = Column(String(50), nullable=False)  # success, failed, escalated
    ai_analysis = Column(Text, nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    endpoint = relationship("APIEndpoint", back_populates="heals")


class StressTestRun(Base):
    __tablename__ = "stress_test_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    total_pings = Column(Integer, default=500)
    success_count = Column(Integer, default=0)
    fail_count = Column(Integer, default=0)
    avg_response_ms = Column(Float, nullable=True)
    min_response_ms = Column(Float, nullable=True)
    max_response_ms = Column(Float, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    status = Column(String(20), default="running")  # running, completed, aborted
    created_at = Column(DateTime, default=utcnow)
    completed_at = Column(DateTime, nullable=True)
