/**
 * Regenerate the catalog thumbnails in public/templates/thumbs/ from the live
 * templates (desktop viewport, top of the page). Uses the locally installed
 * Chrome in headless mode — no extra dependencies.
 *
 *   npm run dev            # or: npm run build && npm run start
 *   node scripts/capture-template-thumbs.mjs
 *
 * Env: BASE_URL (default http://localhost:3000), CHROME_PATH.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const CHROME =
  process.env.CHROME_PATH ??
  (process.platform === "darwin"
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : "google-chrome");

// Read slugs from the content file so new templates are picked up automatically.
const source = readFileSync(path.resolve("src/content/company-templates.ts"), "utf8");
const slugs = [...source.matchAll(/^\s{4}slug: "([^"]+)"/gm)].map((m) => m[1]);

const outDir = path.resolve("public/templates/thumbs");
mkdirSync(outDir, { recursive: true });

// Headless Chrome occasionally captures before the first paint (a blank white
// PNG of a few KB). Real thumbnails are far larger, so retry when it's tiny.
const MIN_BYTES = 20_000;
const ATTEMPTS = 4;

for (const slug of slugs) {
  const out = path.join(outDir, `${slug}.png`);
  let bytes = 0;
  for (let attempt = 1; attempt <= ATTEMPTS && bytes < MIN_BYTES; attempt++) {
    execFileSync(
      CHROME,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows",
        "--window-size=1280,800",
        "--virtual-time-budget=6000",
        `--screenshot=${out}`,
        `${BASE_URL}/templates/${slug}/view`,
      ],
      { stdio: "ignore" }
    );
    bytes = statSync(out).size;
  }
  if (bytes < MIN_BYTES) {
    console.error(`✗ ${slug}: screenshot still blank after ${ATTEMPTS} attempts`);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${slug} → public/templates/thumbs/${slug}.png (${Math.round(bytes / 1024)} KB)`);
  }
}
