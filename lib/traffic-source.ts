export const TRAFFIC_CHANNELS = [
  "google_ads",
  "paid_other",
  "email",
  "social",
  "utm_other",
  "organic_search",
  "referral",
  "direct",
] as const;

export type TrafficChannel = (typeof TRAFFIC_CHANNELS)[number];

export const CHANNEL_LABELS: Record<TrafficChannel, string> = {
  google_ads: "Google Ads",
  paid_other: "Other paid",
  email: "Email",
  social: "Social",
  utm_other: "Other UTM",
  organic_search: "Organic search",
  referral: "Referral",
  direct: "Direct / not set",
};

export type TrafficSourceInput = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  gclid?: string | null;
  referrerHost?: string | null;
};

const PAID_MEDIUMS = new Set(["cpc", "ppc", "paid", "paidsearch", "paid_search", "display", "paid_social", "paidsocial", "cpm"]);
const GOOGLE_PAID_MEDIUMS = new Set(["cpc", "ppc", "paid", "paidsearch", "paid_search"]);
const EMAIL_VALUES = new Set(["email", "e-mail", "newsletter", "mail"]);
const SOCIAL_PATTERN = /(^|\.)(facebook|fb|instagram|linkedin|lnkd|twitter|x|t|youtube|youtu|whatsapp|wa|pinterest|reddit|quora|telegram|snapchat)\.(com|me|co|in|net)$|^(facebook|fb|ig|instagram|linkedin|twitter|x|youtube|whatsapp|pinterest|reddit|quora|telegram|snapchat)$/;
const SEARCH_PATTERN = /(^|\.)(google|bing|yahoo|duckduckgo|ecosia|yandex|baidu)\.[a-z.]+$/;

function clean(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

export function isKnownChannel(value: unknown): value is TrafficChannel {
  return typeof value === "string" && (TRAFFIC_CHANNELS as readonly string[]).includes(value);
}

/** Rules are checked in priority order; the first that applies wins. */
export function classifyTrafficSource(input: TrafficSourceInput): TrafficChannel {
  const source = clean(input.utmSource);
  const medium = clean(input.utmMedium);
  const referrer = clean(input.referrerHost).replace(/^www\./, "");
  const hasUtm = Boolean(source || medium || clean(input.utmCampaign) || clean(input.utmTerm) || clean(input.utmContent));

  if (clean(input.gclid)) return "google_ads";
  if (source.startsWith("google") && GOOGLE_PAID_MEDIUMS.has(medium)) return "google_ads";
  if (PAID_MEDIUMS.has(medium)) return "paid_other";
  if (EMAIL_VALUES.has(medium) || EMAIL_VALUES.has(source)) return "email";
  if (medium === "social" || SOCIAL_PATTERN.test(source) || (referrer && SOCIAL_PATTERN.test(referrer))) return "social";
  if (hasUtm) return "utm_other";
  if (referrer && SEARCH_PATTERN.test(referrer)) return "organic_search";
  if (referrer) return "referral";
  return "direct";
}

/** e.g. "google / cpc · Villa campaign", "instagram.com", or "Direct / not set". */
export function sourceSummaryLabel(input: TrafficSourceInput & { channel?: string | null }): string {
  const source = (input.utmSource || "").trim();
  const medium = (input.utmMedium || "").trim();
  const campaign = (input.utmCampaign || "").trim();
  const parts: string[] = [];
  if (source || medium) parts.push([source || "(not set)", medium || "(not set)"].join(" / "));
  else if (input.referrerHost) parts.push(input.referrerHost);
  if (campaign) parts.push(campaign);
  if (parts.length) return parts.join(" · ");
  if (input.gclid) return "google / cpc";
  return CHANNEL_LABELS.direct;
}

export function channelLabel(value: string | null | undefined) {
  return isKnownChannel(value) ? CHANNEL_LABELS[value] : CHANNEL_LABELS.direct;
}
