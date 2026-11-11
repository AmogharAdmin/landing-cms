import "server-only";

import { getDatabasePool, isDatabaseConfigured } from "@/lib/server/db";
import { ensureAttributionColumns } from "@/lib/server/attribution-schema";
import { normalizeRecordIds } from "@/lib/server/normalize-ids";
import { resolveGeoLocation } from "@/lib/server/geo-location";
import { classifyTrafficSource, isKnownChannel, type TrafficChannel } from "@/lib/traffic-source";

const BOT_PATTERN = /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|headlesschrome/i;
const SESSION_KEY_PATTERN = /^[a-zA-Z0-9_-]{8,64}$/;
const VISITOR_RETENTION_DAYS = 30;

/** Calendar day for analytics cards/tables (IST by default; Neon CURRENT_DATE is UTC). */
export const ANALYTICS_TIMEZONE =
  (process.env.ANALYTICS_TIMEZONE || "Asia/Kolkata").trim() || "Asia/Kolkata";

function analyticsTimezoneSqlLiteral() {
  // Only allow IANA-like zone names so we can safely embed in SQL.
  if (!/^[A-Za-z0-9_+\-/]+$/.test(ANALYTICS_TIMEZONE)) {
    return "Asia/Kolkata";
  }
  return ANALYTICS_TIMEZONE;
}

const collectThrottle = new Map<string, number>();
const COLLECT_THROTTLE_MS = 10_000;

let lastPurgeAt = 0;
const PURGE_INTERVAL_MS = 60 * 60 * 1000;

export type VisitorSessionRow = {
  id: number;
  session_key: string;
  ip_address: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  device_type: string;
  browser: string | null;
  os: string | null;
  referrer_host: string | null;
  scrolled: boolean;
  max_scroll_pct: number;
  duration_seconds: number;
  converted: boolean;
  whatsapp_clicked: boolean;
  first_seen_at: Date | string;
  last_seen_at: Date | string;
} & TrafficSourceColumns;

export type TrafficSourceColumns = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  gclid: string | null;
  landing_path: string | null;
  source_channel: string;
};

/** Source fields joined onto CTA clicks / submissions from their visit. */
export type JoinedSourceColumns = {
  source_channel: string;
  source_utm_source: string | null;
  source_utm_medium: string | null;
  source_utm_campaign: string | null;
  source_utm_term: string | null;
  source_referrer_host: string | null;
};

export type AnalyticsRange = "today" | "7d" | "30d" | "all";

export function normalizeAnalyticsRange(value: unknown): AnalyticsRange {
  return value === "today" || value === "7d" || value === "30d" ? value : "all";
}

/** Legacy rows stored the site's own host; only external referrers are meaningful. */
const VISIBLE_REFERRER_SQL = "CASE WHEN vs.source_channel = 'direct' THEN NULL ELSE vs.referrer_host END";

function rangeCondition(range: AnalyticsRange, column: string) {
  const tz = analyticsTimezoneSqlLiteral();
  if (range === "today") {
    return `(${column} AT TIME ZONE '${tz}')::date = (CURRENT_TIMESTAMP AT TIME ZONE '${tz}')::date`;
  }
  if (range === "7d") return `${column} >= NOW() - INTERVAL '7 days'`;
  if (range === "30d") return `${column} >= NOW() - INTERVAL '30 days'`;
  return "";
}

export type FormSubmissionRow = {
  id: number;
  form_source: string;
  form_label: string;
  click_source: string | null;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  custom_fields: Record<string, string> | null;
  utm_term: string | null;
  gclid: string | null;
  visitor_session_id: number | null;
  ip_address: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  submitted_at: Date | string;
};

export type CollectPayload = {
  sessionKey: string;
  scrolled?: boolean;
  maxScrollPct?: number;
  durationSeconds?: number;
  client?: AnalyticsClientContext;
  source?: VisitSource;
};

/** Already-sanitized first-touch source for a visit. */
export type VisitSource = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  referrerHost?: string;
  landingPath?: string;
};

export type AnalyticsClientContext = {
  browser?: string;
  os?: string;
  deviceType?: string;
};

export type InsertSubmissionInput = {
  formSource: string;
  formLabel: string;
  clickSource?: string;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  customFields?: Record<string, string>;
  utmTerm?: string;
  gclid?: string;
  sessionKey?: string;
  ipAddress?: string;
  country?: string | null;
  region?: string | null;
  city?: string | null;
};

export function isAnalyticsEnabled() {
  if (process.env.ANALYTICS_ENABLED === "false") return false;
  return isDatabaseConfigured();
}

export function isBotUserAgent(userAgent: string) {
  return BOT_PATTERN.test(userAgent);
}

export function normalizeSessionKey(value: string) {
  const trimmed = value.trim().slice(0, 64);
  return SESSION_KEY_PATTERN.test(trimmed) ? trimmed : "";
}

export function parseDeviceFromUserAgent(userAgent: string) {
  const lower = userAgent.toLowerCase();
  let deviceType = "desktop";
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(userAgent) ||
    (lower.includes("macintosh") && lower.includes("mobile/"))) {
    deviceType = "tablet";
  } else if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(userAgent)) {
    deviceType = "mobile";
  }

  let browser = "Unknown";
  if (lower.includes("edg/") || lower.includes("edga/") || lower.includes("edgios/")) browser = "Edge";
  else if (lower.includes("opr/") || lower.includes("opera") || lower.includes("opios/")) browser = "Opera";
  else if (lower.includes("samsungbrowser/")) browser = "Samsung Internet";
  // iOS browsers identify themselves using CriOS/FxiOS rather than Chrome/Firefox.
  else if (lower.includes("crios/") || lower.includes("chrome/")) browser = "Chrome";
  else if (lower.includes("fxios/") || lower.includes("firefox/")) browser = "Firefox";
  else if (lower.includes("safari/")) browser = "Safari";

  let os = "Unknown";
  if (/iphone|ipad|ipod|cpu (?:iphone )?os|crios|fxios|edgios|opios/.test(lower) ||
    (lower.includes("macintosh") && lower.includes("mobile/"))) os = "iOS";
  else if (lower.includes("android")) os = "Android";
  else if (lower.includes("windows")) os = "Windows";
  else if (lower.includes("mac os")) os = "macOS";
  else if (lower.includes("linux")) os = "Linux";

  return {
    deviceType: deviceType.slice(0, 16),
    browser: browser.slice(0, 64),
    os: os.slice(0, 64),
  };
}

const BROWSER_ALIASES: Record<string, string> = {
  "google chrome": "Chrome",
  chrome: "Chrome",
  chromium: "Chrome",
  safari: "Safari",
  firefox: "Firefox",
  "microsoft edge": "Edge",
  edge: "Edge",
  opera: "Opera",
  "samsung internet": "Samsung Internet",
};

const OS_ALIASES: Record<string, string> = {
  android: "Android",
  ios: "iOS",
  ipados: "iOS",
  macos: "macOS",
  "mac os": "macOS",
  windows: "Windows",
  linux: "Linux",
};

function clientValue(value: string | undefined, aliases: Record<string, string>, fallback: string) {
  const normalized = value?.trim().toLowerCase();
  return (normalized && aliases[normalized]) || fallback;
}

/**
 * Chromium Client Hints identify Chrome and its platform more reliably than a
 * reduced User-Agent header. The server parser remains the safe fallback for
 * Safari, Firefox and browsers that do not expose Client Hints.
 */
export function resolveDeviceInfo(userAgent: string, client?: AnalyticsClientContext) {
  const fallback = parseDeviceFromUserAgent(userAgent);
  const requestedDevice = client?.deviceType?.trim().toLowerCase();
  const deviceType = requestedDevice === "mobile" || requestedDevice === "tablet" || requestedDevice === "desktop"
    ? requestedDevice
    : fallback.deviceType;

  return {
    deviceType: deviceType.slice(0, 16),
    browser: clientValue(client?.browser, BROWSER_ALIASES, fallback.browser).slice(0, 64),
    os: clientValue(client?.os, OS_ALIASES, fallback.os).slice(0, 64),
  };
}

export { formatGeoLocation, geoFromRequest } from "@/lib/server/geo-location";

function clampScrollPct(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampDuration(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(86_400, Math.round(value)));
}

export function shouldThrottleCollect(sessionKey: string) {
  const now = Date.now();
  const last = collectThrottle.get(sessionKey) || 0;
  if (now - last < COLLECT_THROTTLE_MS) return true;
  collectThrottle.set(sessionKey, now);
  if (collectThrottle.size > 5000) {
    for (const [key, timestamp] of collectThrottle) {
      if (now - timestamp > COLLECT_THROTTLE_MS * 6) collectThrottle.delete(key);
    }
  }
  return false;
}

export async function purgeOldVisitorSessions() {
  if (!isAnalyticsEnabled()) return;
  const now = Date.now();
  if (now - lastPurgeAt < PURGE_INTERVAL_MS) return;
  lastPurgeAt = now;
  try {
    await getDatabasePool().query(
      `DELETE FROM visitor_sessions WHERE first_seen_at < NOW() - INTERVAL '${VISITOR_RETENTION_DAYS} days'`,
    );
  } catch (error) {
    console.error("Visitor session purge failed", error);
  }
}

export async function upsertVisitorSession(
  payload: CollectPayload,
  context: {
    ipAddress: string;
    userAgent: string;
    request: Request;
  },
) {
  if (!isAnalyticsEnabled()) return null;

  const sessionKey = normalizeSessionKey(payload.sessionKey);
  if (!sessionKey) return null;
  if (isBotUserAgent(context.userAgent)) return null;
  if (shouldThrottleCollect(sessionKey)) return null;

  const ipAddress = context.ipAddress === "unknown" ? null : context.ipAddress.slice(0, 45);
  const geo = await resolveGeoLocation(context.request, context.ipAddress);
  const { deviceType, browser, os } = resolveDeviceInfo(context.userAgent, payload.client);
  const source = payload.source || {};
  const referrerHost = source.referrerHost || null;
  const sourceChannel = classifyTrafficSource(source);
  const scrolled = Boolean(payload.scrolled);
  const maxScrollPct = clampScrollPct(payload.maxScrollPct);
  const durationSeconds = clampDuration(payload.durationSeconds);

  void purgeOldVisitorSessions();
  await ensureAttributionColumns();

  // A known source is only written once: later page loads and heartbeats of
  // the same visit arrive as "direct" and must not overwrite the first touch.
  const firstTouch = (column: string) =>
    `${column} = CASE WHEN visitor_sessions.source_channel = 'direct' AND EXCLUDED.source_channel <> 'direct'
      THEN EXCLUDED.${column} ELSE visitor_sessions.${column} END`;

  const result = await getDatabasePool().query<{ id: number }>(
    `INSERT INTO visitor_sessions (
      session_key, ip_address, country, region, city, device_type, browser, os,
      referrer_host, scrolled, max_scroll_pct, duration_seconds,
      utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, landing_path, source_channel
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    ON CONFLICT (session_key) DO UPDATE SET
      last_seen_at = CURRENT_TIMESTAMP,
      ip_address = EXCLUDED.ip_address,
      country = EXCLUDED.country,
      region = EXCLUDED.region,
      city = EXCLUDED.city,
      device_type = EXCLUDED.device_type,
      browser = EXCLUDED.browser,
      os = EXCLUDED.os,
      duration_seconds = GREATEST(visitor_sessions.duration_seconds, EXCLUDED.duration_seconds),
      max_scroll_pct = GREATEST(visitor_sessions.max_scroll_pct, EXCLUDED.max_scroll_pct),
      scrolled = visitor_sessions.scrolled OR EXCLUDED.scrolled,
      landing_path = COALESCE(visitor_sessions.landing_path, EXCLUDED.landing_path),
      ${firstTouch("referrer_host")},
      ${firstTouch("utm_source")},
      ${firstTouch("utm_medium")},
      ${firstTouch("utm_campaign")},
      ${firstTouch("utm_term")},
      ${firstTouch("utm_content")},
      ${firstTouch("gclid")},
      ${firstTouch("source_channel")}
    RETURNING id`,
    [
      sessionKey,
      ipAddress,
      geo.country,
      geo.region,
      geo.city,
      deviceType,
      browser,
      os,
      referrerHost,
      scrolled,
      maxScrollPct,
      durationSeconds,
      source.utmSource || null,
      source.utmMedium || null,
      source.utmCampaign || null,
      source.utmTerm || null,
      source.utmContent || null,
      source.gclid || null,
      source.landingPath || null,
      sourceChannel,
    ],
  );

  return result.rows[0]?.id ?? null;
}

export async function markSessionConverted(sessionKey: string) {
  if (!isAnalyticsEnabled()) return;
  const normalized = normalizeSessionKey(sessionKey);
  if (!normalized) return;
  try {
    await getDatabasePool().query(
      `UPDATE visitor_sessions SET converted = TRUE, last_seen_at = CURRENT_TIMESTAMP WHERE session_key = $1`,
      [normalized],
    );
  } catch (error) {
    console.error("Mark session converted failed", error);
  }
}

/** Record a WhatsApp FAB / sticky / CTA click on the visitor session (not throttled). */
export async function markSessionWhatsappClicked(sessionKey: string) {
  // Legacy helper — WhatsApp clicks are stored in cta_clicks now.
  return insertCtaClick({
    sessionKey,
    ctaType: "whatsapp",
    sourceLabel: "Floating · WhatsApp",
  });
}

export type CtaClickType = "whatsapp" | "header_call" | "floating_call";

export type CtaClickRow = {
  id: number;
  session_key: string | null;
  cta_type: string;
  source_label: string;
  ip_address: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  device_type: string;
  created_at: Date | string;
} & JoinedSourceColumns;

const JOINED_SOURCE_SELECT = `COALESCE(vs.source_channel, 'direct') AS source_channel,
  vs.utm_source AS source_utm_source,
  vs.utm_medium AS source_utm_medium,
  vs.utm_campaign AS source_utm_campaign,
  vs.utm_term AS source_utm_term,
  ${VISIBLE_REFERRER_SQL} AS source_referrer_host`;

function channelParam(value: unknown): TrafficChannel | null {
  return isKnownChannel(value) ? value : null;
}

export async function insertCtaClick(input: {
  sessionKey?: string;
  ctaType: CtaClickType;
  sourceLabel: string;
  ipAddress?: string;
  userAgent?: string;
  request?: Request;
  client?: AnalyticsClientContext;
}) {
  if (!isAnalyticsEnabled()) return null;

  const sessionKey = input.sessionKey ? normalizeSessionKey(input.sessionKey) : null;
  const visitorSessionId = sessionKey ? await resolveVisitorSessionId(sessionKey) : null;
  const ipAddress =
    !input.ipAddress || input.ipAddress === "unknown" ? null : input.ipAddress.slice(0, 45);
  const geo = input.request
    ? await resolveGeoLocation(input.request, input.ipAddress || "unknown")
    : { country: null, region: null, city: null };
  const { deviceType } = resolveDeviceInfo(input.userAgent || "", input.client);

  try {
    const result = await getDatabasePool().query<{ id: number }>(
      `INSERT INTO cta_clicks (
        session_key, cta_type, source_label, ip_address, country, region, city,
        device_type, visitor_session_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        sessionKey,
        input.ctaType.slice(0, 40),
        input.sourceLabel.trim().slice(0, 120) || input.ctaType,
        ipAddress,
        geo.country,
        geo.region,
        geo.city,
        deviceType,
        visitorSessionId,
      ],
    );
    return result.rows[0]?.id ?? null;
  } catch (error) {
    console.error("Insert CTA click failed", error);
    return null;
  }
}

export type CtaClickListFilters = {
  page?: number;
  limit?: number;
  ctaType?: CtaClickType | "all";
  channel?: string;
  range?: AnalyticsRange;
};

export async function listCtaClicks(filters: CtaClickListFilters = {}) {
  const { page, limit, offset } = pagination(filters.page, filters.limit);
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.ctaType && filters.ctaType !== "all") {
    params.push(filters.ctaType);
    conditions.push(`c.cta_type = $${params.length}`);
  }
  const channel = channelParam(filters.channel);
  if (channel) {
    params.push(channel);
    conditions.push(`COALESCE(vs.source_channel, 'direct') = $${params.length}`);
  }
  const range = rangeCondition(filters.range || "all", "c.created_at");
  if (range) conditions.push(range);

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const from = "FROM cta_clicks c LEFT JOIN visitor_sessions vs ON vs.id = c.visitor_session_id";
  const tz = analyticsTimezoneSqlLiteral();
  await ensureAttributionColumns();
  const pool = getDatabasePool();

  const [rows, countResult, summary] = await Promise.all([
    pool.query<CtaClickRow>(
      `SELECT c.id, c.session_key, c.cta_type, c.source_label, c.ip_address, c.country, c.region, c.city,
              c.device_type, c.created_at, ${JOINED_SOURCE_SELECT}
       ${from}
       ${where}
       ORDER BY c.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    ),
    pool.query<{ total: string }>(`SELECT COUNT(*)::text AS total ${from} ${where}`, params),
    pool.query<{
      whatsapp_today: string;
      header_call_today: string;
      floating_call_today: string;
      total_today: string;
    }>(
      `SELECT
         COUNT(*) FILTER (
           WHERE (created_at AT TIME ZONE '${tz}')::date = (CURRENT_TIMESTAMP AT TIME ZONE '${tz}')::date
             AND cta_type = 'whatsapp'
         )::text AS whatsapp_today,
         COUNT(*) FILTER (
           WHERE (created_at AT TIME ZONE '${tz}')::date = (CURRENT_TIMESTAMP AT TIME ZONE '${tz}')::date
             AND cta_type = 'header_call'
         )::text AS header_call_today,
         COUNT(*) FILTER (
           WHERE (created_at AT TIME ZONE '${tz}')::date = (CURRENT_TIMESTAMP AT TIME ZONE '${tz}')::date
             AND cta_type = 'floating_call'
         )::text AS floating_call_today,
         COUNT(*) FILTER (
           WHERE (created_at AT TIME ZONE '${tz}')::date = (CURRENT_TIMESTAMP AT TIME ZONE '${tz}')::date
         )::text AS total_today
       FROM cta_clicks`,
    ),
  ]);

  const total = Number(countResult.rows[0]?.total || 0);
  const summaryRow = summary.rows[0];

  return {
    items: rows.rows.map((row) => ({ ...row, id: Number(row.id) })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    summary: {
      whatsappToday: Number(summaryRow?.whatsapp_today || 0),
      headerCallToday: Number(summaryRow?.header_call_today || 0),
      floatingCallToday: Number(summaryRow?.floating_call_today || 0),
      totalToday: Number(summaryRow?.total_today || 0),
      timezone: tz,
    },
  };
}

export async function deleteCtaClick(id: number) {
  if (!isAnalyticsEnabled()) return false;
  const result = await getDatabasePool().query<{ id: number }>(
    `DELETE FROM cta_clicks WHERE id = $1 RETURNING id`,
    [id],
  );
  return Boolean(result.rows[0]?.id);
}

async function resolveVisitorSessionId(sessionKey?: string) {
  if (!sessionKey || !isAnalyticsEnabled()) return null;
  const normalized = normalizeSessionKey(sessionKey);
  if (!normalized) return null;
  const result = await getDatabasePool().query<{ id: number }>(
    `SELECT id FROM visitor_sessions WHERE session_key = $1 LIMIT 1`,
    [normalized],
  );
  return result.rows[0]?.id ?? null;
}

export async function insertFormSubmission(input: InsertSubmissionInput) {
  if (!isAnalyticsEnabled()) return null;

  const customEntries = Object.entries(input.customFields || {}).filter(([, value]) => value.trim());
  const customFields = customEntries.length
    ? Object.fromEntries(customEntries.map(([key, value]) => [key, value.trim().slice(0, 2000)]))
    : null;

  const visitorSessionId = await resolveVisitorSessionId(input.sessionKey);
  await ensureAttributionColumns();

  const result = await getDatabasePool().query<{ id: number }>(
    `INSERT INTO form_submissions (
      form_source, form_label, click_source, name, phone, email, message, custom_fields,
      visitor_session_id, ip_address, country, region, city, utm_term, gclid
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id`,
    [
      input.formSource.slice(0, 80),
      input.formLabel.slice(0, 120),
      input.clickSource?.trim().slice(0, 120) || null,
      input.name.trim().slice(0, 200),
      input.phone.trim().slice(0, 40),
      input.email?.trim().slice(0, 200) || null,
      input.message?.trim().slice(0, 4000) || null,
      customFields ? JSON.stringify(customFields) : null,
      visitorSessionId,
      input.ipAddress?.slice(0, 45) || null,
      input.country || null,
      input.region || null,
      input.city || null,
      input.utmTerm?.trim().slice(0, 200) || null,
      input.gclid?.trim().slice(0, 255) || null,
    ],
  );

  return result.rows[0]?.id ?? null;
}

export type VisitorListFilters = {
  page?: number;
  limit?: number;
  scrolled?: "yes" | "no";
  device?: string;
  channel?: string;
  campaign?: string;
  term?: string;
  q?: string;
  range?: AnalyticsRange;
};

export type SubmissionListFilters = {
  page?: number;
  limit?: number;
  source?: string;
  channel?: string;
  range?: AnalyticsRange;
};

function likePattern(value: string) {
  return `%${value.replace(/[\\%_]/g, (match) => `\\${match}`)}%`;
}

const SUBMISSION_CHANNEL_SQL = `CASE
  WHEN vs.source_channel IS NOT NULL AND vs.source_channel <> 'direct' THEN vs.source_channel
  WHEN fs.gclid IS NOT NULL THEN 'google_ads'
  WHEN fs.utm_term IS NOT NULL THEN 'utm_other'
  ELSE 'direct'
END`;

function pagination(page = 1, limit = 50) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, Math.min(100, limit));
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
}

export async function listVisitorSessions(filters: VisitorListFilters = {}) {
  const { page, limit, offset } = pagination(filters.page, filters.limit);
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.scrolled === "yes") conditions.push("vs.scrolled = TRUE");
  if (filters.scrolled === "no") conditions.push("vs.scrolled = FALSE");
  if (filters.device) {
    params.push(filters.device.slice(0, 16));
    conditions.push(`vs.device_type = $${params.length}`);
  }
  const channel = channelParam(filters.channel);
  if (channel) {
    params.push(channel);
    conditions.push(`vs.source_channel = $${params.length}`);
  }
  if (filters.campaign) {
    params.push(filters.campaign.slice(0, 200));
    conditions.push(`vs.utm_campaign = $${params.length}`);
  }
  if (filters.term) {
    params.push(filters.term.slice(0, 200));
    conditions.push(`vs.utm_term = $${params.length}`);
  }
  const q = filters.q?.trim().slice(0, 100);
  if (q) {
    params.push(likePattern(q));
    const p = `$${params.length}`;
    conditions.push(`(
      vs.utm_source ILIKE ${p} OR vs.utm_medium ILIKE ${p} OR vs.utm_campaign ILIKE ${p}
      OR vs.utm_term ILIKE ${p} OR vs.utm_content ILIKE ${p} OR vs.landing_path ILIKE ${p}
      OR ${VISIBLE_REFERRER_SQL} ILIKE ${p} OR vs.city ILIKE ${p} OR vs.region ILIKE ${p}
      OR vs.ip_address ILIKE ${p}
    )`);
  }
  const range = rangeCondition(filters.range || "all", "vs.first_seen_at");
  if (range) conditions.push(range);

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  await ensureAttributionColumns();
  const pool = getDatabasePool();
  const [rows, countResult, summary] = await Promise.all([
    pool.query<VisitorSessionRow>(
      `SELECT vs.id, vs.session_key, vs.ip_address, vs.country, vs.region, vs.city, vs.device_type,
              vs.browser, vs.os, ${VISIBLE_REFERRER_SQL} AS referrer_host, vs.scrolled, vs.max_scroll_pct,
              vs.duration_seconds, vs.converted, vs.first_seen_at, vs.last_seen_at,
              vs.utm_source, vs.utm_medium, vs.utm_campaign, vs.utm_term, vs.utm_content,
              vs.gclid, vs.landing_path, vs.source_channel
       FROM visitor_sessions vs
       ${where}
       ORDER BY vs.first_seen_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    ),
    pool.query<{ total: string }>(`SELECT COUNT(*)::text AS total FROM visitor_sessions vs ${where}`, params),
    pool.query<{
      today_visits: string;
      scrolled_count: string;
      converted_count: string;
    }>(
      (() => {
        const tz = analyticsTimezoneSqlLiteral();
        // Compare calendar dates in the site timezone (not UTC CURRENT_DATE on Neon).
        return `SELECT
          COUNT(*) FILTER (
            WHERE (first_seen_at AT TIME ZONE '${tz}')::date
              = (CURRENT_TIMESTAMP AT TIME ZONE '${tz}')::date
          )::text AS today_visits,
          COUNT(*) FILTER (
            WHERE (first_seen_at AT TIME ZONE '${tz}')::date
              = (CURRENT_TIMESTAMP AT TIME ZONE '${tz}')::date
              AND scrolled = TRUE
          )::text AS scrolled_count,
          COUNT(*) FILTER (
            WHERE (first_seen_at AT TIME ZONE '${tz}')::date
              = (CURRENT_TIMESTAMP AT TIME ZONE '${tz}')::date
              AND converted = TRUE
          )::text AS converted_count
         FROM visitor_sessions`;
      })(),
    ),
  ]);

  const total = Number(countResult.rows[0]?.total || 0);
  const summaryRow = summary.rows[0];
  const todayVisits = Number(summaryRow?.today_visits || 0);
  const scrolledCount = Number(summaryRow?.scrolled_count || 0);

  return {
    items: rows.rows,
    total,
    page,
    limit,
    summary: {
      todayVisits,
      scrolledCount,
      convertedCount: Number(summaryRow?.converted_count || 0),
      scrolledPct: todayVisits > 0 ? Math.round((scrolledCount / todayVisits) * 100) : 0,
      timezone: analyticsTimezoneSqlLiteral(),
    },
  };
}

export type TrafficChannelStat = {
  channel: string;
  visits: number;
  scrolledPct: number;
  avgDurationSeconds: number;
  conversions: number;
  conversionRate: number;
};

export type TrafficTopEntry = {
  value: string;
  channel: string;
  visits: number;
  conversions: number;
};

/** Per-channel visit stats plus top campaigns / keywords for the selected range. */
export async function getTrafficSourceBreakdown(range: AnalyticsRange = "all") {
  await ensureAttributionColumns();
  const condition = rangeCondition(range, "first_seen_at");
  const where = condition ? `WHERE ${condition}` : "";
  const andWhere = condition ? `AND ${condition}` : "";
  const pool = getDatabasePool();

  const topQuery = (column: "utm_campaign" | "utm_term") =>
    pool.query<{ value: string; channel: string; visits: string; conversions: string }>(
      `SELECT ${column} AS value,
              MODE() WITHIN GROUP (ORDER BY source_channel) AS channel,
              COUNT(*)::text AS visits,
              COUNT(*) FILTER (WHERE converted)::text AS conversions
       FROM visitor_sessions
       WHERE ${column} IS NOT NULL AND ${column} <> '' ${andWhere}
       GROUP BY ${column}
       ORDER BY COUNT(*) DESC, ${column}
       LIMIT 10`,
    );

  const [channels, campaigns, terms] = await Promise.all([
    pool.query<{ channel: string; visits: string; scrolled: string; avg_duration: string; conversions: string }>(
      `SELECT source_channel AS channel,
              COUNT(*)::text AS visits,
              COUNT(*) FILTER (WHERE scrolled)::text AS scrolled,
              COALESCE(ROUND(AVG(duration_seconds)), 0)::text AS avg_duration,
              COUNT(*) FILTER (WHERE converted)::text AS conversions
       FROM visitor_sessions
       ${where}
       GROUP BY source_channel
       ORDER BY COUNT(*) DESC`,
    ),
    topQuery("utm_campaign"),
    topQuery("utm_term"),
  ]);

  const channelStats: TrafficChannelStat[] = channels.rows.map((row) => {
    const visits = Number(row.visits);
    const conversions = Number(row.conversions);
    return {
      channel: row.channel,
      visits,
      scrolledPct: visits ? Math.round((Number(row.scrolled) / visits) * 100) : 0,
      avgDurationSeconds: Number(row.avg_duration),
      conversions,
      conversionRate: visits ? Math.round((conversions / visits) * 1000) / 10 : 0,
    };
  });

  const toTop = (rows: typeof campaigns.rows): TrafficTopEntry[] =>
    rows.map((row) => ({
      value: row.value,
      channel: row.channel,
      visits: Number(row.visits),
      conversions: Number(row.conversions),
    }));

  return {
    range,
    totalVisits: channelStats.reduce((sum, row) => sum + row.visits, 0),
    channels: channelStats,
    campaigns: toTop(campaigns.rows),
    terms: toTop(terms.rows),
  };
}

export async function listFormSubmissions(filters: SubmissionListFilters = {}) {
  const { page, limit, offset } = pagination(filters.page, filters.limit);
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.source) {
    params.push(filters.source.slice(0, 80));
    conditions.push(`fs.form_source = $${params.length}`);
  }
  const channel = channelParam(filters.channel);
  if (channel) {
    params.push(channel);
    conditions.push(`${SUBMISSION_CHANNEL_SQL} = $${params.length}`);
  }
  const range = rangeCondition(filters.range || "all", "fs.submitted_at");
  if (range) conditions.push(range);

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const from = "FROM form_submissions fs LEFT JOIN visitor_sessions vs ON vs.id = fs.visitor_session_id";

  await ensureAttributionColumns();
  const pool = getDatabasePool();
  const [rows, countResult, sources, totalAll] = await Promise.all([
    pool.query<FormSubmissionRow & JoinedSourceColumns>(
      `SELECT fs.id, fs.form_source, fs.form_label, fs.click_source, fs.name, fs.phone, fs.email,
              fs.message, fs.custom_fields, fs.utm_term, fs.gclid, fs.visitor_session_id, fs.ip_address,
              fs.country, fs.region, fs.city, fs.submitted_at,
              ${SUBMISSION_CHANNEL_SQL} AS source_channel,
              vs.utm_source AS source_utm_source,
              vs.utm_medium AS source_utm_medium,
              vs.utm_campaign AS source_utm_campaign,
              vs.utm_term AS source_utm_term,
              ${VISIBLE_REFERRER_SQL} AS source_referrer_host
       ${from}
       ${where}
       ORDER BY fs.submitted_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    ),
    pool.query<{ total: string }>(`SELECT COUNT(*)::text AS total ${from} ${where}`, params),
    pool.query<{ form_source: string; form_label: string; count: string }>(
      `SELECT form_source, MAX(form_label) AS form_label, COUNT(*)::text AS count
       FROM form_submissions
       GROUP BY form_source
       ORDER BY COUNT(*) DESC`,
    ),
    pool.query<{ total: string }>(`SELECT COUNT(*)::text AS total FROM form_submissions`),
  ]);

  return {
    items: rows.rows,
    total: Number(countResult.rows[0]?.total || 0),
    totalAll: Number(totalAll.rows[0]?.total || 0),
    page,
    limit,
    sources: sources.rows.map((row) => ({
      formSource: row.form_source,
      formLabel: row.form_label,
      count: Number(row.count),
    })),
  };
}

export async function deleteFormSubmission(id: number) {
  const result = await getDatabasePool().query<{ id: number }>(
    `DELETE FROM form_submissions WHERE id = $1 RETURNING id`,
    [id],
  );
  return result.rows.length > 0;
}

export async function deleteVisitorSession(id: number) {
  const result = await getDatabasePool().query<{ id: number }>(
    `DELETE FROM visitor_sessions WHERE id = $1 RETURNING id`,
    [id],
  );
  return result.rows.length > 0;
}

export async function deleteVisitorSessions(ids: Array<number | string>) {
  const unique = normalizeRecordIds(ids);
  if (!unique.length) return 0;

  const result = await getDatabasePool().query<{ id: number }>(
    `DELETE FROM visitor_sessions WHERE id = ANY($1::bigint[]) RETURNING id`,
    [unique],
  );
  return result.rows.length;
}

export async function purgeVisitorSessionsManual() {
  const result = await getDatabasePool().query(
    `DELETE FROM visitor_sessions WHERE first_seen_at < NOW() - INTERVAL '${VISITOR_RETENTION_DAYS} days'`,
  );
  return result.rowCount || 0;
}

export async function analyticsTablesReady() {
  if (!isDatabaseConfigured()) return false;
  try {
    await getDatabasePool().query("SELECT id FROM visitor_sessions LIMIT 1");
    await getDatabasePool().query("SELECT id FROM form_submissions LIMIT 1");
    return true;
  } catch {
    return false;
  }
}
