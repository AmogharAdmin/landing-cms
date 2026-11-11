import type { CSSProperties } from "react";
import type { CustomButtonGradient, SiteData } from "@/types/site";
import {
  resolveButtonBackgroundStyle,
  type ButtonBackgroundSource,
} from "@/lib/button-background";
import { resolveMobileCardChrome } from "@/lib/hero-mobile";

export type BookingSpec = { label: string; value: string };

const LEGACY_SPEC_KEYS = [
  ["landLabel", "landValue"],
  ["floorsLabel", "floorsValue"],
  ["totalUnitsLabel", "totalUnitsValue"],
  ["configurationsLabel", "configurationsValue"],
  ["possessionLabel", "possessionValue"],
] as const;

export const MAX_BOOKING_SPECS = 5;
const DEFAULT_OFFER_TITLE_BG = "#e4bd68";
const DEFAULT_SPECS_BG = "#f7f5f1";

export function resolveBookingSpecs(card: SiteData["bookingCard"], options?: { keepEmpty?: boolean }): BookingSpec[] {
  const fromSpecs = Array.isArray(card.specs)
    ? card.specs.slice(0, MAX_BOOKING_SPECS).map((item) => ({ label: item.label || "", value: item.value || "" }))
    : LEGACY_SPEC_KEYS.map(([labelKey, valueKey]) => ({
        label: String(card[labelKey] || ""),
        value: String(card[valueKey] || ""),
      }));

  return options?.keepEmpty ? fromSpecs : fromSpecs.filter((item) => item.label || item.value);
}

export function withBookingSpecs(card: SiteData["bookingCard"], specs: BookingSpec[]): SiteData["bookingCard"] {
  const next = specs.slice(0, MAX_BOOKING_SPECS);
  const updated: SiteData["bookingCard"] = { ...card, specs: next };
  const record = updated as unknown as Record<string, string>;
  LEGACY_SPEC_KEYS.forEach(([labelKey, valueKey], index) => {
    record[labelKey] = next[index]?.label || "";
    record[valueKey] = next[index]?.value || "";
  });
  return updated;
}

function surfaceSource(
  type: "plain" | "gradient" | undefined,
  color: string | undefined,
  gradient: string | undefined,
  fallbackColor: string,
): ButtonBackgroundSource {
  return {
    backgroundType: type || "plain",
    backgroundColor: color?.trim() || fallbackColor,
    backgroundGradient: gradient,
  };
}

export function resolveOfferTitleBackgroundStyle(
  card: SiteData["bookingCard"],
  customGradients: CustomButtonGradient[] = [],
): CSSProperties {
  return resolveButtonBackgroundStyle(
    surfaceSource(
      card.offerTitleBackgroundType,
      card.offerTitleBackgroundColor,
      card.offerTitleBackgroundGradient,
      DEFAULT_OFFER_TITLE_BG,
    ),
    customGradients,
  );
}

export function resolveBookingHeaderBackgroundStyle(
  card: SiteData["bookingCard"],
  customGradients: CustomButtonGradient[] = [],
): CSSProperties {
  return resolveButtonBackgroundStyle(
    surfaceSource(card.headerBackgroundType, card.headerColor, card.headerBackgroundGradient, card.headerColor || "#0B1F35"),
    customGradients,
  );
}

export function resolveBookingCardBackgroundStyle(
  card: SiteData["bookingCard"],
  customGradients: CustomButtonGradient[] = [],
): CSSProperties {
  return resolveButtonBackgroundStyle(
    surfaceSource(card.backgroundType, card.backgroundColor, card.backgroundGradient, card.backgroundColor || "#FFFFFF"),
    customGradients,
  );
}

export function resolveBenefitsBackgroundStyle(
  card: SiteData["bookingCard"],
  customGradients: CustomButtonGradient[] = [],
): CSSProperties {
  if (card.benefitsBackgroundType === "gradient" || card.benefitsBackgroundType === "plain") {
    return resolveButtonBackgroundStyle(
      surfaceSource(
        card.benefitsBackgroundType,
        card.benefitsBackgroundColor || card.benefitsStartColor,
        card.benefitsBackgroundGradient,
        card.benefitsBackgroundColor || card.benefitsStartColor || "#0B1F35",
      ),
      customGradients,
    );
  }
  return {
    backgroundImage: `linear-gradient(105deg, ${card.benefitsStartColor}, ${card.benefitsEndColor})`,
    backgroundColor: "transparent",
  };
}

export function resolveSpecsBackgroundColor(card: SiteData["bookingCard"]) {
  return card.specsBackgroundColor?.trim() || DEFAULT_SPECS_BG;
}

export function resolveBookingCardMobileChrome(card: SiteData["bookingCard"]) {
  return resolveMobileCardChrome({
    borderColor: card.borderColorMobile,
    borderWidth: card.borderWidthMobile,
    marginX: card.marginXMobile,
  });
}
