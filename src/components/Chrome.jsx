import React, { useEffect, useState, useCallback } from "react";
import { ArrowRight, ArrowUp, Heart, Home, Menu, ShieldCheck, Sun, Moon, Compass, Ruler } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { SITE_CONFIG } from "../lib/config";
import { useScrollPosition } from "../lib/hooks";
import { useSavedProperties } from "../components/PropertyBits";
import { usePreferences } from "../lib/preferences";

export function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { scrollY, scrollProgress } = useScrollPosition();
  const { ids: saved } = useSavedProperties();
  const { isDark, toggleTheme } = usePreferences();

  useEffect(() => setOpen(false), [location.pathname, location.search]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const closeMenu = useCallback(() => setOpen(false), []);
  const toggleMenu = useCallback(() => setOpen((v) => !v), []);

  return (
    <header className={`site-header ${scrollY > 20 ? "scrolled" : ""}`}>
      <div className="scroll-progress" style={{ width: `${scrollProgress * 100}%` }} />
      <div className="header-inner">
        <Link className="logo" to="/">
          <span className="logo-box"><Home size={18} /></span>haven
        </Link>
        {open && <div className="mobile-nav-backdrop" onClick={closeMenu} aria-hidden="true" />}
        <nav id="main-navigation" className={`main-nav ${open ? "show" : ""}`} onClick={closeMenu} aria-label="Main navigation">
          <NavLink to="/properties" className={({ isActive }) => (isActive ? "active" : "")}>All homes</NavLink>
          <NavLink to="/buy" className={({ isActive }) => (isActive ? "active" : "")}>Buy</NavLink>
          <NavLink to="/rent" className={({ isActive }) => (isActive ? "active" : "")}>Rent</NavLink>
          <NavLink to="/services" className={({ isActive }) => (isActive ? "active" : "")}>Services</NavLink>
          <NavLink to="/team" className={({ isActive }) => (isActive ? "active" : "")}>Team</NavLink>
          <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")}>About</NavLink>
          <NavLink to="/faq" className={({ isActive }) => (isActive ? "active" : "")}>FAQ</NavLink>
        </nav>
        <div className="header-cta">
          {/* Dark / Light Theme Toggle */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <Link className="saved-link" to="/saved" aria-label="Saved homes">
            <Heart size={16} aria-hidden="true" /> Saved
            {saved?.length > 0 && <span className="saved-badge" aria-label={`${saved.length} saved homes`}>{saved.length}</span>}
          </Link>
          <Link className="dark-btn small" to="/contact">Enquire now <ArrowRight size={15} aria-hidden="true" /></Link>
          <button className="hamburger" onClick={toggleMenu} aria-label="Toggle menu" aria-expanded={open} aria-controls="main-navigation"><Menu size={20} aria-hidden="true" /></button>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const { prefs, toggleAreaUnit } = usePreferences();
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <Link className="logo footer-logo" to="/"><span className="logo-box"><Home size={17} /></span>haven</Link>
          <p>Property, with perspective.<br />Curated homes and honest detail across {SITE_CONFIG.cities.join(", ")}.</p>
          <div className="footer-preferences">
            <button
              type="button"
              className="unit-toggle-pill"
              onClick={toggleAreaUnit}
              title="Click to toggle area unit"
            >
              <Ruler size={13} /> Unit: <b>{prefs.areaUnit === "sqft" ? "Sq Ft" : "Sq Mt"}</b>
            </button>
          </div>
        </div>
        <nav aria-label="Explore properties">
          <small>EXPLORE</small>
          <Link to="/properties">All homes</Link>
          <Link to="/buy">Buy</Link>
          <Link to="/rent">Rent</Link>
          <Link to="/team">Our team</Link>
        </nav>
        <nav aria-label="Company links">
          <small>COMPANY</small>
          <Link to="/about">About us</Link>
          <Link to="/services">Services</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/privacy">Privacy policy</Link>
          <Link to="/terms">Terms &amp; conditions</Link>
        </nav>
        <div>
          <small>STAFF ACCESS</small>
          <p className="muted">Company staff can manage listings through the admin panel.</p>
          <Link to="/admin" className="underlink small-underlink"><ShieldCheck size={14} aria-hidden="true" /> Staff login</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {SITE_CONFIG.name}</span>
        <span>Made for people, not portals.</span>
        <button onClick={scrollToTop} className="back-to-top" aria-label="Back to top">
          Back to top <ArrowUp size={15} aria-hidden="true" />
        </button>
      </div>
    </footer>
  );
}
