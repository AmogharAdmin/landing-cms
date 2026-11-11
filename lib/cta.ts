import type { Cta, SiteInfo } from "@/types/site";
import { enquireHash } from "@/lib/enquiry";

export const DEFAULT_WHATSAPP_MESSAGE = "Hey, I want to know about the property";
export const DEFAULT_CALL_BUTTON_COLOR = "#0B1F35";
export const DEFAULT_WHATSAPP_BUTTON_COLOR = "#25D366";

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function resolveWhatsappMessage(site: Pick<SiteInfo, "whatsappMessage" | "name">): string {
  const custom = (site.whatsappMessage || "").trim();
  if (custom) return custom;
  return DEFAULT_WHATSAPP_MESSAGE;
}

export function whatsappUrl(whatsapp: string, message?: string): string {
  const number = digitsOnly(whatsapp);
  const url = new URL(`https://wa.me/${number}`);
  if (message) {
    url.searchParams.set("text", message);
  }
  return url.toString();
}

export function telUrl(phone: string): string {
  return `tel:${digitsOnly(phone)}`;
}

export function resolveCtaHref(cta: Cta, site: SiteInfo): string {
  switch (cta.action) {
    case "brochure":
      return enquireHash(cta.intent || "brochure");
    case "download":
      return enquireHash(cta.intent || "brochure");
    case "scroll":
      return cta.target ?? "#about";
    case "enquire":
      return enquireHash(cta.intent);
    case "whatsapp":
      return whatsappUrl(site.whatsapp, resolveWhatsappMessage(site));
    case "call":
      return telUrl(site.phone);
    case "map":
      return cta.target ?? "#location";
    case "link":
      return cta.href ?? cta.target ?? "#";
    default:
      return cta.target ?? cta.href ?? "#";
  }
}

export function isExternalHref(href: string): boolean {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("tel:") ||
    href.startsWith("mailto:")
  );
}
