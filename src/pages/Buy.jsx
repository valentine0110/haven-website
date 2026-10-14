import React from "react";
import { SITE_CONFIG } from "../lib/config";
import Listing from "../components/Listing";
import { useSEO } from "../lib/seo";

export default function Buy() {
  useSEO({
    title: "Homes for sale",
    description: `Staff-managed homes for sale across ${SITE_CONFIG.cities.join(", ")} — apartments, villas, houses, penthouses and plots.`,
    path: "/buy",
  });
  return (
    <Listing
      eyebrow="BUY"
      title="Find a home to buy."
      intro="Every listing here is added and published by our staff, with availability confirmed with the agent."
      lockPurpose="For sale"
    />
  );
}
