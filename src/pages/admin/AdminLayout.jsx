import React from "react";
import { Building2, LayoutDashboard, LogOut, MessageSquare, PlusCircle, Users, Globe, Settings, Shield } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";

export default function AdminLayout({ title, actions, children }) {
  const navigate = useNavigate();
  const { staff, logout } = useAuth();
  
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" role="navigation" aria-label="Sidebar Navigation">
        <Link to="/" className="logo admin-logo" aria-label="Go to site home">
          <span className="logo-box"><Building2 size={16} /></span>haven <small>{staff?.role || "staff"}</small>
        </Link>
        <nav aria-label="Main Admin Navigation">
          <NavLink to="/admin/dashboard" className={({ isActive }) => (isActive ? "active" : "")} end>
            <LayoutDashboard size={16} /> Properties
          </NavLink>
          <NavLink to="/admin/properties/new" className={({ isActive }) => (isActive ? "active" : "")}>
            <PlusCircle size={16} /> Add property
          </NavLink>
          {["owner", "admin"].includes(staff?.role) && (
            <NavLink to="/admin/agents" className={({ isActive }) => (isActive ? "active" : "")}>
              <Users size={16} /> Agents
            </NavLink>
          )}
          <NavLink to="/admin/enquiries" className={({ isActive }) => (isActive ? "active" : "")}>
            <MessageSquare size={16} /> Enquiries
          </NavLink>
          <NavLink to="/admin/settings" className={({ isActive }) => (isActive ? "active" : "")}>
            <Settings size={16} /> Settings
          </NavLink>
          {staff?.role === "owner" && (
            <NavLink to="/admin/staff" className={({ isActive }) => (isActive ? "active" : "")}>
              <Shield size={16} /> Staff
            </NavLink>
          )}
        </nav>
        <div className="admin-sidebar-foot">
          <Link to="/" aria-label="View live site"><Globe size={15} /> View live site</Link>
          <button aria-label="Log out" onClick={async () => { await logout(); navigate("/admin", { replace: true }); }}>
            <LogOut size={15} /> Log out
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <div className="admin-topbar">
          <h1>{title}</h1>
          <div className="admin-topbar-actions">{actions}</div>
        </div>
        <div className="admin-content-wrap">
          {children}
        </div>
      </main>
    </div>
  );
}
