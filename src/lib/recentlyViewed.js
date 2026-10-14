import { useState, useEffect, useCallback } from "react";

const RECENT_KEY = "haven:recently-viewed";
const MAX_RECENT = 8;

function readRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function writeRecent(list) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
    window.dispatchEvent(new Event("haven:recent-change"));
  } catch (e) {
    // ignore
  }
}

export function useRecentlyViewed() {
  const [recentList, setRecentList] = useState(() => readRecent());

  useEffect(() => {
    const sync = () => setRecentList(readRecent());
    window.addEventListener("storage", sync);
    window.addEventListener("haven:recent-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("haven:recent-change", sync);
    };
  }, []);

  const addRecent = useCallback((prop) => {
    if (!prop || !prop.id) return;
    const item = {
      id: prop.id,
      slug: prop.slug,
      title: prop.title,
      price: prop.price,
      status: prop.status,
      location: prop.location,
      city: prop.city,
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      area: prop.area,
      image: prop.image,
      availability: prop.availability,
      propertyType: prop.propertyType,
      viewedAt: Date.now(),
    };
    const current = readRecent();
    const filtered = current.filter((x) => x.id !== prop.id);
    const next = [item, ...filtered].slice(0, MAX_RECENT);
    writeRecent(next);
    setRecentList(next);
  }, []);

  const clearRecent = useCallback(() => {
    writeRecent([]);
    setRecentList([]);
  }, []);

  return { recentList, addRecent, clearRecent };
}

