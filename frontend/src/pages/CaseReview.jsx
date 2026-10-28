import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FileCheck, AlertTriangle, ShieldCheck, 
  Activity, BookOpen, CheckCircle, Loader2, Info
} from "lucide-react";

export default function CaseReview() {
  const { threadId } = useParams();
  const navigate = useNavigate();

  // State Management
  const [graphState, setGraphState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [physicianNotes, setPhysicianNotes] = useState("");
  const [modifiedRegimen, setModifiedRegimen] = useState("");

  useEffect(() => {
    fetchGraphState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const fetchGraphState = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/tumor-board/state/${threadId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch case state. The session may have expired.");
      }
      const data = await response.json();
      setGraphState(data);
      
      // Pre-fill the modification box with the AI's recommendation for easy editing
      if (data?.state_values?.treatment_plan?.recommended_regimen) {
        setModifiedRegimen(data.state_values.treatment_plan.recommended_regimen);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    setIsApproving(true);

    const payload = {
      is_approved: true,
      physician_notes: physicianNotes,
      // Only send modified regimen if it actually differs from the original
      modified_regimen: modifiedRegimen !== graphState.state_values.treatment_plan.recommended_regimen 
        ? modifiedRegimen 
        : "" 
    };

    try {
      const response = await fetch(`http://localhost:5000/api/v1/tumor-board/approve/${threadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Approval failed to process.");

      // On success, redirect back to the dashboard or patients list
      navigate("/");
    } catch (err) {
      alert("Error finalizing plan: " + err.message);
      setIsApproving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", color: "#9ca3af" }}>
        <Loader2 size={40} className="spin" style={{ animation: "spin 1s linear infinite", marginBottom: "15px", color: "#3b82f6" }} />
        <h2>Retrieving Case File...</h2>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ borderColor: "#ef4444", background: "rgba(239, 68, 68, 0.05)", textAlign: "center", maxWidth: "600px", margin: "40px auto" }}>
        <AlertTriangle size={32} color="#ef4444" style={{ margin: "0 auto 15px auto" }} />
        <h3 style={{ fontSize: "18px", color: "#fca5a5" }}>Error Loading Case</h3>
        <p style={{ color: "#9ca3af" }}>{error}</p>
        <button onClick={() => navigate("/")} className="btnPrimary" style={{ marginTop: "20px" }}>Return to Dashboard</button>
      </div>
    );
  }

  const treatment = graphState?.state_values?.treatment_plan || {};
  const safety = graphState?.state_values?.pharmacology_data || {};
  const isSafe = safety.is_safe;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "25px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <h1 style={{ fontSize: "24px", margin: 0 }}>Human-in-the-Loop Review</h1>
            <span className="badgeBlue">Thread: {threadId}</span>
          </div>
          <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0 }}>
            Review the AI-generated consensus, check pharmacology guardrails, and provide final physician sign-off.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "25px", flexWrap: "wrap", alignItems: "flex-start" }}>
        
        {/* ==========================================
            LEFT COLUMN: CLINICAL CONSENSUS
            ========================================== */}
        <div style={{ flex: "2", minWidth: "500px", display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div className="card">
            <h3 style={{ fontSize: "15px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>
              <Activity size={18} color="#3b82f6" /> Primary Diagnosis Profile
            </h3>
            <p style={{ fontSize: "14px", lineHeight: "1.6" }}>
              {treatment.primary_diagnosis_summary || "No summary provided."}
            </p>
          </div>

          <div className="card" style={{ background: "rgba(59, 130, 246, 0.05)", borderColor: "rgba(59, 130, 246, 0.2)" }}>
            <h3 style={{ fontSize: "15px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px", color: "#93c5fd" }}>
              <FileCheck size={18} color="#3b82f6" /> AI Recommended Regimen
            </h3>
            <div style={{ background: "rgba(0,0,0,0.3)", padding: "15px", borderRadius: "10px", fontSize: "15px", fontWeight: "bold", color: "#fff", marginBottom: "15px" }}>
              {treatment.recommended_regimen || "No regimen drafted."}
            </div>
            
            <h4 style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "5px" }}>Clinical Rationale:</h4>
            <p style={{ fontSize: "13px", lineHeight: "1.5", color: "#d1d5db" }}>
              {treatment.clinical_rationale || "N/A"}
            </p>
            
            <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px dashed rgba(255,255,255,0.1)" }}>
              <h4 style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "5px" }}>Alternative Regimen:</h4>
              <p style={{ fontSize: "13px", color: "#d1d5db", margin: 0 }}>{treatment.alternative_regimen || "N/A"}</p>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: "15px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px" }}>
              <BookOpen size={18} color="#3b82f6" /> Supporting Guidelines
            </h3>
            <ul style={{ paddingLeft: "20px", margin: 0, color: "#d1d5db", fontSize: "13px", lineHeight: "1.6" }}>
              {treatment.guideline_citations?.map((citation, idx) => (
                <li key={idx} style={{ marginBottom: "8px" }}>{citation}</li>
              ))}
              {(!treatment.guideline_citations || treatment.guideline_citations.length === 0) && (
                <li>No specific guideline quotes extracted.</li>
              )}
            </ul>
          </div>

        </div>

        {/* ==========================================
            RIGHT COLUMN: SAFETY & SIGN-OFF
            ========================================== */}
        <div style={{ flex: "1", minWidth: "350px", display: "flex", flexDirection: "column", gap: "20px", position: "sticky", top: "20px" }}>
          
          {/* Pharmacology Safety Evaluation */}
          <div className="card" style={{ borderColor: isSafe ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.4)", background: isSafe ? "rgba(34, 197, 94, 0.05)" : "rgba(239, 68, 68, 0.08)" }}>
            <h3 style={{ fontSize: "15px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px", color: isSafe ? "#86efac" : "#fca5a5" }}>
              {isSafe ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
              Pharmacology Guardrail
            </h3>
            
            {isSafe ? (
              <p style={{ fontSize: "13px", color: "#d1d5db" }}>
                ✓ No critical drug-drug interactions or physiological contraindications detected for the recommended regimen.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span className="badgeRed">Safety Violation Detected</span>
                <ul style={{ paddingLeft: "15px", margin: 0, color: "#fca5a5", fontSize: "13px", lineHeight: "1.5" }}>
                  {safety.identified_risks?.map((risk, idx) => <li key={idx}>{risk}</li>)}
                </ul>
                <div style={{ marginTop: "10px", padding: "10px", background: "rgba(0,0,0,0.3)", borderRadius: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#9ca3af", display: "block", marginBottom: "4px" }}>Pharmacology Suggestion:</span>
                  <span style={{ fontSize: "13px", color: "#d1d5db" }}>{safety.recommended_modifications}</span>
                </div>
              </div>
            )}
          </div>

          {/* Physician Sign-Off Form */}
          <div className="card">
            <h3 style={{ fontSize: "15px", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle size={18} color="#3b82f6" /> Physician Sign-Off
            </h3>
            
            <form onSubmit={handleApprove} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              
              <div className="formGroup" style={{ marginBottom: 0 }}>
                <label className="formLabel" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Final Regimen Decision</span>
                  <span style={{ fontSize: "11px", color: "#3b82f6", display: "flex", alignItems: "center", gap: "4px" }}><Info size={12}/> Editable</span>
                </label>
                <textarea
                  className="textArea"
                  style={{ minHeight: "80px", fontWeight: "bold", background: "rgba(0,0,0,0.4)" }}
                  value={modifiedRegimen}
                  onChange={(e) => setModifiedRegimen(e.target.value)}
                  required
                />
              </div>

              <div className="formGroup" style={{ marginBottom: "10px" }}>
                <label className="formLabel">Clinical Notes (Optional)</label>
                <textarea
                  className="textArea"
                  style={{ minHeight: "80px" }}
                  placeholder="Add your rationale for approval or modifications here..."
                  value={physicianNotes}
                  onChange={(e) => setPhysicianNotes(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="btnPrimary" 
                style={{ width: "100%", padding: "14px", background: "#22c55e", boxShadow: "0 4px 15px rgba(34, 197, 94, 0.3)" }}
                disabled={isApproving}
              >
                {isApproving ? "Finalizing Plan..." : "Approve & Finalize Plan"}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}