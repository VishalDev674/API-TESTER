from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from services.orchestrator import orchestrator

router = APIRouter(prefix="/orchestrator", tags=["Orchestration"])

# Sample Workflow for Demonstration
SAMPLE_WORKFLOW = {
    "id": "shadow_check_v3",
    "startNode": "verify_auth",
    "nodes": [
        {
            "id": "verify_auth",
            "type": "request",
            "config": {
                "method": "GET",
                "url": "http://127.0.0.1:8000/mock/users", # Using internal mock
                "fallbackUrl": "http://127.0.0.1:8000/mock/products"
            },
            "onSuccess": "data_transform",
            "onError": "escalate"
        },
        {
            "id": "data_transform",
            "type": "transform",
            "onSuccess": "finalize_sync",
            "onError": "escalate"
        },
        {
            "id": "finalize_sync",
            "type": "request",
            "config": {
                "method": "POST",
                "url": "http://127.0.0.1:8000/mock/users", # Mock post
            },
            "onSuccess": None,
            "onError": "escalate"
        },
        {
            "id": "escalate",
            "type": "request",
            "config": {
                "method": "GET",
                "url": "http://127.0.0.1:8000/mock/products"
            },
            "onSuccess": None,
            "onError": None
        }
    ]
}

@router.post("/execute")
async def execute_workflow(workflow: Dict[str, Any] = None):
    """Executes an orchestration workflow."""
    wf = workflow or SAMPLE_WORKFLOW
    try:
        result = await orchestrator.orchestrate(wf)
        return {"result": "Workflow complete", "context": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sample")
async def get_sample():
    return SAMPLE_WORKFLOW
