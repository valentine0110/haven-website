import React, { useState, useCallback, useMemo } from "react";
import { ChevronDown, ChevronUp, ShieldCheck, X } from "lucide-react";
import { PROPERTY_TYPES, FURNISHING_OPTIONS, AVAILABILITY_OPTIONS, AMENITY_OPTIONS, CITIES as DEFAULT_CITIES, formatMoney, getSiteSettings } from "../lib/store";
import { useAsync } from "../lib/hooks";

export const DEFAULT_FILTERS = {
  purpose: "Any", type: "Any type", city: "Any", minPrice: "", maxPrice: "", beds: "Any", baths: "Any",
  minArea: "", maxArea: "", furnishing: "Any", amenities: [], parking: "Any", availability: "Any",
};

export function applyFilters(list, f, query) {
  const q = query?.trim().toLowerCase();
  return list.filter((p) => {
    if (q) {
      const hay = `${p.title} ${p.location} ${p.city} ${p.id} ${p.propertyType}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.purpose !== "Any" && p.status !== f.purpose) return false;
    if (f.city !== "Any" && p.city !== f.city) return false;
    if (f.type !== "Any type" && p.propertyType !== f.type) return false;
    if (f.minPrice && p.price < Number(f.minPrice)) return false;
    if (f.maxPrice && p.price > Number(f.maxPrice)) return false;
    if (f.beds !== "Any" && !(f.beds === "5+" ? p.bedrooms >= 5 : p.bedrooms === Number(f.beds))) return false;
    if (f.baths !== "Any" && !(f.baths === "4+" ? p.bathrooms >= 4 : p.bathrooms === Number(f.baths))) return false;
    if (f.minArea && p.area < Number(f.minArea)) return false;
    if (f.maxArea && p.area > Number(f.maxArea)) return false;
    if (f.furnishing !== "Any" && p.furnishing !== f.furnishing) return false;
    if (f.parking !== "Any" && !(f.parking === "2+" ? p.parking >= 2 : p.parking === Number(f.parking))) return false;
    if (f.availability !== "Any" && p.availability !== f.availability) return false;
    if (f.amenities.length && !f.amenities.every((a) => p.amenities.includes(a))) return false;
    return true;
  });
}

export function sortList(list, sort) {
  const arr = [...list];
  switch (sort) {
    case "price-asc": return arr.sort((a, b) => a.price - b.price);
    case "price-desc": return arr.sort((a, b) => b.price - a.price);
    case "area-asc": return arr.sort((a, b) => a.area - b.area);
    case "area-desc": return arr.sort((a, b) => b.area - a.area);
    default: return arr.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
  }
}

export function countActiveFilters(f) {
  let n = 0;
  ["purpose", "type", "city", "minPrice", "maxPrice", "beds", "baths", "minArea", "maxArea", "furnishing", "parking", "availability"].forEach((key) => {
    const value = f[key];
    if (value && !["Any", "Any type"].includes(value)) n += 1;
  });
  return n + f.amenities.length;
}

const SALE_PRICE_PRESETS = [
  { label: "Under ₹1 Cr", min: "", max: "10000000" },
  { label: "₹1Cr–3Cr", min: "10000000", max: "30000000" },
  { label: "₹3Cr–5Cr", min: "30000000", max: "50000000" },
  { label: "₹5Cr+", min: "50000000", max: "" },
];

const RENT_PRICE_PRESETS = [
  { label: "Under ₹50k", min: "", max: "50000" },
  { label: "₹50k–1L", min: "50000", max: "100000" },
  { label: "₹1L–2.5L", min: "100000", max: "250000" },
  { label: "₹2.5L+", min: "250000", max: "" },
];

function FilterSection({ label, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="filter-section">
      <button type="button" className="filter-section-head" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`Toggle ${label} filters`}>
        <span className="filter-label" style={{ margin: 0 }}>{label}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      <div className={`filter-section-body ${open ? "" : "collapsed"}`} style={{ maxHeight: open ? "600px" : "0" }}>
        {children}
      </div>
    </div>
  );
}

const FilterPanel = React.memo(function FilterPanel({ filters, setFilters, open, onClose, lockPurpose }) {
  const countFilters = { ...filters, purpose: lockPurpose ? "Any" : filters.purpose, availability: lockPurpose && filters.availability === "Available" ? "Any" : filters.availability };
  const activeCount = countActiveFilters(countFilters);
  const isRent = lockPurpose === "For rent" || filters.purpose === "For rent";
  const pricePresets = isRent ? RENT_PRICE_PRESETS : SALE_PRICE_PRESETS;
  
  const set = useCallback((patch) => { setFilters(prev => ({ ...prev, ...patch })); }, [setFilters]);
  
  const toggleAmenity = useCallback((a) => {
    setFilters(prev => ({ ...prev, amenities: prev.amenities.includes(a) ? prev.amenities.filter((x) => x !== a) : [...prev.amenities, a] }));
  }, [setFilters]);
  
  const reset = useCallback(() => { setFilters({ ...DEFAULT_FILTERS, purpose: lockPurpose || "Any", availability: lockPurpose ? "Available" : "Any" }); }, [setFilters, lockPurpose]);

  const setPreset = useCallback((preset) => {
    setFilters(prev => {
      if (prev.minPrice === preset.min && prev.maxPrice === preset.max) {
        return { ...prev, minPrice: "", maxPrice: "" };
      } else {
        return { ...prev, minPrice: preset.min, maxPrice: preset.max };
      }
    });
  }, [setFilters]);

  const { data: settings } = useAsync(getSiteSettings, []);
  const cities = useMemo(() => settings?.cities?.length > 0 ? settings.cities : DEFAULT_CITIES, [settings]);

  return (
    <aside className={`filter-panel ${open ? "sheet-open" : ""}`} aria-label="Property filters">
      <div className="filter-head">
        <b>Filters {activeCount > 0 && <span className="filter-count" aria-label={`${activeCount} active filters`}>{activeCount}</span>}</b>
        <div className="filter-head-actions">
          <button type="button" onClick={reset} aria-label="Reset all filters">Reset</button>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Close filters"><X size={18} /></button>
        </div>
      </div>

      {!lockPurpose && (
        <FilterSection label="BUY OR RENT">
          <div className="type-options">
            {["Any", "For sale", "For rent"].map((v) => <button type="button" key={v} className={filters.purpose === v ? "active" : ""} onClick={() => set({ purpose: v })} aria-label={`Filter by ${v}`} aria-pressed={filters.purpose === v}>{v}</button>)}
          </div>
        </FilterSection>
      )}

      <FilterSection label="CITY">
        <div className="type-options">
          <button type="button" className={filters.city === "Any" ? "active" : ""} onClick={() => set({ city: "Any" })} aria-label="Filter by Any city" aria-pressed={filters.city === "Any"}>Any</button>
          {cities.map((c) => <button type="button" key={c} className={filters.city === c ? "active" : ""} onClick={() => set({ city: c })} aria-label={`Filter by ${c}`} aria-pressed={filters.city === c}>{c}</button>)}
        </div>
      </FilterSection>

      <FilterSection label="PROPERTY TYPE">
        <div className="type-options">
          <button type="button" className={filters.type === "Any type" ? "active" : ""} onClick={() => set({ type: "Any type" })} aria-label="Filter by Any type" aria-pressed={filters.type === "Any type"}>Any</button>
          {PROPERTY_TYPES.map((t) => <button type="button" key={t} className={filters.type === t ? "active" : ""} onClick={() => set({ type: t })} aria-label={`Filter by ${t}`} aria-pressed={filters.type === t}>{t}</button>)}
        </div>
      </FilterSection>

      <FilterSection label={`PRICE RANGE ${isRent ? "(RENT/MO)" : ""} · ${filters.minPrice ? formatMoney(Number(filters.minPrice)) : "Min"} – ${filters.maxPrice ? formatMoney(Number(filters.maxPrice)) : "Max"}`}>
        <div className="price-presets">
          {pricePresets.map((p) => (
            <button
              type="button"
              key={p.label}
              className={filters.minPrice === p.min && filters.maxPrice === p.max ? "active" : ""}
              onClick={() => setPreset(p)}
              aria-label={`Set price range to ${p.label}`}
              aria-pressed={filters.minPrice === p.min && filters.maxPrice === p.max}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mini-input filter-field"><label className="sr-only">Minimum price</label><input aria-label="Minimum price" type="number" min="0" placeholder="Min price (₹)" value={filters.minPrice} onChange={(e) => set({ minPrice: e.target.value })} /></div>
        <div className="mini-input filter-field"><label className="sr-only">Maximum price</label><input aria-label="Maximum price" type="number" min="0" placeholder="Max price (₹)" value={filters.maxPrice} onChange={(e) => set({ maxPrice: e.target.value })} /></div>
      </FilterSection>

      <FilterSection label="BEDROOMS">
        <div className="bed-options">{["Any", "1", "2", "3", "4", "5+"].map((v) => <button type="button" key={v} className={filters.beds === v ? "active" : ""} onClick={() => set({ beds: v })} aria-label={`${v} bedrooms`} aria-pressed={filters.beds === v}>{v}</button>)}</div>
      </FilterSection>

      <FilterSection label="BATHROOMS">
        <div className="bed-options">{["Any", "1", "2", "3", "4+"].map((v) => <button type="button" key={v} className={filters.baths === v ? "active" : ""} onClick={() => set({ baths: v })} aria-label={`${v} bathrooms`} aria-pressed={filters.baths === v}>{v}</button>)}</div>
      </FilterSection>

      <FilterSection label="AREA (SQFT)" defaultOpen={false}>
        <div className="mini-input filter-field"><label className="sr-only">Minimum area</label><input aria-label="Minimum area" type="number" min="0" placeholder="Min area" value={filters.minArea} onChange={(e) => set({ minArea: e.target.value })} /></div>
        <div className="mini-input filter-field"><label className="sr-only">Maximum area</label><input aria-label="Maximum area" type="number" min="0" placeholder="Max area" value={filters.maxArea} onChange={(e) => set({ maxArea: e.target.value })} /></div>
      </FilterSection>

      <FilterSection label="FURNISHING" defaultOpen={false}>
        <div className="vertical-options">{["Any", ...FURNISHING_OPTIONS].map((v) => <button type="button" key={v} className={filters.furnishing === v ? "active" : ""} onClick={() => set({ furnishing: v })} aria-label={`${v} furnishing`} aria-pressed={filters.furnishing === v}>{v}<span /></button>)}</div>
      </FilterSection>

      <FilterSection label="PARKING" defaultOpen={false}>
        <div className="bed-options">{["Any", "0", "1", "2+"].map((v) => <button type="button" key={v} className={filters.parking === v ? "active" : ""} onClick={() => set({ parking: v })} aria-label={`${v} parking spots`} aria-pressed={filters.parking === v}>{v}</button>)}</div>
      </FilterSection>

      <FilterSection label="AVAILABILITY" defaultOpen={false}>
        <div className="vertical-options">{["Any", ...AVAILABILITY_OPTIONS].map((v) => <button type="button" key={v} className={filters.availability === v ? "active" : ""} onClick={() => set({ availability: v })} aria-label={`${v} availability`} aria-pressed={filters.availability === v}>{v}<span /></button>)}</div>
      </FilterSection>

      <FilterSection label="AMENITIES" defaultOpen={false}>
        <div className="type-options amenity-filter-options">
          {AMENITY_OPTIONS.map((a) => <button type="button" key={a} className={filters.amenities.includes(a) ? "active" : ""} onClick={() => toggleAmenity(a)} aria-label={`Toggle amenity ${a}`} aria-pressed={filters.amenities.includes(a)}>{a}</button>)}
        </div>
      </FilterSection>

      <div className="verified-note">
        <ShieldCheck size={16} aria-hidden="true" />
        <div><b>Staff-managed listings</b><p>Properties are added and published by Haven staff rather than by anonymous public sellers.</p></div>
      </div>
      <button type="button" className="dark-btn full sheet-apply" onClick={onClose}>Show {activeCount ? `${activeCount} filters` : "results"}</button>
    </aside>
  );
});

export default FilterPanel;
