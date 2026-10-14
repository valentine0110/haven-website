import React, { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Save, Trash2, Upload, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getPropertyById, saveProperty, deleteProperty, getAgents, uploadMedia, getSiteSettings, PROPERTY_TYPES, FURNISHING_OPTIONS, AVAILABILITY_OPTIONS, AMENITY_OPTIONS, CITIES as DEFAULT_CITIES } from "../../lib/store";
import { useAsync } from "../../lib/hooks";
import { PageLoading, PageError } from "../../components/DataState";
import AdminLayout from "./AdminLayout";
import { useSEO } from "../../lib/seo";
import { useAuth } from "../../lib/auth";

const BLANK = {
  title: "", slug: "", propertyType: "Apartment", status: "For sale", price: "", location: "", city: DEFAULT_CITIES[0] || "",
  address: "", area: "", bedrooms: "", bathrooms: "", floor: "", totalFloors: "", furnishing: "Unfurnished", parking: "0",
  description: "", amenities: [], images: [], floorPlan: "", videoUrl: "", lat: "", lng: "", showMap: false,
  featured: false, availability: "Available", agentId: "", published: false,
};

function toFormShape(editing) {
  return {
    ...BLANK, ...editing,
    price: String(editing.price ?? ""), area: String(editing.area ?? ""), bedrooms: String(editing.bedrooms ?? ""), bathrooms: String(editing.bathrooms ?? ""),
    floor: editing.floor ?? "", totalFloors: editing.totalFloors ?? "", parking: String(editing.parking ?? 0),
    images: editing.images?.length ? editing.images : [], lat: editing.lat ?? "", lng: editing.lng ?? "", showMap: editing.showMap === true,
  };
}

export default function AdminPropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const propertyState = useAsync(() => isNew ? Promise.resolve(null) : getPropertyById(id), [id]);
  const agentsState = useAsync(() => getAgents(true), []);
  const settingsState = useAsync(getSiteSettings, []);
  const cities = settingsState.data?.cities?.length ? settingsState.data.cities : DEFAULT_CITIES;
  const { staff } = useAuth();
  const canDelete = ["owner", "admin"].includes(staff?.role);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({});
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => { 
    if (propertyState.data) setForm(toFormShape(propertyState.data)); 
    else if (isNew && form.city === "" && cities.length > 0) setForm(s => ({ ...s, city: cities[0] }));
  }, [propertyState.data, isNew, cities, form.city]);
  useSEO({ title: isNew ? "Add property" : `Edit ${propertyState.data?.title || "property"}`, path: `/admin/properties${id ? `/${id}` : ""}`, noindex: true });

  function set(patch) { setForm((f) => ({ ...f, ...patch })); }
  function toggleAmenity(a) { set({ amenities: form.amenities.includes(a) ? form.amenities.filter((x) => x !== a) : [...form.amenities, a] }); }
  function setImage(i, val) { const images = [...form.images]; images[i] = val; set({ images }); }
  function addImage() { set({ images: [...form.images, ""] }); }
  function removeImage(i) { set({ images: form.images.filter((_, idx) => idx !== i) }); }
  function moveImage(i, dir) { const images = [...form.images]; const j = i + dir; if (j < 0 || j >= images.length) return; [images[i], images[j]] = [images[j], images[i]]; set({ images }); }

  async function uploadImage(i, file) {
    if (!file) return;
    setUploading((u) => ({ ...u, [i]: true })); setSaveError("");
    try { setImage(i, await uploadMedia(file, "properties")); } catch (e) { setSaveError(e.message || "Image upload failed."); }
    finally { setUploading((u) => ({ ...u, [i]: false })); }
  }
  async function uploadFloorPlan(file) {
    if (!file) return;
    setUploading((u) => ({ ...u, floorPlan: true })); setSaveError("");
    try { set({ floorPlan: await uploadMedia(file, "floor-plans") }); } catch (e) { setSaveError(e.message || "Floor plan upload failed."); }
    finally { setUploading((u) => ({ ...u, floorPlan: false })); }
  }

  async function submit(e) {
    e.preventDefault();
    const intent = e.nativeEvent.submitter?.value || (form.published ? "publish" : "draft");
    const publishing = intent === "publish";
    setSaving(true); setSaveError(""); setNotice("");
    const clean = { ...form, price: Number(form.price), area: Number(form.area), bedrooms: Number(form.bedrooms || 0), bathrooms: Number(form.bathrooms || 0), parking: Number(form.parking || 0), floor: form.floor === "" ? null : Number(form.floor), totalFloors: form.totalFloors === "" ? null : Number(form.totalFloors), lat: form.lat === "" ? null : Number(form.lat), lng: form.lng === "" ? null : Number(form.lng), images: form.images.map((s) => s.trim()).filter(Boolean) };
    try {
      const saved = await saveProperty({ ...clean, id: propertyState.data?.id }, { publishing });
      setForm(toFormShape(saved));
      setNotice(publishing ? "Property published." : "Draft saved.");
      if (isNew) navigate(`/admin/properties/${saved.id}`, { replace: true });
    } catch (err) { setSaveError(err.message || "Couldn't save this property."); }
    finally { setSaving(false); }
  }

  async function onDelete() {
    if (propertyState.data && confirm(`Delete “${propertyState.data.title}”? This permanently removes the listing.`)) {
      try { await deleteProperty(propertyState.data.id); navigate("/admin/dashboard"); } catch (e) { setSaveError(e.message || "Couldn't delete the property."); }
    }
  }

  if (propertyState.loading || agentsState.loading) return <AdminLayout title="Loading..."><PageLoading label="Loading property..." /></AdminLayout>;
  if (propertyState.error) return <AdminLayout title="Error"><PageError error={propertyState.error} /></AdminLayout>;
  const agents = agentsState.data || [];

  return (
    <AdminLayout title={propertyState.data ? `Edit: ${propertyState.data.title}` : "Add a new property"} actions={propertyState.data && canDelete ? <button type="button" className="outline-btn small danger" onClick={onDelete}><Trash2 size={14} /> Delete</button> : null}>
      <form className="admin-form" onSubmit={submit}>
        <div className="admin-form-notice"><span className={`publish-state ${form.published ? "live" : "draft"}`}>{form.published ? "Published" : "Draft"}</span><span>{form.published ? "Visible on the public site." : "Not visible until you publish."}</span></div>
        <div className="admin-form-grid">
          <section><h3>Basics</h3><label>Property title<input required minLength="3" value={form.title} onChange={(e) => set({ title: e.target.value })} /></label><label>URL slug <span className="muted">(optional)</span><input value={form.slug} onChange={(e) => set({ slug: e.target.value })} placeholder="modern-3-bedroom-home" /></label><div className="two-col"><label>Property type<select value={form.propertyType} onChange={(e) => set({ propertyType: e.target.value })}>{PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label><label>Buy / Rent<select value={form.status} onChange={(e) => set({ status: e.target.value })}><option>For sale</option><option>For rent</option></select></label></div><div className="two-col"><label>Price (₹{form.status === "For rent" ? " / month" : ""})<input required type="number" min="1" value={form.price} onChange={(e) => set({ price: e.target.value })} /></label><label>Assigned agent<select required value={form.agentId} onChange={(e) => set({ agentId: e.target.value })}><option value="">Select agent</option>{agents.filter((a) => a.active || a.id === form.agentId).map((a) => <option key={a.id} value={a.id}>{a.name}{!a.active ? " (inactive)" : ""}</option>)}</select></label></div></section>

          <section><h3>Location</h3><div className="two-col"><label>Locality / area<input required value={form.location} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. Bandra West" /></label><label>City<select required value={form.city} onChange={(e) => set({ city: e.target.value })}>{cities.map((c) => <option key={c}>{c}</option>)}</select></label></div><label>Full address <span className="muted">(staff record; not displayed publicly)</span><input required value={form.address} onChange={(e) => set({ address: e.target.value })} /></label><div className="two-col"><label>Latitude <span className="muted">(optional)</span><input type="number" step="any" value={form.lat} onChange={(e) => set({ lat: e.target.value })} /></label><label>Longitude <span className="muted">(optional)</span><input type="number" step="any" value={form.lng} onChange={(e) => set({ lng: e.target.value })} /></label></div><label className="checkbox-row"><input type="checkbox" checked={form.showMap} onChange={(e) => set({ showMap: e.target.checked })} disabled={!form.lat || !form.lng} /> Show approximate map location publicly</label></section>

          <section><h3>Specifications</h3><div className="three-col"><label>Area (sqft)<input required type="number" min="1" value={form.area} onChange={(e) => set({ area: e.target.value })} /></label><label>Bedrooms<input type="number" min="0" value={form.bedrooms} onChange={(e) => set({ bedrooms: e.target.value })} /></label><label>Bathrooms<input type="number" min="0" value={form.bathrooms} onChange={(e) => set({ bathrooms: e.target.value })} /></label></div><div className="three-col"><label>Floor<input type="number" min="0" value={form.floor} onChange={(e) => set({ floor: e.target.value })} placeholder="0 = ground" /></label><label>Total floors<input type="number" min="1" value={form.totalFloors} onChange={(e) => set({ totalFloors: e.target.value })} /></label><label>Parking spaces<input type="number" min="0" value={form.parking} onChange={(e) => set({ parking: e.target.value })} /></label></div><div className="two-col"><label>Furnishing<select value={form.furnishing} onChange={(e) => set({ furnishing: e.target.value })}>{FURNISHING_OPTIONS.map((f) => <option key={f}>{f}</option>)}</select></label><label>Availability<select value={form.availability} onChange={(e) => set({ availability: e.target.value })}>{AVAILABILITY_OPTIONS.map((a) => <option key={a}>{a}</option>)}</select></label></div></section>

          <section><h3>Description</h3><label>Property description<textarea required minLength="30" rows={6} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Describe the space accurately, including useful context and trade-offs." /></label></section>

          <section><h3>Amenities</h3><div className="amenity-check-grid">{AMENITY_OPTIONS.map((a) => <label key={a} className="checkbox-row"><input type="checkbox" checked={form.amenities.includes(a)} onChange={() => toggleAmenity(a)} />{a}</label>)}</div></section>

          <section><h3>Property media</h3><p className="muted small">Upload images directly or paste an existing image URL. The first image is always the cover.</p>{form.images.map((img, i) => <div className="image-manager-row" key={i}><div className="image-manager-preview">{img ? <img src={img} alt={`Property image ${i + 1}`} onError={(e) => { e.currentTarget.src = "/placeholder-property.svg"; }} /> : <span>No image</span>} {i === 0 && <b>Cover</b>}</div><div className="image-manager-controls"><input aria-label={`Image ${i + 1} URL`} placeholder="https://… image URL" value={img} onChange={(e) => setImage(i, e.target.value)} /><div className="image-actions"><label className="outline-btn small upload-btn"><Upload size={13} /> {uploading[i] ? "Uploading…" : "Upload"}<input type="file" accept="image/*" disabled={uploading[i]} onChange={(e) => uploadImage(i, e.target.files?.[0])} /></label><button type="button" className="mini-icon-btn" onClick={() => moveImage(i, -1)} disabled={i === 0} title="Move image up"><ArrowUp size={14} /></button><button type="button" className="mini-icon-btn" onClick={() => moveImage(i, 1)} disabled={i === form.images.length - 1} title="Move image down"><ArrowDown size={14} /></button><button type="button" className="mini-icon-btn danger-icon" onClick={() => removeImage(i)} title="Remove image"><X size={14} /></button></div></div></div>)}<button type="button" className="outline-btn small" onClick={addImage}>Add image</button></section>

          <section><h3>Extras</h3><label>Floor plan<input value={form.floorPlan || ""} onChange={(e) => set({ floorPlan: e.target.value })} placeholder="Paste image URL or upload below" /></label><label className="outline-btn small upload-btn"><Upload size={13} /> {uploading.floorPlan ? "Uploading…" : "Upload floor plan"}<input type="file" accept="image/*" disabled={uploading.floorPlan} onChange={(e) => uploadFloorPlan(e.target.files?.[0])} /></label><label>Video / virtual tour embed URL <span className="muted">(optional)</span><input value={form.videoUrl || ""} onChange={(e) => set({ videoUrl: e.target.value })} placeholder="https://www.youtube.com/embed/..." /></label><div className="two-col"><label className="checkbox-row"><input type="checkbox" checked={form.featured} onChange={(e) => set({ featured: e.target.checked })} /> Featured property</label></div></section>
        </div>
        {saveError && <p className="form-error" role="alert">{saveError}</p>}{notice && <p className="form-success" role="status">{notice}</p>}
        <div className="admin-form-actions"><button className="outline-btn" type="submit" name="publish" value="draft" disabled={saving || Object.values(uploading).some(Boolean)}><Save size={15} /> {saving ? "Saving…" : "Save draft"}</button><button className="dark-btn" type="submit" name="publish" value="publish" disabled={saving || Object.values(uploading).some(Boolean)}><Save size={15} /> {saving ? "Saving…" : form.published ? "Save & keep published" : "Save & publish"}</button></div>
      </form>
    </AdminLayout>
  );
}
