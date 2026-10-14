import React from "react";
import { SITE_CONFIG } from "../lib/config";
import { getPublishedProperties } from "../lib/store";
import { useAsync, useIntersection, useCountUp } from "../lib/hooks";
import { PageLoading, PageError } from "../components/DataState";
import { useSEO } from "../lib/seo";
import ScrollReveal from "../components/ScrollReveal";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function About() {
  useSEO({
    title: "About us",
    description: `${SITE_CONFIG.name} is a boutique brokerage across ${SITE_CONFIG.cities.join(", ")}, built around staff-managed listings and named local agents.`,
    path: "/about",
  });
  
  const { data: all, loading, error } = useAsync(getPublishedProperties, []);
  
  const [statsRef, statsVisible] = useIntersection();
  const citiesCount = all ? new Set(all.map((p) => p.city)).size : 0;
  const homesCount = all ? all.length : 0;
  const agentsCount = all ? new Set(all.map((p) => p.agentId).filter(Boolean)).size : 0;
  
  const displayCities = useCountUp(citiesCount, statsVisible);
  const displayHomes = useCountUp(homesCount, statsVisible);
  const displayAgents = useCountUp(agentsCount, statsVisible);

  if (loading) return <PageLoading label="Loading..." />;
  if (error) return <PageError error={error} />;

  return (
    <main>
      <ScrollReveal>
        <section className="manifesto container">
          <span className="eyebrow">OUR APPROACH</span>
          <h1>Property is personal.<br /><em>The search should be too.</em></h1>
          <p className="manifesto-lead">Property search works better when listings are clear, local and managed by a real team. Haven is built around that idea: a smaller collection, useful detail and people who can answer the questions that filters cannot.</p>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="about-image container">
          <img src={all[Math.min(4, Math.max(0, all.length - 1))]?.image || "/placeholder-property.svg"} alt="A Haven home" />
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="principles container">
          <div><span className="eyebrow">WHAT WE BELIEVE</span><h2>Small choices add up.</h2></div>
          <div className="principle-grid">
            <div><b>01</b><h3>Show the whole picture.</h3><p>Price, size, condition and context should sit together. A beautiful image is useful; it is not the whole story.</p></div>
            <div><b>02</b><h3>Keep the list human.</h3><p>Every listing is added and published by our own staff — never a public self-listing form — so the collection stays under one team.</p></div>
            <div><b>03</b><h3>Write like a person.</h3><p>No invented superlatives. We describe the space, the street and the trade-offs so you can make the call yourself.</p></div>
            <div><b>04</b><h3>Make room for questions.</h3><p>Good property decisions rarely happen in one click. Our agents are there for the questions that don't fit a filter.</p></div>
          </div>
        </section>
      </ScrollReveal>

      <section className="about-numbers" ref={statsRef}>
        <div className="container numbers-grid">
          <div><b>{displayCities}</b><span>cities represented</span></div>
          <div><b>{displayHomes}</b><span>homes currently listed</span></div>
          <div><b>{displayAgents}</b><span>named agents</span></div>
          <div><b>100%</b><span>staff-managed listings</span></div>
        </div>
      </section>

      <ScrollReveal>
        <section className="split-cta container">
          <div><span className="eyebrow">THE TEAM</span><h2>People who know<br/>the streets.</h2></div>
          <div>
            <p>Every Haven listing is managed by a named local agent. Meet the people behind the properties.</p>
            <Link className="dark-btn" to="/team">Meet the team <ArrowRight size={16} /></Link>
          </div>
        </section>
      </ScrollReveal>
    </main>
  );
}
