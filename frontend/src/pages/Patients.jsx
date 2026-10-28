import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Search, Plus, User, Clock, 
  CheckCircle2, AlertCircle, ArrowRight 
} from "lucide-react";

// Mock Data for the Patient Directory
const MOCK_PATIENTS = [
  { 
    id: "P-19943", name: "John Doe", age: 58, gender: "M", 
    cancerType: "NSCLC", stage: "IIIA", 
    status: "awaiting_review", date: "12 May 2024", threadId: "mock-thread-123" 
  },
  { 
    id: "P-19944", name: "Sarah Jenkins", age: 62, gender: "F", 
    cancerType: "Breast Cancer", stage: "IIB", 
    status: "completed", date: "11 May 2024", threadId: "mock-thread-124" 
  },
  { 
    id: "P-19945", name: "Michael Chen", age: 45, gender: "M", 
    cancerType: "Colorectal", stage: "IV", 
    status: "processing", date: "14 May 2024", threadId: "mock-thread-125" 
  },
  { 
    id: "P-19946", name: "Elena Rodriguez", age: 71, gender: "F", 
    cancerType: "Ovarian", stage: "IIIC", 
    status: "completed", date: "10 May 2024", threadId: "mock-thread-126" 
  },
  { 
    id: "P-19947", name: "Robert Taylor", age: 66, gender: "M", 
    cancerType: "Prostate", stage: "IV", 
    status: "awaiting_review", date: "14 May 2024", threadId: "mock-thread-127" 
  },
];

export default function Patients() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // 'all', 'processing', 'awaiting_review', 'completed'

  // Filter logic
  const filteredPatients = MOCK_PATIENTS.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          patient.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === "all" || patient.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // Helper to render the correct status badge
  const renderStatusBadge = (status) => {
    switch(status) {
      case "completed":
        return <span className="badgeGreen" style={{ display: "flex", alignItems: "center", gap: "4px", width: "fit-content" }}><CheckCircle2 size={12} /> Finalized</span>;
      case "awaiting_review":
        return <span className="badgeYellow" style={{ display: "flex", alignItems: "center", gap: "4px", width: "fit-content" }}><AlertCircle size={12} /> Action Required</span>;
      case "processing":
        return <span className="badgeBlue" style={{ display: "flex", alignItems: "center", gap: "4px", width: "fit-content" }}><Clock size={12} /> AI Processing</span>;
      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* ==========================================
          1. HEADER & ACTIONS
          ========================================== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "25px" }}>
        <div>
          <h1 style={{ fontSize: "22px", marginBottom: "4px" }}>Patient Directory</h1>
          <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>
            Manage active AI tumor board cases and review historical consensus reports.
          </p>
        </div>
        
        {/* Direct route to the NewCase.jsx form */}
        <Link to="/patients/new" className="btnPrimary" style={{ textDecoration: "none" }}>
          <Plus size={16} /> New Tumor Board Case
        </Link>
      </div>

      {/* ==========================================
          2. SEARCH & FILTERS
          ========================================== */}
      <div className="card" style={{ padding: "15px", marginBottom: "25px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(0,0,0,0.3)", padding: "8px 15px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", minWidth: "300px" }}>
          <Search size={16} color="#9ca3af" />
          <input 
            type="text" 
            placeholder="Search by Patient Name or ID (e.g., P-19943)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: "transparent", border: "none", color: "white", outline: "none", width: "100%", fontSize: "13px" }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={() => setActiveFilter("all")} 
            style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", background: activeFilter === "all" ? "rgba(255,255,255,0.15)" : "transparent", color: "white" }}
          >
            All Cases
          </button>
          <button 
            onClick={() => setActiveFilter("awaiting_review")} 
            style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", border: "1px solid rgba(234, 179, 8, 0.3)", background: activeFilter === "awaiting_review" ? "rgba(234, 179, 8, 0.15)" : "transparent", color: activeFilter === "awaiting_review" ? "#fde047" : "white" }}
          >
            Action Required
          </button>
          <button 
            onClick={() => setActiveFilter("processing")} 
            style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", border: "1px solid rgba(59, 130, 246, 0.3)", background: activeFilter === "processing" ? "rgba(59, 130, 246, 0.15)" : "transparent", color: activeFilter === "processing" ? "#93c5fd" : "white" }}
          >
            Processing
          </button>
        </div>
      </div>

      {/* ==========================================
          3. PATIENT DATA TABLE
          ========================================== */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <th style={{ padding: "15px 20px", color: "#9ca3af", fontWeight: "500" }}>Patient / ID</th>
                <th style={{ padding: "15px 20px", color: "#9ca3af", fontWeight: "500" }}>Diagnosis</th>
                <th style={{ padding: "15px 20px", color: "#9ca3af", fontWeight: "500" }}>Date Initiated</th>
                <th style={{ padding: "15px 20px", color: "#9ca3af", fontWeight: "500" }}>AI Status</th>
                <th style={{ padding: "15px 20px", color: "#9ca3af", fontWeight: "500", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                    
                    {/* Name & Avatar */}
                    <td style={{ padding: "15px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
                          <User size={16} color="#9ca3af" />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: "bold", fontSize: "14px", color: "white" }}>{patient.name}</p>
                          <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#9ca3af" }}>
                            {patient.id} • {patient.gender}, {patient.age} Yrs
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Diagnosis */}
                    <td style={{ padding: "15px 20px" }}>
                      <p style={{ margin: 0, fontWeight: "500", color: "white" }}>{patient.cancerType}</p>
                      <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#9ca3af" }}>Stage {patient.stage}</p>
                    </td>

                    {/* Date */}
                    <td style={{ padding: "15px 20px", color: "#d1d5db" }}>
                      {patient.date}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: "15px 20px" }}>
                      {renderStatusBadge(patient.status)}
                    </td>

                    {/* Action Routing */}
                    <td style={{ padding: "15px 20px", textAlign: "right" }}>
                      {patient.status === "processing" ? (
                        <button 
                          onClick={() => navigate(`/patients/live/${patient.threadId}`)}
                          style={{ background: "transparent", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          View Live <ArrowRight size={14} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => navigate(`/review/${patient.threadId}`)}
                          style={{ background: "transparent", border: "none", color: patient.status === "awaiting_review" ? "#facc15" : "#9ca3af", cursor: "pointer", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: patient.status === "awaiting_review" ? "bold" : "normal" }}
                        >
                          {patient.status === "awaiting_review" ? "Sign Off" : "View Record"} <ArrowRight size={14} />
                        </button>
                      )}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                    No patients found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}