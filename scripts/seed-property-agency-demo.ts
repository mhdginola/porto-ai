import "./_loadEnv";

import { db } from "@/lib/db";
import { propertyAgencySites } from "@/lib/db/schema";
import { defaultSiteConfig } from "@/lib/property-agency/defaults";
import { serializeSiteConfig } from "@/lib/property-agency/schemas";

const SAMPLE = {
  slug: "nusantara-homes",
  name: "Nusantara Homes",
};

async function main() {
  const config = defaultSiteConfig(SAMPLE.name);
  config.hero.title = "Premium Properties Across Indonesia";
  config.hero.subtitle =
    "Apartments, houses, and commercial spaces — curated by local experts.";

  const [row] = await db
    .insert(propertyAgencySites)
    .values({
      slug: SAMPLE.slug,
      name: SAMPLE.name,
      config: serializeSiteConfig(config),
      isPublished: true,
    })
    .onConflictDoNothing({ target: propertyAgencySites.slug })
    .returning({ slug: propertyAgencySites.slug });

  if (row) {
    console.log(`✓ Seeded property agency site "${row.slug}".`);
    console.log(
      `  Preview: /projects/property-agency-builder#${row.slug}`
    );
  } else {
    console.log(`✓ Site "${SAMPLE.slug}" already exists — skipped.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
