import React from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, Clock, Activity, Target } from "lucide-react";

// Mock Analytics Data
const cancerTypeData = [
  { name: "NSCLC", value: 45 },
  { name: "Breast", value: 30 },
  { name: "Colorectal", value: 15 },
  { name: "Prostate", value: 10 },
];
const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"];

const monthlyTrendData = [
  { month: "Jan", cases: 45, confidence: 88 },
  { month: "Feb", cases: 52, confidence: 89 },
  { month: "Mar", cases: 78, confidence: 91 },
  { month: "Apr", cases: 95, confidence: 92 },
  { month: "May", cases: 128, confidence: 94 },
];

export default function Reports() {
  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "25px" }}>
        <h1 style={{ fontSize: "22px", marginBottom: "4px" }}>Analytics & Reports</h1>
        <p style={{ color: "#9ca3af", fontSize: "13px" }}>
          Hospital-wide metrics for AI Tumor Board utilization and efficiency.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="threeCol">
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ width: 40, height: 40, borderRadius: "10px", background: "rgba(59, 130, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={20} color="#3b82f6" />
          </div>
          <div>
            <p style={{ color: "#9ca3af", fontSize: "12px", margin: 0 }}>Total Cases Processed</p>
            <h2 style={{ fontSize: "24px", margin: "4px 0 0 0" }}>398</h2>
          </div>
        </div>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ width: 40, height: 40, borderRadius: "10px", background: "rgba(34, 197, 94, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Target size={20} color="#4ade80" />
          </div>
          <div>
            <p style={{ color: "#9ca3af", fontSize: "12px", margin: 0 }}>Avg AI Confidence Score</p>
            <h2 style={{ fontSize: "24px", margin: "4px 0 0 0" }}>91.4%</h2>
          </div>
        </div>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ width: 40, height: 40, borderRadius: "10px", background: "rgba(139, 92, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Clock size={20} color="#8b5cf6" />
          </div>
          <div>
            <p style={{ color: "#9ca3af", fontSize: "12px", margin: 0 }}>Time Saved Per Case</p>
            <h2 style={{ fontSize: "24px", margin: "4px 0 0 0" }}>~45 min</h2>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        
        {/* Bar Chart: Monthly Volume */}
        <div className="card" style={{ flex: "2", minWidth: "500px", minHeight: "350px" }}>
          <h3 style={{ fontSize: "15px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={18} color="#3b82f6" /> Monthly Case Volume
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyTrendData}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" stroke="#888" tickLine={false} axisLine={false} />
              <YAxis stroke="#888" tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
              <Bar dataKey="cases" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart: Cancer Types */}
        <div className="card" style={{ flex: "1", minWidth: "300px", minHeight: "350px" }}>
          <h3 style={{ fontSize: "15px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={18} color="#8b5cf6" /> Distribution by Primary Site
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={cancerTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {cancerTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: "15px", flexWrap: "wrap", marginTop: "10px" }}>
            {cancerTypeData.map((entry, index) => (
              <div key={index} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#9ca3af" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[index] }}></span> {entry.name}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}