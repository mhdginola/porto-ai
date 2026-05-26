import "./_loadEnv";

import { db } from "@/lib/db";
import { demoItems } from "@/lib/db/schema";

const DUMMY_ITEMS = [
  { title: "Weekly status report", description: "Ops team sync notes for Monday." },
  { title: "API rate limit review", description: "Document thresholds for public endpoints." },
  { title: "Onboarding checklist", description: "Steps for new engineers joining the squad." },
  { title: "Database backup policy", description: "Nightly snapshots and retention rules." },
  { title: "UI component audit", description: "List shared buttons and form patterns." },
  { title: "Customer feedback Q1", description: "Themes from support tickets last quarter." },
  { title: "Security patch window", description: "Planned maintenance Saturday 02:00 WIB." },
  { title: "Mobile layout fixes", description: "Navbar overlap on small screens." },
  { title: "Invoice export template", description: "CSV columns for finance team." },
  { title: "Load test results", description: "p95 latency under 200ms at 500 RPS." },
  { title: "Vendor comparison", description: "Email provider pricing and deliverability." },
  { title: "Accessibility pass", description: "Focus states and aria labels on forms." },
  { title: "Release notes v2.4", description: "Highlights for stakeholders and CS." },
  { title: "Staging environment reset", description: "Refresh seed data after deploy." },
  { title: "Error budget review", description: "SLO burn rate for checkout service." },
  { title: "Design system tokens", description: "Color and spacing variables for Tailwind." },
  { title: "Webhook retry logic", description: "Exponential backoff and dead letter queue." },
  { title: "Team offsite agenda", description: "Workshops and demo day schedule." },
  { title: "Legacy migration plan", description: "Phased cutover from monolith module." },
  { title: "Documentation sprint", description: "OpenAPI specs and README updates." },
];

async function main() {
  const inserted = await db
    .insert(demoItems)
    .values(DUMMY_ITEMS)
    .returning({ id: demoItems.id });

  console.log(`✓ Inserted ${inserted.length} demo items into demo_items.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
