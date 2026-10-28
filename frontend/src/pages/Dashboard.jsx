import React from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  FolderOpen, CheckCircle2, Clock, AlertTriangle,
  Dna, ScanLine, Microscope, Pill, BookOpen
} from "lucide-react";

// Mock Data for the Confidence Chart
const chartData = [
  { time: "09:15", value: 20 },
  { time: "09:30", value: 38 },
  { time: "09:45", value: 55 },
  { time: "10:00", value: 60 },
  { time: "10:15", value: 78 },
  { time: "10:28", value: 92 },
];

export default function Dashboard() {
  return (
    <>
      {/* HEADER */}
      <h1 style={{ fontSize: "22px", marginBottom: "0px", marginTop: 0 }}>Dashboard</h1>
      <p style={{ color: "#8b919d", fontSize: "13px", marginTop: "4px" }}>
        Welcome back, Dr. Ananya Sharma
      </p>

      {/* ==========================================
          1. STATS ROW
          ========================================== */}
      <div style={{ display: "flex", gap: "15px", margin: "20px 0" }}>
        <div className="card" style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#9ca3af", fontSize: "12px" }}>Total Cases</span>
            <FolderOpen size={16} color="#3b82f6" />
          </div>
          <h2 style={{ fontSize: "24px", margin: "8px 0" }}>128</h2>
          <p style={{ color: "#86efac", fontSize: "12px", margin: 0 }}>↑ +12% vs last month</p>
        </div>

        <div className="card" style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#9ca3af", fontSize: "12px" }}>Completed Analyses</span>
            <CheckCircle2 size={16} color="#3b82f6" />
          </div>
          <h2 style={{ fontSize: "24px", margin: "8px 0" }}>96</h2>
          <p style={{ color: "#86efac", fontSize: "12px", margin: 0 }}>↑ +8% vs last month</p>
        </div>

        <div className="card" style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#9ca3af", fontSize: "12px" }}>In Progress</span>
            <Clock size={16} color="#3b82f6" />
          </div>
          <h2 style={{ fontSize: "24px", margin: "8px 0" }}>24</h2>
          <p style={{ color: "#86efac", fontSize: "12px", margin: 0 }}>↑ +5% vs last month</p>
        </div>

        <div className="card" style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#9ca3af", fontSize: "12px" }}>Critical Alerts</span>
            <AlertTriangle size={16} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: "24px", margin: "8px 0" }}>8</h2>
          <p style={{ color: "#fca5a5", fontSize: "12px", margin: 0 }}>↓ -3% vs last month</p>
        </div>
      </div>

      {/* ==========================================
          2. ACTIVE CASE OVERVIEW
          ========================================== */}
      <div className="threeCol">
        
        {/* Patient Profile Snapshot */}
        <div className="card">
          <h3 style={{ fontSize: "15px", marginBottom: "15px" }}>Patient Overview</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
            <div style={{ width: 35, height: 35, borderRadius: "50%", background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>JD</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: "bold", margin: 0, fontSize: "14px" }}>John Doe</p>
              <p style={{ color: "#9ca3af", margin: 0, fontSize: "12px" }}>Male, 58 Yrs</p>
            </div>
            <span className="badgeBlue">P-19943</span>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <p style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af", borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "4px", margin: 0 }}><span>Cancer Type</span><span style={{ color: "white" }}>Stage IIIA - NSCLC</span></p>
            <p style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af", borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "4px", margin: 0 }}><span>Diagnosed on</span><span style={{ color: "white" }}>12 May 2024</span></p>
            <p style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af", borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "4px", margin: 0 }}><span>Smoking Status</span><span style={{ color: "white" }}>Former Smoker</span></p>
            <p style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af", borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "4px", margin: 0 }}><span>Mutation</span><span style={{ color: "white" }}>EGFR L858R</span></p>
            <p style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af", margin: 0 }}><span>PD-L1</span><span style={{ color: "#4ade80" }}>39%</span></p>
          </div>
          
          {/* Note: This routes to the review screen we will build later */}
          <Link to="/review/mock-thread-123" className="link">View Full Profile →</Link>
        </div>

        {/* AI Agents Pipeline Status */}
        <div className="card">
          <h3 style={{ fontSize: "15px", marginBottom: "15px" }}>AI Agents Status</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
              <Dna size={16} color="#3b82f6" /> <span style={{ flex: 1 }}>Pathology Agent</span> <span className="badgeGreen">Completed</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
              <ScanLine size={16} color="#3b82f6" /> <span style={{ flex: 1 }}>Radiology Agent</span> <span className="badgeGreen">Completed</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
              <Microscope size={16} color="#3b82f6" /> <span style={{ flex: 1 }}>Genomics Agent</span> <span className="badgeGreen">Completed</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
              <BookOpen size={16} color="#3b82f6" /> <span style={{ flex: 1 }}>Guidelines Agent</span> <span className="badgeGreen">Completed</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
              <Pill size={16} color="#eab308" /> <span style={{ flex: 1 }}>Pharmacology Agent</span> <span className="badgeYellow">Warning</span>
            </div>
          </div>
        </div>

        {/* AI Consensus Summary */}
        <div className="card">
          <h3 style={{ fontSize: "15px", marginBottom: "15px" }}>AI Consensus Summary</h3>
          <p style={{ color: "#9ca3af", fontSize: "12px", margin: "0 0 4px 0" }}>Recommended Treatment</p>
          <h2 style={{ fontSize: "20px", margin: "0 0 8px 0" }}>Osimertinib (80 mg daily)</h2>
          <span className="badgeBlue">EGFR TKI</span>
          
          <p style={{ color: "#9ca3af", fontSize: "12px", marginTop: "20px", marginBottom: "4px" }}>Confidence Score</p>
          <h2 style={{ color: "#4ade80", fontSize: "24px", margin: "0 0 8px 0" }}>92%</h2>
          
          <div style={{ background: "rgba(255,255,255,0.1)", height: "6px", borderRadius: "5px", overflow: "hidden" }}>
            <div style={{ background: "#4ade80", width: "92%", height: "100%" }}></div>
          </div>
          
          <Link to="/review/mock-thread-123" className="link" style={{ marginTop: "15px" }}>View Full Consensus Report →</Link>
        </div>
      </div>

      {/* ==========================================
          3. METRICS & TIMELINE
          ========================================== */}
      <div className="threeCol">
        
        {/* Timeline */}
        <div className="card">
          <h3 style={{ fontSize: "15px", marginBottom: "15px" }}>Analysis Timeline</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
            <p style={{ margin: 0 }}>Case Created - <span style={{ color: "#9ca3af" }}>12 May 09:15 AM</span></p>
            <p style={{ margin: 0 }}>Data Ingestion Complete - <span style={{ color: "#9ca3af" }}>12 May 09:47 AM</span></p>
            <p style={{ margin: 0 }}>AI Agents Processing - <span style={{ color: "#3b82f6" }}>ongoing</span></p>
            <p style={{ margin: 0 }}>Consensus Generated - <span style={{ color: "#9ca3af" }}>12 May 10:28 AM</span></p>
          </div>
        </div>

        {/* Chart */}
        <div className="card">
          <h3 style={{ fontSize: "15px", marginBottom: "15px" }}>Confidence Over Time</h3>
          <div style={{ height: "140px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="#888" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                  itemStyle={{ color: "#3b82f6" }}
                />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ fill: "#080a0f", stroke: "#3b82f6", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts */}
        <div className="card">
          <h3 style={{ fontSize: "15px", marginBottom: "15px" }}>Recent Alerts</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: "bold" }}>Drug Interaction Detected</p>
              <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>Osimertinib + Warfarin - 2 min ago</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: "bold" }}>Kidney Function Declining</p>
              <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>eGFR &lt; 65 - 15 min ago</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: "bold" }}>Missing Radiologic Report</p>
              <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>PET-CT not uploaded - 1 hr ago</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}