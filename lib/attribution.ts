export const UTM_TERM_COOKIE = "amoghaa_utm_term";
export const GCLID_COOKIE = "amoghaa_gclid";
export const ATTRIBUTION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;
export const UTM_TERM_MAX_LENGTH = 200;
export const GCLID_MAX_LENGTH = 255;

export type Attribution = {
  utmTerm: string;
  gclid: string;
};

function safeDecode(value: string): string {
  const spaced = value.replace(/\+/g, " ");
  try {
    return decodeURIComponent(spaced);
  } catch {
    return spaced;
  }
}

/** Untrusted search keyword → plain, bounded text. */
export function sanitizeUtmTerm(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return "";
  let value = raw;
  // Decode at most twice so double-encoded Ads values (%2520) still read correctly.
  for (let i = 0; i < 2 && /%[0-9a-f]{2}|\+/i.test(value); i += 1) {
    const next = safeDecode(value);
    if (next === value) break;
    value = next;
  }
  return value
    .replace(/[\u0000-\u001f\u007f<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, UTM_TERM_MAX_LENGTH)
    .trim();
}

/** Any UTM tag (source, medium, campaign, content) → plain, bounded text. */
export function sanitizeUtmValue(raw: unknown): string {
  return sanitizeUtmTerm(raw);
}

/** Bare hostname from a referrer URL, or "" when missing or invalid. */
export function referrerHostFromUrl(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.hostname.toLowerCase().replace(/^www\./, "").slice(0, 191);
  } catch {
    return "";
  }
}

/** Path only (no query string), safe to store. */
export function sanitizeLandingPath(raw: unknown): string {
  if (typeof raw !== "string" || !raw.startsWith("/")) return "";
  return raw.replace(/[\u0000-\u001f\u007f<>"'`\s]/g, "").slice(0, 300);
}

/** Google click IDs are URL-safe base64-ish tokens. Anything else is dropped. */
export function sanitizeGclid(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return "";
  const value = safeDecode(raw).trim();
  if (!value || value.length > GCLID_MAX_LENGTH) return "";
  return /^[A-Za-z0-9_-]+$/.test(value) ? value : "";
}

export function attributionFromSearch(search: string): Attribution {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return {
    utmTerm: sanitizeUtmTerm(params.get("utm_term") ?? ""),
    gclid: sanitizeGclid(params.get("gclid") ?? ""),
  };
}

/**
 * Latest valid click wins per field; an empty incoming value never erases a stored one.
 */
export function mergeAttribution(stored: Attribution, incoming: Attribution): Attribution {
  return {
    utmTerm: incoming.utmTerm || stored.utmTerm,
    gclid: incoming.gclid || stored.gclid,
  };
}

export function readCookieValue(cookieHeader: string, name: string): string {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  if (!match?.[1]) return "";
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function attributionFromCookieHeader(cookieHeader: string | null | undefined): Attribution {
  const header = cookieHeader || "";
  return {
    utmTerm: sanitizeUtmTerm(readCookieValue(header, UTM_TERM_COOKIE)),
    gclid: sanitizeGclid(readCookieValue(header, GCLID_COOKIE)),
  };
}

function writeCookie(name: string, value: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ATTRIBUTION_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

/** Client only. */
export function readAttribution(): Attribution {
  if (typeof document === "undefined") return { utmTerm: "", gclid: "" };
  return attributionFromCookieHeader(document.cookie);
}

/** Client only. Stores any valid utm_term / gclid found in the current URL. */
export function captureAttributionFromUrl(search: string): Attribution {
  if (typeof document === "undefined") return { utmTerm: "", gclid: "" };
  const incoming = attributionFromSearch(search);
  if (incoming.utmTerm) writeCookie(UTM_TERM_COOKIE, incoming.utmTerm);
  if (incoming.gclid) writeCookie(GCLID_COOKIE, incoming.gclid);
  return mergeAttribution(readAttribution(), incoming);
}

/** Client only. Adds stored attribution to a lead submission body. */
export function appendAttribution(params: URLSearchParams) {
  if (typeof window === "undefined") return;
  const current = mergeAttribution(readAttribution(), attributionFromSearch(window.location.search));
  if (current.utmTerm) params.set("utm_term", current.utmTerm);
  if (current.gclid) params.set("gclid", current.gclid);
}
