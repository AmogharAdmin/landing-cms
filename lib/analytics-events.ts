import { getAnalyticsSessionKey } from "@/lib/analytics-session";

export type CtaClickEventType = "whatsapp" | "header_call" | "floating_call";

type BrowserUserAgentData = {
  brands?: Array<{ brand: string; version: string }>;
  mobile?: boolean;
  platform?: string;
};

const recentCtaKeys = new Map<string, number>();
const CTA_DEDUPE_MS = 1500;

function shouldTrackAnalyticsEvents() {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  if (path.startsWith("/admin") || path.startsWith("/dashboard")) return false;
  // Match AnalyticsTracker: only live production traffic.
  if (process.env.NODE_ENV !== "production") return false;
  return true;
}

function clientContext() {
  const navigatorWithHints = navigator as Navigator & { userAgentData?: BrowserUserAgentData };
  const hints = navigatorWithHints.userAgentData;
  if (!hints) {
    const coarse = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    return { deviceType: coarse ? "mobile" : "desktop" as const };
  }

  const brands = hints.brands?.map((entry) => entry.brand.toLowerCase()) || [];
  let browser: string | undefined;
  if (brands.some((brand) => brand.includes("edge"))) browser = "Edge";
  else if (brands.some((brand) => brand.includes("opera"))) browser = "Opera";
  else if (brands.some((brand) => brand.includes("chrome") || brand.includes("chromium"))) {
    browser = "Chrome";
  }

  const platform = hints.platform?.toLowerCase();
  const os =
    platform === "macos"
      ? "macOS"
      : platform === "windows"
        ? "Windows"
        : platform === "android"
          ? "Android"
          : platform === "ios"
            ? "iOS"
            : platform === "linux"
              ? "Linux"
              : undefined;

  return {
    browser,
    os,
    deviceType: hints.mobile ? ("mobile" as const) : ("desktop" as const),
  };
}

function postAnalyticsEvent(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  // Prefer fetch+keepalive: sendBeacon + application/json can fail CORS/origin checks
  // on some desktop browsers, which silently drops CTA events.
  try {
    void fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "same-origin",
    });
    return;
  } catch {
    // Fall through to beacon.
  }

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/event", new Blob([body], { type: "text/plain" }));
  }
}

/** Fire-and-forget CTA click tracer (WhatsApp, header call, floating call). */
export function trackCtaClick(ctaType: CtaClickEventType, source: string) {
  if (!shouldTrackAnalyticsEvents()) return;
  const sessionKey = getAnalyticsSessionKey();
  if (!sessionKey) return;

  const dedupeKey = `${sessionKey}:${ctaType}:${source}`;
  const now = Date.now();
  const last = recentCtaKeys.get(dedupeKey) || 0;
  if (now - last < CTA_DEDUPE_MS) return;
  recentCtaKeys.set(dedupeKey, now);
  if (recentCtaKeys.size > 200) {
    for (const [key, timestamp] of recentCtaKeys) {
      if (now - timestamp > CTA_DEDUPE_MS) recentCtaKeys.delete(key);
    }
  }

  postAnalyticsEvent({
    sessionKey,
    event: "cta_click",
    ctaType,
    source: source.slice(0, 120),
    client: clientContext(),
  });
}

export function ctaClickHandler(
  ctaType: CtaClickEventType,
  source: string,
  onClick?: () => void,
) {
  return () => {
    trackCtaClick(ctaType, source);
    onClick?.();
  };
}

/** @deprecated Prefer trackCtaClick("whatsapp", source) */
export function trackWhatsappClick(source = "Floating WhatsApp") {
  trackCtaClick("whatsapp", source);
}

/** @deprecated Prefer ctaClickHandler("whatsapp", source) */
export function whatsappClickHandler(source: string, onClick?: () => void) {
  return ctaClickHandler("whatsapp", source, onClick);
}
