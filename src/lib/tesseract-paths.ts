import { createRequire } from "node:module";
import path from "node:path";
import { existsSync } from "node:fs";

function isFilesystemPath(p: string): boolean {
  return (
    path.isAbsolute(p) &&
    !p.includes("[") &&
    !p.includes("externals]") &&
    existsSync(p)
  );
}

function resolveTesseractPackageRoot(): string {
  const candidates: string[] = [];

  try {
    const fromCwd = createRequire(
      path.join(process.cwd(), "package.json")
    );
    candidates.push(fromCwd.resolve("tesseract.js/package.json"));
  } catch {
    /* ignore */
  }

  try {
    const fromModule = createRequire(import.meta.url);
    candidates.push(fromModule.resolve("tesseract.js/package.json"));
  } catch {
    /* ignore */
  }

  candidates.push(
    path.join(process.cwd(), "node_modules", "tesseract.js", "package.json")
  );

  for (const pkgJson of candidates) {
    if (isFilesystemPath(pkgJson)) {
      return path.dirname(pkgJson);
    }
  }

  throw new Error(
    "tesseract.js is not installed. Run: npm install tesseract.js @napi-rs/canvas"
  );
}

/** Absolute paths — Turbopack externalizes tesseract with virtual paths that break __dirname. */
export function getTesseractWorkerOptions() {
  const pkgRoot = resolveTesseractPackageRoot();
  const workerPath = path.join(
    pkgRoot,
    "src/worker-script/node/index.js"
  );

  if (!existsSync(workerPath)) {
    throw new Error(
      `Tesseract worker not found at ${workerPath}. Try: npm install tesseract.js`
    );
  }

  return {
    workerPath,
    workerBlobURL: false,
    gzip: false,
  };
}
