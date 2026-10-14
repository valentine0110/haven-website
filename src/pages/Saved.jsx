import React, { useState } from "react";
import { ArrowRight, Heart, SortAsc, Trash2, Scale, Share2, Sparkles, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { getPublishedProperties, formatMoney } from "../lib/store";
import { useAsync } from "../lib/hooks";
import { useSavedProperties, PropertyCard } from "../components/PropertyBits";
import { PageError, PropertyGridSkeleton } from "../components/DataState";
import { useSEO } from "../lib/seo";
import { useToast } from "../components/Toast";
import CompareModal from "../components/CompareModal";
import ScrollReveal from "../components/ScrollReveal";

export default function Saved() {
  useSEO({ title: "Saved homes", description: "Your saved Haven property shortlist.", path: "/saved", noindex: true });
  const { ids, toggle } = useSavedProperties();
  const { data, loading, error } = useAsync(getPublishedProperties, []);
  const [sortBy, setSortBy] = useState("saved"); // saved | price-asc | price-desc | area-desc
  const [comparing, setComparing] = useState(false);
  const toast = useToast();

  if (error) return <PageError error={error} />;

  const saved = (data || []).filter((p) => ids.includes(p.id));

  const sorted = [...saved].sort((a, b) => {
    switch (sortBy) {
      case "price-asc": return a.price - b.price;
      case "price-desc": return b.price - a.price;
      case "area-desc": return b.area - a.area;
      default: return ids.indexOf(a.id) - ids.indexOf(b.id);
    }
  });

  const avgPrice = saved.length ? Math.round(saved.reduce((sum, p) => sum + p.price, 0) / saved.length) : 0;
  const avgArea = saved.length ? Math.round(saved.reduce((sum, p) => sum + p.area, 0) / saved.length) : 0;

  function clearAll() {
    if (!confirm(`Remove all ${saved.length} saved homes?`)) return;
    saved.forEach((p) => toggle(p.id));
    toast.success("Shortlist cleared");
  }

  function shareShortlist() {
    const text = `Check out my saved properties on Haven:\n${saved.map((p) => `• ${p.title} (${formatMoney(p.price)}) - ${window.location.origin}/properties/${p.slug}`).join("\n")}`;
    if (navigator.share) {
      navigator.share({ title: "My Haven Shortlist", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Shortlist copied to clipboard!");
    }
  }

  return (
    <>
      <main className="saved-page container">
        <div className="page-intro-row">
          <div>
            <span className="eyebrow">YOUR SHORTLIST</span>
            <h1>Saved homes.</h1>
            <p>Saved locally on your device — no account needed.</p>
          </div>
          <div className="saved-actions">
            {saved.length > 0 && (
              <>
                <div className="toolbar-sort">
                  <SortAsc size={14} />
                  <select aria-label="Sort saved homes" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="saved">Date saved</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="area-desc">Area: Largest</option>
                  </select>
                </div>
                
                {saved.length >= 2 && (
                  <button
                    type="button"
                    className="dark-btn small"
                    onClick={() => setComparing(true)}
                  >
                    <Scale size={14} /> Compare ({saved.length})
                  </button>
                )}

                <button
                  type="button"
                  className="outline-btn"
                  onClick={shareShortlist}
                  title="Share your shortlist"
                >
                  <Share2 size={14} /> Share
                </button>

                <button
                  type="button"
                  className="outline-btn"
                  onClick={clearAll}
                  style={{ gap: 6 }}
                >
                  <Trash2 size={14} /> Clear all
                </button>
              </>
            )}
            <span className="saved-count"><Heart size={15} /> {saved.length}</span>
          </div>
        </div>

        {/* Shortlist summary metrics if items exist */}
        {saved.length > 0 && (
          <div className="saved-summary-bar">
            <div className="summary-stat">
              <span className="stat-label">Total Shortlisted</span>
              <b>{saved.length} {saved.length === 1 ? "Property" : "Properties"}</b>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Average Asking Price</span>
              <b>{formatMoney(avgPrice)}</b>
            </div>
            {avgArea > 0 && (
              <div className="summary-stat">
                <span className="stat-label">Average Area</span>
                <b>{avgArea.toLocaleString("en-IN")} sq ft</b>
              </div>
            )}
            <div className="summary-stat cta-stat">
              <Link to="/contact" className="underlink">
                Discuss this shortlist with an advisor <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}

        {loading ? (
          <PropertyGridSkeleton count={3} />
        ) : sorted.length ? (
          <ScrollReveal>
            <div className="results-grid">
              {sorted.map((p) => <PropertyCard key={p.id} p={p} />)}
            </div>
          </ScrollReveal>
        ) : (
          <div className="empty">
            <Heart size={28} />
            <h2>No saved homes yet.</h2>
            <p>Tap the heart on any property listing to keep it here while you compare options.</p>
            <Link className="dark-btn" to="/properties">Browse collection <ArrowRight size={15} /></Link>
          </div>
        )}
      </main>

      {comparing && (
        <CompareModal
          properties={saved}
          onClose={() => setComparing(false)}
          onRemove={(id) => toggle(id)}
        />
      )}
    </>
  );
}
