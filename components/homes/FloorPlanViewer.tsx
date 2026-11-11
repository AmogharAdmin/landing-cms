"use client";

import { LockKeyhole } from "lucide-react";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { resolveCtaHref } from "@/lib/cta";
import { leadClickSourceById } from "@/lib/lead-form-buttons";
import { Button } from "@/components/ui/Button";
import { textStyle } from "@/lib/typography";
import type { FloorPlan } from "@/types/site";

type FloorPlanImageSize = "compact" | "standard" | "large";

type FloorPlanViewerProps = {
  plan: FloorPlan;
  imageSize?: FloorPlanImageSize;
  centered?: boolean;
};

const imageSizeClass: Record<FloorPlanImageSize, string> = {
  compact: "aspect-[4/3] max-h-[280px] sm:max-h-[320px]",
  standard: "aspect-[4/3] max-h-[320px] sm:aspect-[16/10] sm:max-h-[360px]",
  large: "aspect-[16/10] max-h-[420px]",
};

export function FloorPlanViewer({ plan, imageSize = "standard", centered = false }: FloorPlanViewerProps) {
  const siteData = useSiteData();
  const { homes, site } = siteData;
  const isLocked = homes.floorPlanLocked !== false;
  const blurAmount = Math.min(20, Math.max(0, homes.floorPlanBlur ?? 3));

  return (
    <div
      id="floor-plans"
      className="flex flex-col rounded-lg border border-[var(--color-primary)]/8 bg-white p-4 sm:p-6"
    >
      <div className={centered ? "text-center" : undefined}>
        <h3 className="font-sans text-[14px] font-bold text-[var(--color-primary)]" style={textStyle(plan, "label")}>
          {plan.label}
        </h3>
        <p className="mt-1 text-[13px] text-[var(--color-muted)]" style={textStyle(plan, "area")}>{plan.area}</p>
      </div>

      <div className="relative mt-3 overflow-hidden bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={plan.image}
          alt={plan.alt}
          className={`mx-auto w-full object-contain object-center p-2 sm:p-3 ${imageSizeClass[imageSize]}`}
          loading="lazy"
          style={isLocked && blurAmount > 0 ? { filter: `blur(${blurAmount}px)`, WebkitFilter: `blur(${blurAmount}px)` } : undefined}
        />
        {isLocked ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/12" aria-label="Floor plan preview locked">
            <span className="flex size-14 items-center justify-center rounded-full border border-white/80 bg-[var(--color-primary)]/88 text-white shadow-xl">
              <LockKeyhole className="size-6" aria-hidden="true" />
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col justify-center gap-3 pb-1 sm:flex-row sm:items-center">
        <Button
          href={resolveCtaHref(homes.downloadCta, site)}
          leadClickSource={leadClickSourceById.homesDownload}
          variant="outline"
          backgroundType={homes.downloadCta.backgroundType}
          backgroundColor={homes.downloadCta.backgroundColor}
          backgroundGradient={homes.downloadCta.backgroundGradient}
          textColor={homes.downloadCta.textColor}
          className="w-full sm:w-auto"
        >
          {homes.downloadCta.label}
        </Button>
        <Button
          href={resolveCtaHref(homes.visitCta, site)}
          leadClickSource={leadClickSourceById.homesVisit}
          variant="primary"
          backgroundType={homes.visitCta.backgroundType}
          backgroundColor={homes.visitCta.backgroundColor}
          backgroundGradient={homes.visitCta.backgroundGradient}
          textColor={homes.visitCta.textColor}
          className="w-full sm:w-auto"
        >
          {homes.visitCta.label}
        </Button>
      </div>
    </div>
  );
}
