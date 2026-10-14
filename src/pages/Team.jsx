import React from "react";
import { SITE_CONFIG } from "../lib/config";
import { ArrowRight, Mail, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { getAgents, getPublishedProperties } from "../lib/store";
import { optimizeImage } from "../lib/images";
import { useAsync } from "../lib/hooks";
import { PageLoading, PageError } from "../components/DataState";
import { useSEO } from "../lib/seo";
import ScrollReveal, { StaggerReveal } from "../components/ScrollReveal";

export default function Team() {
  useSEO({
    title: "Our team",
    description: `Meet the ${SITE_CONFIG.name} agents across ${SITE_CONFIG.cities.join(", ")} — named advisors who know their neighborhoods.`,
    path: "/team",
  });
  const { data: agents, loading: loadingAgents, error: agentsError } = useAsync(getAgents, []);
  const { data: props, loading: loadingProps } = useAsync(getPublishedProperties, []);

  if (loadingAgents || loadingProps) return <PageLoading label="Loading team..." />;
  if (agentsError) return <PageError error={agentsError} />;

  return (
    <section className="agents-page">
      <ScrollReveal>
        <div className="agents-hero container">
          <div><span className="eyebrow">PEOPLE, NOT CALL CENTERS</span><h1>Meet the people<br />behind the listings.</h1></div>
          <p>Our agents work in the neighborhoods they represent and can add context that a filter cannot.</p>
        </div>
      </ScrollReveal>
      
      <StaggerReveal className="container agents-grid">
        {agents.map((a, i) => {
          const count = (props || []).filter((p) => p.agentId === a.id).length;
          const phoneClean = (a.phone || "").replace(/\s/g, "").replace(/^\+/, "");
          return (
            <article className="agent-card" key={a.id}>
              <div className="agent-photo">
                <img
                  src={optimizeImage(a.image || "/placeholder-property.svg", { width: 400 })}
                  alt={a.name}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => { e.currentTarget.src = "/placeholder-property.svg"; }}
                />
                <span>0{i + 1}</span>
                <div className="agent-overlay">
                  <a href={`tel:${(a.phone || '').replace(/\s/g, '')}`} className="agent-overlay-btn"><Phone size={16} /> Call</a>
                  <a href={`mailto:${a.email}`} className="agent-overlay-btn"><Mail size={16} /> Email</a>
                </div>
              </div>
              <div className="agent-card-body">
                <h2>{a.name}</h2>
                <p className="agent-role">{a.role}</p>
                <p className="agent-listings-count">{count} active listing{count !== 1 ? 's' : ''}</p>
                <div className="agent-contact-info">
                  <a href={`tel:${(a.phone || "").replace(/\s/g, "")}`}><Phone size={13} /> {a.phone}</a>
                  <a href={`mailto:${a.email}`}><Mail size={13} /> {a.email}</a>
                </div>
                <div className="agent-action-btns">
                  <a href={`tel:${(a.phone || "").replace(/\s/g, "")}`} className="agent-btn-call"><Phone size={14} /> Call</a>
                  <a href={`https://wa.me/${phoneClean}`} target="_blank" rel="noopener noreferrer" className="agent-btn-wa"><MessageCircle size={14} /> WhatsApp</a>
                </div>
              </div>
            </article>
          );
        })}
      </StaggerReveal>
      
      <ScrollReveal>
        <div className="agent-cta">
          <div className="container">
            <span className="eyebrow light">FOR AGENTS &amp; PARTNERS</span>
            <h2>Good local knowledge<br />should travel further.</h2>
            <p>Join a small network of independent property professionals who value accurate listings and straightforward conversations.</p>
            <Link className="light-btn" to="/contact">Start a conversation <ArrowRight size={16} /></Link>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
