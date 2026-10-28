import React, { useState, useEffect } from "react";
import { 
  Server, Database, ShieldAlert, Activity, 
  Zap, CheckCircle2, AlertTriangle, Clock 
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

// Mock data for agent performance
const AGENT_METRICS = [
  { name: "Pathology", tier: "Tier 1", latency: 1.2, success: 99.8, calls: 1420 },
  { name: "Radiology", tier: "Tier 1", latency: 1.5, success: 99.5, calls: 1418 },
  { name: "Genomics", tier: "Tier 1", latency: 0.8, success: 99.9, calls: 1425 },
  { name: "Guidelines", tier: "Tier 2", latency: 2.1, success: 98.5, calls: 1390 },
  { name: "Oncology", tier: "Tier 2", latency: 4.5, success: 97.2, calls: 1385 },
  { name: "Pharmacology", tier: "Tier 3", latency: 0.3, success: 99.9, calls: 1385 },
  { name: "Moderator", tier: "Tier 3", latency: 3.2, success: 98.0, calls: 112 }, // Only runs on conflicts
];

export default function AIAgents() {
  const [servers, setServers] = useState([
    { id: "gateway", name: "FastAPI Gateway", port: 5000, status: "checking", icon: Server },
    { id: "rag", name: "FastMCP RAG Server", port: 8000, status: "checking", icon: Database },
    { id: "safety", name: "FastMCP Safety Server", port: 8001, status: "checking", icon: ShieldAlert },
  ]);

  // Simulate startup connection checks
  useEffect(() => {
    const timer = setTimeout(() => {
      setServers(prev => prev.map(s => ({ ...s, status: "online" })));
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* Header */}
      <div style={{ marginBottom: "25px" }}>
        <h1 style={{ fontSize: "22px", marginBottom: "4px" }}>System Health & AI Agents</h1>
        <p style={{ color: "#9ca3af", fontSize: "13px" }}>
          Monitor microservice connectivity and LangGraph agent inference metrics.
        </p>
      </div>

      {/* ==========================================
          1. MICROSERVICES STATUS ROW
          ========================================== */}
      <div className="threeCol">
        {servers.map((server) => {
          const Icon = server.icon;
          const isOnline = server.status === "online";
          
          return (
            <div key={server.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ 
                    width: 36, height: 36, borderRadius: "10px", 
                    background: isOnline ? "rgba(34, 197, 94, 0.15)" : "rgba(255,255,255,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <Icon size={18} color={isOnline ? "#4ade80" : "#9ca3af"} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "14px", margin: 0 }}>{server.name}</h3>
                    <p style={{ fontSize: "11px", color: "#9ca3af", margin: "2px 0 0 0", fontFamily: "monospace" }}>
                      localhost:{server.port}
                    </p>
                  </div>
                </div>
                
                {isOnline ? (
                  <span className="badgeGreen" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span className="pulseDot" style={{ width: 6, height: 6, background: "#4ade80", borderRadius: "50%", display: "inline-block" }}></span>
                    Online
                  </span>
                ) : (
                  <span className="badgeYellow" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Activity size={10} className="spin" /> Checking...
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ==========================================
          2. METRICS & CHARTS
          ========================================== */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        
        {/* Left: Agent Performance List */}
        <div className="card" style={{ flex: "2", minWidth: "500px" }}>
          <h3 style={{ fontSize: "15px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Zap size={18} color="#3b82f6" /> LangGraph Agent Metrics
          </h3>
          
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ color: "#9ca3af", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <th style={{ padding: "12px 10px", fontWeight: "500" }}>Agent Node</th>
                  <th style={{ padding: "12px 10px", fontWeight: "500" }}>Execution Tier</th>
                  <th style={{ padding: "12px 10px", fontWeight: "500" }}>Total Calls</th>
                  <th style={{ padding: "12px 10px", fontWeight: "500" }}>Success Rate</th>
                  <th style={{ padding: "12px 10px", fontWeight: "500" }}>Avg Latency</th>
                  <th style={{ padding: "12px 10px", fontWeight: "500" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {AGENT_METRICS.map((agent, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "12px 10px", fontWeight: "bold" }}>{agent.name}</td>
                    <td style={{ padding: "12px 10px", color: "#9ca3af" }}>{agent.tier}</td>
                    <td style={{ padding: "12px 10px", fontFamily: "monospace" }}>{agent.calls.toLocaleString()}</td>
                    <td style={{ padding: "12px 10px" }}>
                      <span style={{ color: agent.success > 98 ? "#4ade80" : "#facc15" }}>{agent.success}%</span>
                    </td>
                    <td style={{ padding: "12px 10px", fontFamily: "monospace" }}>{agent.latency}s</td>
                    <td style={{ padding: "12px 10px" }}>
                      {agent.success > 95 ? (
                        <CheckCircle2 size={16} color="#4ade80" />
                      ) : (
                        <AlertTriangle size={16} color="#facc15" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Latency Chart */}
        <div className="card" style={{ flex: "1", minWidth: "300px", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "15px", marginBottom: "5px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={18} color="#3b82f6" /> Average Inference Latency
          </h3>
          <p style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "20px" }}>
            Response times in seconds per model invocation.
          </p>
          
          <div style={{ flex: 1, minHeight: "250px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={AGENT_METRICS} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#888" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#888" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                />
                <Bar dataKey="latency" radius={[0, 4, 4, 0]} barSize={12}>
                  {AGENT_METRICS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.latency > 3 ? "#f43f5e" : (entry.latency > 1.5 ? "#facc15" : "#4ade80")} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Required CSS for Animations */}
      <style>{`
        @keyframes pulseDotAnim {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(74, 222, 128, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
        }
        .pulseDot {
          animation: pulseDotAnim 2s infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}