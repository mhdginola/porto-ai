import type { PropertyAgencyConfig } from "@/lib/property-agency/schemas";

export function defaultSiteConfig(name: string): PropertyAgencyConfig {
  return {
    hero: {
      title: name,
      subtitle: "Find your dream home with trusted local experts.",
      imageUrl: "",
    },
    about:
      "We help families and investors discover premium properties across the city. Browse listings, schedule viewings, and get expert guidance every step of the way.",
    contact: {
      phone: "+62 812 3456 7890",
      email: "hello@agency.example",
      address: "Jl. Sudirman No. 10, Jakarta",
    },
    listings: [
      {
        id: crypto.randomUUID(),
        title: "Modern Loft in SCBD",
        location: "Jakarta Selatan",
        price: 3_500_000_000,
        bedrooms: 2,
        bathrooms: 2,
        area: 85,
        type: "Apartment",
        imageUrl: "",
      },
      {
        id: crypto.randomUUID(),
        title: "Family House with Garden",
        location: "BSD City",
        price: 2_800_000_000,
        bedrooms: 4,
        bathrooms: 3,
        area: 180,
        type: "House",
        imageUrl: "",
      },
    ],
    theme: { accent: "emerald" },
  };
}
