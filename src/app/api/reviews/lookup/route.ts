import {
  lookupGooglePlaceReviews,
  GooglePlacesError,
} from "@/lib/google-places";
import { parseLocale } from "@/lib/i18n/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { query?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const query = body.query?.trim();
  if (!query) {
    return Response.json({ error: "Missing place name" }, { status: 400 });
  }

  if (query.length > 120) {
    return Response.json(
      { error: "Place name too long (max 120 chars)" },
      { status: 413 },
    );
  }

  const languageCode = parseLocale(body.locale) === "en" ? "en" : "id";

  try {
    const result = await lookupGooglePlaceReviews(query, languageCode);
    return Response.json(result);
  } catch (err) {
    if (err instanceof GooglePlacesError) {
      const status =
        err.code === "missing_key"
          ? 503
          : err.code === "not_found" || err.code === "no_reviews"
            ? 404
            : 502;
      return Response.json({ error: err.message, code: err.code }, { status });
    }
    console.error("[/api/reviews/lookup]", err);
    return Response.json(
      { error: "Failed to fetch Google Maps reviews" },
      { status: 500 },
    );
  }
}
