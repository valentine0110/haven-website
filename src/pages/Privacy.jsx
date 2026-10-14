import React from "react";
import { useSEO } from "../lib/seo";
import { SITE_CONFIG } from "../lib/config";

export default function Privacy() {
  useSEO({ title: "Privacy policy", description: `Privacy information for ${SITE_CONFIG.name}.`, path: "/privacy" });
  return <main className="legal-page container"><span className="eyebrow">LEGAL</span><h1>Privacy policy.</h1><div className="legal-body"><p>Last updated: 20 September 2026</p><h2>What we collect</h2><p>When you send an enquiry, we collect the contact details and property information you choose to provide. Website forms may also record the source page so our team can understand the context of a request.</p><h2>How we use it</h2><p>We use submitted details to respond to property enquiries, arrange communication or viewings, maintain our listing records and operate the website. We do not use enquiry data to create public profiles.</p><h2>Third-party services</h2><p>The website uses Supabase for database, staff authentication and property/agent media storage. Saved homes are stored in your browser local storage; we do not require a public account for saved homes.</p><h2>Your choices</h2><p>You can contact the team to ask what information we hold or to request correction or deletion where applicable.</p><h2>Contact</h2><p>Privacy questions: {SITE_CONFIG.email ? <a href={`mailto:${SITE_CONFIG.email}`}>{SITE_CONFIG.email}</a> : "Configure VITE_COMPANY_EMAIL before launch."}</p></div></main>;
}
