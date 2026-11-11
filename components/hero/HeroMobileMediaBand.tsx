"use client";

import Image from "next/image";
import type { HeroMobileLayoutResolved } from "@/lib/hero-mobile";
import { HeroBackground } from "@/components/hero/HeroBackground";
import { HeroOverlay } from "@/components/hero/HeroOverlay";
import { hasCustomHeroOverlay } from "@/lib/hero-overlay";

function isSvgSrc(src: string) {
  return src.toLowerCase().split("?")[0]?.endsWith(".svg") ?? false;
}

/** Landscape media band (image, video, or carousel) shown only on mobile above the offer card. */
export function HeroMobileMediaBand({ layout }: { layout: HeroMobileLayoutResolved }) {
  if (!layout.imageFirstEnabled) return null;

  const showImageLayer = layout.backgroundMode === "image" && layout.image;
  const showRichMedia =
    layout.backgroundMode === "video" || layout.backgroundMode === "carousel" || !layout.image;

  if (!showImageLayer && !showRichMedia) return null;

  return (
    <div
      className="relative w-full overflow-hidden sm:hidden"
      style={{ height: layout.imageHeight }}
      aria-hidden={!layout.imageAlt}
    >
      {layout.backgroundMode === "image" && layout.image ? (
        <Image
          src={layout.image}
          alt={layout.imageAlt}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={72}
          unoptimized={isSvgSrc(layout.image)}
          className="object-cover"
          style={{ objectPosition: layout.imageObjectPosition }}
        />
      ) : (
        <div className="absolute inset-0">
          <HeroBackground hero={layout.mediaHero} />
        </div>
      )}
      {hasCustomHeroOverlay(layout.mediaHero) ? (
        <div className="absolute inset-0 z-[2]">
          <HeroOverlay hero={layout.mediaHero} />
        </div>
      ) : layout.overlayOpacity > 0 ? (
        <div className="absolute inset-0 z-[2] bg-black" style={{ opacity: layout.overlayOpacity }} aria-hidden="true" />
      ) : null}
    </div>
  );
}
