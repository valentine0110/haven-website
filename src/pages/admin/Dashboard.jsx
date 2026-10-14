import React, { useMemo, useState } from "react";
import { Archive, CheckSquare, Edit3, Eye, EyeOff, PlusCircle, Star, Trash2, XSquare, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { getProperties, getEnquiries, deleteProperty, setPropertyFeatured, setPropertyPublished, setPropertyAvailability, bulkUpdateProperties, priceLabel, AVAILABILITY_OPTIONS } from "../../lib/store";
import { useAsync } from "../../lib/hooks";
import { PageLoading, PageError } from "../../components/DataState";
import AdminLayout from "./AdminLayout";
import { useSEO } from "../../lib/seo";
import { useAuth } from "../../lib/auth";

export default function AdminDashboard() {
  useSEO({ title: "Manage properties", path: "/admin/dashboard", noindex: true });
  const propsState = useAsync(getProperties, []);
  const enquiryState = useAsync(getEnquiries, []);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [notice, setNotice] = useState(null);
  const { staff } = useAuth();
  const canDelete = ["owner", "admin"].includes(staff?.role);
  const properties = propsState.data || [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return properties.filter((p) => {
      if (visibility === "published" && !p.published) return false;
      if (visibility === "draft" && p.published) return false;
      if (availability !== "all" && p.availability !== availability) return false;
      if (q && !`${p.title} ${p.location} ${p.city} ${p.id} ${p.agentId || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [properties, search, visibility, availability]);

  const stats = {
    total: properties.length,
    live: properties.filter((p) => p.published).length,
    drafts: properties.filter((p) => !p.published).length,
    newLeads: (enquiryState.data || []).filter((e) => e.status === "New").length,
  };

  function toggleOne(id) { setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]); }
  function toggleVisible() {
    const ids = filtered.map((p) => p.id);
    setSelected((prev) => prev.length === ids.length && ids.every((id) => prev.includes(id)) ? [] : ids);
  }
  async function mutate(fn, success) {
    setNotice(null);
    try { await fn(); setNotice({ type: "success", text: success }); setSelected([]); await propsState.refetch(); }
    catch (e) { setNotice({ type: "error", text: e.message || "Action failed." }); }
  }
  async function onDelete(p) {
    if (!confirm(`Delete “${p.title}”? This permanently removes the listing.`)) return;
    await mutate(() => deleteProperty(p.id), "Property deleted.");
  }
  function exportCSV() {
    if (!properties.length) return;
    const headers = ["ID", "Title", "Type", "Status", "Price", "City", "Location", "Bedrooms", "Bathrooms", "Area_SqFt", "Availability", "Published"];
    const rows = properties.map((p) => [
      p.id,
      `"${(p.title || "").replace(/"/g, '""')}"`,
      p.propertyType,
      p.status,
      p.price,
      `"${(p.city || "").replace(/"/g, '""')}"`,
      `"${(p.location || "").replace(/"/g, '""')}"`,
      p.bedrooms,
      p.bathrooms,
      p.area,
      p.availability,
      p.published ? "Yes" : "No",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `haven-inventory-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const selectedCount = selected.filter((id) => properties.some((p) => p.id === id)).length;

  return (
    <AdminLayout
      title="Properties"
      actions={
        <div style={{ display: "flex", gap: "8px" }}>
          {properties.length > 0 && (
            <button type="button" className="outline-btn small" onClick={exportCSV} title="Export CSV">
              <Download size={14} /> Export CSV
            </button>
          )}
          <Link className="dark-btn small" to="/admin/properties/new">
            <PlusCircle size={15} /> Add property
          </Link>
        </div>
      }
    >
      <div className="admin-stat-grid">
        <div><span>ALL LISTINGS</span><b>{stats.total}</b><small>inventory records</small></div>
        <div><span>LIVE</span><b>{stats.live}</b><small>visible on site</small></div>
        <div><span>DRAFTS</span><b>{stats.drafts}</b><small>not public</small></div>
        <div><span>NEW LEADS</span><b>{stats.newLeads}</b><small><Link to="/admin/enquiries">Open lead inbox</Link></small></div>
      </div>

      {notice && <div className={`admin-notice ${notice.type === "error" ? "error" : ""}`} role={notice.type === "error" ? "alert" : "status"}>{notice.text}</div>}
      <div className="admin-toolbar">
        <div className="mini-input admin-search"><label className="sr-only" htmlFor="admin-property-search">Search properties</label><input id="admin-property-search" placeholder="Search title, area, city, ID or agent…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <select value={visibility} onChange={(e) => setVisibility(e.target.value)} aria-label="Filter by visibility"><option value="all">All visibility</option><option value="published">Published</option><option value="draft">Drafts</option></select>
        <select value={availability} onChange={(e) => setAvailability(e.target.value)} aria-label="Filter by availability"><option value="all">All availability</option>{AVAILABILITY_OPTIONS.map((v) => <option key={v}>{v}</option>)}</select>
      </div>

      {propsState.loading && <PageLoading label="Loading properties..." />}
      {propsState.error && <PageError error={propsState.error} onRetry={propsState.refetch} />}
      {!propsState.loading && !propsState.error && <>
        {selectedCount > 0 && <div className="bulk-bar"><span>{selectedCount} selected</span><button type="button" onClick={() => mutate(() => bulkUpdateProperties(selected, { published: true }), "Selected properties published.")}><Eye size={15} /> Publish</button><button type="button" onClick={() => mutate(() => bulkUpdateProperties(selected, { published: false }), "Selected properties moved to draft.")}><EyeOff size={15} /> Unpublish</button><button type="button" onClick={() => mutate(() => bulkUpdateProperties(selected, { availability: "Sold" }), "Selected properties marked sold.")}><Archive size={15} /> Mark sold</button><button type="button" onClick={() => setSelected([])}><XSquare size={15} /> Clear</button></div>}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th><input type="checkbox" aria-label="Select visible properties" checked={filtered.length > 0 && selectedCount === filtered.length} onChange={toggleVisible} /></th><th>Property</th><th>Type</th><th>Price</th><th>Availability</th><th>Featured</th><th>Visibility</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td><input type="checkbox" aria-label={`Select ${p.title}`} checked={selected.includes(p.id)} onChange={() => toggleOne(p.id)} /></td>
                  <td className="admin-prop-cell"><img src={p.image || "/placeholder-property.svg"} alt="" /><div><b>{p.title}</b><span>{p.location} · ID {p.id}</span></div></td>
                  <td>{p.propertyType}</td><td>{priceLabel(p)}</td>
                  <td><select value={p.availability} onChange={(e) => mutate(() => setPropertyAvailability(p.id, e.target.value), "Availability updated.")} aria-label={`Availability for ${p.title}`}>{AVAILABILITY_OPTIONS.map((a) => <option key={a}>{a}</option>)}</select></td>
                  <td><button type="button" className={`icon-toggle ${p.featured ? "on" : ""}`} onClick={() => mutate(() => setPropertyFeatured(p.id, !p.featured), "Featured status updated.")} title={p.featured ? "Remove from featured" : "Feature property"}><Star size={16} fill={p.featured ? "currentColor" : "none"} /></button></td>
                  <td><button type="button" className={`publish-toggle ${p.published ? "live" : "draft"}`} onClick={() => mutate(() => setPropertyPublished(p.id, !p.published), p.published ? "Property unpublished." : "Property published.")}><span className="status-dot" /> {p.published ? "Published" : "Draft"}</button></td>
                  <td className="admin-actions"><Link to={`/admin/properties/${p.id}`} title="Edit property" aria-label={`Edit ${p.title}`}><Edit3 size={15} /></Link>{canDelete && <button type="button" onClick={() => onDelete(p)} title="Delete property" aria-label={`Delete ${p.title}`}><Trash2 size={15} /></button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <div className="admin-empty"><CheckSquare size={20} /><h3>No matching properties</h3><p>Try changing the search or filters.</p></div>}
        </div>
      </>}
    </AdminLayout>
  );
}
