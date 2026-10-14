import React from "react";
import { ArrowRight, Check, Home, Key, TrendingUp, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useSEO } from "../lib/seo";
import ScrollReveal from "../components/ScrollReveal";

const services = [
  {
    name: "Buying",
    desc: "Shortlisting, private viewings and honest negotiation support from an agent who knows the building.",
    points: ["Curated shortlist based on your brief", "Private, unhurried viewings", "Negotiation & offer support", "Paperwork and closing checklist"],
    icon: Home
  },
  {
    name: "Renting",
    desc: "Staff-managed rentals with transparent pricing, direct agent follow-up and clear lease documentation.",
    points: ["Furnished, semi and unfurnished options", "Viewing coordination around agent availability", "Lease review guidance", "Move-in coordination"],
    icon: Key
  },
  {
    name: "Selling",
    desc: "Professional photography, realistic pricing guidance and a managed enquiry pipeline — not a lawn sign.",
    points: ["Photography & floor plan shoot", "Comparative market pricing", "Managed enquiries via our team", "Weekly performance updates"],
    icon: TrendingUp
  },
  {
    name: "Advisory",
    desc: "Neighborhood, legal-document and paperwork guidance for first-time buyers and NRIs.",
    points: ["Introductions to appropriate document-review professionals", "Home loan process guidance", "Neighborhood briefings", "Relocation support"],
    icon: BookOpen
  },
];

export default function Services() {
  useSEO({
    title: "Services",
    description: "What Haven Property Co. offers: buying, renting, selling and advisory services backed by named local agents.",
    path: "/services",
  });
  return (
    <main className="services-page container">
      <section className="manifesto" style={{ paddingBottom: 30 }}>
        <span className="eyebrow">WHAT WE DO</span>
        <h1>Services built around<br />one deal at a time.</h1>
        <p className="manifesto-lead">We keep the list short on purpose — four things, done properly, rather than everything, done thinly.</p>
      </section>
      
      <div className="services-grid">
        {services.map((s) => {
          const Icon = s.icon;
          return (
            <article className="service-card" key={s.name}>
              <div className="service-icon"><Icon size={24} /></div>
              <h2>{s.name}</h2>
              <p className="muted">{s.desc}</p>
              <div className="feature-list">{s.points.map((pt) => <div key={pt}><Check size={15} />{pt}</div>)}</div>
            </article>
          );
        })}
      </div>

      <section className="process-section">
        <ScrollReveal>
          <span className="eyebrow">HOW IT WORKS</span>
          <h2>Four steps to your next home.</h2>
          <div className="process-grid">
            <div className="process-step">
              <span className="process-num">01</span>
              <h3>Tell us what you need</h3>
              <p className="muted">A quick call or message to outline your requirements.</p>
            </div>
            <div className="process-step">
              <span className="process-num">02</span>
              <h3>We curate options</h3>
              <p className="muted">Our agents shortlist properties that match your brief.</p>
            </div>
            <div className="process-step">
              <span className="process-num">03</span>
              <h3>Visit with context</h3>
              <p className="muted">Private viewings with an agent who knows the building.</p>
            </div>
            <div className="process-step">
              <span className="process-num">04</span>
              <h3>Close with confidence</h3>
              <p className="muted">Negotiation support and paperwork guidance to the finish.</p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <section className="split-cta" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div><span className="eyebrow">NOT SURE WHERE TO START?</span><h2>Tell us the goal.<br />We'll map the route.</h2></div>
        <div><p>A five-minute conversation with an agent usually clarifies more than an hour of scrolling.</p><Link className="dark-btn" to="/contact">Talk to the team <ArrowRight size={16} /></Link></div>
      </section>
    </main>
  );
}
