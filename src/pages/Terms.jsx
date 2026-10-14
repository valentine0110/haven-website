import React from "react";
import { useSEO } from "../lib/seo";
import { SITE_CONFIG } from "../lib/config";

export default function Terms() {
  useSEO({ title: "Terms and conditions", description: `Terms and conditions for using ${SITE_CONFIG.name}.`, path: "/terms" });
  return <main className="legal-page container"><span className="eyebrow">LEGAL</span><h1>Terms &amp; conditions.</h1><div className="legal-body"><p>Last updated: 20 September 2026</p><h2>Listings</h2><p>Property information is supplied for general information and may change. Asking prices, availability, dimensions and other particulars should be confirmed with the listing agent before making a decision.</p><h2>Enquiries</h2><p>Submitting an enquiry does not create a booking, offer or agency agreement. A member of the team may contact you using the details you provide.</p><h2>Professional advice</h2><p>Website content is not a substitute for legal, tax, valuation, lending or other regulated professional advice. Obtain independent advice where appropriate.</p><h2>Website use</h2><p>Users must not attempt to disrupt the site, access staff-only areas without authorization, scrape restricted information, or submit knowingly false enquiries.</p><h2>Contact</h2><p>Questions: {SITE_CONFIG.email ? <a href={`mailto:${SITE_CONFIG.email}`}>{SITE_CONFIG.email}</a> : "Configure VITE_COMPANY_EMAIL before launch."}</p></div></main>;
}
