import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

// ============================================================================
// 1. PAGE IMPORTS (Actual built files)
// ============================================================================
import Dashboard from "./pages/Dashboard"; 
import CaseReview from "./pages/CaseReview";
import AIAgents from "./pages/AIAgents";
import Patients from "./pages/Patients";
import NewCase from "./pages/NewCase";
import LiveExecution from "./pages/LiveExecution";

// ============================================================================
// 2. FUTURE PAGES (Placeholders for pages not built yet)
// ============================================================================
const Reports = () => <div className="card"><h2>Analytics & Reports</h2></div>;
const Consensus = () => <div className="card"><h2>Historical Consensus Decisions</h2></div>;
const Settings = () => <div className="card"><h2>System Settings</h2></div>;
const NotFound = () => <div className="card"><h2>404 - Page Not Found</h2></div>;

// ============================================================================
// 3. MAIN ROUTER CONFIGURATION
// ============================================================================
export default function App() {
  return (
    // BrowserRouter enables client-side routing without page reloads, 
    // preserving your SSE web socket connections in the background.
    <BrowserRouter>
      {/* 
        You can wrap the Routes in global context providers here in the future 
        e.g., <AuthProvider>, <ThemeProvider>, <Toaster /> for notifications
      */}
      <Routes>
        
        {/* The Layout component wraps all these routes, providing the Sidebar & Topbar */}
        <Route element={<Layout />}>
          
          {/* Main Navigation Routes */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/agents" element={<AIAgents />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/consensus" element={<Consensus />} />
          <Route path="/settings" element={<Settings />} />

          {/* 
            CRITICAL BACKEND-DRIVEN ROUTES 
            These map directly to your LangGraph / FastAPI lifecycle 
          */}
          
          {/* 1. Submits the unstructured data to start the graph */}
          <Route path="/patients/new" element={<NewCase />} />
          
          {/* 2. Tracks the SSE stream of a specific thread_id in real-time */}
          <Route path="/patients/live/:threadId" element={<LiveExecution />} />
          
          {/* 3. The HITL pause screen where the physician reviews the drafted state */}
          <Route path="/review/:threadId" element={<CaseReview />} />
          
          {/* Catch-all for undefined URLs */}
          <Route path="*" element={<NotFound />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}