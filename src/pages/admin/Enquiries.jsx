import React, { useMemo, useState } from "react";
import { Mail, MessageCircle, Phone, Search } from "lucide-react";
import { getEnquiries, getAgents, updateEnquiry, ENQUIRY_STATUSES } from "../../lib/store";
import { useAsync } from "../../lib/hooks";
import { PageError, PageLoading } from "../../components/DataState";
import AdminLayout from "./AdminLayout";
import { useSEO } from "../../lib/seo";

export default function AdminEnquiries() {
  useSEO({ title: "Enquiries", path: "/admin/enquiries", noindex: true });
  const enquiries = useAsync(getEnquiries, []);
  const agents = useAsync(() => getAgents(true), []);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState(null);
  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (enquiries.data || []).filter((e) => {
      if (status !== "all" && e.status !== status) return false;
      if (q && !`${e.name} ${e.email} ${e.phone || ""} ${e.propertyTitle || ""} ${e.propertyId || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [enquiries.data, status, search]);
  async function patch(id, data) {
    setSaving(id); setNotice(null);
    try { await updateEnquiry(id, data); await enquiries.refetch(); setNotice({ type: "success", text: "Lead updated." }); }
    catch (e) { setNotice({ type: "error", text: e.message || "Couldn't update the lead." }); }
    finally { setSaving(""); }
  }
  return (
    <AdminLayout title={`Enquiries · ${list.length}`}>
      <div className="admin-toolbar enquiry-toolbar"><div className="mini-input admin-search"><Search size={14} aria-hidden="true" /><label className="sr-only" htmlFor="enquiry-search">Search enquiries</label><input id="enquiry-search" placeholder="Search name, email, phone or property…" value={search} onChange={(e) => setSearch(e.target.value)} /></div><select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter leads by status"><option value="all">All statuses</option>{ENQUIRY_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
      {notice && <div className={`admin-notice ${notice.type === "error" ? "error" : ""}`} role={notice.type === "error" ? "alert" : "status"}>{notice.text}</div>}
      {enquiries.loading && <PageLoading label="Loading enquiries..." />}
      {enquiries.error && <PageError error={enquiries.error} onRetry={enquiries.refetch} />}
      {!enquiries.loading && !enquiries.error && !list.length && <div className="admin-empty"><h3>No enquiries found</h3><p>New website leads will appear here.</p></div>}
      <div className="enquiry-list">
        {list.map((e) => (
          <article className={`enquiry-row ${e.status === "New" ? "unread" : ""}`} key={e.id}>
            <div className="enquiry-row-head"><div><b>{e.name}</b><span className="lead-status-chip">{e.status}</span></div><span>{new Date(e.date).toLocaleString("en-IN")}</span></div>
            <div className="enquiry-row-meta">{e.phone && <a href={`tel:${e.phone}`}><Phone size={12} /> {e.phone}</a>}{e.email && <a href={`mailto:${e.email}`}><Mail size={12} /> {e.email}</a>}{e.propertyTitle && <span>Re: {e.propertyTitle}</span>}<span>via {e.source || "Website"}</span></div>
            <p>{e.message}</p>
            {e.preferredDate && <p className="preferred-viewing"><b>Preferred viewing:</b> {new Date(`${e.preferredDate}T00:00:00`).toLocaleDateString("en-IN", { dateStyle: "medium" })}{e.preferredTime ? ` at ${e.preferredTime}` : ""}</p>}
            <div className="lead-controls">
              <label>Status<select disabled={saving === e.id} value={e.status} onChange={(ev) => patch(e.id, { status: ev.target.value })}>{ENQUIRY_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
              <label>Assigned agent<select disabled={saving === e.id} value={e.assignedAgentId || ""} onChange={(ev) => patch(e.id, { assignedAgentId: ev.target.value })}><option value="">Unassigned</option>{(agents.data || []).map((a) => <option key={a.id} value={a.id}>{a.name}{!a.active ? " (inactive)" : ""}</option>)}</select></label>
              <label className="lead-notes">Internal notes<textarea rows={2} defaultValue={e.notes} onBlur={(ev) => patch(e.id, { notes: ev.target.value })} placeholder="Next step, client preference, follow-up…" /></label>
            </div>
            <div className="lead-actions">{e.phone && <a className="outline-btn small" href={`https://wa.me/${e.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={13} /> WhatsApp</a>}{e.phone && <a className="outline-btn small" href={`tel:${e.phone}`}><Phone size={13} /> Call</a>}{e.email && <a className="outline-btn small" href={`mailto:${e.email}`}><Mail size={13} /> Email</a>}</div>
          </article>
        ))}
      </div>
    </AdminLayout>
  );
}
