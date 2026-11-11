"use client";

import { useState } from "react";
import Image from "next/image";
import { LockKeyhole } from "lucide-react";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { useSiteData } from "@/components/providers/SiteDataProvider";

export function NearbyPlaces() {
  const siteData = useSiteData();
  const [open, setOpen] = useState(false);
  const { location } = siteData;
  const image = { src: location.masterPlanImage, alt: location.masterPlanAlt };
  const isLocked = Boolean(location.masterPlanLocked);
  const blurAmount = Math.min(30, Math.max(0, location.masterPlanBlur ?? 8));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative min-h-[280px] overflow-hidden rounded-lg sm:min-h-[320px] lg:min-h-0"
        aria-label="Open location connectivity map"
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(max-width: 1023px) 100vw, 50vw"
          quality={70}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          style={isLocked ? { filter: `blur(${blurAmount}px)` } : undefined}
        />
        {isLocked ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10" aria-hidden="true">
            <span className="flex size-14 items-center justify-center rounded-full border border-white/80 bg-[#071d31]/85 text-white shadow-xl backdrop-blur-sm">
              <LockKeyhole className="size-6" aria-hidden="true" />
            </span>
          </div>
        ) : null}
      </button>
      <ImageLightbox images={[image]} selectedIndex={open ? 0 : null} onChange={() => undefined} onClose={() => setOpen(false)} />
    </>
  );
}
