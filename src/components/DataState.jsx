import React from "react";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";

export function PageLoading({ label = "Loading..." }) {
  return (
    <div className="data-state" role="status">
      <Loader2 className="spin" size={22} />
      <p>{label}</p>
    </div>
  );
}

export function PageError({ error, onRetry }) {
  return (
    <div className="data-state" role="alert">
      <AlertTriangle size={22} />
      <p>Something went wrong.</p>
      {import.meta.env.DEV && error?.message && <p className="small">{error.message}</p>}
      {onRetry && (
        <button type="button" className="outline-btn" onClick={onRetry}>
          <RefreshCw size={14} /> Try again
        </button>
      )}
    </div>
  );
}

/* ── Skeleton components ──────────────────────────────── */

export function PropertyCardSkeleton() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton-card-image" />
      <div className="skeleton skeleton-card-title" />
      <div className="skeleton skeleton-card-line" />
      <div className="skeleton skeleton-card-facts" />
    </div>
  );
}

export function PropertyGridSkeleton({ count = 6 }) {
  return (
    <div className="results-grid" aria-busy="true" aria-label="Loading properties">
      {Array.from({ length: count }, (_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="container" style={{ paddingTop: 40 }} aria-busy="true" aria-label="Loading property details">
      <div className="skeleton" style={{ height: 14, width: 200, marginBottom: 16 }} />
      <div className="skeleton" style={{ height: "min(55vw, 550px)", borderRadius: 9, marginBottom: 12 }} />
      <div style={{ display: "flex", gap: 8 }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ width: 100, height: 66, borderRadius: 6 }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 345px", gap: 60, paddingTop: 48 }}>
        <div>
          <div className="skeleton" style={{ height: 18, width: 120, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 48, width: "80%", marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 14, width: 260, marginBottom: 32 }} />
          <div className="skeleton" style={{ height: 60, width: "100%", marginBottom: 40 }} />
          <div className="skeleton" style={{ height: 120, width: "100%" }} />
        </div>
        <div className="skeleton" style={{ height: 380, borderRadius: 9 }} />
      </div>
    </div>
  );
}
