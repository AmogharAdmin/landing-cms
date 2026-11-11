import { phoneValidationError } from "@/lib/phone";
import { defaultEnquiryFields, type ResolvedEnquiryField } from "@/lib/enquiry";
import type { HeroBackgroundMode } from "@/lib/hero-background";
import { resolveHeroBackgroundMode, resolveHeroVideoSource } from "@/lib/hero-background";
import type { EnquiryFormField, SiteData } from "@/types/site";
import type { CSSProperties } from "react";

export const HERO_MOBILE_LEAD_FORM_INTENT_ID = "hero-mobile-lead";

export type HeroMobileLayoutResolved = {
  imageFirstEnabled: boolean;
  backgroundMode: HeroBackgroundMode;
  image: string;
  imageAlt: string;
  imageHeight: number;
  headerGap: number;
  cardOffset: number;
  formGap: number;
  imageObjectPosition: string;
  overlayOpacity: number;
  contentBackgroundColor: string;
  mediaHero: SiteData["hero"];
};

export type HeroMobileLeadFields = {
  name: ResolvedEnquiryField;
  phone: ResolvedEnquiryField;
};

export type HeroMobileLeadFormResolved = {
  enabled: boolean;
  gtmId?: string;
  title: string;
  submitLabel: string;
  successMessage: string;
  footerText: string;
  formMinHeight?: number;
  formBackgroundColor: string;
  formTextColor: string;
  fieldLabelColor?: string;
  inputBackgroundColor: string;
  inputBorderColor: string;
  inputTextColor: string;
  buttonBackgroundType: "plain" | "gradient";
  buttonBackgroundColor: string;
  buttonBackgroundGradient?: string;
  buttonTextColor: string;
  chrome: HeroMobileCardChrome;
  fields: HeroMobileLeadFields;
};

const DEFAULT_MOBILE_LAYOUT = {
  imageHeight: 240,
  headerGap: 0,
  cardOffset: 12,
  formGap: 16,
  imageObjectPosition: "center center",
  overlayOpacity: 0.18,
  contentBackgroundColor: "#f7f3ed",
} as const;

export const DEFAULT_HERO_MOBILE_LEAD_FORM: Omit<HeroMobileLeadFormResolved, "fields" | "chrome"> & {
  fields: {
    name: EnquiryFormField;
    phone: EnquiryFormField;
  };
} = {
  enabled: true,
  gtmId: "hero_mobile_lead",
  title: "Get a callback",
  submitLabel: "Submit",
  successMessage: "Thank you. We will call you shortly.",
  footerText: "We respect your privacy.",
  formBackgroundColor: "#ffffff",
  formTextColor: "#0b1f35",
  inputBackgroundColor: "#ffffff",
  inputBorderColor: "#d8dde6",
  inputTextColor: "#0b1f35",
  buttonBackgroundType: "plain",
  buttonBackgroundColor: "#b98945",
  buttonBackgroundGradient: "golden",
  buttonTextColor: "#ffffff",
  fields: {
    name: { enabled: true, required: true, label: "Full Name", placeholder: "Enter your full name" },
    phone: { enabled: true, required: true, label: "Phone Number", placeholder: "Enter your phone number" },
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function mergeField(base: ResolvedEnquiryField, overlay?: Partial<EnquiryFormField>): ResolvedEnquiryField {
  return {
    enabled: overlay?.enabled ?? base.enabled,
    required: overlay?.required ?? base.required,
    label: overlay?.label || base.label,
    placeholder: overlay?.placeholder || base.placeholder,
  };
}

export function resolveHeroMobileLayout(hero: SiteData["hero"]): HeroMobileLayoutResolved {
  const raw = hero.mobileLayout || {};
  const height =
    typeof raw.imageHeight === "number" && Number.isFinite(raw.imageHeight)
      ? clamp(Math.round(raw.imageHeight), 120, 480)
      : DEFAULT_MOBILE_LAYOUT.imageHeight;
  const headerGap =
    typeof raw.headerGap === "number" && Number.isFinite(raw.headerGap)
      ? clamp(Math.round(raw.headerGap), 0, 120)
      : DEFAULT_MOBILE_LAYOUT.headerGap;
  const offset =
    typeof raw.cardOffset === "number" && Number.isFinite(raw.cardOffset)
      ? clamp(Math.round(raw.cardOffset), 0, 160)
      : DEFAULT_MOBILE_LAYOUT.cardOffset;
  const formGap =
    typeof raw.formGap === "number" && Number.isFinite(raw.formGap)
      ? clamp(Math.round(raw.formGap), 0, 80)
      : DEFAULT_MOBILE_LAYOUT.formGap;
  const overlay =
    typeof raw.overlayOpacity === "number" && Number.isFinite(raw.overlayOpacity)
      ? clamp(raw.overlayOpacity, 0, 1)
      : DEFAULT_MOBILE_LAYOUT.overlayOpacity;

  const dedicatedImage = (raw.image || "").trim();
  const fallbackImage = (hero.backgroundImage || "").trim();
  const image = dedicatedImage || fallbackImage;
  const imageAlt = (raw.imageAlt || "").trim() || hero.backgroundAlt || "Project preview";

  const modeRaw = raw.backgroundMode;
  const backgroundMode: HeroBackgroundMode =
    modeRaw === "video" || modeRaw === "carousel" || modeRaw === "image" ? modeRaw : "image";

  const mediaHero: SiteData["hero"] = {
    ...hero,
    backgroundMode,
    backgroundImage: image,
    backgroundAlt: imageAlt,
    backgroundVideoUrl: raw.backgroundVideoUrl ?? hero.backgroundVideoUrl,
    backgroundVideoPoster: raw.backgroundVideoPoster ?? hero.backgroundVideoPoster,
    backgroundVideoAutoplay: raw.backgroundVideoAutoplay ?? hero.backgroundVideoAutoplay,
    backgroundVideoMuted: raw.backgroundVideoMuted ?? hero.backgroundVideoMuted,
    backgroundVideoLoop: raw.backgroundVideoLoop ?? hero.backgroundVideoLoop,
    backgroundVideoOverlayOpacity:
      raw.backgroundVideoOverlayOpacity ?? hero.backgroundVideoOverlayOpacity,
    backgroundCarouselImages:
      raw.backgroundCarouselImages?.length ? raw.backgroundCarouselImages : hero.backgroundCarouselImages,
    backgroundCarouselIntervalMs: raw.backgroundCarouselIntervalMs ?? hero.backgroundCarouselIntervalMs,
    backgroundCarouselTransition: raw.backgroundCarouselTransition ?? hero.backgroundCarouselTransition,
    backgroundCarouselShowDots: raw.backgroundCarouselShowDots ?? hero.backgroundCarouselShowDots,
    backgroundCarouselPauseOnHover: raw.backgroundCarouselPauseOnHover ?? hero.backgroundCarouselPauseOnHover,
  };

  const resolvedMode =
    backgroundMode === "image" ? resolveHeroBackgroundMode(mediaHero) : backgroundMode;

  return {
    imageFirstEnabled: raw.imageFirstEnabled !== false,
    backgroundMode: resolvedMode,
    image,
    imageAlt,
    imageHeight: height,
    headerGap,
    cardOffset: offset,
    formGap,
    imageObjectPosition: (raw.imageObjectPosition || "").trim() || DEFAULT_MOBILE_LAYOUT.imageObjectPosition,
    overlayOpacity: overlay,
    contentBackgroundColor:
      (raw.contentBackgroundColor || "").trim() || DEFAULT_MOBILE_LAYOUT.contentBackgroundColor,
    mediaHero: { ...mediaHero, backgroundMode: resolvedMode },
  };
}

export function heroMobileBandHasMedia(layout: HeroMobileLayoutResolved): boolean {
  if (!layout.imageFirstEnabled) return false;
  if (layout.backgroundMode === "video") {
    return resolveHeroVideoSource(layout.mediaHero).kind !== "none" || Boolean(layout.image);
  }
  if (layout.backgroundMode === "carousel") {
    const slides = layout.mediaHero.backgroundCarouselImages?.length ?? 0;
    return slides > 0 || Boolean(layout.image);
  }
  return Boolean(layout.image);
}

export type HeroMobileCardChrome = {
  borderColor: string;
  borderWidth: number;
  marginX: number;
};

const DEFAULT_MOBILE_CARD_CHROME: HeroMobileCardChrome = {
  borderColor: "#E5E7EB",
  borderWidth: 1,
  marginX: 0,
};

export function resolveMobileCardChrome(input?: {
  borderColor?: string;
  borderWidth?: number;
  marginX?: number;
}): HeroMobileCardChrome {
  const borderWidth =
    typeof input?.borderWidth === "number" && Number.isFinite(input.borderWidth)
      ? clamp(Math.round(input.borderWidth), 0, 8)
      : DEFAULT_MOBILE_CARD_CHROME.borderWidth;
  const marginX =
    typeof input?.marginX === "number" && Number.isFinite(input.marginX)
      ? clamp(Math.round(input.marginX), 0, 48)
      : DEFAULT_MOBILE_CARD_CHROME.marginX;
  const borderColor = (input?.borderColor || "").trim() || DEFAULT_MOBILE_CARD_CHROME.borderColor;
  return { borderColor, borderWidth, marginX };
}

/** Inline styles for mobile-only card chrome (no shadow; border + horizontal margin). */
export function mobileCardChromeStyle(chrome: HeroMobileCardChrome): CSSProperties {
  const style: CSSProperties = {
    boxShadow: "none",
  };
  if (chrome.borderWidth > 0) {
    style.borderWidth = chrome.borderWidth;
    style.borderStyle = "solid";
    style.borderColor = chrome.borderColor;
  } else {
    style.borderWidth = 0;
    style.borderStyle = "none";
  }
  if (chrome.marginX > 0) {
    style.marginLeft = chrome.marginX;
    style.marginRight = chrome.marginX;
    style.width = `calc(100% - ${chrome.marginX * 2}px)`;
  }
  return style;
}

export function resolveHeroFactsMobileStyle(hero: SiteData["hero"]) {
  const marginTop =
    typeof hero.factsMarginTopMobile === "number" && Number.isFinite(hero.factsMarginTopMobile)
      ? clamp(Math.round(hero.factsMarginTopMobile), 0, 120)
      : undefined;
  const backgroundColor = (hero.factsBackgroundColorMobile || "").trim() || undefined;
  const sectionBackgroundColor = (hero.factsSectionBackgroundColorMobile || "").trim() || undefined;
  const chrome = resolveMobileCardChrome({
    borderColor: hero.factsBorderColorMobile,
    borderWidth: hero.factsBorderWidthMobile,
    marginX: hero.factsMarginXMobile,
  });
  return { marginTop, backgroundColor, sectionBackgroundColor, chrome };
}

export function resolveHeroMobileLeadForm(
  hero: SiteData["hero"],
  enquiry: SiteData["enquiry"],
): HeroMobileLeadFormResolved {
  const raw = hero.mobileLeadForm || {};
  const enquiryDefaults = defaultEnquiryFields(enquiry);
  const nameDefaults = mergeField(
    {
      enabled: true,
      required: true,
      label: DEFAULT_HERO_MOBILE_LEAD_FORM.fields.name.label,
      placeholder: DEFAULT_HERO_MOBILE_LEAD_FORM.fields.name.placeholder,
    },
    enquiryDefaults.name,
  );
  const phoneDefaults = mergeField(
    {
      enabled: true,
      required: true,
      label: DEFAULT_HERO_MOBILE_LEAD_FORM.fields.phone.label,
      placeholder: DEFAULT_HERO_MOBILE_LEAD_FORM.fields.phone.placeholder,
    },
    enquiryDefaults.phone,
  );

  const minHeight =
    typeof raw.formMinHeight === "number" && Number.isFinite(raw.formMinHeight) && raw.formMinHeight > 0
      ? clamp(Math.round(raw.formMinHeight), 0, 2000)
      : undefined;

  return {
    enabled: raw.enabled !== false,
    gtmId: (raw.gtmId || "").trim() || DEFAULT_HERO_MOBILE_LEAD_FORM.gtmId,
    title: (raw.title || "").trim() || DEFAULT_HERO_MOBILE_LEAD_FORM.title,
    submitLabel: (raw.submitLabel || "").trim() || DEFAULT_HERO_MOBILE_LEAD_FORM.submitLabel,
    successMessage: (raw.successMessage || "").trim() || DEFAULT_HERO_MOBILE_LEAD_FORM.successMessage,
    footerText: (raw.footerText || "").trim() || DEFAULT_HERO_MOBILE_LEAD_FORM.footerText,
    formMinHeight: minHeight,
    formBackgroundColor: (raw.formBackgroundColor || "").trim() || DEFAULT_HERO_MOBILE_LEAD_FORM.formBackgroundColor,
    formTextColor: (raw.formTextColor || "").trim() || DEFAULT_HERO_MOBILE_LEAD_FORM.formTextColor,
    fieldLabelColor: (raw.fieldLabelColor || "").trim() || undefined,
    inputBackgroundColor: (raw.inputBackgroundColor || "").trim() || DEFAULT_HERO_MOBILE_LEAD_FORM.inputBackgroundColor,
    inputBorderColor: (raw.inputBorderColor || "").trim() || DEFAULT_HERO_MOBILE_LEAD_FORM.inputBorderColor,
    inputTextColor: (raw.inputTextColor || "").trim() || DEFAULT_HERO_MOBILE_LEAD_FORM.inputTextColor,
    buttonBackgroundType: raw.buttonBackgroundType === "gradient" ? "gradient" : "plain",
    buttonBackgroundColor:
      (raw.buttonBackgroundColor || "").trim() || DEFAULT_HERO_MOBILE_LEAD_FORM.buttonBackgroundColor,
    buttonBackgroundGradient: raw.buttonBackgroundGradient || DEFAULT_HERO_MOBILE_LEAD_FORM.buttonBackgroundGradient,
    buttonTextColor: (raw.buttonTextColor || "").trim() || DEFAULT_HERO_MOBILE_LEAD_FORM.buttonTextColor,
    chrome: resolveMobileCardChrome({
      borderColor: raw.borderColor,
      borderWidth: raw.borderWidth,
      marginX: raw.marginX,
    }),
    fields: {
      name: mergeField(nameDefaults, raw.fields?.name),
      phone: mergeField(phoneDefaults, raw.fields?.phone),
    },
  };
}

export function resolveHeroMobileFieldLabelColor(
  fieldLabelColor: string | undefined,
  formTextColor: string | undefined,
): string {
  const formText = (formTextColor || "").trim() || "#0b1f35";
  const label = (fieldLabelColor || "").trim();
  return label || formText;
}

export function validateHeroMobileLeadFields(
  values: { name: string; phone: string },
  fields: HeroMobileLeadFields,
): string | null {
  const name = values.name.trim();
  const phone = values.phone.trim();

  if (fields.name.enabled && fields.name.required && name.length < 2) {
    return `Please enter a valid ${fields.name.label.toLowerCase()}.`;
  }
  if (fields.phone.enabled && fields.phone.required && !phone) {
    return `Please enter your ${fields.phone.label.toLowerCase()}.`;
  }
  if (fields.phone.enabled && phone) {
    const phoneError = phoneValidationError(phone, fields.phone.label);
    if (phoneError) return phoneError;
  }
  return null;
}
