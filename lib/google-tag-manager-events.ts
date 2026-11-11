export type GtmEventValue = string | number | boolean | null | undefined;
export type GtmEventParameters = Record<string, GtmEventValue>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    __landingPageGtmEnabled?: boolean;
    __landingPageGtmContext?: Record<string, string>;
  }
}

const MAX_VALUE_LENGTH = 240;

function cleanValue(value: GtmEventValue): string | number | boolean | null | undefined {
  if (typeof value !== "string") return value;
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_VALUE_LENGTH);
}

export function configureGtmEventContext(projectName: string) {
  if (typeof window === "undefined") return;
  window.__landingPageGtmContext = {
    project_name: String(projectName || "Landing page").trim().slice(0, MAX_VALUE_LENGTH),
  };
}

/** Queue a privacy-safe custom event for the enabled GTM container. */
export function pushGtmEvent(event: string, parameters: GtmEventParameters = {}): boolean {
  if (typeof window === "undefined" || window.__landingPageGtmEnabled !== true) return false;
  if (window.location.pathname.startsWith("/admin") || window.location.pathname.startsWith("/dashboard")) {
    return false;
  }

  const cleaned = Object.fromEntries(
    Object.entries(parameters)
      .map(([key, value]) => [key, cleanValue(value)] as const)
      .filter(([, value]) => value !== undefined && value !== ""),
  );

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: event.replace(/[^a-z0-9_]/gi, "_").toLowerCase().slice(0, 80),
    ...(window.__landingPageGtmContext || {}),
    page_path: window.location.pathname,
    ...cleaned,
  });
  return true;
}

export type GtmClickKind =
  | "button_click"
  | "link_click"
  | "form_cta_click"
  | "phone_click"
  | "whatsapp_click"
  | "file_download";

export function classifyGtmClick(href: string, override?: string | null): GtmClickKind {
  const explicit = String(override || "").trim().toLowerCase();
  if (explicit === "file_download") return "file_download";
  if (explicit === "phone_click") return "phone_click";
  if (explicit === "whatsapp_click") return "whatsapp_click";
  if (explicit === "form_cta_click") return "form_cta_click";

  const normalized = String(href || "").trim().toLowerCase();
  if (!normalized) return "button_click";
  if (normalized.startsWith("tel:")) return "phone_click";
  if (normalized.includes("wa.me/") || normalized.includes("whatsapp.com/")) return "whatsapp_click";
  if (normalized.includes("#enquire")) return "form_cta_click";
  if (/\.(pdf|docx?|xlsx?|zip)(?:[?#]|$)/i.test(normalized) || normalized.startsWith("/api/download")) {
    return "file_download";
  }
  return "link_click";
}

/** Keep useful link context without sending phone numbers, query strings, or form values. */
export function safeGtmLinkDestination(href: string): string {
  const normalized = String(href || "").trim();
  if (!normalized || /^(tel:|mailto:)/i.test(normalized)) return "";
  if (/wa\.me\/|whatsapp\.com\//i.test(normalized)) return "whatsapp";
  try {
    const url = new URL(normalized, typeof window === "undefined" ? "https://landing.invalid" : window.location.origin);
    return `${url.hostname === "landing.invalid" ? "" : url.hostname}${url.pathname}${url.hash}`.slice(0, MAX_VALUE_LENGTH);
  } catch {
    return normalized.split("?")[0].slice(0, MAX_VALUE_LENGTH);
  }
}
