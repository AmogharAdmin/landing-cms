import { resolveHeroOverlay } from "@/lib/hero-overlay";
import type { SiteData } from "@/types/site";

export function HeroOverlay({ hero }: { hero: Pick<SiteData["hero"], "overlayEnabled" | "overlayStyle" | "overlayColor" | "overlayOpacity"> }) {
  const overlay = resolveHeroOverlay(hero);
  if (!overlay.enabled || overlay.layers.length === 0) return null;
  return (
    <>
      {overlay.layers.map((style, index) => (
        <div key={index} className="pointer-events-none absolute inset-0" style={style} aria-hidden="true" />
      ))}
    </>
  );
}
