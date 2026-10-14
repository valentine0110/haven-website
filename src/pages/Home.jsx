import React, { useState, useEffect } from "react";
import { SITE_CONFIG } from "../lib/config";
import { ArrowRight, Sparkles, ChevronDown, X, Star, ShieldCheck, CheckCircle2, XCircle, Home as HomeIcon, Building2, Trees, Key, MessageSquare, Plus, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { getPublishedProperties, getSiteSettings, CITIES as DEFAULT_CITIES } from "../lib/store";
import { PropertyCard, SearchBox } from "../components/PropertyBits";
import { PageLoading, PageError } from "../components/DataState";
import { useAsync, useIntersection, useCountUp } from "../lib/hooks";
import { useSEO } from "../lib/seo";
import { useRecentlyViewed } from "../lib/recentlyViewed";
import { optimizeImage } from "../lib/images";
import ScrollReveal, { StaggerReveal } from "../components/ScrollReveal";

function OfferPopup({ settings }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (settings?.offer_enabled && settings?.offer_image) {
      if (!sessionStorage.getItem('haven_offer_seen')) {
        const timer = setTimeout(() => setOpen(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [settings]);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    sessionStorage.setItem('haven_offer_seen', 'true');
  };

  const content = <img src={settings.offer_image} alt="Special Offer" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }} />;

  return (
    <div className="modal-backdrop" style={{ zIndex: 9999 }}>
      <div style={{ position: 'relative', maxWidth: 600, width: '90%', margin: 'auto', top: '50%', transform: 'translateY(-50%)' }}>
        <button onClick={close} aria-label="Close offer" style={{ position: 'absolute', top: -16, right: -16, background: 'white', color: 'black', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}><X size={20} /></button>
        {settings.offer_link ? <a href={settings.offer_link} target="_blank" rel="noreferrer" onClick={close}>{content}</a> : content}
      </div>
    </div>
  );
}

const TESTIMONIALS = [
  {
    quote: "Finding a home through Haven felt like working with a trusted family advisor. No pushy brokers, no ghost listings — just total transparency.",
    author: "Rohit & Ananya M.",
    role: "Purchased a 4 BHK Residence in Pune",
    rating: 5,
    location: "Shinobi Lane, Pune",
  },
  {
    quote: "The photography and details were 100% accurate. We flew in from Singapore, viewed the property in the morning, and had paperwork initiated that afternoon.",
    author: "Dr. Vikram Sethi",
    role: "NRI Buyer",
    rating: 5,
    location: "Alibaug Estate",
  },
  {
    quote: "As a tenant, I was exhausted by aggregator portals with fake prices. Haven’s rental process took less than 48 hours from request to signed agreement.",
    author: "Meera K.",
    role: "Tenant in Bengaluru",
    rating: 5,
    location: "Animville, Bengaluru",
  },
];

const HOME_FAQS = [
  {
    q: "Why are there fewer listings on Haven than on large property portals?",
    a: "Every listing on Haven is inspected, vetted, and directly managed by our licensed staff. We intentionally refuse unverified third-party submissions to eliminate duplicate spam, outdated prices, and unavailable inventory.",
  },
  {
    q: "How do I schedule an in-person or live video tour?",
    a: "Click 'Request a viewing' on any property page. Choose your preferred day and time slot (or live video tour), and the dedicated agent will confirm directly with you.",
  },
  {
    q: "Do you assist with home loans and documentation?",
    a: "Yes. Our advisory team coordinates paperwork, title checks with trusted legal counsels, and connects buyers with premier banking partners offering competitive interest rates.",
  },
];

export default function Home() {
  const { data: all, loading, error, refetch } = useAsync(getPublishedProperties, []);
  const { data: settingsData } = useAsync(getSiteSettings, []);
  const { recentList } = useRecentlyViewed();
  const [newsletterSent, setNewsletterSent] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [openFaq, setOpenFaq] = useState(0);

  const cities = settingsData?.cities?.length ? settingsData.cities : DEFAULT_CITIES;

  useSEO({
    title: `Curated Homes to Buy & Rent across ${cities.join(", ")}`,
    description: `${SITE_CONFIG.name} — staff-managed listings across ${cities.join(", ")}. Authentic photography, verified pricing, and named local advisors.`,
    path: "/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "RealEstateAgent",
      name: SITE_CONFIG.name,
      areaServed: cities,
      url: SITE_CONFIG.url,
    },
  });

  const [statsRef, statsVisible] = useIntersection();

  const activeHomes = all && !loading && !error ? all.filter((p) => p.availability === "Available" || p.availability === "Under offer") : [];
  
  const activeHomesCount = activeHomes.length;
  const citiesCount = all ? new Set(all.map((p) => p.city)).size : 0;
  const agentsCount = all ? new Set(all.map((p) => p.agentId).filter(Boolean)).size : 0;

  const animatedHomes = useCountUp(activeHomesCount, statsVisible);
  const animatedCities = useCountUp(citiesCount, statsVisible);
  const animatedAgents = useCountUp(agentsCount, statsVisible);

  if (loading) return <PageLoading label="Loading curated homes..." />;
  if (error) return <PageError error={error} onRetry={refetch} />;
  if (!all.length) return (
    <main className="empty container">
      <h2>No homes are published yet.</h2>
      <p>Once the team publishes the first listing, it will appear here.</p>
      <Link className="outline-btn" to="/contact">Contact the team <ArrowRight size={15} /></Link>
    </main>
  );

  const featured = activeHomes.filter((p) => p.featured).slice(0, 3);
  const latest = [...activeHomes].sort((a, b) => (a.dateAdded < b.dateAdded ? 1 : -1)).slice(0, 3);
  const rawHero = settingsData?.hero_image || all[0]?.image || "/placeholder-property.svg";
  const heroImage = optimizeImage(rawHero, { width: 1400 });

  return (
    <>
      <OfferPopup settings={settingsData} />
      
      {/* Hero Section */}
      <section className="home-hero">
        <div className="hero-image" style={{ backgroundImage: `url(${heroImage})` }} />
        <div className="hero-overlay" />
        <div className="hero-content container">
          <span className="eyebrow light"><Sparkles size={14} /> Curated brokerage &amp; property advisory</span>
          <h1>Find a home<br /><em>worth coming home to.</em></h1>
          <p>Staff-managed properties, authentic photography, and local agents who actually know the streets.</p>
          <SearchBox />
        </div>
        {!settingsData?.hero_image && <div className="hero-credit">Photo story · {all[0]?.location}</div>}
        <div className="hero-scroll-hint"><ChevronDown size={22} /></div>
      </section>

      {/* Intro Manifesto */}
      <ScrollReveal direction="up">
        <section className="intro container">
          <div className="intro-left">
            <span className="eyebrow">THE HAVEN EDIT</span>
            <h2>Less scrolling.<br /><span>More knowing.</span></h2>
          </div>
          <div className="intro-copy">
            <p>Property search has become very good at showing you everything. We think it should be better at helping you notice what matters.</p>
            <p className="muted">That means zero duplicate listings, realistic numbers, verified architectural floor plans, and local advisors who can answer the awkward questions — never public "list it yourself" clutter.</p>
            <Link className="underlink" to="/about">Why we built Haven <ArrowRight size={15} /></Link>
          </div>
        </section>
      </ScrollReveal>

      {/* Featured Collection */}
      <ScrollReveal direction="up">
        <section className="feature-strip">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">CURATED EDIT</span>
                <h2>Homes with distinct character.</h2>
              </div>
              <Link to="/properties" className="outline-btn">See all homes <ArrowRight size={15} /></Link>
            </div>
            <StaggerReveal className="editorial-grid" stagger={120}>
              {featured.map((p, i) => (
                <PropertyCard key={p.id} p={p} variant={i === 0 ? "feature" : "normal"} />
              ))}
            </StaggerReveal>
          </div>
        </section>
      </ScrollReveal>

      {/* Browse by Lifestyle & Architectural Style */}
      <ScrollReveal direction="up">
        <section className="lifestyle-section container">
          <div className="section-head">
            <div>
              <span className="eyebrow">LIFESTYLE COLLECTIONS</span>
              <h2>Explore by how you want to live.</h2>
            </div>
            <Link to="/properties" className="underlink">All categories <ArrowRight size={15} /></Link>
          </div>

          <div className="lifestyle-grid">
            <Link to="/properties?type=Villa" className="lifestyle-card">
              <div className="lifestyle-icon"><HomeIcon size={24} /></div>
              <h3>Villas &amp; Private Estates</h3>
              <p>Independent residences with private gardens, pools, and spacious layouts.</p>
              <span className="lifestyle-cta">Explore villas <ArrowRight size={14} /></span>
            </Link>

            <Link to="/properties?type=House" className="lifestyle-card">
              <div className="lifestyle-icon"><Trees size={24} /></div>
              <h3>Family Residences</h3>
              <p>Multi-storey family homes situated in peaceful residential neighborhoods.</p>
              <span className="lifestyle-cta">Browse houses <ArrowRight size={14} /></span>
            </Link>

            <Link to="/properties?type=Apartment" className="lifestyle-card">
              <div className="lifestyle-icon"><Building2 size={24} /></div>
              <h3>City Apartments &amp; Penthouses</h3>
              <p>Contemporary urban homes offering security, elevators, and clubhouse amenities.</p>
              <span className="lifestyle-cta">Explore apartments <ArrowRight size={14} /></span>
            </Link>

            <Link to="/rent" className="lifestyle-card">
              <div className="lifestyle-icon"><Key size={24} /></div>
              <h3>Turnkey Curated Rentals</h3>
              <p>Furnished and semi-furnished homes ready for immediate move-in.</p>
              <span className="lifestyle-cta">View rentals <ArrowRight size={14} /></span>
            </Link>
          </div>
        </section>
      </ScrollReveal>

      {/* Just Listed */}
      <ScrollReveal direction="up">
        <section className="feature-strip" style={{ background: "var(--paper)" }}>
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">JUST LISTED</span>
                <h2>The latest additions to the collection.</h2>
              </div>
              <Link to="/properties?sort=newest" className="outline-btn">Browse latest <ArrowRight size={15} /></Link>
            </div>
            <StaggerReveal className="results-grid" stagger={120}>
              {latest.map((p) => <PropertyCard key={p.id} p={p} />)}
            </StaggerReveal>
          </div>
        </section>
      </ScrollReveal>

      {/* The Haven Difference vs Aggregator Portals */}
      <ScrollReveal direction="up">
        <section className="haven-difference-section container">
          <div className="section-head">
            <div>
              <span className="eyebrow">THE HAVEN DIFFERENCE</span>
              <h2>Why buyers &amp; sellers choose Haven.</h2>
            </div>
          </div>

          <div className="comparison-table-wrap">
            <table className="haven-vs-market-table">
              <thead>
                <tr>
                  <th>Property Search Standard</th>
                  <th className="haven-th"><Sparkles size={16} /> Haven Property Co.</th>
                  <th className="market-th">Generic Portals &amp; Classifieds</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><b>Listing Verification</b></td>
                  <td className="haven-td"><CheckCircle2 size={16} className="text-success" /> 100% staff inspected &amp; managed</td>
                  <td className="market-td"><XCircle size={16} className="text-error" /> Unverified crowd-sourced submissions</td>
                </tr>
                <tr>
                  <td><b>Pricing Integrity</b></td>
                  <td className="haven-td"><CheckCircle2 size={16} className="text-success" /> Direct owner-agreed asking prices</td>
                  <td className="market-td"><XCircle size={16} className="text-error" /> Fake bait-and-switch teaser rates</td>
                </tr>
                <tr>
                  <td><b>Agent Contact</b></td>
                  <td className="haven-td"><CheckCircle2 size={16} className="text-success" /> Named local advisor who knows the block</td>
                  <td className="market-td"><XCircle size={16} className="text-error" /> Number sold to dozens of telemarketers</td>
                </tr>
                <tr>
                  <td><b>Duplicate Listings</b></td>
                  <td className="haven-td"><CheckCircle2 size={16} className="text-success" /> Strict single-source record per home</td>
                  <td className="market-td"><XCircle size={16} className="text-error" /> 20+ copies of the same property</td>
                </tr>
                <tr>
                  <td><b>Viewing Experience</b></td>
                  <td className="haven-td"><CheckCircle2 size={16} className="text-success" /> In-person or live video tours on your schedule</td>
                  <td className="market-td"><XCircle size={16} className="text-error" /> Frustrating run-around &amp; unanswered calls</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </ScrollReveal>

      {/* Services Strip */}
      <ScrollReveal direction="up">
        <section className="services-strip container">
          <div className="section-head">
            <div><span className="eyebrow">WHAT WE DO</span><h2>Services built around one deal at a time.</h2></div>
          </div>
          <div className="principle-grid">
            <div><b>01</b><h3>Buying</h3><p className="muted">Shortlisting, private viewings, and honest negotiation support from a local advisor.</p></div>
            <div><b>02</b><h3>Renting</h3><p className="muted">Staff-managed rentals with clear pricing, documentation help, and direct agent follow-up.</p></div>
            <div><b>03</b><h3>Selling</h3><p className="muted">Professional photography, comparative pricing guidance, and a managed enquiry pipeline.</p></div>
            <div><b>04</b><h3>Advisory</h3><p className="muted">Neighborhood insights, title checks, and NRI transaction support.</p></div>
          </div>
          <Link className="underlink" to="/services">See all services <ArrowRight size={15} /></Link>
        </section>
      </ScrollReveal>

      {/* Numbers / Stats */}
      <section className="about-numbers">
        <div className="container numbers-grid" ref={statsRef}>
          <div><b>{animatedHomes}</b><span>available / under offer</span></div>
          <div><b>{animatedCities}</b><span>cities represented</span></div>
          <div><b>{animatedAgents}</b><span>named advisors</span></div>
          <div><b>100%</b><span>staff-managed inventory</span></div>
        </div>
      </section>

      {/* Cities / Neighborhoods */}
      <ScrollReveal direction="up">
        <section className="city-section container">
          <div className="section-head">
            <div><span className="eyebrow">NEIGHBORHOODS</span><h2>Start with the city.<br />Stay for the details.</h2></div>
            <Link className="underlink" to="/properties">Explore every listing <ArrowRight size={15} /></Link>
          </div>
          <div className="city-grid">
            {cities.map((c, i) => (
              <Link key={c} to={`/properties?city=${encodeURIComponent(c)}`} className="city-card">
                <img
                  src={optimizeImage(all.find((p) => p.city === c)?.image || "/placeholder-property.svg", { width: 500 })}
                  alt={`${c} homes`}
                  loading="lazy"
                  decoding="async"
                />
                <div className="city-card-body">
                  <span>0{i + 1}</span>
                  <div><h3>{c}</h3><p>{all.filter((p) => p.city === c).length} curated homes</p></div>
                  <ArrowRight size={20} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* Client Testimonials */}
      <ScrollReveal direction="up">
        <section className="testimonials-section container">
          <div className="section-head">
            <div>
              <span className="eyebrow">CLIENT EXPERIENCES</span>
              <h2>Stories from our clients.</h2>
            </div>
            <Link to="/about" className="underlink">About our approach <ArrowRight size={14} /></Link>
          </div>

          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, idx) => (
              <div className="testimonial-card" key={idx}>
                <div className="testimonial-stars">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={15} fill="#d4af37" color="#d4af37" />
                  ))}
                </div>
                <blockquote className="testimonial-quote">"{t.quote}"</blockquote>
                <div className="testimonial-author">
                  <b>{t.author}</b>
                  <span className="muted">{t.role}</span>
                  <small className="testimonial-loc">{t.location}</small>
                </div>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* Recently Viewed (if user visited homes) */}
      {recentList.length > 0 && (
        <section className="recently-viewed-home-strip container">
          <div className="section-head">
            <div>
              <span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span>
              <h2>Your recently viewed homes.</h2>
            </div>
            <Link to="/saved" className="underlink">View shortlist <ArrowRight size={14} /></Link>
          </div>
          <div className="results-grid">
            {recentList.slice(0, 3).map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      {/* Home FAQ Preview Accordion */}
      <ScrollReveal direction="up">
        <section className="home-faq-section container">
          <div className="section-head">
            <div>
              <span className="eyebrow">COMMON QUESTIONS</span>
              <h2>Everything you need to know.</h2>
            </div>
            <Link to="/faq" className="outline-btn">View full FAQ <ArrowRight size={14} /></Link>
          </div>

          <div className="home-faq-accordion">
            {HOME_FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div className={`home-faq-item ${isOpen ? "open" : ""}`} key={idx}>
                  <button
                    type="button"
                    className="home-faq-q"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                  </button>
                  {isOpen && <p className="home-faq-a">{faq.a}</p>}
                </div>
              );
            })}
          </div>
        </section>
      </ScrollReveal>

      {/* Newsletter */}
      <section className="newsletter-section container">
        <ScrollReveal>
          <div className="newsletter-inner">
            <div>
              <span className="eyebrow light">STAY IN THE LOOP</span>
              <h2>New homes,<br />before they're listed.</h2>
              <p className="muted">Join our private registry for early access to new properties, private listings, and neighborhood market reports.</p>
            </div>
            {newsletterSent ? (
              <div className="newsletter-success">
                <CheckCircle2 size={24} className="text-success" />
                <div>
                  <b>You're subscribed!</b>
                  <p>We'll notify you as soon as new properties match our standards.</p>
                </div>
              </div>
            ) : (
              <form
                className="newsletter-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newsletterEmail) setNewsletterSent(true);
                }}
              >
                <input
                  type="email"
                  placeholder="Your email address"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="newsletter-input"
                />
                <button type="submit" className="dark-btn">Subscribe <ArrowRight size={15} /></button>
              </form>
            )}
          </div>
        </ScrollReveal>
      </section>

      {/* Split CTA */}
      <ScrollReveal direction="up">
        <section className="split-cta container">
          <div>
            <span className="eyebrow">HAVE A QUESTION?</span>
            <h2>Talk to a real<br />advisor, today.</h2>
          </div>
          <div>
            <p>Whether you're buying your first home or scouting for an estate rental, our team can help you work through the details without the sales script.</p>
            <Link className="dark-btn" to="/contact">Start a conversation <ArrowRight size={16} /></Link>
          </div>
        </section>
      </ScrollReveal>
    </>
  );
}
