import React from "react";
import { Settings as SettingsIcon, Key, Shield, User, Save } from "lucide-react";

export default function Settings() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "25px" }}>
        <h1 style={{ fontSize: "22px", marginBottom: "4px" }}>System Settings</h1>
        <p style={{ color: "#9ca3af", fontSize: "13px" }}>Manage LLM inference keys and global clinical guardrails.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
        
        {/* API Configuration */}
        <div className="card">
          <h3 style={{ fontSize: "15px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <Key size={18} color="#3b82f6" /> LLM Inference Configuration
          </h3>
          <div className="formGroup">
            <label className="formLabel">Hugging Face API Token</label>
            <input type="password" placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxx" className="inputField" defaultValue="hf_mock_token_loaded" />
            <span style={{ fontSize: "11px", color: "#9ca3af" }}>Used by all 7 LangGraph agents for model inference.</span>
          </div>
          <div className="formGroup">
            <label className="formLabel">Default Model ID</label>
            <input type="text" className="inputField" defaultValue="Qwen/Qwen2.5-7B-Instruct-1M" />
          </div>
        </div>

        {/* Clinical Guardrails */}
        <div className="card">
          <h3 style={{ fontSize: "15px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <Shield size={18} color="#3b82f6" /> Pharmacology Thresholds
          </h3>
          <div className="formGroup">
            <label className="formLabel">Max GFR Cap for Calvert Formula (mL/min)</label>
            <input type="number" className="inputField" defaultValue="125" />
            <span style={{ fontSize: "11px", color: "#9ca3af" }}>Limits Carboplatin dosing in hyper-filtering patients.</span>
          </div>
        </div>

        {/* Action Bar */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="btnPrimary">
            <Save size={16} /> Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}