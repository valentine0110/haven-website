import React from "react";
import { SITE_CONFIG } from "../lib/config";
import Listing from "../components/Listing";
import { useSEO } from "../lib/seo";

export default function Rent() {
  useSEO({
    title: "Homes for rent",
    description: `Staff-managed rentals across ${SITE_CONFIG.cities.join(", ")} — furnished, semi-furnished and unfurnished, with transparent monthly pricing.`,
    path: "/rent",
  });
  return (
    <Listing
      eyebrow="RENT"
      title="Find a home to rent."
      intro="Listings shown here are published by our staff; confirm current availability and terms with the agent before committing."
      lockPurpose="For rent"
    />
  );
}
