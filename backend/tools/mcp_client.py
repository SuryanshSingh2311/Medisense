import os
import logging
from typing import Any, Dict, Optional

# The fastmcp library handles the Model Context Protocol communication
from fastmcp import Client
from fastmcp.exceptions import ToolError

# -------------------------------------------------------------------------
# 1. Logging Configuration
# -------------------------------------------------------------------------
logger = logging.getLogger("Medisense.MCPClient")
logger.setLevel(logging.INFO)
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logger.addHandler(ch)

# -------------------------------------------------------------------------
# 2. Server Configuration Mapping
# -------------------------------------------------------------------------
# Map internal server names to their environment variables and default local URLs
SERVER_URLS = {
    "rag": os.getenv("FASTMCP_RAG_SERVER", "http://localhost:8000/mcp"),
    "safety": os.getenv("FASTMCP_SAFETY_SERVER", "http://localhost:8001/mcp"),
}

# -------------------------------------------------------------------------
# 3. Core Execution Helper
# -------------------------------------------------------------------------
async def call_mcp_tool(server_type: str, tool_name: str, arguments: Dict[str, Any]) -> Any:
    """
    Connects to the specified FastMCP server, executes a tool, and returns the result.
    
    Args:
        server_type (str): The target microservice (e.g., 'rag' or 'safety').
        tool_name (str): The specific tool to call (e.g., 'search_nccn', 'calculate_egfr').
        arguments (Dict[str, Any]): The JSON payload expected by the tool.
        
    Returns:
        Any: The data returned by the tool, or an error string if execution failed.
    """
    server_url = SERVER_URLS.get(server_type)
    
    if not server_url:
        logger.error(f"Unknown server type requested: {server_type}")
        return f"System Error: Unknown MCP server type '{server_type}'."

    logger.info(f"Connecting to {server_type.upper()} MCP Server at {server_url} to call '{tool_name}'...")
    
    try:
        # The async with block ensures the client connection is safely opened and closed
        async with Client(server_url, mode="auto") as client:
            result = await client.call_tool(tool_name, arguments)
            
            if result and hasattr(result, 'data'):
                return result.data
            return result

    except ToolError as e:
        logger.error(f"Tool execution failed for '{tool_name}' on {server_type} server: {str(e)}")
        return f"MCP Tool Error: {str(e)}"
    
    except ConnectionError as e:
        logger.error(f"Failed to connect to {server_type} server. Is it running? Error: {str(e)}")
        return f"Connection Failed: {server_type} microservice is unreachable."
        
    except Exception as e:
        logger.error(f"Unexpected error during MCP tool call: {str(e)}")
        return f"System Error: {str(e)}"

# -------------------------------------------------------------------------
# 4. Agent-Specific Wrappers (Optional but recommended for clean code)
# -------------------------------------------------------------------------
async def query_guidelines_rag(database: str, query: str, top_k: int = 3) -> str:
    """
    Wrapper specifically for the Guidelines Agent to query NCCN or ESMO.
    """
    tool_name = f"search_{database.lower()}"  # e.g., 'search_nccn'
    arguments = {"query": query, "top_k": top_k}
    
    result = await call_mcp_tool("rag", tool_name, arguments)
    return str(result)

async def check_clinical_calculators(calculator_name: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
    """
    Wrapper for the Pharmacology Agent to run remote calculators (eGFR, Body Surface Area, etc.)
    """
    result = await call_mcp_tool("safety", calculator_name, inputs)
    if isinstance(result, str) and ("Error" in result or "Failed" in result):
        return {"error": result, "is_valid": False}
    return result