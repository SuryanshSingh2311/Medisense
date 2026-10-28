import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Activity, Dna, Play } from "lucide-react";

export default function NewCase() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unstructured Text Reports
  const [pathology, setPathology] = useState("");
  const [radiology, setRadiology] = useState("");
  const [genomics, setGenomics] = useState("");

  // Structured Labs & Vitals
  const [eGFR, setEGFR] = useState("");
  const [lvef, setLvef] = useState("");
  const [medications, setMedications] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 1. Generate a unique thread ID for LangGraph session management
    const threadId = `case-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 2. Format the payload to perfectly match the FastAPI PatientPayload schema
    const payload = {
      thread_id: threadId,
      raw_pathology_report: pathology,
      raw_radiology_report: radiology,
      raw_genomics_report: genomics,
      patient_labs: {
        eGFR: eGFR ? parseFloat(eGFR) : null,
        LVEF: lvef ? parseFloat(lvef) : null,
        // Convert comma-separated string to an array, stripping whitespace
        active_medications: medications
          ? medications.split(",").map((med) => med.trim()).filter(Boolean)
          : [],
      },
    };

    // 3. Navigate to the Live Execution page, passing the payload in memory
    // The Live Execution page will mount, read this state, and initiate the POST SSE stream
    navigate(`/patients/live/${threadId}`, { state: { payload } });
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "25px" }}>
        <h1 style={{ fontSize: "22px", marginBottom: "4px" }}>Initiate Tumor Board Analysis</h1>
        <p style={{ color: "#9ca3af", fontSize: "13px" }}>
          Input unstructured diagnostic reports and vitals to trigger the multi-agent pipeline.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", gap: "25px", flexWrap: "wrap" }}>
          
          {/* ==========================================
              LEFT COLUMN: UNSTRUCTURED REPORTS
              ========================================== */}
          <div style={{ flex: "2", minWidth: "400px", display: "flex", flexDirection: "column", gap: "20px" }}>
            
            <div className="card">
              <h3 style={{ fontSize: "15px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px" }}>
                <FileText size={18} color="#3b82f6" /> Pathology Report
              </h3>
              <div className="formGroup">
                <label className="formLabel">Biopsy & Histology Findings</label>
                <textarea
                  className="textArea"
                  placeholder="Paste unstructured surgical pathology report here..."
                  value={pathology}
                  onChange={(e) => setPathology(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: "15px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px" }}>
                <Activity size={18} color="#3b82f6" /> Radiology / Imaging
              </h3>
              <div className="formGroup">
                <label className="formLabel">PET/CT or MRI Impression</label>
                <textarea
                  className="textArea"
                  placeholder="Paste unstructured imaging impression noting primary mass and metastases..."
                  value={radiology}
                  onChange={(e) => setRadiology(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: "15px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px" }}>
                <Dna size={18} color="#3b82f6" /> Molecular & Genomics
              </h3>
              <div className="formGroup">
                <label className="formLabel">NGS Biomarker Panel</label>
                <textarea
                  className="textArea"
                  placeholder="Paste unstructured NGS report (e.g., EGFR, KRAS, PD-L1 TPS status)..."
                  value={genomics}
                  onChange={(e) => setGenomics(e.target.value)}
                  required
                />
              </div>
            </div>

          </div>

          {/* ==========================================
              RIGHT COLUMN: STRUCTURED LABS & ACTION
              ========================================== */}
          <div style={{ flex: "1", minWidth: "300px", display: "flex", flexDirection: "column", gap: "20px" }}>
            
            <div className="card">
              <h3 style={{ fontSize: "15px", marginBottom: "15px" }}>Patient Labs & Vitals</h3>
              <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "15px" }}>
                These exact values are used by the Pharmacology Agent to calculate toxicity guardrails (e.g., Calvert formula for Carboplatin).
              </p>

              <div className="formGroup">
                <label className="formLabel">eGFR (Renal Function) - mL/min</label>
                <input
                  type="number"
                  step="0.1"
                  className="inputField"
                  placeholder="e.g., 65.5"
                  value={eGFR}
                  onChange={(e) => setEGFR(e.target.value)}
                  required
                />
              </div>

              <div className="formGroup">
                <label className="formLabel">LVEF (Cardiac Function) - %</label>
                <input
                  type="number"
                  step="1"
                  className="inputField"
                  placeholder="e.g., 55"
                  value={lvef}
                  onChange={(e) => setLvef(e.target.value)}
                  required
                />
              </div>

              <div className="formGroup">
                <label className="formLabel">Active Medications</label>
                <textarea
                  className="textArea"
                  style={{ minHeight: "80px" }}
                  placeholder="Comma-separated (e.g., Lisinopril, Warfarin, Metformin)"
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="card" style={{ background: "rgba(59, 130, 246, 0.05)", borderColor: "rgba(59, 130, 246, 0.2)" }}>
              <h3 style={{ fontSize: "15px", marginBottom: "10px" }}>Ready for Analysis</h3>
              <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "20px" }}>
                Submitting this case will trigger the parallel execution of the Pathology, Radiology, and Genomics agents.
              </p>
              
              <button 
                type="submit" 
                className="btnPrimary" 
                style={{ width: "100%", padding: "14px" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Initializing Agents..." : "Start AI Tumor Board"} 
                {!isSubmitting && <Play size={16} fill="currentColor" />}
              </button>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}