import "server-only";

import { isPublicIp } from "@/lib/server/client-ip";

export type GeoLocation = {
  country: string | null;
  region: string | null;
  city: string | null;
};

type GeoCacheEntry = {
  geo: GeoLocation;
  expiresAt: number;
};

const geoCache = new Map<string, GeoCacheEntry>();
const GEO_CACHE_TTL_MS = 60 * 60 * 1000;
const GEO_LOOKUP_TIMEOUT_MS = 2500;

const INDIAN_REGION_NAMES: Record<string, string> = {
  AN: "Andaman and Nicobar Islands",
  AP: "Andhra Pradesh",
  AR: "Arunachal Pradesh",
  AS: "Assam",
  BR: "Bihar",
  CH: "Chandigarh",
  CT: "Chhattisgarh",
  DL: "Delhi",
  GA: "Goa",
  GJ: "Gujarat",
  HP: "Himachal Pradesh",
  HR: "Haryana",
  JH: "Jharkhand",
  JK: "Jammu and Kashmir",
  KA: "Karnataka",
  KL: "Kerala",
  LA: "Ladakh",
  LD: "Lakshadweep",
  MH: "Maharashtra",
  ML: "Meghalaya",
  MN: "Manipur",
  MP: "Madhya Pradesh",
  MZ: "Mizoram",
  NL: "Nagaland",
  OR: "Odisha",
  PB: "Punjab",
  PY: "Puducherry",
  RJ: "Rajasthan",
  SK: "Sikkim",
  TG: "Telangana",
  TN: "Tamil Nadu",
  TR: "Tripura",
  UP: "Uttar Pradesh",
  UT: "Uttarakhand",
  WB: "West Bengal",
};

function trimGeo(value: string | null | undefined, max: number) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function regionNameFromCode(country: string | null, regionCode: string | null) {
  if (!regionCode) return null;
  if (country === "IN" && INDIAN_REGION_NAMES[regionCode.toUpperCase()]) {
    return INDIAN_REGION_NAMES[regionCode.toUpperCase()];
  }
  return regionCode;
}

/** Vercel URL-encodes x-vercel-ip-city (e.g. "Council%20Bluffs"). */
function decodeHeaderValue(value: string | null) {
  if (!value) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function geoFromVercelHeaders(request: Request): GeoLocation {
  const country = trimGeo(request.headers.get("x-vercel-ip-country"), 2)?.toUpperCase() || null;
  const city = trimGeo(decodeHeaderValue(request.headers.get("x-vercel-ip-city")), 80);
  const regionCode = trimGeo(request.headers.get("x-vercel-ip-country-region"), 80);
  const region = regionNameFromCode(country, regionCode);
  return { country, region, city };
}

function shouldUseIpLookup() {
  return process.env.ANALYTICS_GEO_LOOKUP !== "false";
}

function readCache(ip: string) {
  const cached = geoCache.get(ip);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    geoCache.delete(ip);
    return null;
  }
  return cached.geo;
}

function writeCache(ip: string, geo: GeoLocation) {
  geoCache.set(ip, { geo, expiresAt: Date.now() + GEO_CACHE_TTL_MS });
  if (geoCache.size > 5000) {
    const now = Date.now();
    for (const [key, entry] of geoCache) {
      if (entry.expiresAt <= now) geoCache.delete(key);
    }
  }
}

async function lookupGeoFromIp(ip: string): Promise<GeoLocation | null> {
  const cached = readCache(ip);
  if (cached) return cached;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEO_LOOKUP_TIMEOUT_MS);

  try {
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;

    const payload = await response.json() as {
      success?: boolean;
      country_code?: string;
      region?: string;
      city?: string;
    };

    if (!payload.success) return null;

    const geo: GeoLocation = {
      country: trimGeo(payload.country_code, 2)?.toUpperCase() || null,
      region: trimGeo(payload.region, 80),
      city: trimGeo(payload.city, 80),
    };
    writeCache(ip, geo);
    return geo;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Resolve visitor location from the hosting platform's request headers, using
 * a separate IP lookup only when the platform did not provide a value.
 */
export async function resolveGeoLocation(request: Request, ip: string): Promise<GeoLocation> {
  const fromHeaders = geoFromVercelHeaders(request);

  // Vercel resolves these headers from the original visitor request. Prefer a
  // complete Vercel result over a separate IP database: the latter can map a
  // mobile carrier/VPN gateway to a different city than the visitor's network.
  if (fromHeaders.country && fromHeaders.city) {
    return fromHeaders;
  }

  if (!shouldUseIpLookup() || !isPublicIp(ip)) return fromHeaders;

  const fromIp = await lookupGeoFromIp(ip);
  if (!fromIp) return fromHeaders;

  // Only fill gaps from the external IP lookup. Never replace a value already
  // supplied by the hosting platform for this request.
  return {
    country: fromHeaders.country || fromIp.country,
    city: fromHeaders.city || fromIp.city,
    region: fromHeaders.region || fromIp.region,
  };
}

/** @deprecated Use resolveGeoLocation — kept for synchronous call sites during migration. */
export function geoFromRequest(request: Request): GeoLocation {
  return geoFromVercelHeaders(request);
}

export function formatGeoLocation(geo: Pick<GeoLocation, "city" | "region" | "country">) {
  const parts = [geo.city, geo.region, geo.country].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}
