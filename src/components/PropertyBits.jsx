import React, { useEffect, useRef, useState, useMemo } from "react";
import { ArrowRight, Bath, BedDouble, Heart, MapPin, Maximize, Search, X, ShieldCheck, CalendarDays, Clock3, Video, UserCheck, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { priceLabel, addEnquiry, PROPERTY_TYPES, getPublishedProperties, CITIES } from "../lib/store";
import { usePreferences } from "../lib/preferences";
import { optimizeImage } from "../lib/images";

const SAVED_KEY = "haven:saved-properties";

function readSaved() {
  try {
    const value = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
    return Array.isArray(value) ? value.filter((id) => typeof id === "string").slice(0, 100) : [];
  } catch { return []; }
}

function writeSaved(ids) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify([...new Set(ids)].slice(0, 100)));
    window.dispatchEvent(new Event("haven:saved-change"));
  } catch {
    // Keep saved homes usable even when browser storage is unavailable.
  }
}

export function useSavedProperties() {
  const [ids, setIds] = useState(() => readSaved());
  useEffect(() => {
    const sync = () => setIds(readSaved());
    window.addEventListener("storage", sync);
    window.addEventListener("haven:saved-change", sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("haven:saved-change", sync); };
  }, []);
  function toggle(id) {
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    writeSaved(next); setIds(next);
  }
  return { ids, toggle, has: (id) => ids.includes(id) };
}

function SafeImage({ src, alt, className, width = 640, ...props }) {
  const [loaded, setLoaded] = useState(false);
  const optimizedSrc = optimizeImage(src, { width });
  return (
    <div className={`safe-image-wrap ${loaded ? "is-loaded" : "is-loading"}`}>
      <img
        src={optimizedSrc}
        alt={alt}
        className={className}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          if (e.currentTarget.src.endsWith("placeholder-property.svg")) return;
          e.currentTarget.src = "/placeholder-property.svg";
          setLoaded(true);
        }}
        {...props}
      />
    </div>
  );
}

/**
 * PropertyCard Component
 */
export const PropertyCard = React.memo(function PropertyCard({ p, variant = "normal", className = "", style }) {
  const { has, toggle } = useSavedProperties();
  const { formatArea } = usePreferences();
  const saved = has(p.id);
  const [animating, setAnimating] = useState(false);
  
  function handleSave(e) {
    e.preventDefault();
    e.stopPropagation();
    toggle(p.id);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);
  }

  const isNew = p.dateAdded && (Date.now() - new Date(p.dateAdded).getTime()) < 7 * 24 * 60 * 60 * 1000;
  const statusClass = p.status === "For rent" ? "pill-rent" : "pill-sale";

  return (
    <article className={`property-card ${variant === "feature" ? "feature-card" : ""} ${className}`} style={style}>
      <Link className="card-media" to={`/properties/${p.slug}`} aria-label={`View ${p.title}`}>
        <SafeImage src={p.image} alt={p.title} loading="lazy" />
        <span className={`card-pill pill ${statusClass}`}>{p.status === "For rent" ? "For rent" : "For sale"}</span>
        {isNew && <span className="card-pill card-new-pill pill">New</span>}
        <span className="media-arrow"><ArrowRight size={16} /></span>
      </Link>
      <div className="card-copy">
        <div className="card-top">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="price">{priceLabel(p)}</span>
            {p.availability && p.availability !== 'Available' && <span className="availability-tag">{p.availability}</span>}
          </div>
          <button
            type="button"
            className={`save ${saved ? "saved" : ""} ${animating ? 'save-pop' : ''}`}
            aria-label={saved ? `Remove ${p.title} from saved homes` : `Save ${p.title}`}
            aria-pressed={saved}
            onClick={handleSave}
          >
            <Heart size={16} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
        <Link to={`/properties/${p.slug}`}><h3>{p.title}</h3></Link>
        <div className="location"><MapPin size={11} />{p.location}, {p.city}</div>
        <div className="facts">
          {p.bedrooms > 0 && <span><BedDouble size={12} />{p.bedrooms} bd</span>}
          {p.bathrooms > 0 && <span><Bath size={12} />{p.bathrooms} ba</span>}
          <span><Maximize size={12} />{formatArea(p.area)}</span>
          <span className="fact-id">ID: {p.id}</span>
        </div>
      </div>
    </article>
  );
});

/**
 * SearchBox Component with Live Autocomplete & Quick Tags
 */
export const SearchBox = React.memo(function SearchBox({ compact = false }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("Any type");
  const [purpose, setPurpose] = useState("Buy");
  const [isOpen, setIsOpen] = useState(false);
  const [properties, setProperties] = useState([]);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const searchBoxRef = useRef(null);
  const navigate = useNavigate();

  // Load published properties for smart autocomplete suggestions
  useEffect(() => {
    let alive = true;
    getPublishedProperties().then((data) => {
      if (alive && data) setProperties(data);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // Filter suggestions
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 1) return [];

    const matches = [];

    // Match cities
    CITIES.forEach((c) => {
      if (c.toLowerCase().includes(q)) {
        matches.push({ type: "city", label: `${c}`, value: c, sub: "City" });
      }
    });

    // Match property types
    PROPERTY_TYPES.forEach((t) => {
      if (t.toLowerCase().includes(q)) {
        matches.push({ type: "type", label: `${t}`, value: t, sub: "Property type" });
      }
    });

    // Match property titles or locations
    properties.forEach((p) => {
      if (p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)) {
        matches.push({
          type: "property",
          label: p.title,
          slug: p.slug,
          location: `${p.location}, ${p.city}`,
          price: priceLabel(p),
          image: p.image,
          sub: `${p.propertyType} in ${p.city}`,
        });
      }
    });

    return matches.slice(0, 6);
  }, [query, properties]);

  // Handle outside clicks to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelectSuggestion(item) {
    setIsOpen(false);
    if (item.type === "property") {
      navigate(`/properties/${item.slug}`);
    } else if (item.type === "city") {
      navigate(`${purpose === "Rent" ? "/rent" : "/buy"}?city=${encodeURIComponent(item.value)}`);
    } else if (item.type === "type") {
      navigate(`${purpose === "Rent" ? "/rent" : "/buy"}?type=${encodeURIComponent(item.value)}`);
    }
  }

  function handleKeyDown(e) {
    if (!isOpen || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && highlightIdx >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[highlightIdx]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  function go(e) {
    e.preventDefault();
    setIsOpen(false);
    const params = new URLSearchParams();
    const cleanQuery = query.trim().substring(0, 100);
    if (cleanQuery) params.set("q", cleanQuery);
    if (type !== "Any type") params.set("type", type);
    navigate(`${purpose === "Rent" ? "/rent" : "/buy"}${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className={`search-box-wrapper ${compact ? "compact-wrap" : ""}`} ref={searchBoxRef}>
      <form className={`search-box ${compact ? "compact" : ""}`} onSubmit={go} role="search">
        <div className="search-field">
          <Search size={16} aria-hidden="true" />
          <label className="sr-only" htmlFor="site-search">Search properties</label>
          <input
            id="site-search"
            placeholder="Search by city, neighborhood, or project..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setHighlightIdx(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            maxLength={100}
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => { setQuery(""); setIsOpen(false); }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="search-field select-field">
          <label className="sr-only" htmlFor="site-property-type">Property type</label>
          <select id="site-property-type" value={type} onChange={(e) => setType(e.target.value)}>
            <option>Any type</option>
            {PROPERTY_TYPES.map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        <div className="search-field select-field">
          <label className="sr-only" htmlFor="site-purpose">Buy or rent</label>
          <select id="site-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
            <option>Buy</option>
            <option>Rent</option>
          </select>
        </div>
        <button type="submit"><Search size={15} aria-hidden="true" /> Search</button>
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="search-autocomplete-dropdown" role="listbox">
          {suggestions.map((item, idx) => (
            <button
              type="button"
              key={item.label + idx}
              className={`autocomplete-item ${highlightIdx === idx ? "highlighted" : ""}`}
              onClick={() => handleSelectSuggestion(item)}
              role="option"
              aria-selected={highlightIdx === idx}
            >
              {item.image && (
                <img
                  src={item.image}
                  alt=""
                  className="autocomplete-thumb"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              )}
              <div className="autocomplete-info">
                <span className="autocomplete-title">{item.label}</span>
                <span className="autocomplete-sub">{item.location || item.sub}</span>
              </div>
              {item.price && <span className="autocomplete-price">{item.price}</span>}
              <ArrowRight size={13} className="autocomplete-arrow" />
            </button>
          ))}
        </div>
      )}

      {/* Popular Quick Search Chips (only on hero search box) */}
      {!compact && (
        <div className="search-quick-tags">
          <span className="quick-tags-label"><Sparkles size={12} /> Popular:</span>
          {["Villas", "Pune", "Bengaluru", "Furnished", "Under ₹1 Cr"].map((tag) => (
            <button
              key={tag}
              type="button"
              className="quick-tag-btn"
              onClick={() => {
                if (tag === "Under ₹1 Cr") {
                  navigate(`/buy?maxPrice=10000000`);
                } else if (PROPERTY_TYPES.includes(tag)) {
                  navigate(`/buy?type=${tag}`);
                } else if (CITIES.includes(tag)) {
                  navigate(`/buy?city=${tag}`);
                } else {
                  navigate(`/buy?amenity=${encodeURIComponent(tag)}`);
                }
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export function EnquiryModal({ property, onClose }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [viewingType, setViewingType] = useState("in_person"); // "in_person" | "video_walkthrough"
  const [contactMethod, setContactMethod] = useState("whatsapp"); // "whatsapp" | "call" | "email"
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: `I'm interested in ${property.title} (${property.id}). Please share more details.`,
    preferredDate: "",
    preferredTime: "morning",
    hp: "",
  });
  const firstFieldRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    firstFieldRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab") return;
      const focusable = [...(modalRef.current?.querySelectorAll("button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]") || [])].filter((el) => el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  async function submit(e) {
    e.preventDefault();
    if (form.hp) return;
    setSending(true); setSubmitError("");
    try {
      const contactLabel = contactMethod === "whatsapp" ? "WhatsApp" : contactMethod === "call" ? "Phone Call" : "Email";
      const formattedMessage = `[Preferred Contact: ${contactLabel}] [Tour Format: ${viewingType === "in_person" ? "In-Person Viewing" : "Live Video Walkthrough"}] [Slot: ${form.preferredTime}] ${form.message}`;
      await addEnquiry({
        ...form,
        message: formattedMessage,
        propertyId: property.id,
        propertyTitle: property.title,
        source: `Property detail page · ${window.location.pathname}`,
      });
      setSent(true);
    } catch (err) {
      setSubmitError(err.message || "Couldn't send your enquiry — please try again.");
    } finally { setSending(false); }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={modalRef} className="enquiry-modal" role="dialog" aria-modal="true" aria-labelledby="enquiry-title">
        <button type="button" className="modal-x" onClick={onClose} aria-label="Close enquiry"><X size={17} /></button>
        {sent ? (
          <div className="sent-state">
            <div className="sent-icon"><ShieldCheck size={28} /></div>
            <h2 id="enquiry-title">Viewing requested!</h2>
            <p>Thanks, {form.name.split(" ")[0]}. Your request has been forwarded to the listing agent who will contact you to confirm timing.</p>
            <button type="button" className="dark-btn" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <h2 id="enquiry-title">Request a Viewing<br />{property.title}</h2>
            <p className="modal-sub">Property ID: {property.id} · {property.location}, {property.city}</p>

            <form onSubmit={submit}>
              <input type="text" name="company" tabIndex={-1} autoComplete="off" value={form.hp} onChange={(e) => setForm({ ...form, hp: e.target.value })} className="honeypot" aria-hidden="true" />
              
              {/* Tour format selector */}
              <div className="viewing-type-toggle">
                <button
                  type="button"
                  className={viewingType === "in_person" ? "active" : ""}
                  onClick={() => setViewingType("in_person")}
                >
                  <UserCheck size={15} /> In-person tour
                </button>
                <button
                  type="button"
                  className={viewingType === "video_walkthrough" ? "active" : ""}
                  onClick={() => setViewingType("video_walkthrough")}
                >
                  <Video size={15} /> Live video tour
                </button>
              </div>

              {/* Preferred Contact Method */}
              <div className="contact-method-selector">
                <span className="contact-method-title">How should we contact you?</span>
                <div className="contact-method-options" role="radiogroup" aria-label="Preferred contact method">
                  <button
                    type="button"
                    className={`contact-method-btn ${contactMethod === "whatsapp" ? "active" : ""}`}
                    onClick={() => setContactMethod("whatsapp")}
                    role="radio"
                    aria-checked={contactMethod === "whatsapp"}
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    className={`contact-method-btn ${contactMethod === "call" ? "active" : ""}`}
                    onClick={() => setContactMethod("call")}
                    role="radio"
                    aria-checked={contactMethod === "call"}
                  >
                    Phone Call
                  </button>
                  <button
                    type="button"
                    className={`contact-method-btn ${contactMethod === "email" ? "active" : ""}`}
                    onClick={() => setContactMethod("email")}
                    role="radio"
                    aria-checked={contactMethod === "email"}
                  >
                    Email
                  </button>
                </div>
              </div>

              <div className="two-fields">
                <label>Full name<input required autoComplete="name" value={form.name} ref={firstFieldRef} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
                <label>Phone number<input required autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
              </div>
              <label>Email address<input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              
              <div className="two-fields">
                <label>Preferred date<input type="date" min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)} value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} /></label>
                <label>
                  Preferred slot
                  <select value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}>
                    <option value="morning">Morning (9am - 12pm)</option>
                    <option value="afternoon">Afternoon (12pm - 4pm)</option>
                    <option value="evening">Evening (4pm - 7pm)</option>
                    <option value="flexible">Any time / Flexible</option>
                  </select>
                </label>
              </div>
              
              <label>Questions or notes<textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
              {submitError && <p className="form-error" role="alert">{submitError}</p>}
              <button className="dark-btn full" type="submit" disabled={sending}>{sending ? "Sending..." : "Confirm Viewing Request"} <ArrowRight size={15} /></button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
