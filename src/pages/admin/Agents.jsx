import React, { useState } from "react";
import { PlusCircle, Save, Trash2, X, RotateCcw, Upload } from "lucide-react";
import { getAgents, saveAgent, setAgentActive, uploadMedia } from "../../lib/store";
import { useAsync } from "../../lib/hooks";
import { PageLoading, PageError } from "../../components/DataState";
import AdminLayout from "./AdminLayout";
import { useSEO } from "../../lib/seo";

const BLANK = { name: "", role: "", phone: "", email: "", image: "", active: true };

export default function AdminAgents() {
  useSEO({ title: "Manage agents", path: "/admin/agents", noindex: true });
  const state = useAsync(() => getAgents(true), []);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  async function save(e) { e.preventDefault(); setSaving(true); setError(""); try { await saveAgent(editing); setEditing(null); state.refetch(); } catch (err) { setError(err.message || "Couldn't save agent."); } finally { setSaving(false); } }
  async function toggle(a) {
    if (a.active && !window.confirm(`Deactivate ${a.name}? Any published listings must be reassigned before this agent can be deactivated.`)) return;
    try { await setAgentActive(a.id, !a.active); state.refetch(); } catch (err) { setError(err.message || "Couldn't update agent."); }
  }
  return (
    <AdminLayout title={`Agents · ${state.data?.length ?? "…"}`} actions={<button type="button" className="dark-btn small" onClick={() => setEditing({ ...BLANK })}><PlusCircle size={15} /> Add agent</button>}>
      {error && <p className="form-error" role="alert">{error}</p>}
      {state.loading && <PageLoading label="Loading agents..." />}
      {state.error && <PageError error={state.error} onRetry={state.refetch} />}
      {editing && <form className="admin-form agent-inline-form" onSubmit={save}><div className="three-col"><label>Name<input required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label><label>Role / territory<input required value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} placeholder="e.g. Mumbai · Residential" /></label><label>Photo URL<input value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} /></label><label className="outline-btn small upload-btn agent-upload"><Upload size={13} /> {uploading ? "Uploading…" : "Upload photo"}<input type="file" accept="image/*" disabled={uploading} onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; setUploading(true); setError(""); try { const url = await uploadMedia(file, "agents"); setEditing({ ...editing, image: url }); } catch (err) { setError(err.message || "Photo upload failed."); } finally { setUploading(false); } }} /></label></div><div className="two-col"><label>Phone<input required value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></label><label>Email<input required type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></label></div><div className="admin-form-actions"><button className="dark-btn small" type="submit" disabled={saving}><Save size={14} /> {saving ? "Saving..." : "Save agent"}</button><button className="outline-btn small" type="button" onClick={() => setEditing(null)}><X size={14} /> Cancel</button></div></form>}
      {state.data && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Agent</th><th>Role</th><th>Phone</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead><tbody>{state.data.map((a) => <tr key={a.id} className={!a.active ? "muted-row" : ""}><td className="admin-prop-cell"><img src={a.image || "/placeholder-property.svg"} alt="" style={{ borderRadius: "50%" }} /><div><b>{a.name}</b></div></td><td>{a.role}</td><td>{a.phone}</td><td>{a.email}</td><td><span className={`agent-status ${a.active ? "active" : "inactive"}`}>{a.active ? "Active" : "Inactive"}</span></td><td className="admin-actions"><button type="button" onClick={() => setEditing(a)} title="Edit agent">Edit</button><button type="button" onClick={() => toggle(a)} title={a.active ? "Deactivate agent" : "Reactivate agent"}>{a.active ? <Trash2 size={15} /> : <RotateCcw size={15} />}</button></td></tr>)}</tbody></table></div>}
    </AdminLayout>
  );
}
