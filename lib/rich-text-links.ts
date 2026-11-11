import { telUrl, whatsappUrl } from "@/lib/cta";
import { enquireHash } from "@/lib/enquiry";
import type { IntentOption, SectionOption } from "@/components/admin/editor-ui";

export type RichTextLinkType = "form" | "section" | "url" | "email" | "phone" | "whatsapp";

export type RichTextLinkContext = {
  intents: IntentOption[];
  sections: SectionOption[];
  sitePhone?: string;
  siteWhatsapp?: string;
};

export const RICH_TEXT_LINK_TYPE_LABELS: Record<RichTextLinkType, string> = {
  form: "Form",
  section: "Section on page",
  url: "Website link",
  email: "Email",
  phone: "Phone number",
  whatsapp: "WhatsApp",
};

export function buildRichTextLinkHref(
  type: RichTextLinkType,
  value: string,
  context?: RichTextLinkContext,
): string {
  const trimmed = value.trim();
  switch (type) {
    case "form":
      return enquireHash(trimmed || "default");
    case "section":
      return trimmed.startsWith("#") ? trimmed : `#${trimmed.replace(/^#/, "")}`;
    case "email": {
      const email = trimmed.replace(/^mailto:/i, "");
      return email ? `mailto:${email}` : "";
    }
    case "phone": {
      const number = trimmed.replace(/^tel:/i, "");
      return number ? telUrl(number) : context?.sitePhone ? telUrl(context.sitePhone) : "";
    }
    case "whatsapp": {
      const number = trimmed.replace(/\D/g, "");
      if (number) return whatsappUrl(number);
      return context?.siteWhatsapp ? whatsappUrl(context.siteWhatsapp) : "";
    }
    case "url":
    default:
      if (!trimmed) return "";
      if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed;
      return `https://${trimmed}`;
  }
}

export function isExternalRichTextHref(href: string) {
  return /^https?:\/\//i.test(href);
}

export type ParsedRichTextLink = {
  type: RichTextLinkType;
  formIntent: string;
  sectionHash: string;
  url: string;
  email: string;
  phone: string;
};

export function parseRichTextLinkHref(href: string, context?: RichTextLinkContext): ParsedRichTextLink {
  const trimmed = href.trim();
  const defaults: ParsedRichTextLink = {
    type: "url",
    formIntent: context?.intents[0]?.id || "default",
    sectionHash: context?.sections[0]?.hash || "#about",
    url: "https://",
    email: "",
    phone: context?.sitePhone || "",
  };

  if (!trimmed) return defaults;

  if (trimmed.startsWith("#enquire")) {
    const intent = trimmed.includes("=")
      ? decodeURIComponent(trimmed.split("=").slice(1).join("="))
      : "default";
    return { ...defaults, type: "form", formIntent: intent || "default" };
  }

  if (trimmed.startsWith("#")) {
    return { ...defaults, type: "section", sectionHash: trimmed };
  }

  if (trimmed.toLowerCase().startsWith("mailto:")) {
    return { ...defaults, type: "email", email: trimmed.slice(7) };
  }

  if (trimmed.toLowerCase().startsWith("tel:")) {
    return { ...defaults, type: "phone", phone: trimmed.slice(4) };
  }

  if (/wa\.me/i.test(trimmed)) {
    return { ...defaults, type: "whatsapp", phone: trimmed };
  }

  return { ...defaults, type: "url", url: trimmed };
}
