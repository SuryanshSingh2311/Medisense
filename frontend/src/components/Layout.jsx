import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { 
  Home, Users, Bot, FileText, MessageSquare, 
  Bell, Settings, LogOut, Search 
} from "lucide-react";

// Define the navigation structure here so it's easy to update later
const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/patients", label: "Patients", icon: Users },
  { path: "/agents", label: "AI Agents", icon: Bot },
  { path: "/reports", label: "Reports", icon: FileText },
  { path: "/consensus", label: "Consensus", icon: MessageSquare },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="appWrapper">
      {/* ==========================================
          1. SIDEBAR NAVIGATION
          ========================================== */}
      <div className="sidebar">
        
        {/* Brand & Logo */}
        <div className="brand" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <div 
            className="logoBox" 
            style={{ 
              width: 32, height: 32, 
              background: "rgba(255, 255, 255, 0.08)", 
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: 9, 
              display: "flex", alignItems: "center", justifyContent: "center", 
              fontWeight: "bold",
              boxShadow: "0 6px 18px rgba(0,0,0,0.2)"
            }}
          >
            M
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: "bold", fontSize: "14px" }}>MediSense AI</p>
            <p style={{ margin: 0, fontSize: "10px", color: "#8b919d" }}>Multi-Agent Orchestrator</p>
          </div>
        </div>

        {/* Dynamic Navigation Links */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            // Highlight if current path matches the item path (or starts with it for sub-routes, except home)
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`navItem ${isActive ? "navActive" : ""}`}
              >
                <Icon size={16} /> {item.label}
              </Link>
            );
          })}
        </div>

        {/* Bottom Section (Plan & Logout) */}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="card" style={{ padding: "12px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <p style={{ margin: 0, fontWeight: "bold", fontSize: "12px" }}>Enterprise Plan</p>
            <p style={{ margin: 0, fontSize: "10px", color: "#9ca3af" }}>Valid till Dec 2025</p>
          </div>
          
          <div className="navItem" style={{ cursor: "pointer", color: "#ef4444" }}>
            <LogOut size={16} /> Logout
          </div>
        </div>
      </div>

      {/* ==========================================
          2. MAIN CONTENT AREA
          ========================================== */}
      <div className="mainArea">
        
        {/* Topbar (Search & Profile) */}
        <div className="topbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          
          <div 
            className="searchBox" 
            style={{ 
              flex: 1, maxWidth: "400px", 
              background: "rgba(255, 255, 255, 0.055)", 
              border: "1px solid rgba(255, 255, 255, 0.14)", 
              borderRadius: "13px", padding: "8px 12px", 
              color: "#9ca3af", display: "flex", alignItems: "center", gap: "8px", 
              fontSize: "13px" 
            }}
          >
            <Search size={14} />
            <span>Search patients, reports, agents...</span>
          </div>
          
          <div className="topbarRight" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div 
              style={{ 
                width: 34, height: 34, 
                background: "rgba(255, 255, 255, 0.055)", 
                border: "1px solid rgba(255, 255, 255, 0.14)", 
                borderRadius: "11px", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <Bell size={16} />
            </div>
            
            <div className="docInfo" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div 
                className="docAvatar" 
                style={{ 
                  width: 36, height: 36, borderRadius: "50%", 
                  background: "rgba(255, 255, 255, 0.09)", 
                  border: "1px solid rgba(255, 255, 255, 0.16)", 
                  display: "flex", alignItems: "center", justifyContent: "center", 
                  fontSize: "12px", fontWeight: "bold" 
                }}
              >
                AS
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: "bold", fontSize: "13px" }}>Dr. Ananya Sharma</p>
                <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>Oncologist</p>
              </div>
            </div>
          </div>
        </div>

        {/* 
          This Outlet is the magic of React Router. 
          It injects Dashboard.jsx, NewCase.jsx, etc., based on the URL. 
        */}
        <Outlet />
        
      </div>
    </div>
  );
}