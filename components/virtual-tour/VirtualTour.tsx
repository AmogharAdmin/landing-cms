"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import type { CSSProperties } from "react";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { enquireHash } from "@/lib/enquiry";
import { leadClickSourceById } from "@/lib/lead-form-buttons";
import { leadClickHandler } from "@/lib/lead-click-source";
import { leadCtaGtmDomAttrs } from "@/lib/lead-form-gtm";
import { isHexColor, textStyle } from "@/lib/typography";

/** Prefer a static YouTube thumbnail over an autoplaying iframe (huge mobile PSI win). */
function youtubeThumbnailUrl(value: string): string | null {
  try {
    const url = new URL(value);
    let videoId = "";

    if (url.hostname.includes("youtu.be")) videoId = url.pathname.slice(1).split("/")[0] || "";
    if (url.hostname.includes("youtube.com")) {
      videoId = url.pathname.startsWith("/embed/")
        ? url.pathname.split("/embed/")[1]?.split(/[/?&]/)[0] || ""
        : url.searchParams.get("v") || "";
    }

    if (!videoId) return null;
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  } catch {
    return null;
  }
}

export function VirtualTour() {
  const { virtualTourSection } = useSiteData();

  if (!virtualTourSection?.enabled) return null;

  const configuredHeight = virtualTourSection.sectionHeight ?? virtualTourSection.minHeight ?? 420;
  const sectionHeight = Math.min(520, Math.max(300, configuredHeight));
  const showPlayIcon = virtualTourSection.playIconEnabled ?? virtualTourSection.playButtonEnabled ?? true;
  const containerWidth = Math.min(100, Math.max(40, virtualTourSection.containerWidth ?? 70));
  const widthStyle = { "--tour-width": `${containerWidth}%` } as CSSProperties;
  const hex = (value?: string) => (isHexColor(value) ? value.trim() : undefined);
  const playIconColor = hex(virtualTourSection.playIconColor);
  const playButtonColor = hex(virtualTourSection.playButtonColor);
  const playButtonBorderColor = hex(virtualTourSection.playButtonBorderColor);
  const thumbUrl = virtualTourSection.videoUrl
    ? youtubeThumbnailUrl(virtualTourSection.videoUrl)
    : null;

  return (
    <section className="scroll-mt-28 bg-white py-16 sm:py-20" aria-labelledby="virtual-tour-heading">
      <Container>
        <div className="mb-5 sm:mb-7">
          <SectionLabel style={textStyle(virtualTourSection, "label")}>{virtualTourSection.label || "VIRTUAL TOUR"}</SectionLabel>
        </div>
        <div
          className="relative isolate mx-auto flex w-full items-center justify-center overflow-hidden rounded-2xl sm:w-[var(--tour-width)] sm:rounded-[28px]"
          style={{ ...widthStyle, minHeight: sectionHeight, color: virtualTourSection.textColor }}
        >
          {thumbUrl ? (
            <Image
              src={thumbUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 70vw"
              quality={60}
              className="pointer-events-none absolute inset-0 -z-20 object-cover"
              style={{
                filter: `blur(${virtualTourSection.blurAmount}px)`,
                transform: "scale(1.08)",
              }}
              aria-hidden="true"
            />
          ) : null}
          <div className="absolute inset-0 -z-10" style={{ backgroundColor: virtualTourSection.overlayColor, opacity: virtualTourSection.overlayOpacity }} />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.28)_100%)]" />

          <div className="max-w-3xl px-5 text-center">
          {showPlayIcon ? (
            <a
              href={enquireHash(virtualTourSection.enquireIntent)}
              onClick={leadClickHandler(enquireHash(virtualTourSection.enquireIntent), leadClickSourceById.virtualTour)}
              aria-label="Open the enquiry form for the virtual tour"
              className={`mx-auto flex size-20 items-center justify-center rounded-full border shadow-[0_15px_45px_rgba(0,0,0,0.3)] backdrop-blur-md transition-[background-color,opacity] sm:size-24 ${playButtonColor ? "hover:opacity-90" : "bg-white/15 hover:bg-white/25"} ${playButtonBorderColor ? "" : "border-white/45"}`}
              style={{
                backgroundColor: playButtonColor,
                borderColor: playButtonBorderColor,
                color: playIconColor,
              }}
              {...leadCtaGtmDomAttrs(leadClickSourceById.virtualTour)}
            >
              <Play className="ml-1 size-8 fill-current sm:size-9" aria-hidden="true" />
            </a>
          ) : null}

          <h2
            id="virtual-tour-heading"
            className={`${showPlayIcon ? "mt-5" : ""} font-serif text-[34px] font-medium leading-[1.1] tracking-[-0.025em] sm:text-[44px] lg:text-[48px]`}
            style={textStyle(virtualTourSection, "heading")}
          >
            {virtualTourSection.heading}
          </h2>
          </div>
        </div>
      </Container>
    </section>
  );
}
