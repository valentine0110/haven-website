import React from "react";
import { ArrowRight, Home, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useSEO } from "../lib/seo";
import { SearchBox } from "../components/PropertyBits";
import ScrollReveal from "../components/ScrollReveal";

export default function NotFound() {
  useSEO({ title: "Page not found", description: "The page you're looking for doesn't exist.", path: "/404", noindex: true });
  return (
    <div className="not-found container">
      <ScrollReveal>
        <span className="eyebrow">404</span>
        <h1>That page took a wrong turn.</h1>
        <p className="muted" style={{ maxWidth: 420, margin: "0 auto 26px" }}>
          The page you&apos;re looking for may have been moved, renamed, or never existed.
        </p>
        <div className="not-found-actions">
          <Link className="dark-btn" to="/"><Home size={16} /> Back to Haven</Link>
          <Link className="outline-btn" to="/properties"><Search size={16} /> Browse homes</Link>
        </div>
        <div style={{ marginTop: 48 }}>
          <p className="muted" style={{ fontSize: 12, marginBottom: 14 }}>Or search for what you need:</p>
          <SearchBox compact />
        </div>
      </ScrollReveal>
    </div>
  );
}
