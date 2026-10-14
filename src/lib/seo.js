import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SITE_CONFIG } from "./config";

const SITE_NAME = SITE_CONFIG.name;
const SITE_URL = SITE_CONFIG.url;

function setMeta(name, content, attr = "name") {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function removeMeta(name, attr) {
  document.querySelector(`meta[${attr}="${name}"]`)?.remove();
}

function setCanonical(path) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", `${SITE_URL}${path}`);
}

function setJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!data) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function useSEO({ title, description, path, image, jsonLd, noindex }) {
  const { pathname } = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = fullTitle;
    setMeta("description", description || `Browse homes to buy and rent from ${SITE_NAME}.`);
    setMeta("robots", noindex ? "noindex, nofollow" : "index, follow");
    setMeta("og:title", fullTitle, "property");
    setMeta("og:description", description || "", "property");
    setMeta("og:type", "website", "property");
    setMeta("og:site_name", SITE_NAME, "property");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description || "");
    if (image) {
      setMeta("og:image", image, "property");
      setMeta("twitter:image", image);
    } else {
      removeMeta("og:image", "property");
      removeMeta("twitter:image", "name");
    }
    setMeta("twitter:card", "summary_large_image");
    if (path) {
      const absolute = `${SITE_URL}${path}`;
      setMeta("og:url", absolute, "property");
      setCanonical(path);
    }
    setJsonLd("page-jsonld", jsonLd || null);
    return () => setJsonLd("page-jsonld", null);
  }, [title, description, path, image, JSON.stringify(jsonLd), noindex]);
}

export { SITE_URL, SITE_NAME };
