import os
from dotenv import load_dotenv
load_dotenv()
import json
import logging
from typing import Dict, Any, AsyncGenerator
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Import the compiled LangGraph engine and state schema
from graph import medisense_graph
from schemas.state import TumorBoardState

# -------------------------------------------------------------------------
# 1. API Configuration & Logging
# -------------------------------------------------------------------------
logger = logging.getLogger("Medisense.FastAPI")
logger.setLevel(logging.INFO)

app = FastAPI(
    title="Medisense Tumor Board API",
    description="Multi-Agent LLM Backend for Oncology Case Processing",
    version="1.0.0"
)

# Enable CORS for the React/Tailwind frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change to ["http://localhost:3000"] in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------------
# 2. Pydantic API Request Schemas (Frontend -> Backend)
# -------------------------------------------------------------------------
class PatientPayload(BaseModel):
    thread_id: str
    raw_pathology_report: str
    raw_radiology_report: str
    raw_genomics_report: str
    patient_labs: Dict[str, Any]

class PhysicianApproval(BaseModel):
    is_approved: bool
    physician_notes: str = ""
    modified_regimen: str = ""

# -------------------------------------------------------------------------
# 3. Streaming Engine (Server-Sent Events)
# -------------------------------------------------------------------------
async def event_generator(patient_data: PatientPayload) -> AsyncGenerator[str, None]:
    """
    Executes the LangGraph engine asynchronously and yields Server-Sent Events (SSE).
    This allows the frontend to show a live progress bar as each agent activates.
    """
    config = {"configurable": {"thread_id": patient_data.thread_id}}
    
    # Initialize the graph state
    initial_state = {
        "raw_pathology_report": patient_data.raw_pathology_report,
        "raw_radiology_report": patient_data.raw_radiology_report,
        "raw_genomics_report": patient_data.raw_genomics_report,
        "patient_labs": patient_data.patient_labs,
        "retry_count": 0
    }

    try:
        # Stream the graph execution node by node
        # We use astream() because our Guidelines Agent relies on async FastMCP calls
        async for event in medisense_graph.astream(initial_state, config=config):
            for node_name, state_update in event.items():
                logger.info(f"Finished executing node: {node_name}")
                
                # Format payload for SSE (data: {json}\n\n)
                payload = json.dumps({"node": node_name, "status": "completed"})
                yield f"data: {payload}\n\n"
                
                # If graph halts at the HITL node, notify the frontend
                if node_name == "pharmacology" or node_name == "moderator":
                    current_state = medisense_graph.get_state(config)
                    if current_state.next and "human_review" in current_state.next:
                        logger.info(f"Graph paused for HITL in thread {patient_data.thread_id}")
                        hitl_payload = json.dumps({"node": "system", "status": "awaiting_human_review"})
                        yield f"data: {hitl_payload}\n\n"

        yield "data: {\"node\": \"system\", \"status\": \"stream_ended\"}\n\n"

    except Exception as e:
        logger.error(f"Graph execution failed: {str(e)}")
        error_payload = json.dumps({"node": "system", "status": "error", "message": str(e)})
        yield f"data: {error_payload}\n\n"

# -------------------------------------------------------------------------
# 4. API Endpoints
# -------------------------------------------------------------------------

@app.post("/api/v1/tumor-board/start")
async def start_tumor_board(payload: PatientPayload):
    """
    Entry point for a new patient case. 
    Returns a StreamingResponse that the React frontend connects to via EventSource.
    """
    logger.info(f"Starting new Tumor Board session. Thread ID: {payload.thread_id}")
    return StreamingResponse(event_generator(payload), media_type="text/event-stream")


@app.get("/api/v1/tumor-board/state/{thread_id}")
async def get_graph_state(thread_id: str):
    """
    Retrieves the current paused state of the graph. 
    The frontend calls this when it receives 'awaiting_human_review' to display the drafted plan.
    """
    config = {"configurable": {"thread_id": thread_id}}
    state_snapshot = medisense_graph.get_state(config)
    
    if not state_snapshot:
        raise HTTPException(status_code=404, detail="Thread not found or expired.")
        
    return {
        "thread_id": thread_id,
        "is_paused": len(state_snapshot.next) > 0,
        "next_nodes": state_snapshot.next,
        "state_values": state_snapshot.values
    }


@app.post("/api/v1/tumor-board/approve/{thread_id}")
async def approve_treatment_plan(thread_id: str, approval: PhysicianApproval):
    """
    The Human-in-the-Loop resume endpoint. 
    Accepts physician modifications, updates the graph state, and resumes execution to the END node.
    """
    config = {"configurable": {"thread_id": thread_id}}
    state_snapshot = medisense_graph.get_state(config)
    
    if not state_snapshot or "human_review" not in state_snapshot.next:
        raise HTTPException(status_code=400, detail="Graph is not currently awaiting human review.")

    # 1. Update the state if the physician modified the regimen
    if approval.modified_regimen:
        # Retrieve current plan and update it
        current_plan = state_snapshot.values.get("treatment_plan", {})
        current_plan["recommended_regimen"] = approval.modified_regimen
        current_plan["physician_notes"] = approval.physician_notes
        
        # Inject the updated state back into the graph checkpointer
        medisense_graph.update_state(config, {"treatment_plan": current_plan})
        logger.info(f"State updated with physician modifications for thread {thread_id}")

    # 2. Resume the graph execution (Pushing it through the 'human_review' node to END)
    # By passing None, we tell LangGraph to continue from where it paused
    logger.info(f"Resuming graph for thread {thread_id} to finalize.")
    async for event in medisense_graph.astream(None, config=config):
        pass # We just let it silently finish the remaining nodes (which is just END)

    return {"status": "success", "message": "Tumor board finalized and signed off by physician."}