import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "70vh", textAlign: "center" }}>
      <div className="card" style={{ maxWidth: "450px", padding: "40px" }}>
        <AlertTriangle size={48} color="#facc15" style={{ margin: "0 auto 20px auto" }} />
        <h1 style={{ fontSize: "24px", marginBottom: "10px" }}>404 - Page Not Found</h1>
        <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "30px", lineHeight: "1.6" }}>
          The module or patient record you are looking for does not exist or you do not have permission to access it.
        </p>
        <Link to="/" className="btnPrimary" style={{ display: "inline-flex", textDecoration: "none" }}>
          <Home size={16} /> Return to Dashboard
        </Link>
      </div>
    </div>
  );
}