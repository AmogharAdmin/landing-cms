import type { CSSProperties } from "react";
import type { SiteData } from "@/types/site";

export type HeroOverlayStyle = "solid" | "left" | "vertical" | "both";

export type HeroOverlayResolved = {
  enabled: boolean;
  style: HeroOverlayStyle;
  color: string;
  /** 0–1 multiplier on the overlay strength. */
  strength: number;
  layers: CSSProperties[];
};

const DEFAULT_COLOR = "#05111F";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function withAlpha(hex: string, alpha: number) {
  const normalized = /^#[0-9a-f]{6}$/i.test(hex) ? hex : DEFAULT_COLOR;
  const value = Number.parseInt(normalized.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  const opacity = clamp(alpha, 0, 1);
  return `rgba(${red}, ${green}, ${blue}, ${Number(opacity.toFixed(3))})`;
}

export function hasCustomHeroOverlay(hero: Pick<SiteData["hero"], "overlayEnabled" | "overlayStyle" | "overlayColor" | "overlayOpacity">) {
  return (
    hero.overlayEnabled !== undefined ||
    Boolean(hero.overlayStyle) ||
    Boolean((hero.overlayColor || "").trim()) ||
    typeof hero.overlayOpacity === "number"
  );
}

export function resolveHeroOverlay(
  hero: Pick<SiteData["hero"], "overlayEnabled" | "overlayStyle" | "overlayColor" | "overlayOpacity">,
): HeroOverlayResolved {
  const style: HeroOverlayStyle =
    hero.overlayStyle === "solid" || hero.overlayStyle === "left" || hero.overlayStyle === "vertical" || hero.overlayStyle === "both"
      ? hero.overlayStyle
      : "both";
  const color = /^#[0-9a-f]{6}$/i.test(hero.overlayColor || "") ? (hero.overlayColor as string) : DEFAULT_COLOR;
  const strength =
    typeof hero.overlayOpacity === "number" && Number.isFinite(hero.overlayOpacity)
      ? clamp(hero.overlayOpacity, 0, 1)
      : 1;
  const enabled = hero.overlayEnabled !== false && strength > 0;

  const layers: CSSProperties[] = [];
  if (enabled && (style === "left" || style === "both")) {
    layers.push({
      backgroundImage: `linear-gradient(90deg, ${withAlpha(color, 0.88 * strength)} 0%, ${withAlpha(color, 0.55 * strength)} 42%, ${withAlpha(color, 0.12 * strength)} 78%, transparent 100%)`,
    });
  }
  if (enabled && (style === "vertical" || style === "both")) {
    layers.push({
      backgroundImage: `linear-gradient(180deg, ${withAlpha(color, 0.28 * strength)} 0%, transparent 28%, ${withAlpha(color, 0.35 * strength)} 100%)`,
    });
  }
  if (enabled && style === "solid") {
    layers.push({ backgroundColor: withAlpha(color, 0.45 * strength) });
  }

  return { enabled, style, color, strength, layers };
}
