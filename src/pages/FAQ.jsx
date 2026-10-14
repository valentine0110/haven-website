import React, { useState } from "react";
import { Plus, Minus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useSEO } from "../lib/seo";

const faqs = [
  { q: "Can I list my own property on Haven?", a: "No. Haven is a managed brokerage — only our staff add and publish listings. This keeps the collection under one team and makes the source of each listing clear. If you'd like to sell or rent out a property through us, contact our team and an agent will handle the listing on your behalf.", category: "General" },
  { q: "How do I schedule a viewing?", a: "Open any property page and use \"Request a viewing\", or call/WhatsApp the listing agent directly. Viewing requests are reviewed by the team during business hours and a suitable time is confirmed directly with the agent.", category: "Viewings & Process" },
  { q: "Are the prices on the site final?", a: "Listed prices reflect the current asking price set by the owner and our team. Final terms are always confirmed directly with the agent before any agreement.", category: "Buying & Selling" },
  { q: "Do you charge buyers or tenants a fee?", a: "Haven't brokerage fee structure is discussed directly with our agents and depends on the transaction type. There's no charge for browsing, searching or enquiring.", category: "Buying & Selling" },
  { q: "How often is availability updated?", a: "Our staff update availability when they are informed of a change. For important decisions, confirm the current status directly with the listing agent before committing.", category: "General" },
  { q: "Can I filter by amenities and furnishing status?", a: "Yes — the filter panel on every listings page lets you filter by furnishing, parking, amenities, bedrooms, bathrooms, area and availability, and filters can be combined.", category: "General" },
  { q: "I'm an NRI — can I buy remotely?", a: "Yes. Our advisory service can include remote viewings, document coordination and general guidance. Transaction-specific legal and tax advice should be taken from the appropriate licensed professional.", category: "Buying & Selling" },
];

const categoryOrder = ["General", "Buying & Selling", "Viewings & Process"];

export default function FAQ() {
  useSEO({
    title: "Frequently asked questions",
    description: "Answers to common questions about buying, renting, viewings, pricing and how Haven Property Co.'s managed listings work.",
    path: "/faq",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  });

  const [openSet, setOpenSet] = useState(new Set([0]));
  const [search, setSearch] = useState("");

  const toggle = (i) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const filteredFaqs = faqs.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()));

  // Group by category, but maintain the original index so that `toggle(i)` works consistently 
  // Wait, if we render filtered and grouped, the index `i` might refer to something else if we map over filteredFaqs. 
  // Let's attach original index to the items.
  const faqsWithIndex = filteredFaqs.map(f => ({ ...f, originalIndex: faqs.indexOf(f) }));

  const groupedFaqs = categoryOrder.map(cat => ({
    category: cat,
    items: faqsWithIndex.filter(f => f.category === cat)
  })).filter(g => g.items.length > 0);

  return (
    <main className="faq-page container">
      <section className="manifesto" style={{ paddingBottom: 20 }}>
        <span className="eyebrow">QUESTIONS</span>
        <h1>Frequently asked<br />questions.</h1>
        <p className="manifesto-lead">Can't find what you need? <Link to="/contact">Get in touch</Link> and a member of the team will answer directly.</p>
        
        <div className="faq-search-wrap" style={{ position: 'relative', marginTop: '2rem' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input 
            type="text" 
            placeholder="Search questions..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="faq-search"
            style={{ width: '100%', padding: '16px 16px 16px 48px', fontSize: '1rem', margin: 0 }}
          />
        </div>
      </section>

      <div className="faq-list">
        {groupedFaqs.map(group => (
          <div key={group.category} className="faq-group" style={{ marginBottom: '2rem' }}>
            <h2 className="eyebrow" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.5rem' }}>{group.category}</h2>
            {group.items.map((f) => {
              const i = f.originalIndex;
              const isOpen = openSet.has(i);
              return (
                <div className={`faq-item ${isOpen ? "open" : ""}`} key={f.q}>
                  <button type="button" className="faq-q" aria-expanded={isOpen} aria-controls={`faq-answer-${i}`} onClick={() => toggle(i)}>
                    <span>{f.q}</span>
                    {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                  </button>
                  <div className="faq-answer-wrap" style={{ maxHeight: isOpen ? '500px' : '0', overflow: 'hidden', transition: 'max-height 0.35s ease' }}>
                    <p id={`faq-answer-${i}`} className="faq-a" style={{ paddingTop: isOpen ? '1rem' : '0', paddingBottom: isOpen ? '1rem' : '0' }}>{f.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {groupedFaqs.length === 0 && <p className="muted">No results found for "{search}"</p>}
      </div>
    </main>
  );
}
