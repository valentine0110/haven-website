import React from "react";
import { SITE_CONFIG } from "../lib/config";
import Listing from "../components/Listing";
import { useSEO } from "../lib/seo";

export default function Properties() {
  useSEO({
    title: "All property listings",
    description: `Browse every ${SITE_CONFIG.name} property — buy or rent, across ${SITE_CONFIG.cities.join(", ")}. Filter by price, bedrooms, area and amenities.`,
    path: "/properties",
  });
  return (
    <Listing
      eyebrow="THE COLLECTION"
      title="Homes, without the noise."
      intro="Browse the full Haven collection — buy or rent, across every city we serve."
    />
  );
}
