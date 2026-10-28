import React, { useState } from "react";
import { Search, FileCheck, Calendar, ArrowRight } from "lucide-react";

const HISTORICAL_CASES = [
  { id: "P-19801", name: "David Miller", diagnosis: "Stage IV Melanoma", regimen: "Nivolumab + Ipilimumab", approvedBy: "Dr. A. Sharma", date: "02 May 2024" },
  { id: "P-19802", name: "Anita Desai", diagnosis: "Stage IIB Breast", regimen: "TCHP Neoadjuvant", approvedBy: "Dr. R. Gupta", date: "05 May 2024" },
  { id: "P-19805", name: "James Wilson", diagnosis: "Stage IV NSCLC", regimen: "Pembrolizumab Monotherapy", approvedBy: "Dr. A. Sharma", date: "08 May 2024" },
];

export default function Consensus() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCases = HISTORICAL_CASES.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "25px" }}>
        <div>
          <h1 style={{ fontSize: "22px", marginBottom: "4px" }}>Historical Consensus Database</h1>
          <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>Search and review finalized, physician-approved treatment plans.</p>
        </div>
      </div>

      <div className="card" style={{ padding: "15px", marginBottom: "25px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(0,0,0,0.3)", padding: "10px 15px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Search size={16} color="#9ca3af" />
          <input 
            type="text" 
            placeholder="Search by Patient, Diagnosis, or Drug Regimen..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: "transparent", border: "none", color: "white", outline: "none", width: "100%", fontSize: "13px" }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <th style={{ padding: "15px 20px", color: "#9ca3af", fontWeight: "500" }}>Patient</th>
                <th style={{ padding: "15px 20px", color: "#9ca3af", fontWeight: "500" }}>Diagnosis</th>
                <th style={{ padding: "15px 20px", color: "#9ca3af", fontWeight: "500" }}>Approved Regimen</th>
                <th style={{ padding: "15px 20px", color: "#9ca3af", fontWeight: "500" }}>Sign-Off By</th>
                <th style={{ padding: "15px 20px", color: "#9ca3af", fontWeight: "500", textAlign: "right" }}>Archive</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((c, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "15px 20px", fontWeight: "bold" }}>{c.name} <br/><span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "normal" }}>{c.id}</span></td>
                  <td style={{ padding: "15px 20px" }}>{c.diagnosis}</td>
                  <td style={{ padding: "15px 20px" }}><span className="badgeBlue"><FileCheck size={10} style={{ marginRight: "4px" }}/> {c.regimen}</span></td>
                  <td style={{ padding: "15px 20px" }}>{c.approvedBy} <br/><span style={{ fontSize: "11px", color: "#9ca3af", display: "flex", alignItems: "center", gap: "4px" }}><Calendar size={10}/> {c.date}</span></td>
                  <td style={{ padding: "15px 20px", textAlign: "right" }}>
                    <button style={{ background: "transparent", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      View PDF <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}