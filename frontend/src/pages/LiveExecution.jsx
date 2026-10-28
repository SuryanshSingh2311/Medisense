import React, { useEffect, useState, useRef } from "react";
import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, Loader2, AlertCircle, ArrowRight, Dna, ScanLine, Microscope, BookOpen, Stethoscope, Pill, ShieldAlert } from "lucide-react";

// The ordered pipeline of agents to track
const AGENT_PIPELINE = [
  { id: "pathology", label: "Pathology Agent", icon: Dna, tier: "Tier 1: Diagnostic Extraction (Parallel)" },
  { id: "radiology", label: "Radiology Agent", icon: ScanLine, tier: "Tier 1: Diagnostic Extraction (Parallel)" },
  { id: "genomics", label: "Genomics Agent", icon: Microscope, tier: "Tier 1: Diagnostic Extraction (Parallel)" },
  { id: "guidelines", label: "Guidelines Agent", icon: BookOpen, tier: "Tier 2: Clinical Synthesis" },
  { id: "oncology", label: "Oncology Agent", icon: Stethoscope, tier: "Tier 2: Clinical Synthesis" },
  { id: "pharmacology", label: "Pharmacology Agent", icon: Pill, tier: "Tier 3: Safety Guardrails" },
  { id: "moderator", label: "Moderator Agent", icon: ShieldAlert, tier: "Tier 3: Safety Guardrails" },
];

export default function LiveExecution() {
  const { threadId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Prevent double-fetching in React StrictMode
  const hasStartedRef = useRef(false);

  // Payload passed from NewCase.jsx
  const payload = location.state?.payload;

  // Track the status of each node: 'pending' | 'running' | 'completed' | 'error'
  const [nodeStatuses, setNodeStatuses] = useState(
    AGENT_PIPELINE.reduce((acc, agent) => ({ ...acc, [agent.id]: "pending" }), {})
  );
  
  const [systemStatus, setSystemStatus] = useState("initializing"); // 'initializing', 'processing', 'awaiting_human_review', 'error'
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!payload) {
      setSystemStatus("error");
      setErrorMessage("No patient data provided. Please start a new case.");
      return;
    }

    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    startStreamingExecution();
  }, [payload]);

  const startStreamingExecution = async () => {
    setSystemStatus("processing");
    
    // Set Tier 1 agents to running immediately since they execute in parallel
    setNodeStatuses(prev => ({ ...prev, pathology: "running", radiology: "running", genomics: "running" }));

    try {
      // Point this to your actual FastAPI server URL
      const response = await fetch("http://localhost:5000/api/v1/tumor-board/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      // 1. Setup stream reader
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      // 2. Read stream chunks continuously
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // 3. Parse SSE lines ending in \n\n
        const parts = buffer.split("\n\n");
        // Keep the last incomplete part in the buffer
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (part.startsWith("data: ")) {
            const dataStr = part.replace("data: ", "").trim();
            if (dataStr) {
              const data = JSON.parse(dataStr);
              handleStreamEvent(data);
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setSystemStatus("error");
      setErrorMessage(error.message);
    }
  };

  const handleStreamEvent = (data) => {
    const { node, status } = data;

    // Handle system-level events (e.g., HITL pause)
    if (node === "system") {
      if (status === "awaiting_human_review") {
        setSystemStatus("awaiting_human_review");
      }
      return;
    }

    // Update the completed node
    if (status === "completed") {
      setNodeStatuses(prev => {
        const nextState = { ...prev, [node]: "completed" };
        
        // Waterfall logic to simulate the next agent starting visually
        if (node === "pathology" && nextState.radiology === "completed" && nextState.genomics === "completed") {
          nextState.guidelines = "running";
        } else if (node === "radiology" && nextState.pathology === "completed" && nextState.genomics === "completed") {
          nextState.guidelines = "running";
        } else if (node === "genomics" && nextState.pathology === "completed" && nextState.radiology === "completed") {
          nextState.guidelines = "running";
        } else if (node === "guidelines") {
          nextState.oncology = "running";
        } else if (node === "oncology") {
          nextState.pharmacology = "running";
        } else if (node === "pharmacology") {
          // If pharmacology completes and graph loops to moderator
          // The backend SSE will emit "moderator", so we set it to running if it happens
        }
        
        return nextState;
      });
    }

    // Handle retry loops dynamically
    if (node === "moderator" && status === "completed") {
      setNodeStatuses(prev => ({ ...prev, moderator: "completed", oncology: "running" }));
    }
  };

  // Group agents by their tier for UI rendering
  const groupedAgents = AGENT_PIPELINE.reduce((acc, agent) => {
    if (!acc[agent.tier]) acc[agent.tier] = [];
    acc[agent.tier].push(agent);
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      
      {/* Header */}
      <div style={{ marginBottom: "30px", textAlign: "center" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>Live AI Execution</h1>
        <p style={{ color: "#9ca3af", fontSize: "14px" }}>
          Thread ID: <span style={{ color: "white", fontFamily: "monospace" }}>{threadId}</span>
        </p>
      </div>

      {/* Error State */}
      {systemStatus === "error" && (
        <div className="card" style={{ borderColor: "#ef4444", background: "rgba(239, 68, 68, 0.05)", textAlign: "center", marginBottom: "20px" }}>
          <AlertCircle size={32} color="#ef4444" style={{ margin: "0 auto 15px auto" }} />
          <h3 style={{ fontSize: "18px", color: "#fca5a5", margin: "0 0 10px 0" }}>Execution Failed</h3>
          <p style={{ color: "#9ca3af", margin: "0 0 20px 0" }}>{errorMessage}</p>
          <Link to="/patients/new" className="btnPrimary" style={{ display: "inline-flex", textDecoration: "none" }}>
            Start New Case
          </Link>
        </div>
      )}

      {/* Pipeline Visualization */}
      <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
        {Object.entries(groupedAgents).map(([tier, agents]) => (
          <div key={tier} className="card">
            <h3 style={{ fontSize: "12px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "15px" }}>
              {tier}
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {agents.map((agent) => {
                const status = nodeStatuses[agent.id];
                const Icon = agent.icon;
                
                return (
                  <div 
                    key={agent.id} 
                    style={{ 
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 15px", 
                      background: "rgba(0,0,0,0.2)", 
                      borderRadius: "10px",
                      border: `1px solid ${status === "running" ? "rgba(59, 130, 246, 0.3)" : "transparent"}`,
                      opacity: status === "pending" ? 0.4 : 1,
                      transition: "all 0.3s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ 
                        width: 32, height: 32, borderRadius: "8px", 
                        background: status === "completed" ? "rgba(34, 197, 94, 0.15)" : "rgba(255,255,255,0.05)", 
                        display: "flex", alignItems: "center", justifyContent: "center" 
                      }}>
                        <Icon size={16} color={status === "completed" ? "#4ade80" : "#9ca3af"} />
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: status === "running" ? "bold" : "normal" }}>
                        {agent.label}
                      </span>
                    </div>

                    {/* Status Indicators */}
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {status === "pending" && <span style={{ fontSize: "12px", color: "#9ca3af" }}>Pending</span>}
                      {status === "running" && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#3b82f6", fontSize: "12px", fontWeight: "bold" }}>
                          <Loader2 size={14} className="spin" style={{ animation: "spin 1s linear infinite" }} /> Processing...
                        </div>
                      )}
                      {status === "completed" && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#4ade80", fontSize: "12px", fontWeight: "bold" }}>
                          <CheckCircle2 size={16} /> Completed
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Success / Transition Action */}
      {systemStatus === "awaiting_human_review" && (
        <div 
          className="card" 
          style={{ 
            marginTop: "30px", 
            background: "rgba(59, 130, 246, 0.1)", 
            borderColor: "rgba(59, 130, 246, 0.3)", 
            textAlign: "center",
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
          }}
        >
          <h2 style={{ fontSize: "20px", color: "white", marginBottom: "8px" }}>Consensus Reached</h2>
          <p style={{ color: "#93c5fd", fontSize: "14px", marginBottom: "20px" }}>
            The AI Tumor Board has drafted a treatment plan and completed safety evaluations. It is now awaiting physician review and sign-off.
          </p>
          
          <button 
            className="btnPrimary" 
            style={{ margin: "0 auto" }}
            onClick={() => navigate(`/review/${threadId}`)}
          >
            Review Treatment Plan <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Global CSS animation required for the spinner & pulse effect */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse { 50% { opacity: .85; box-shadow: 0 0 20px rgba(59, 130, 246, 0.2); } }
      `}</style>
    </div>
  );
}