import {
  referrerHostFromUrl,
  sanitizeGclid,
  sanitizeLandingPath,
  sanitizeUtmTerm,
  sanitizeUtmValue,
} from "@/lib/attribution";
import { isAnalyticsEnabled, upsertVisitorSession, type VisitSource } from "@/lib/server/analytics";
import { hasValidMutationOrigin, jsonError, requestIp } from "@/lib/server/security";

export const runtime = "nodejs";

/** The site's own pages are internal navigation, not a traffic source. */
function externalReferrerHost(raw: unknown, request: Request) {
  const host = referrerHostFromUrl(raw);
  if (!host) return "";
  const ownHosts = [request.headers.get("host"), request.headers.get("x-forwarded-host")]
    .flatMap((value) => (value || "").split(","))
    .map((value) => value.trim().toLowerCase().replace(/:\d+$/, "").replace(/^www\./, ""))
    .filter(Boolean);
  return ownHosts.includes(host) ? "" : host;
}

export async function POST(request: Request) {
  if (!hasValidMutationOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  if (!isAnalyticsEnabled()) {
    return Response.json({ ok: true });
  }

  try {
    const body = await request.json() as {
      sessionKey?: string;
      scrolled?: boolean;
      maxScrollPct?: number;
      durationSeconds?: number;
      client?: {
        browser?: unknown;
        os?: unknown;
        deviceType?: unknown;
      };
      source?: Record<string, unknown>;
    };
    const rawSource = body.source && typeof body.source === "object" ? body.source : undefined;
    const source: VisitSource | undefined = rawSource ? {
      utmSource: sanitizeUtmValue(rawSource.utmSource) || undefined,
      utmMedium: sanitizeUtmValue(rawSource.utmMedium) || undefined,
      utmCampaign: sanitizeUtmValue(rawSource.utmCampaign) || undefined,
      utmTerm: sanitizeUtmTerm(rawSource.utmTerm) || undefined,
      utmContent: sanitizeUtmValue(rawSource.utmContent) || undefined,
      gclid: sanitizeGclid(rawSource.gclid) || undefined,
      referrerHost: externalReferrerHost(rawSource.referrer, request) || undefined,
      landingPath: sanitizeLandingPath(rawSource.landingPath) || undefined,
    } : undefined;

    const sessionKey = String(body.sessionKey || "").trim();
    if (!sessionKey) {
      return Response.json({ ok: true });
    }

    await upsertVisitorSession(
      {
        sessionKey,
        scrolled: body.scrolled,
        maxScrollPct: body.maxScrollPct,
        durationSeconds: body.durationSeconds,
        client: body.client && typeof body.client === "object" ? {
          browser: typeof body.client.browser === "string" ? body.client.browser.slice(0, 64) : undefined,
          os: typeof body.client.os === "string" ? body.client.os.slice(0, 64) : undefined,
          deviceType: typeof body.client.deviceType === "string" ? body.client.deviceType.slice(0, 16) : undefined,
        } : undefined,
        source,
      },
      {
        ipAddress: requestIp(request),
        userAgent: request.headers.get("user-agent") || "",
        request,
      },
    );

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Analytics collect failed", error);
    return Response.json({ ok: true });
  }
}
