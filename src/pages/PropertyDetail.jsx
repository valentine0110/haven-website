import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Bath, BedDouble, Check, Clock3, Maximize, MapPin, MessageCircle, Phone, X, Share2, Waves, Dumbbell, ArrowUpDown, TreePine, Shield, Heart, Car, Printer, Calculator, Compass, ExternalLink, Sparkles, Scale } from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getAgentById, getPropertyBySlug, getRelatedProperties, priceLabel, formatMoney } from "../lib/store";
import { PropertyCard, EnquiryModal, useSavedProperties } from "../components/PropertyBits";
import { PageLoading, PageError } from "../components/DataState";
import { useAsync } from "../lib/hooks";
import { useSEO } from "../lib/seo";
import { SITE_CONFIG, toTel, toWhatsApp } from "../lib/config";
import { usePreferences } from "../lib/preferences";
import { useRecentlyViewed } from "../lib/recentlyViewed";
import { optimizeImage } from "../lib/images";
import MortgageCalculator from "../components/MortgageCalculator";
import ShareModal from "../components/ShareModal";
import CompareModal from "../components/CompareModal";
import NotFound from "./NotFound";
import ScrollReveal from "../components/ScrollReveal";
import { useToast } from "../components/Toast";

function amenityIcon(name) {
  const n = name.toLowerCase();
  if (n.includes("pool")) return <Waves size={15} />;
  if (n.includes("gym")) return <Dumbbell size={15} />;
  if (n.includes("lift")) return <ArrowUpDown size={15} />;
  if (n.includes("garden")) return <TreePine size={15} />;
  if (n.includes("security")) return <Shield size={15} />;
  if (n.includes("pet")) return <Heart size={15} />;
  if (n.includes("parking")) return <Car size={15} />;
  return <Check size={15} />;
}

export default function PropertyDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { formatArea } = usePreferences();
  const { addRecent, recentList } = useRecentlyViewed();
  const { has, toggle } = useSavedProperties();

  const [active, setActive] = useState(0);
  const [modal, setModal] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [compareModal, setCompareModal] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const lightboxRef = useRef(null);
  const [agent, setAgent] = useState(null);
  const [related, setRelated] = useState([]);
  const { data: p, loading, error } = useAsync(() => getPropertyBySlug(slug), [slug]);
  const touchStart = useRef(null);

  // Record recently viewed
  useEffect(() => {
    if (p) {
      addRecent(p);
    }
  }, [p, addRecent]);

  // Lightbox keyboard & trapping
  useEffect(() => {
    if (!lightbox) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => lightboxRef.current?.querySelector(".modal-x")?.focus());
    const onKey = (e) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") setActive((v) => (v - 1 + (p?.images?.length || 1)) % (p?.images?.length || 1));
      if (e.key === "ArrowRight") setActive((v) => (v + 1) % (p?.images?.length || 1));
      if (e.key === "Tab") {
        const focusable = [...(lightboxRef.current?.querySelectorAll("button:not([disabled])") || [])];
        if (!focusable.length) return;
        const first = focusable[0]; const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKey); };
  }, [lightbox, p?.images?.length]);

  // Keyboard navigation for main gallery (when lightbox is closed)
  useEffect(() => {
    if (lightbox || modal || shareModal || compareModal) return;
    const onKey = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
      const count = p?.images?.length || 1;
      if (count <= 1) return;
      if (e.key === "ArrowLeft") setActive((v) => (v - 1 + count) % count);
      if (e.key === "ArrowRight") setActive((v) => (v + 1) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, modal, shareModal, compareModal, p?.images?.length]);

  useEffect(() => {
    if (!p) return;
    let alive = true;
    Promise.all([getAgentById(p.agentId), getRelatedProperties(p.city, p.id)]).then(([a, homes]) => {
      if (!alive) return;
      setAgent(a); setRelated(homes || []); setActive(0);
    }).catch(() => { if (alive) { setAgent(null); setRelated([]); } });
    return () => { alive = false; };
  }, [p]);

  useSEO({
    title: p ? p.title : "Property not found",
    description: p ? `${p.title} — ${p.propertyType} ${p.status.toLowerCase()} in ${p.location}. ${p.bedrooms} bed, ${p.bathrooms} bath, ${p.area.toLocaleString("en-IN")} sqft.` : undefined,
    path: p ? `/properties/${p.slug}` : "/404",
    image: p?.image,
    jsonLd: p ? {
      "@context": "https://schema.org",
      "@type": "Residence",
      name: p.title,
      description: p.description,
      address: { "@type": "PostalAddress", addressLocality: p.location, addressRegion: p.city, addressCountry: "IN" },
      numberOfRooms: p.bedrooms || undefined,
      floorSize: { "@type": "QuantitativeValue", value: p.area, unitCode: "FTK" },
      image: p.images,
      offers: { "@type": "Offer", priceCurrency: "INR", price: p.price, url: `${SITE_CONFIG.url}/properties/${p.slug}` },
    } : undefined,
    noindex: !p,
  });

  if (loading) return <PageLoading label="Loading property details..." />;
  if (error) return <PageError error={error} />;
  if (!p) return <NotFound />;

  const isSaved = has(p.id);
  const images = p.images.length ? p.images : [p.image];
  const currentImage = optimizeImage(images[active] || "/placeholder-property.svg", { width: 1200 });
  const fallbackPhone = toTel(SITE_CONFIG.phone);
  const fallbackWhatsApp = toWhatsApp(SITE_CONFIG.whatsapp || SITE_CONFIG.phone);
  const waMessage = encodeURIComponent(`Hi, I'm interested in ${p.title} (Property ID: ${p.id}) listed on ${SITE_CONFIG.name}.`);

  const otherRecentlyViewed = recentList.filter((x) => x.id !== p.id);

  return (
    <>
      <main className="property-detail" id="property-detail-sheet">
        {/* Print-only editorial header */}
        <div className="print-only-header">
          <div className="print-brand">
            <h2>HAVEN PROPERTY CO.</h2>
            <span>CURATED BROKERAGE &amp; ADVISORY</span>
          </div>
          <div className="print-ref">
            <b>Property Sheet</b> · ID #{p.id} · Printed {new Date().toLocaleDateString("en-IN")}
          </div>
        </div>

        <div className="detail-gallery container">
          <div className="detail-top-controls">
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span aria-hidden="true">›</span>
              <Link to="/properties">Properties</Link>
              <span aria-hidden="true">›</span>
              <span aria-current="page">{p.title}</span>
            </nav>

            <div className="detail-actions-bar">
              <button
                type="button"
                className={`action-pill-btn ${isSaved ? "active" : ""}`}
                onClick={() => toggle(p.id)}
                aria-label={isSaved ? "Remove from saved" : "Save property"}
              >
                <Heart size={15} fill={isSaved ? "currentColor" : "none"} />
                <span>{isSaved ? "Saved" : "Save"}</span>
              </button>

              <button
                type="button"
                className="action-pill-btn"
                onClick={() => setCompareModal(true)}
                aria-label="Compare property with others"
              >
                <Scale size={15} />
                <span>Compare</span>
              </button>

              <button
                type="button"
                className="action-pill-btn"
                onClick={() => setShareModal(true)}
                aria-label="Share property"
              >
                <Share2 size={15} />
                <span>Share</span>
              </button>

              <button
                type="button"
                className="action-pill-btn"
                onClick={() => window.print()}
                aria-label="Print property brochure"
              >
                <Printer size={15} />
                <span>Print Sheet</span>
              </button>

              <button type="button" className="back-link" onClick={() => navigate(-1)}>
                <ArrowLeft size={16} /> Back
              </button>
            </div>
          </div>

          <div 
            className="gallery-main"
            onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (touchStart.current === null) return;
              const diff = touchStart.current - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 50) {
                if (diff > 0) setActive((v) => (v + 1) % images.length);
                else setActive((v) => (v - 1 + images.length) % images.length);
              }
              touchStart.current = null;
            }}
          >
            <img src={currentImage} alt={`${p.title} — photo ${active + 1} of ${images.length}`} onError={(e) => { e.currentTarget.src = "/placeholder-property.svg"; }} />
            {p.availability && p.availability !== "Available" && <div className="gallery-status-badge">{p.availability}</div>}
            {images.length > 1 && <>
              <button type="button" className="gallery-prev" onClick={() => setActive((v) => (v - 1 + images.length) % images.length)} aria-label="Previous photo"><ArrowLeft /></button>
              <button type="button" className="gallery-next" onClick={() => setActive((v) => (v + 1) % images.length)} aria-label="Next photo"><ArrowRight /></button>
            </>}
            <span className="gallery-counter">{active + 1} / {images.length}</span>
            <button type="button" className="gallery-fullscreen" onClick={() => setLightbox(true)} aria-label="Open photo full screen"><Maximize size={16} /></button>
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbs" aria-label="Property photos">
              {images.map((im, i) => (
                <button
                  type="button"
                  key={im + i}
                  onClick={() => setActive(i)}
                  className={active === i ? "active" : ""}
                  aria-label={`View photo ${i + 1}`}
                >
                  <img
                    src={optimizeImage(im, { width: 180 })}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.currentTarget.src = "/placeholder-property.svg"; }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {lightbox && (
          <div ref={lightboxRef} className="lightbox-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setLightbox(false)}>
            <div className="lightbox-dialog" role="dialog" aria-modal="true" aria-label={`${p.title} photo viewer`}>
              <button type="button" className="modal-x" onClick={() => setLightbox(false)} aria-label="Close full screen photo viewer"><X size={18} /></button>
              <img src={currentImage} alt={`${p.title} — photo ${active + 1} of ${images.length}`} onError={(e) => { e.currentTarget.src = "/placeholder-property.svg"; }} />
              {images.length > 1 && <>
                <button type="button" className="gallery-prev lightbox-nav" onClick={() => setActive((v) => (v - 1 + images.length) % images.length)} aria-label="Previous photo"><ArrowLeft /></button>
                <button type="button" className="gallery-next lightbox-nav" onClick={() => setActive((v) => (v + 1) % images.length)} aria-label="Next photo"><ArrowRight /></button>
              </>}
              <span className="gallery-counter">{active + 1} / {images.length}</span>
            </div>
          </div>
        )}

        <div className="detail-layout container">
          <div className="detail-main">
            <div className="detail-kicker">
              <span className="pill">{p.propertyType}</span>
              <span>{p.status}</span>
              <span>{p.availability}</span>
              <span>ID: {p.id}</span>
            </div>
            <h1>{p.title}</h1>
            <p className="detail-location"><MapPin size={15} />{p.location}, {p.city}</p>

            <div className="detail-facts">
              {p.bedrooms > 0 && <span><b>{p.bedrooms}</b> bedrooms</span>}
              {p.bathrooms > 0 && <span><b>{p.bathrooms}</b> bathrooms</span>}
              <span><b>{formatArea(p.area)}</b> area</span>
              {p.area > 0 && <span><b>₹{Math.round(p.price / p.area).toLocaleString("en-IN")}</b> / sq ft</span>}
              {p.floor !== null && p.floor !== undefined && <span><b>{p.floor === 0 ? "Ground" : p.floor}</b>{p.totalFloors ? ` of ${p.totalFloors} floors` : " floor"}</span>}
              <span><b>{p.parking}</b> parking</span>
              <span><b>{p.furnishing}</b></span>
            </div>

            <ScrollReveal>
              <div className="detail-section">
                <span className="eyebrow">THE RESIDENCE</span>
                <p className="lead">{p.description}</p>
              </div>
            </ScrollReveal>

            {p.amenities && p.amenities.length > 0 && (
              <ScrollReveal>
                <div className="detail-section">
                  <span className="eyebrow">AMENITIES &amp; FEATURES</span>
                  <div className="feature-list">
                    {p.amenities.map((f) => (
                      <div key={f}>{amenityIcon(f)}{f}</div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            )}

            {p.floorPlan && (
              <ScrollReveal>
                <div className="detail-section">
                  <span className="eyebrow">ARCHITECTURAL FLOOR PLAN</span>
                  <div className="floor-plan-card">
                    <img src={p.floorPlan} alt={`${p.title} floor plan`} className="floor-plan-image" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  </div>
                </div>
              </ScrollReveal>
            )}

            {p.videoUrl && (
              <div className="detail-section">
                <span className="eyebrow">VIDEO / VIRTUAL TOUR</span>
                <div className="video-embed">
                  <iframe src={p.videoUrl} title="Property video tour" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
                </div>
              </div>
            )}

            {/* Mortgage & EMI Estimator for purchase listings */}
            {p.status === "For sale" && (
              <ScrollReveal>
                <div className="detail-section emi-section">
                  <span className="eyebrow">FINANCING &amp; MONTHLY ESTIMATE</span>
                  <MortgageCalculator propertyPrice={p.price} propertyTitle={p.title} />
                </div>
              </ScrollReveal>
            )}

            {/* Neighborhood & Location */}
            <div className="detail-section neighborhood">
              <span className="eyebrow">NEIGHBORHOOD</span>
              <h2>{p.location}, {p.city}</h2>
              <p className="muted">
                Managed residential pocket close to everyday conveniences, transport, and dining.
              </p>
              
              {p.showMap && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)) ? (
                <div className="map-embed">
                  <iframe
                    title="Approximate property location map"
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${p.lng - 0.015}%2C${p.lat - 0.015}%2C${p.lng + 0.015}%2C${p.lat + 0.015}&layer=mapnik&marker=${p.lat}%2C${p.lng}`}
                  />
                </div>
              ) : null}

              <div className="neighborhood-external-links">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.location + ", " + p.city)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underlink"
                >
                  Explore {p.location} on Google Maps <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>

          {/* Sticky Enquiry Sidebar */}
          <aside className="enquiry-card">
            <small>EXCLUSIVE LISTING</small>
            <div className="detail-price">{priceLabel(p)}</div>
            {p.area > 0 && <span className="detail-price-sub">₹{Math.round(p.price / p.area).toLocaleString("en-IN")} per sq ft</span>}
            <p>Schedule an in-person viewing or live video walkthrough with the assigned agent.</p>

            {agent && (
              <div className="agent-mini">
                <img
                  src={optimizeImage(agent.image || "/placeholder-property.svg", { width: 140 })}
                  alt={agent.name}
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <b>{agent.name}</b>
                  <span>{agent.role}</span>
                </div>
              </div>
            )}

            <button type="button" className="dark-btn full" onClick={() => setModal(true)}>
              Schedule a viewing <ArrowRight size={16} />
            </button>

            {(agent?.phone || fallbackPhone || fallbackWhatsApp) && (
              <div className="cta-row">
                {(agent?.phone || fallbackPhone) && (
                  <a className="outline-btn full" href={`tel:${toTel(agent?.phone || fallbackPhone)}`}>
                    <Phone size={15} /> Call
                  </a>
                )}
                {(agent?.phone || fallbackWhatsApp) && (
                  <a
                    className="outline-btn full whatsapp-btn"
                    href={`https://wa.me/${toWhatsApp(agent?.phone || fallbackWhatsApp)}?text=${waMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle size={15} /> WhatsApp
                  </a>
                )}
              </div>
            )}

            <div className="response">
              <Clock3 size={15} />
              <span>Prompt response during working hours</span>
            </div>

            <div className="property-assurance">
              <Shield size={14} />
              <span>Verified listing · No middleman spam</span>
            </div>
          </aside>
        </div>
      </main>

      {/* Recently Viewed Strip */}
      {otherRecentlyViewed.length > 0 && (
        <section className="recently-viewed-strip container">
          <div className="section-head">
            <div>
              <span className="eyebrow">YOUR BROWSING HISTORY</span>
              <h2>Recently viewed by you.</h2>
            </div>
            <Link to="/saved" className="underlink">View saved shortlist <ArrowRight size={14} /></Link>
          </div>
          <div className="results-grid">
            {otherRecentlyViewed.slice(0, 3).map((x) => (
              <PropertyCard key={x.id} p={x} />
            ))}
          </div>
        </section>
      )}

      {/* Related properties in same city */}
      {related.length > 0 && (
        <ScrollReveal>
          <section className="related container">
            <div className="section-head">
              <div>
                <span className="eyebrow">MORE NEARBY IN {p.city.toUpperCase()}</span>
                <h2>Other homes worth considering.</h2>
              </div>
              <Link to={`/properties?city=${encodeURIComponent(p.city)}`} className="underlink">
                View all in {p.city} <ArrowRight size={14} />
              </Link>
            </div>
            <div className="related-grid">
              {related.map((x) => <PropertyCard key={x.id} p={x} />)}
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Mobile Sticky CTA */}
      <div className="mobile-sticky-cta">
        <div className="msc-price">
          <span>{priceLabel(p)}</span>
          <small>{p.location}</small>
        </div>
        <button type="button" className="dark-btn" onClick={() => setModal(true)}>
          Enquire <ArrowRight size={15} />
        </button>
      </div>

      {modal && <EnquiryModal property={p} onClose={() => setModal(false)} />}
      {shareModal && <ShareModal property={p} onClose={() => setShareModal(false)} />}
      {compareModal && (
        <CompareModal
          properties={[
            p,
            ...recentList.filter((x) => x.id !== p.id),
            ...related.filter((x) => x.id !== p.id),
          ]
            .filter((item, idx, arr) => arr.findIndex((x) => x.id === item.id) === idx)
            .slice(0, 3)}
          onClose={() => setCompareModal(false)}
        />
      )}
    </>
  );
}
