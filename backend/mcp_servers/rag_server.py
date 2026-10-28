import os
import logging
from typing import List, Dict, Any

# FastMCP creates the microservice endpoints
from fastmcp import FastMCP

# ChromaDB is the vector database for RAG
import chromadb
from chromadb.config import Settings

# -------------------------------------------------------------------------
# 1. Logging Configuration
# -------------------------------------------------------------------------
logger = logging.getLogger("Medisense.RAGServer")
logger.setLevel(logging.INFO)
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logger.addHandler(ch)

# -------------------------------------------------------------------------
# 2. FastMCP Server Initialization
# -------------------------------------------------------------------------
# This initializes the MCP server that mcp_client.py will connect to
mcp = FastMCP("Medisense Vector DB Microservice")

# -------------------------------------------------------------------------
# 3. Vector Database (ChromaDB) Setup & Seeding
# -------------------------------------------------------------------------
logger.info("Initializing ChromaDB Ephemeral Client...")
chroma_client = chromadb.EphemeralClient(settings=Settings(allow_reset=True))

# Create distinct collections for NCCN and ESMO guidelines
# By default, Chroma uses a lightweight sentence-transformer model for embeddings
nccn_collection = chroma_client.create_collection(name="nccn_guidelines")
esmo_collection = chroma_client.create_collection(name="esmo_guidelines")

def seed_database():
    """Seeds the in-memory vector database with mock clinical guidelines for testing."""
    logger.info("Seeding Vector DB with mock NCCN and ESMO guidelines...")
    
    # NCCN Mock Data
    nccn_collection.add(
        documents=[
            "Stage IV NSCLC, KRAS G12C mutated: First-line therapy is Pembrolizumab + Pemetrexed + Carboplatin. Subsequent therapy is Sotorasib 960 mg PO daily or Adagrasib.",
            "Stage III Breast Cancer, HER2 Positive: Neoadjuvant therapy with Docetaxel, Carboplatin, Trastuzumab, and Pertuzumab (TCHP).",
            "Advanced Renal Cell Carcinoma, clear cell, poor risk: Pembrolizumab + Axitinib or Ipilimumab + Nivolumab."
        ],
        metadatas=[{"cancer": "NSCLC", "stage": "IV"}, {"cancer": "Breast", "stage": "III"}, {"cancer": "RCC", "stage": "Advanced"}],
        ids=["nccn_nsclc_1", "nccn_breast_1", "nccn_rcc_1"]
    )
    
    # ESMO Mock Data
    esmo_collection.add(
        documents=[
            "ESMO Guidelines for metastatic NSCLC (KRAS mutated): Immune checkpoint inhibitors (ICI) combined with platinum-based doublet chemotherapy is recommended for first-line treatment regardless of PD-L1 TPS.",
            "ESMO Breast Cancer: For HER2-amplified early breast cancer, dual HER2 blockade with Trastuzumab and Pertuzumab combined with chemotherapy is the standard of care.",
            "ESMO RCC: First-line treatment for intermediate/poor risk advanced RCC includes dual immune checkpoint inhibition (Nivolumab/Ipilimumab)."
        ],
        metadatas=[{"cancer": "NSCLC", "stage": "IV"}, {"cancer": "Breast", "stage": "Early"}, {"cancer": "RCC", "stage": "Advanced"}],
        ids=["esmo_nsclc_1", "esmo_breast_1", "esmo_rcc_1"]
    )

# Seed the database on startup
seed_database()

# -------------------------------------------------------------------------
# 4. Expose FastMCP Tools (@mcp.tool)
# -------------------------------------------------------------------------
# The @mcp.tool decorator automatically exposes these Python functions 
# over the FastMCP network protocol so the Guidelines Agent can call them.

@mcp.tool()
def search_nccn(query: str, top_k: int = 2) -> str:
    """
    Query the NCCN Vector Database for clinical guidelines.
    
    Args:
        query: The clinical summary (e.g., 'Stage IV NSCLC KRAS G12C').
        top_k: Number of guideline snippets to retrieve.
    """
    logger.info(f"NCCN Search triggered for query: '{query}'")
    try:
        results = nccn_collection.query(
            query_texts=[query],
            n_results=top_k
        )
        
        # Format the retrieved documents into a clean string
        documents = results.get("documents", [[]])[0]
        if not documents:
            return "No matching NCCN guidelines found."
            
        formatted_result = "\n".join([f"- {doc}" for doc in documents])
        return f"NCCN Retrieved Protocols:\n{formatted_result}"
        
    except Exception as e:
        logger.error(f"NCCN Search failed: {str(e)}")
        return f"Error querying NCCN database: {str(e)}"

@mcp.tool()
def search_esmo(query: str, top_k: int = 2) -> str:
    """
    Query the ESMO Vector Database for European clinical protocols.
    
    Args:
        query: The clinical summary (e.g., 'Stage IV NSCLC KRAS G12C').
        top_k: Number of guideline snippets to retrieve.
    """
    logger.info(f"ESMO Search triggered for query: '{query}'")
    try:
        results = esmo_collection.query(
            query_texts=[query],
            n_results=top_k
        )
        
        documents = results.get("documents", [[]])[0]
        if not documents:
            return "No matching ESMO guidelines found."
            
        formatted_result = "\n".join([f"- {doc}" for doc in documents])
        return f"ESMO Retrieved Protocols:\n{formatted_result}"
        
    except Exception as e:
        logger.error(f"ESMO Search failed: {str(e)}")
        return f"Error querying ESMO database: {str(e)}"

# -------------------------------------------------------------------------
# 5. Server Execution
# -------------------------------------------------------------------------
if __name__ == "__main__":
    logger.info("Starting FastMCP RAG Server on SSE transport (Port 8000)...")
    
    # Run the server using Server-Sent Events (SSE) which allows HTTP connections
    # Note: Depending on your fastmcp version, syntax might be mcp.run(transport="sse")
    try:
        mcp.run(transport="sse", host="0.0.0.0", port=8000)
    except Exception as e:
        logger.error(f"Server execution failed: {str(e)}")