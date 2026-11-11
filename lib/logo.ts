import type { SiteInfo } from "@/types/site";

export const DEFAULT_LOGO_HEIGHT_MOBILE = 40;
export const DEFAULT_LOGO_HEIGHT = 48;

export type LogoAppearance = {
  height?: number;
  heightMobile?: number;
  width?: number;
  widthMobile?: number;
  backgroundColor?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Resolved logo heights (px) with safe defaults. */
export function resolveLogoHeights(appearance: LogoAppearance) {
  const hasDesktop = typeof appearance.height === "number" && !Number.isNaN(appearance.height);
  const hasMobile =
    typeof appearance.heightMobile === "number" && !Number.isNaN(appearance.heightMobile);

  let desktop = hasDesktop ? appearance.height! : DEFAULT_LOGO_HEIGHT;
  let mobile = hasMobile ? appearance.heightMobile! : DEFAULT_LOGO_HEIGHT_MOBILE;

  if (hasDesktop && !hasMobile) {
    mobile = Math.round(desktop * (DEFAULT_LOGO_HEIGHT_MOBILE / DEFAULT_LOGO_HEIGHT));
  } else if (hasMobile && !hasDesktop) {
    desktop = Math.round(mobile * (DEFAULT_LOGO_HEIGHT / DEFAULT_LOGO_HEIGHT_MOBILE));
  }

  return {
    mobile: clamp(mobile, 20, 120),
    desktop: clamp(desktop, 20, 160),
  };
}

function optionalSize(value: number | undefined, min: number, max: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  return clamp(value, min, max);
}

/** Explicit logo widths (px). Unset means the image keeps its natural width. */
export function resolveLogoWidths(appearance: LogoAppearance) {
  return {
    mobile: optionalSize(appearance.widthMobile, 20, 360),
    desktop: optionalSize(appearance.width, 20, 480),
  };
}

export function resolveLogoBackgroundColor(backgroundColor?: string) {
  const color = (backgroundColor || "").trim();
  return color || undefined;
}

export function primaryLogoAppearance(site: SiteInfo): LogoAppearance {
  return {
    height: site.logoHeight,
    heightMobile: site.logoHeightMobile,
    width: site.logoWidth,
    widthMobile: site.logoWidthMobile,
    backgroundColor: site.logoBackgroundColor,
  };
}

export function secondaryLogoAppearance(site: SiteInfo): LogoAppearance {
  return {
    height: site.secondaryLogoHeight,
    heightMobile: site.secondaryLogoHeightMobile,
    width: site.secondaryLogoWidth,
    widthMobile: site.secondaryLogoWidthMobile,
    backgroundColor: site.secondaryLogoBackgroundColor,
  };
}

export function hasSecondaryHeaderLogo(site: Pick<SiteInfo, "secondaryLogo">) {
  return Boolean((site.secondaryLogo || "").trim());
}
