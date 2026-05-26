export class GooglePlacesError extends Error {
  constructor(
    public code: "missing_key" | "not_found" | "api_error" | "no_reviews",
    message: string,
  ) {
    super(message);
    this.name = "GooglePlacesError";
  }
}

export type GooglePlaceReview = {
  author: string;
  rating: number;
  relativeTime: string;
  text: string;
};

export type GooglePlaceDataSource = "reviews" | "review_summary" | "editorial";

export type GooglePlaceMeta = {
  name: string;
  address?: string;
  rating?: number;
  totalRatings?: number;
  mapsUrl?: string;
  reviewCount: number;
  dataSource: GooglePlaceDataSource;
  placeType?: string;
};

export type GooglePlaceLookup = {
  meta: GooglePlaceMeta;
  reviewsText: string;
};

type LocalizedText = { text?: string; languageCode?: string };

type ApiReview = {
  rating?: number;
  relativePublishTimeDescription?: string;
  text?: LocalizedText;
  authorAttribution?: { displayName?: string };
};

type PlaceRecord = {
  name?: string;
  id?: string;
  displayName?: LocalizedText;
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  editorialSummary?: LocalizedText;
  reviewSummary?: {
    text?: LocalizedText;
    disclosureText?: LocalizedText;
  };
  reviews?: ApiReview[];
  primaryTypeDisplayName?: LocalizedText;
  priceLevel?: string;
  priceRange?: { startPrice?: { currencyCode?: string; units?: string } };
  dineIn?: boolean;
  takeout?: boolean;
  delivery?: boolean;
  reservable?: boolean;
  goodForGroups?: boolean;
  goodForChildren?: boolean;
  servesLunch?: boolean;
  servesDinner?: boolean;
  parkingOptions?: {
    paidParkingLot?: boolean;
    paidStreetParking?: boolean;
    valetParking?: boolean;
  };
  paymentOptions?: {
    acceptsCreditCards?: boolean;
    acceptsDebitCards?: boolean;
    acceptsCashOnly?: boolean;
  };
};

type PlacesSearchResponse = { places?: PlaceRecord[] };

const PLACES_BASE = "https://places.googleapis.com/v1";

function stars(rating: number): string {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

function getApiKey(): string {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new GooglePlacesError(
      "missing_key",
      "Google Places API key is not configured. Add GOOGLE_PLACES_API_KEY to .env.local.",
    );
  }
  return apiKey;
}

async function placesRequest<T>(
  url: string,
  init: RequestInit,
  fieldMask: string,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": getApiKey(),
      "X-Goog-FieldMask": fieldMask,
      ...init.headers,
    },
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new GooglePlacesError(
      "api_error",
      `Google Places API error (${res.status}): ${detail.slice(0, 200)}`,
    );
  }

  return res.json() as Promise<T>;
}

function parseReviews(reviews: ApiReview[] | undefined): GooglePlaceReview[] {
  return (reviews ?? [])
    .filter((r) => r.text?.text?.trim())
    .map((r) => ({
      author: r.authorAttribution?.displayName ?? "Anonymous",
      rating: r.rating ?? 0,
      relativeTime: r.relativePublishTimeDescription ?? "",
      text: r.text!.text!.trim(),
    }));
}

function formatPriceLevel(priceLevel?: string): string | null {
  const labels: Record<string, string> = {
    PRICE_LEVEL_FREE: "Free",
    PRICE_LEVEL_INEXPENSIVE: "Inexpensive",
    PRICE_LEVEL_MODERATE: "Moderate",
    PRICE_LEVEL_EXPENSIVE: "Expensive",
    PRICE_LEVEL_VERY_EXPENSIVE: "Very expensive",
  };
  return priceLevel ? (labels[priceLevel] ?? priceLevel) : null;
}

function formatAttributes(place: PlaceRecord): string[] {
  const lines: string[] = [];

  const type = place.primaryTypeDisplayName?.text;
  if (type) lines.push(`Category: ${type}`);

  const price = formatPriceLevel(place.priceLevel);
  if (price) lines.push(`Price level: ${price}`);

  if (place.priceRange?.startPrice?.units) {
    const { currencyCode, units } = place.priceRange.startPrice;
    lines.push(`Typical price from: ${currencyCode ?? ""} ${units}`.trim());
  }

  const flags: [boolean | undefined, string][] = [
    [place.dineIn, "Dine-in"],
    [place.takeout, "Takeout"],
    [place.delivery, "Delivery"],
    [place.reservable, "Reservations"],
    [place.goodForGroups, "Good for groups"],
    [place.goodForChildren, "Good for children"],
    [place.servesLunch, "Serves lunch"],
    [place.servesDinner, "Serves dinner"],
  ];

  const amenities = flags.filter(([value]) => value).map(([, label]) => label);
  if (amenities.length) lines.push(`Amenities: ${amenities.join(", ")}`);

  const parking = place.parkingOptions;
  if (parking) {
    const options = [
      parking.paidParkingLot && "paid parking lot",
      parking.paidStreetParking && "paid street parking",
      parking.valetParking && "valet parking",
    ].filter(Boolean);
    if (options.length) lines.push(`Parking: ${options.join(", ")}`);
  }

  const payment = place.paymentOptions;
  if (payment) {
    const options = [
      payment.acceptsCreditCards && "credit cards",
      payment.acceptsDebitCards && "debit cards",
      payment.acceptsCashOnly && "cash only",
    ].filter(Boolean);
    if (options.length) lines.push(`Payment: ${options.join(", ")}`);
  }

  return lines;
}

function buildMeta(
  place: PlaceRecord,
  query: string,
  reviewCount: number,
  dataSource: GooglePlaceDataSource,
): GooglePlaceMeta {
  return {
    name: place.displayName?.text ?? query,
    address: place.formattedAddress,
    rating: place.rating,
    totalRatings: place.userRatingCount,
    mapsUrl: place.googleMapsUri,
    reviewCount,
    dataSource,
    placeType: place.primaryTypeDisplayName?.text,
  };
}

function placeHeader(meta: GooglePlaceMeta, sourceNote: string): string {
  return [
    `Place: ${meta.name}`,
    meta.address ? `Address: ${meta.address}` : null,
    meta.rating != null
      ? `Google rating: ${meta.rating}/5 (${meta.totalRatings?.toLocaleString() ?? "?"} total ratings on Google Maps)`
      : null,
    meta.placeType ? `Type: ${meta.placeType}` : null,
    sourceNote,
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatReviewsForPrompt(
  meta: GooglePlaceMeta,
  reviews: GooglePlaceReview[],
): string {
  const header = placeHeader(
    meta,
    `Reviews fetched: ${reviews.length} (most relevant from Google Maps)`,
  );

  const body = reviews
    .map((r) => `${stars(r.rating)} ${r.author} — ${r.relativeTime}\n${r.text}`)
    .join("\n\n");

  return `${header}\n\n---\n\n${body}`;
}

function formatReviewSummaryForPrompt(
  meta: GooglePlaceMeta,
  summary: string,
  disclosure?: string,
): string {
  const header = placeHeader(
    meta,
    "Source: Google Maps AI review summary (not individual review texts)",
  );

  return `${header}\n\n---\n\nGoogle review summary:\n${summary}${
    disclosure ? `\n\n(${disclosure})` : ""
  }`;
}

function formatEditorialForPrompt(
  meta: GooglePlaceMeta,
  place: PlaceRecord,
): string {
  const editorial = place.editorialSummary?.text?.trim();
  const attributes = formatAttributes(place);

  const header = placeHeader(
    meta,
    "Source: Google editorial description + public place attributes (individual review texts unavailable via API for this key)",
  );

  const sections = [
    editorial ? `Google editorial description:\n${editorial}` : null,
    attributes.length ? `Place attributes:\n${attributes.join("\n")}` : null,
    "Note: No individual customer review texts were returned by Google Places API. Infer cautiously from rating, editorial text, and attributes only. Mention this limitation in the summary.",
  ].filter(Boolean);

  return `${header}\n\n---\n\n${sections.join("\n\n")}`;
}

async function searchPlace(
  query: string,
  languageCode: "id" | "en",
): Promise<PlaceRecord> {
  const data = await placesRequest<PlacesSearchResponse>(
    `${PLACES_BASE}/places:searchText`,
    {
      method: "POST",
      body: JSON.stringify({
        textQuery: query,
        languageCode,
        regionCode: "ID",
        maxResultCount: 1,
      }),
    },
    "places.name,places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri",
  );

  const place = data.places?.[0];
  if (!place?.name && !place?.id) {
    throw new GooglePlacesError(
      "not_found",
      `No place found on Google Maps for "${query}". Try a more specific name + area.`,
    );
  }

  return place;
}

async function fetchPlaceDetails(
  place: PlaceRecord,
  languageCode: "id" | "en",
): Promise<PlaceRecord> {
  const resourceName = place.name ?? `places/${place.id}`;
  const fieldMask = [
    "displayName",
    "formattedAddress",
    "rating",
    "userRatingCount",
    "googleMapsUri",
    "reviews",
    "reviewSummary.text",
    "reviewSummary.disclosureText",
    "editorialSummary",
    "primaryTypeDisplayName",
    "priceLevel",
    "priceRange",
    "dineIn",
    "takeout",
    "delivery",
    "reservable",
    "goodForGroups",
    "goodForChildren",
    "servesLunch",
    "servesDinner",
    "parkingOptions",
    "paymentOptions",
  ].join(",");

  return placesRequest<PlaceRecord>(
    `${PLACES_BASE}/${resourceName}?languageCode=${languageCode}`,
    { method: "GET" },
    fieldMask,
  );
}

export async function lookupGooglePlaceReviews(
  query: string,
  languageCode: "id" | "en" = "id",
): Promise<GooglePlaceLookup> {
  const searchHit = await searchPlace(query, languageCode);
  const place = await fetchPlaceDetails(searchHit, languageCode);

  const reviews = parseReviews(place.reviews);
  if (reviews.length > 0) {
    const meta = buildMeta(place, query, reviews.length, "reviews");
    return {
      meta,
      reviewsText: formatReviewsForPrompt(meta, reviews),
    };
  }

  const reviewSummaryText = place.reviewSummary?.text?.text?.trim();
  if (reviewSummaryText) {
    const meta = buildMeta(place, query, 0, "review_summary");
    return {
      meta,
      reviewsText: formatReviewSummaryForPrompt(
        meta,
        reviewSummaryText,
        place.reviewSummary?.disclosureText?.text,
      ),
    };
  }

  const editorial = place.editorialSummary?.text?.trim();
  if (editorial || place.rating != null) {
    const meta = buildMeta(place, query, 0, "editorial");
    return {
      meta,
      reviewsText: formatEditorialForPrompt(meta, place),
    };
  }

  throw new GooglePlacesError(
    "no_reviews",
    `Found "${place.displayName?.text ?? query}" on Google Maps but Google did not return review data for this API key. Enable billing and Places API (New) Enterprise + Atmosphere SKU for review access.`,
  );
}
