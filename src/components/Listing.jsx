import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, Grid3X3, List, Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { getPublishedProperties } from "../lib/store";
import { useAsync, useDebounce } from "../lib/hooks";
import { PropertyGridSkeleton, PageError } from "./DataState";
import { PropertyCard } from "./PropertyBits";
import FilterPanel, { DEFAULT_FILTERS, applyFilters, sortList } from "./FilterPanel";

const PAGE_SIZE = 9;

function filtersFromParams(params, lockPurpose) {
  return {
    purpose: lockPurpose || params.get("purpose") || "Any",
    type: params.get("type") || "Any type",
    city: params.get("city") || "Any",
    minPrice: params.get("minPrice") || "",
    maxPrice: params.get("maxPrice") || "",
    beds: params.get("beds") || "Any",
    baths: params.get("baths") || "Any",
    minArea: params.get("minArea") || "",
    maxArea: params.get("maxArea") || "",
    furnishing: params.get("furnishing") || "Any",
    parking: params.get("parking") || "Any",
    availability: params.get("availability") || (lockPurpose ? "Available" : "Any"),
    amenities: params.getAll("amenity"),
  };
}

function writeParams(filters, query, sort, lockPurpose) {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (!lockPurpose && filters.purpose !== "Any") params.set("purpose", filters.purpose);
  if (filters.city !== "Any") params.set("city", filters.city);
  if (filters.type !== "Any type") params.set("type", filters.type);
  ["minPrice", "maxPrice", "beds", "baths", "minArea", "maxArea", "furnishing", "parking", "availability"].forEach((k) => {
    if (filters[k] && !["Any"].includes(filters[k])) params.set(k, filters[k]);
  });
  filters.amenities.forEach((a) => params.append("amenity", a));
  if (sort !== "newest") params.set("sort", sort);
  return params;
}

export default function Listing({ eyebrow, title, intro, lockPurpose }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid");
  const [rawQuery, setRawQuery] = useState(searchParams.get("q") || "");
  const query = useDebounce(rawQuery, 300);
  const sort = searchParams.get("sort") || "newest";
  const filters = useMemo(() => filtersFromParams(searchParams, lockPurpose), [searchParams, lockPurpose]);
  const { data: all, loading, error, refetch } = useAsync(getPublishedProperties, []);

  // Sync URL query back to raw input when URL changes externally
  useEffect(() => {
    const urlQuery = searchParams.get("q") || "";
    if (urlQuery !== rawQuery) setRawQuery(urlQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => setPage(1), [query, searchParams.toString()]);

  // Write debounced query to URL
  useEffect(() => {
    const currentUrlQuery = searchParams.get("q") || "";
    if (query !== currentUrlQuery) {
      setSearchParams(writeParams(filters, query, sort, lockPurpose), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const filtered = useMemo(() => {
    if (!all) return [];
    return sortList(applyFilters(all, filters, query), sort);
  }, [all, filters, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = filtered.slice(0, page * PAGE_SIZE);

  function updateFilters(next) {
    setSearchParams(writeParams(next, query, sort, lockPurpose), { replace: true });
  }

  function updateSort(next) {
    setSearchParams(writeParams(filters, query, next, lockPurpose), { replace: true });
  }

  if (error) return <PageError error={error} onRetry={refetch} />;

  return (
    <section className="listing-page container">
      <div className="page-intro-row">
        <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></div>
        <div className="market-note">
          <span>RESULTS</span>
          <b>{loading ? "—" : filtered.length}</b>
          <small>{lockPurpose === "For rent" ? "homes for rent" : lockPurpose === "For sale" ? "homes for sale" : "active listings"}</small>
        </div>
      </div>

      <div className="listing-toolbar">
        <button type="button" className="outline-btn filter-toggle" onClick={() => setShowFilters(true)}><SlidersHorizontal size={16} /> Filters</button>
        <div className="mini-input toolbar-search">
          <Search size={14} aria-hidden="true" />
          <label className="sr-only" htmlFor="listing-search">Search homes</label>
          <input
            id="listing-search"
            placeholder="Search location, project or Property ID"
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
          />
        </div>
        <span><b>{loading ? "…" : filtered.length}</b> homes</span>
        <div className="view-toggle">
          <button type="button" className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")} aria-label="Grid view"><Grid3X3 size={15} /></button>
          <button type="button" className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")} aria-label="List view"><List size={15} /></button>
        </div>
        <div className="toolbar-sort">
          <small>Sort</small>
          <select aria-label="Sort listings" value={sort} onChange={(e) => updateSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="area-asc">Area: Small to Large</option>
            <option value="area-desc">Area: Large to Small</option>
          </select>
          <ChevronDown size={14} aria-hidden="true" />
        </div>
      </div>

      <div className="active-filter-bar">
        {rawQuery && <button type="button" onClick={() => setRawQuery("")}>Search: &ldquo;{rawQuery}&rdquo; ×</button>}
        {filters.city !== "Any" && <button type="button" onClick={() => updateFilters({ ...filters, city: "Any" })}>City: {filters.city} ×</button>}
        {filters.amenities.map((a) => <button type="button" key={a} onClick={() => updateFilters({ ...filters, amenities: filters.amenities.filter((x) => x !== a) })}>{a} ×</button>)}
        {filters.amenities.length === 0 && !rawQuery && filters.city === "Any" && <span>Use filters to narrow the collection.</span>}
      </div>

      {/* Screen reader announcement for filter results */}
      <div className="results-announce" role="status" aria-live="polite" aria-atomic="true">
        {!loading && `${filtered.length} ${filtered.length === 1 ? "home" : "homes"} found`}
      </div>

      <div className={`listing-body ${showFilters ? "show-filters" : ""}`}>
        <FilterPanel filters={filters} setFilters={updateFilters} open={showFilters} onClose={() => setShowFilters(false)} lockPurpose={lockPurpose} />
        {showFilters && <div className="sheet-backdrop" onClick={() => setShowFilters(false)} aria-hidden="true" />}
        <div className="listing-results">
          {loading ? (
            <PropertyGridSkeleton count={6} />
          ) : shown.length ? (
            <>
              <div className={viewMode === "list" ? "results-grid results-list" : "results-grid"}>
                {shown.map((p) => <PropertyCard key={p.id} p={p} />)}
              </div>
              {page < totalPages && (
                <div className="load-more-row">
                  <button type="button" className="outline-btn" onClick={() => setPage((v) => v + 1)}>
                    Load more homes · {Math.min(PAGE_SIZE, filtered.length - shown.length)} more
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty">
              <Search size={23} />
              <h2>Nothing quite matched.</h2>
              <p>Try widening the price range, clearing a filter, or searching a different area.</p>
              <button
                type="button"
                className="outline-btn"
                onClick={() => {
                  setRawQuery("");
                  updateFilters({ ...DEFAULT_FILTERS, purpose: lockPurpose || "Any", availability: lockPurpose ? "Available" : "Any" });
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
