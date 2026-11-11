import { insertCtaClick, isAnalyticsEnabled, type CtaClickType } from "@/lib/server/analytics";
import { hasValidMutationOrigin, jsonError, requestIp } from "@/lib/server/security";

export const runtime = "nodejs";

const CTA_TYPES = new Set<CtaClickType>(["whatsapp", "header_call", "floating_call"]);

function resolveCtaType(raw: string | undefined): CtaClickType | null {
  const value = String(raw || "").trim() as CtaClickType;
  return CTA_TYPES.has(value) ? value : null;
}

function asOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

async function readEventBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await request.json()) as Record<string, unknown>;
  }
  const text = await request.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  if (!hasValidMutationOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  if (!isAnalyticsEnabled()) {
    return Response.json({ ok: true });
  }

  try {
    const body = await readEventBody(request);
    const clientRaw = body.client && typeof body.client === "object"
      ? (body.client as Record<string, unknown>)
      : null;

    const sessionKey = String(body.sessionKey || "").trim();
    const event = String(body.event || "").trim();
    if (!sessionKey || !event) {
      return Response.json({ ok: true });
    }

    if (event === "cta_click" || event === "whatsapp_click") {
      const ctaType =
        event === "whatsapp_click"
          ? ("whatsapp" as const)
          : resolveCtaType(asOptionalString(body.ctaType));
      if (!ctaType) {
        return Response.json({ ok: true });
      }

      const sourceLabel =
        String(body.source || "").trim() ||
        (ctaType === "whatsapp"
          ? "WhatsApp"
          : ctaType === "header_call"
            ? "Header · Call"
            : "Floating · Call");

      await insertCtaClick({
        sessionKey,
        ctaType,
        sourceLabel,
        ipAddress: requestIp(request),
        userAgent: request.headers.get("user-agent") || "",
        request,
        client: clientRaw
          ? {
              browser: asOptionalString(clientRaw.browser)?.slice(0, 64),
              os: asOptionalString(clientRaw.os)?.slice(0, 64),
              deviceType: asOptionalString(clientRaw.deviceType)?.slice(0, 16),
            }
          : undefined,
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Analytics event failed", error);
    return Response.json({ ok: true });
  }
}
