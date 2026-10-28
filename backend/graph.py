from typing import Any, Dict, TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

# -------------------------------------------------------------------------
# 1. State Definition
# -------------------------------------------------------------------------
class TumorBoardState(TypedDict):
    """
    The central state object passed between all agent nodes.
    Each agent returns a dictionary that updates its specific key in this state.
    """
    raw_pathology_report: str
    raw_radiology_report: str
    raw_genomics_report: str
    patient_labs: Dict[str, Any]

    pathology_data: Dict[str, Any]
    radiology_data: Dict[str, Any]
    genomics_data: Dict[str, Any]
    guidelines_data: Dict[str, Any]
    
    treatment_plan: Dict[str, Any]
    consensus_reached: bool
    retry_count: int

# -------------------------------------------------------------------------
# 2. Import REAL Agent Node Functions
# (Names strictly match your Explorer in Screenshot (201).png)
# -------------------------------------------------------------------------
from agents.Pathology_agent import run_pathology_agent
from agents.Radiology_agent import run_radiology_agent
from agents.Genomics_agent import run_genomics_agent
from agents.Guidelines_agent import run_guidelines_agent
from agents.oncology_agent import run_oncology_agent        
from agents.pharmacology_agent import run_pharmacology_agent  
from agents.moderator import run_moderator_agent        

# Human Review is the only one that stays as a simple pass-through function here
def run_human_review(state: TumorBoardState):
    """Terminal node executed after physician sign-off."""
    print("--- HITL: PHYSICIAN REVIEWING FINAL PLAN ---")
    return state

# -------------------------------------------------------------------------
# 3. Conditional Routing Logic
# -------------------------------------------------------------------------
def route_pharmacology_output(state: TumorBoardState) -> str:
    """
    Determines whether the proposed treatment is safe.
    Routes to the physician if safe (or if max retries hit), otherwise routes to Moderator.
    """
    if state.get("consensus_reached", False):
        return "human_review"
    
    if state.get("retry_count", 0) >= 3:
        print("Max retries reached. Forcing plan to physician review with warnings.")
        return "human_review"
        
    return "moderator"

# -------------------------------------------------------------------------
# 4. Graph Construction
# -------------------------------------------------------------------------
builder = StateGraph(TumorBoardState)

# Add Nodes
builder.add_node("pathology", run_pathology_agent)
builder.add_node("radiology", run_radiology_agent)
builder.add_node("genomics", run_genomics_agent)
builder.add_node("guidelines", run_guidelines_agent)
builder.add_node("oncology", run_oncology_agent)
builder.add_node("pharmacology", run_pharmacology_agent)
builder.add_node("moderator", run_moderator_agent)
builder.add_node("human_review", run_human_review)

# Add Parallel Entry Edges (Tier 1 Diagnostic Extraction)
builder.add_edge(START, "pathology")
builder.add_edge(START, "radiology")
builder.add_edge(START, "genomics")

# Synchronize Parallel Nodes -> Guidelines Agent
builder.add_edge("pathology", "guidelines")
builder.add_edge("radiology", "guidelines")
builder.add_edge("genomics", "guidelines")

# Sequential Synthesis Flow
builder.add_edge("guidelines", "oncology")
builder.add_edge("oncology", "pharmacology")

# Conditional Edge (Safety Verification & Cycle)
builder.add_conditional_edges(
    "pharmacology",
    route_pharmacology_output,
    {
        "human_review": "human_review",
        "moderator": "moderator"
    }
)

# Cycle back from Moderator to draft a new plan
builder.add_edge("moderator", "oncology")

# Terminate Graph
builder.add_edge("human_review", END)

# -------------------------------------------------------------------------
# 5. Compilation & Checkpointer Integration
# -------------------------------------------------------------------------
memory = MemorySaver()

medisense_graph = builder.compile(
    checkpointer=memory,
    interrupt_before=["human_review"]  # Halts state execution precisely before this node
)