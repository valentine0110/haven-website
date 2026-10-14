import { supabase } from "./supabaseClient";
import { SITE_CONFIG } from "./config";
import { createClient } from "@supabase/supabase-js";

/**
 * Slugifies a given string.
 */
function slugify(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const PROPERTY_LIST_FIELDS = [
  "id", "slug", "title", "property_type", "status", "price", "location", "city",
  "area", "bedrooms", "bathrooms", "furnishing", "parking", "amenities", "image",
  "date_added", "featured", "availability", "agent_id", "published", "updated_at"
].join(",");

const PROPERTY_ADMIN_FIELDS = "*";
const PROPERTY_ADMIN_LIST_FIELDS = [
  "id", "slug", "title", "property_type", "status", "price", "location", "city", "area",
  "bedrooms", "bathrooms", "parking", "image", "featured", "availability", "agent_id",
  "published", "published_at", "updated_at"
].join(",");

/**
 * Maps a database row to a property object.
 */
function fromRow(r) {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    propertyType: r.property_type,
    status: r.status,
    price: Number(r.price),
    location: r.location,
    city: r.city,
    address: r.address || "",
    area: Number(r.area || 0),
    bedrooms: Number(r.bedrooms || 0),
    bathrooms: Number(r.bathrooms || 0),
    floor: r.floor,
    totalFloors: r.total_floors,
    furnishing: r.furnishing,
    parking: Number(r.parking || 0),
    description: r.description || "",
    amenities: r.amenities || [],
    image: r.image || null,
    images: r.images && r.images.length ? r.images : (r.image ? [r.image] : []),
    floorPlan: r.floor_plan || null,
    videoUrl: r.video_url || null,
    lat: r.lat,
    lng: r.lng,
    showMap: r.show_map !== false,
    dateAdded: r.date_added,
    featured: !!r.featured,
    availability: r.availability,
    agentId: r.agent_id,
    published: r.published !== false,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    publishedAt: r.published_at,
  };
}

/**
 * Maps a property object to a database row.
 */
function toRow(p, { publishing } = {}) {
  const lat = p.lat === "" || p.lat === null || p.lat === undefined ? null : Number(p.lat);
  const lng = p.lng === "" || p.lng === null || p.lng === undefined ? null : Number(p.lng);
  const images = (p.images || []).map((s) => String(s).trim()).filter(Boolean);
  return {
    slug: p.slug ? slugify(p.slug) : slugify(p.title || "property"),
    title: String(p.title || "").trim(),
    property_type: p.propertyType,
    status: p.status,
    price: Number(p.price),
    location: String(p.location || "").trim(),
    city: p.city,
    address: String(p.address || "").trim(),
    area: Number(p.area),
    bedrooms: Number(p.bedrooms || 0),
    bathrooms: Number(p.bathrooms || 0),
    floor: p.floor === "" || p.floor === undefined ? null : Number(p.floor),
    total_floors: p.totalFloors === "" || p.totalFloors === undefined ? null : Number(p.totalFloors),
    furnishing: p.furnishing,
    parking: Number(p.parking || 0),
    description: String(p.description || "").trim(),
    amenities: p.amenities || [],
    image: images[0] || null,
    images,
    floor_plan: p.floorPlan || null,
    video_url: p.videoUrl || null,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    show_map: p.showMap !== false,
    featured: !!p.featured,
    availability: p.availability,
    agent_id: p.agentId || null,
    published: publishing !== undefined ? publishing : p.published !== false,
  };
}

/**
 * Maps a database row to an agent object.
 */
function agentFromRow(r) {
  return {
    id: r.id, name: r.name, role: r.role, phone: r.phone, email: r.email,
    image: r.image, active: r.active !== false,
  };
}

/**
 * Throws an error if one exists.
 */
function must(error) {
  if (error) throw new Error(error.message || "Request failed");
}

/**
 * Validates property data before saving or publishing.
 */
function validateProperty(p, publishing) {
  const errors = [];
  if (!p.title?.trim()) errors.push("Property title is required.");
  if (!p.propertyType) errors.push("Property type is required.");
  if (!p.status) errors.push("Buy/rent status is required.");
  if (!p.location?.trim()) errors.push("Location is required.");
  if (!p.city) errors.push("City is required.");
  if (!PROPERTY_TYPES.includes(p.propertyType)) errors.push("Choose a valid property type.");
  if (!["For sale", "For rent"].includes(p.status)) errors.push("Choose For sale or For rent.");
  if (!FURNISHING_OPTIONS.includes(p.furnishing)) errors.push("Choose a valid furnishing option.");
  if (!AVAILABILITY_OPTIONS.includes(p.availability)) errors.push("Choose a valid availability status.");
  if (!p.address?.trim()) errors.push("Internal address is required.");
  if (!Number.isFinite(Number(p.price)) || Number(p.price) <= 0) errors.push("Price must be greater than zero.");
  if (!Number.isFinite(Number(p.area)) || Number(p.area) <= 0) errors.push("Area must be greater than zero.");
  if (Number(p.bedrooms) < 0 || Number(p.bathrooms) < 0 || Number(p.parking) < 0) errors.push("Bedroom, bathroom and parking values cannot be negative.");
  if (p.floor !== null && p.floor !== "" && Number(p.floor) < 0) errors.push("Floor cannot be negative.");
  if (p.totalFloors !== null && p.totalFloors !== "" && Number(p.totalFloors) < 1) errors.push("Total floors must be at least 1.");
  if (p.floor !== null && p.floor !== "" && p.totalFloors !== null && p.totalFloors !== "" && Number(p.floor) > Number(p.totalFloors)) errors.push("Floor cannot be above total floors.");
  if (!p.description?.trim() || p.description.trim().length < 30) errors.push("Description should be at least 30 characters.");
  if (!p.agentId) errors.push("Assign an agent before saving.");
  const hasImage = (p.images || []).some((s) => String(s).trim());
  if (publishing && !hasImage) errors.push("Add at least one property image before publishing.");
  const mediaUrls = [...(p.images || []), p.floorPlan].filter(Boolean).map((x) => String(x).trim());
  if (mediaUrls.some((url) => !/^(https?:\/\/|\/)/i.test(url))) errors.push("Image and floor-plan URLs must use http(s) or a site-relative path.");
  if (p.videoUrl && !/^https?:\/\//i.test(String(p.videoUrl).trim())) errors.push("Video / virtual tour URL must start with http:// or https://.");
  if (p.lat !== null && p.lat !== "" && (Number(p.lat) < -90 || Number(p.lat) > 90)) errors.push("Latitude must be between -90 and 90.");
  if (p.lng !== null && p.lng !== "" && (Number(p.lng) < -180 || Number(p.lng) > 180)) errors.push("Longitude must be between -180 and 180.");
  if (errors.length) throw new Error(errors.join(" "));
}

// ── Auth ──

/**
 * Gets a staff profile by user ID.
 */
export async function getStaffProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase.from("staff_profiles").select("user_id, role, full_name, active").eq("user_id", userId).eq("active", true).maybeSingle();
  must(error);
  return data || null;
}

/**
 * Logs in a user.
 */
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) return { ok: false, error: error.message };
  const staff = await getStaffProfile(data.user.id);
  if (!staff) {
    await supabase.auth.signOut();
    return { ok: false, error: "This account is not authorized for the Haven staff panel." };
  }
  return { ok: true, staff };
}

/**
 * Logs out the current user.
 */
export async function logout() { await supabase.auth.signOut(); }

/**
 * Gets the current session.
 */
export async function getSession() { const { data, error } = await supabase.auth.getSession(); must(error); return data.session; }

/**
 * Listens for auth state changes.
 */
export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

// ── Properties ──

/**
 * Gets all properties for the admin view.
 */
export async function getProperties() {
  const { data, error } = await supabase.from("properties").select(PROPERTY_ADMIN_LIST_FIELDS).order("updated_at", { ascending: false });
  must(error);
  return (data || []).map(fromRow);
}

/**
 * High-performance Stale-While-Revalidate (SWR) cache helper.
 * Serves cached listings instantaneously (0ms) while silently revalidating in background.
 */
async function withCache(key, fetcher, ttlMs = 1000 * 60 * 10) {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (raw) {
        const { data, timestamp } = JSON.parse(raw);
        const isFresh = Date.now() - timestamp < ttlMs;
        if (isFresh) return data;

        // Stale-While-Revalidate: Trigger background fetch to update cache silently
        fetcher().then((freshData) => {
          try {
            const payload = JSON.stringify({ data: freshData, timestamp: Date.now() });
            localStorage.setItem(key, payload);
          } catch (e) { /* ignore */ }
        }).catch(() => {});

        // Return stale data immediately for instant render without loading screens
        return data;
      }
    } catch (e) { /* ignore */ }
  }
  const data = await fetcher();
  if (typeof window !== "undefined") {
    try {
      const payload = JSON.stringify({ data, timestamp: Date.now() });
      localStorage.setItem(key, payload);
      sessionStorage.setItem(key, payload);
    } catch (e) { /* ignore */ }
  }
  return data;
}

/**
 * Gets all published properties.
 */
export async function getPublishedProperties() {
  return withCache("haven_cache_properties", async () => {
    const { data, error } = await supabase
      .from("public_properties")
      .select(PROPERTY_LIST_FIELDS)
      .order("date_added", { ascending: false });
    must(error);
    return (data || []).map(fromRow);
  });
}

/**
 * Gets a published property by its slug.
 */
export async function getPropertyBySlug(slug) {
  const { data, error } = await supabase.from("public_properties").select("*").eq("slug", slug).maybeSingle();
  must(error);
  return data ? fromRow(data) : null;
}

/**
 * Gets a property by its ID for admin view.
 */
export async function getPropertyById(id) {
  const { data, error } = await supabase.from("properties").select(PROPERTY_ADMIN_FIELDS).eq("id", id).maybeSingle();
  must(error);
  return data ? fromRow(data) : null;
}

/**
 * Gets related properties in the same city.
 */
export async function getRelatedProperties(city, excludeId) {
  const { data, error } = await supabase
    .from("public_properties")
    .select(PROPERTY_LIST_FIELDS)
    .eq("city", city)
    .neq("id", excludeId)
    .order("featured", { ascending: false })
    .order("date_added", { ascending: false })
    .limit(3);
  must(error);
  return (data || []).map(fromRow);
}

function clearPropertyCache() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("haven_cache_properties");
    sessionStorage.removeItem("haven_cache_properties");
  }
}

/**
 * Saves a property (inserts or updates).
 */
export async function saveProperty(prop, { publishing } = {}) {
  clearPropertyCache();
  const willPublish = publishing !== undefined ? publishing : prop.published !== false;
  validateProperty(prop, willPublish);
  const row = toRow(prop, { publishing });
  if (prop.id) {
    const { data, error } = await supabase.from("properties").update(row).eq("id", prop.id).select(PROPERTY_ADMIN_FIELDS).single();
    if (error?.code === "23505") throw new Error("That URL slug is already in use. Choose a different slug.");
    must(error);
    return fromRow(data);
  }
  const { data, error } = await supabase.from("properties").insert(row).select(PROPERTY_ADMIN_FIELDS).single();
  if (error?.code === "23505") throw new Error("That URL slug is already in use. Choose a different slug.");
  must(error);
  return fromRow(data);
}

/**
 * Deletes a property.
 */
export async function deleteProperty(id) {
  clearPropertyCache();
  const { error } = await supabase.from("properties").delete().eq("id", id);
  must(error);
}

/**
 * Sets the published status of a property.
 */
export async function setPropertyPublished(id, published) {
  clearPropertyCache();
  if (published) {
    const { data, error } = await supabase.from("properties").select(PROPERTY_ADMIN_FIELDS).eq("id", id).single();
    must(error);
    validateProperty(fromRow(data), true);
  }
  const { error } = await supabase.from("properties").update({ published: !!published }).eq("id", id);
  must(error);
}

/**
 * Sets the featured status of a property.
 */
export async function setPropertyFeatured(id, featured) {
  clearPropertyCache();
  const { error } = await supabase.from("properties").update({ featured: !!featured }).eq("id", id);
  must(error);
}

/**
 * Sets the availability status of a property.
 */
export async function setPropertyAvailability(id, availability) {
  clearPropertyCache();
  if (!AVAILABILITY_OPTIONS.includes(availability)) throw new Error("Invalid availability status.");
  const { error } = await supabase.from("properties").update({ availability }).eq("id", id);
  must(error);
}

/**
 * Bulk updates properties.
 */
export async function bulkUpdateProperties(ids, patch) {
  clearPropertyCache();
  if (!ids?.length) return;
  const allowed = {};
  if ("published" in patch) allowed.published = !!patch.published;
  if ("featured" in patch) allowed.featured = !!patch.featured;
  if ("availability" in patch && AVAILABILITY_OPTIONS.includes(patch.availability)) allowed.availability = patch.availability;
  if (!Object.keys(allowed).length) return;
  if (allowed.published === true) {
    const { data, error } = await supabase.from("properties").select(PROPERTY_ADMIN_FIELDS).in("id", ids);
    must(error);
    (data || []).forEach((row) => validateProperty(fromRow(row), true));
  }
  const { error } = await supabase.from("properties").update(allowed).in("id", ids);
  must(error);
}

// ── Agents ──

/**
 * Gets a list of agents.
 */
export async function getAgents(includeInactive = false) {
  let query = supabase.from("agents").select("*").order("name");
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  must(error);
  return (data || []).map(agentFromRow);
}

/**
 * Gets a single agent by ID.
 */
export async function getAgentById(id) {
  if (!id) return null;
  const { data, error } = await supabase.from("agents").select("*").eq("id", id).eq("active", true).maybeSingle();
  must(error);
  return data ? agentFromRow(data) : null;
}

/**
 * Saves (inserts or updates) an agent.
 */
export async function saveAgent(agent) {
  const row = {
    name: String(agent.name || "").trim(), role: String(agent.role || "").trim(),
    phone: String(agent.phone || "").trim(), email: String(agent.email || "").trim(),
    image: String(agent.image || "").trim() || null, active: agent.active !== false,
  };
  if (!row.name || !row.role || !row.phone || !row.email) throw new Error("Name, role, phone and email are required.");
  if (!/^\S+@\S+\.\S+$/.test(row.email)) throw new Error("Enter a valid agent email address.");
  if (row.phone.replace(/\D/g, "").length < 7) throw new Error("Enter a valid agent phone number.");
  if (agent.id) {
    const { data, error } = await supabase.from("agents").update(row).eq("id", agent.id).select().single();
    must(error);
    return agentFromRow(data);
  }
  const { data, error } = await supabase.from("agents").insert(row).select().single();
  must(error);
  return agentFromRow(data);
}

/**
 * Sets an agent's active status.
 */
export async function setAgentActive(id, active) {
  const { error } = await supabase.from("agents").update({ active: !!active }).eq("id", id);
  must(error);
}

/**
 * Updates a specific field on an agent.
 */
export async function updateAgent(id, patch) {
  const { error } = await supabase.from("agents").update(patch).eq("id", id);
  must(error);
}

// ── Enquiries ──

export const ENQUIRY_STATUSES = ["New", "Contacted", "Viewing requested", "Qualified", "Closed", "Lost"];

/**
 * Gets all enquiries.
 */
export async function getEnquiries() {
  const { data, error } = await supabase.from("enquiries").select("*, agents:assigned_agent_id(name)").order("created_at", { ascending: false });
  must(error);
  return (data || []).map((r) => ({
    id: r.id,
    date: r.created_at,
    updatedAt: r.updated_at,
    status: r.status,
    propertyId: r.property_id,
    propertyTitle: r.property_title,
    name: r.name,
    phone: r.phone,
    email: r.email,
    message: r.message,
    source: r.source,
    preferredDate: r.preferred_date,
    preferredTime: r.preferred_time,
    assignedAgentId: r.assigned_agent_id,
    assignedAgentName: r.agents?.name || null,
    notes: r.internal_notes || "",
  }));
}

/**
 * Adds a new enquiry.
 */
export async function addEnquiry(enq) {
  const cleanName = String(enq.name || "").trim();
  const cleanEmail = String(enq.email || "").trim().toLowerCase();
  const cleanPhone = String(enq.phone || "").trim();
  const message = String(enq.message || "").trim();
  if (cleanName.length < 2) throw new Error("Please enter your name.");
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) throw new Error("Please enter a valid email address.");
  if (cleanPhone && cleanPhone.replace(/\D/g, "").length < 7) throw new Error("Please enter a valid phone number.");
  if (message.length < 5) throw new Error("Please add a little more detail to your message.");
  const { error } = await supabase.from("enquiries").insert({
    property_id: enq.propertyId || null,
    property_title: enq.propertyTitle || null,
    name: cleanName,
    phone: cleanPhone || null,
    email: cleanEmail,
    message: message.slice(0, 4000),
    source: String(enq.source || "Website").slice(0, 120),
    preferred_date: enq.preferredDate || null,
    preferred_time: enq.preferredTime || null,
    status: enq.preferredDate || enq.preferredTime ? "Viewing requested" : "New",
  });
  must(error);
}

/**
 * Updates an enquiry.
 */
export async function updateEnquiry(id, patch) {
  const row = {};
  if (patch.status) {
    if (!ENQUIRY_STATUSES.includes(patch.status)) throw new Error("Invalid lead status.");
    row.status = patch.status;
  }
  if (patch.assignedAgentId !== undefined) row.assigned_agent_id = patch.assignedAgentId || null;
  if (patch.notes !== undefined) row.internal_notes = String(patch.notes || "").trim();
  if (patch.preferredDate !== undefined) row.preferred_date = patch.preferredDate || null;
  if (patch.preferredTime !== undefined) row.preferred_time = patch.preferredTime || null;
  if (!Object.keys(row).length) return;
  const { error } = await supabase.from("enquiries").update(row).eq("id", id);
  must(error);
}

// ── Staff Management ──

const adminAuth = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
);

/**
 * Creates a new staff user.
 */
export async function createStaff(email, password, name, role) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanName = String(name || "").trim();
  const cleanRole = String(role || "").trim();
  
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) throw new Error("Invalid email format.");
  if (!password || password.length < 6) throw new Error("Password must be at least 6 characters long.");
  if (!cleanName) throw new Error("Name cannot be empty.");
  if (!["owner", "admin", "editor"].includes(cleanRole)) throw new Error("Role must be owner, admin, or editor.");

  const { data, error } = await adminAuth.auth.signUp({ email: cleanEmail, password, options: { data: { full_name: cleanName } } });
  if (error) throw error;
  if (!data.user) throw new Error("Could not create user account.");
  
  const { error: profileError } = await supabase.from("staff_profiles").insert({
    user_id: data.user.id,
    full_name: cleanName,
    role: cleanRole,
    active: true
  });
  if (profileError) throw profileError;
  return data.user;
}

/**
 * Gets all staff profiles.
 */
export async function getAllStaff() {
  const { data, error } = await supabase.from("staff_profiles").select("*").order("created_at", { ascending: false });
  must(error);
  return data;
}

/**
 * Updates a staff member's active status.
 */
export async function updateStaffStatus(id, active) {
  const { error } = await supabase.from("staff_profiles").update({ active }).eq("user_id", id);
  must(error);
}

// ── CMS Settings ──

/**
 * Gets site settings, returning defaults if not found.
 */
export async function getSiteSettings() {
  return withCache("haven_cache_settings", async () => {
    const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
    if (error) {
      console.warn("Could not fetch site_settings (table might not exist yet):", error);
      return { hero_image: null, offer_enabled: false, offer_image: null, offer_link: null, cities: null };
    }
    return data || { hero_image: null, offer_enabled: false, offer_image: null, offer_link: null, cities: null };
  });
}

/**
 * Updates site settings.
 */
export async function updateSiteSettings(patch) {
  const cleanPatch = {};
  if (patch.hero_image !== undefined) {
    cleanPatch.hero_image = patch.hero_image ? String(patch.hero_image).trim() : null;
    if (cleanPatch.hero_image && !/^(https?:\/\/|\/)/i.test(cleanPatch.hero_image)) {
      throw new Error("Hero image URL must be valid.");
    }
  }
  if (patch.offer_enabled !== undefined) cleanPatch.offer_enabled = !!patch.offer_enabled;
  if (patch.offer_image !== undefined) {
    cleanPatch.offer_image = patch.offer_image ? String(patch.offer_image).trim() : null;
    if (cleanPatch.offer_image && !/^(https?:\/\/|\/)/i.test(cleanPatch.offer_image)) {
      throw new Error("Offer image URL must be valid.");
    }
  }
  if (patch.offer_link !== undefined) {
    cleanPatch.offer_link = patch.offer_link ? String(patch.offer_link).trim() : null;
    if (cleanPatch.offer_link && !/^(https?:\/\/|\/)/i.test(cleanPatch.offer_link)) {
      throw new Error("Offer link URL must be valid.");
    }
  }
  if (patch.cities !== undefined) {
    cleanPatch.cities = patch.cities;
  }

  const { error } = await supabase.from("site_settings").upsert({ id: 1, ...cleanPatch, updated_at: new Date().toISOString() });
  if (error && error.code === '42P01') {
    throw new Error("The 'site_settings' table doesn't exist yet. Please run the SQL migration in supabase/migrations/add_settings.sql in your Supabase SQL editor.");
  }
  must(error);
  if (typeof window !== "undefined") sessionStorage.removeItem("haven_cache_settings");
}

// ── Media ──

/**
 * Uploads media (images) to Supabase Storage.
 */
export async function uploadMedia(file, folder = "properties") {
  if (!file || !file.type?.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 12 * 1024 * 1024) throw new Error("Images must be 12 MB or smaller.");
  const path = `${folder}/${crypto.randomUUID()}.webp`;
  const blob = await optimizeImage(file);
  const { error } = await supabase.storage.from("property-media").upload(path, blob, {
    cacheControl: "31536000", contentType: "image/webp", upsert: false,
  });
  must(error);
  return supabase.storage.from("property-media").getPublicUrl(path).data.publicUrl;
}

/**
 * Optimizes an image before upload.
 */
async function optimizeImage(file) {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return file;
  const bitmap = await createImageBitmap(file);
  const max = 2200;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return await new Promise((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Image optimization failed.")), "image/webp", 0.84));
}

// ── Constants ──

export const PROPERTY_TYPES = ["Apartment", "House", "Villa", "Studio", "Penthouse", "Plot"];
export const FURNISHING_OPTIONS = ["Unfurnished", "Semi-furnished", "Furnished"];
export const AVAILABILITY_OPTIONS = ["Available", "Under offer", "Sold", "Rented"];
export const AMENITY_OPTIONS = [
  "Clubhouse", "Pool", "Private pool", "Gym", "Lift", "Power backup", "24/7 security",
  "Gated community", "Garden", "Private garden", "Children's play area", "Visitor parking",
  "Pet friendly", "Furnished", "Sea view", "Concierge", "Home theatre", "Solar power",
];
export const CITIES = SITE_CONFIG.cities;

/**
 * Formats a number as a monetary value.
 */
export function formatMoney(n) {
  const value = Number(n) || 0;
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`;
  return `₹${value.toLocaleString("en-IN")}`;
}

/**
 * Gets a formatted price label for a property.
 */
export function priceLabel(p) { return p.status === "For rent" ? `${formatMoney(p.price)} / month` : formatMoney(p.price); }
