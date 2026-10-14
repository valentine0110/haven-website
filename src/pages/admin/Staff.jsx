import React, { useState } from "react";
import { PlusCircle, RotateCcw, Trash2, Shield, X, Save, Info } from "lucide-react";
import { getAllStaff, createStaff, updateStaffStatus } from "../../lib/store";
import { useAsync } from "../../lib/hooks";
import { PageLoading, PageError } from "../../components/DataState";
import { useToast } from "../../components/Toast";
import AdminLayout from "./AdminLayout";
import { useSEO } from "../../lib/seo";
import { useAuth } from "../../lib/auth";
import { useNavigate } from "react-router-dom";

export default function AdminStaff() {
  useSEO({ title: "Staff Directory", path: "/admin/staff", noindex: true });
  
  const { staff } = useAuth();
  const navigate = useNavigate();
  const state = useAsync(getAllStaff, []);
  
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "editor" });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  // Loading guard for initial auth check
  if (staff === undefined) {
    return (
      <AdminLayout title="Staff Directory">
        <PageLoading label="Checking access..." />
      </AdminLayout>
    );
  }

  // Access check using conditional render instead of early return hook violation
  if (staff?.role !== "owner") {
    return (
      <AdminLayout title="Access Denied">
        <div className="admin-notice error">
          <p>Only owners can manage staff.</p>
        </div>
      </AdminLayout>
    );
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await createStaff(form.email, form.password, form.name, form.role);
      toast.success("Staff account created!");
      setAdding(false);
      setForm({ name: "", email: "", password: "", role: "editor" });
      state.refetch();
    } catch (err) {
      toast.error(err.message || "Could not create staff account.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(s) {
    if (s.user_id === staff.user_id) {
      return toast.error("You cannot deactivate your own account.");
    }
    
    // TODO: replace window.confirm with custom modal
    if (!window.confirm(`Are you sure you want to ${s.active ? "deactivate" : "reactivate"} this account?`)) {
      return;
    }
    
    try {
      await updateStaffStatus(s.user_id, !s.active);
      toast.success(`Account ${s.active ? "deactivated" : "reactivated"}.`);
      state.refetch();
    } catch (err) {
      toast.error(err.message || "Failed to update status.");
    }
  }

  const roleDescriptions = {
    editor: "Can manage properties",
    admin: "Can manage agents & properties",
    owner: "Full access to all system features"
  };

  return (
    <AdminLayout 
      title="Staff Directory" 
      actions={
        <button 
          aria-label="Add new staff"
          className="dark-btn small" 
          onClick={() => setAdding(!adding)}
        >
          <PlusCircle size={15} /> Add staff
        </button>
      }
    >
      {adding && (
        <form className="admin-form" onSubmit={handleAdd} style={{ marginBottom: 30, maxWidth: 800 }}>
          <div className="section-header"><h3>Add new employee</h3></div>
          <div className="two-col">
            <label>
              Full name
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </label>
            <label>
              Email address
              <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </label>
          </div>
          <div className="two-col">
            <label>
              Password
              <input required minLength="6" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            </label>
            <label>
              System Role
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="editor">Editor (Can manage properties)</option>
                <option value="admin">Admin (Can manage agents & properties)</option>
                <option value="owner">Owner (Full access)</option>
              </select>
            </label>
          </div>
          <div className="admin-form-actions">
            <button aria-label="Create account" className="dark-btn small" type="submit" disabled={saving}>
              <Save size={14} /> {saving ? "Creating..." : "Create account"}
            </button>
            <button aria-label="Cancel adding staff" className="outline-btn small" type="button" onClick={() => setAdding(false)}>
              <X size={14} /> Cancel
            </button>
          </div>
        </form>
      )}

      {state.loading && <PageLoading label="Loading staff..." />}
      {state.error && <PageError error={state.error} onRetry={state.refetch} />}
      
      {state.data && (
        <div className="admin-table-wrap">
          <table className="admin-table table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.data.map(s => (
                <tr key={s.user_id} className={!s.active ? "muted-row" : ""}>
                  <td>
                    <b>{s.full_name}</b> 
                    {s.user_id === staff.user_id && <span className="muted" style={{ marginLeft: 8 }}>(You)</span>}
                  </td>
                  <td style={{ textTransform: "capitalize" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {s.role}
                      <Info size={14} className="muted" title={roleDescriptions[s.role] || ""} style={{ cursor: "help" }} />
                    </div>
                  </td>
                  <td>
                    <span className={`agent-status ${s.active ? "active" : "inactive"}`}>
                      {s.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="admin-actions">
                    <button 
                      type="button" 
                      aria-label={s.active ? "Deactivate account" : "Reactivate account"}
                      onClick={() => toggleStatus(s)} 
                      disabled={s.user_id === staff.user_id} 
                      title={s.user_id === staff.user_id ? "Cannot deactivate your own account" : (s.active ? "Deactivate account" : "Reactivate account")}
                      style={{
                        opacity: s.user_id === staff.user_id ? 0.5 : 1,
                        cursor: s.user_id === staff.user_id ? "not-allowed" : "pointer",
                      }}
                    >
                      {s.active ? <Trash2 size={15} /> : <RotateCcw size={15} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
