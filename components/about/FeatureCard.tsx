"use client";

import { ArrowRight } from "lucide-react";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { resolveCtaHref } from "@/lib/cta";
import { aboutFeatureClickSource } from "@/lib/lead-form-buttons";
import { leadClickHandler } from "@/lib/lead-click-source";
import { leadCtaGtmDomAttrs } from "@/lib/lead-form-gtm";
import { hasCustomButtonBackground, resolveButtonBackgroundStyle } from "@/lib/button-background";
import { Icon } from "@/components/ui/Icon";
import type { Feature } from "@/types/site";
import { textStyle } from "@/lib/typography";

export function FeatureCard({ feature, featureIndex }: { feature: Feature; featureIndex: number }) {
  const siteData = useSiteData();
  const href = resolveCtaHref(feature.cta, siteData.site);
  const clickSource = aboutFeatureClickSource(featureIndex, feature.title);
  return (
    <article className="grid grid-cols-[52px_minmax(0,1fr)] items-start gap-4 rounded-xl border border-[#eee9e1] bg-[#fbfaf8] px-4 py-5 text-left sm:min-h-[190px] sm:grid-cols-[60px_minmax(0,1fr)] sm:gap-5 sm:px-6 sm:py-6">
      <div className="flex size-12 items-center justify-center rounded-full bg-white text-[var(--color-secondary)] shadow-[0_8px_20px_rgba(11,31,53,0.06)] sm:size-14" style={feature.iconColor ? { color: feature.iconColor } : undefined}>
        <Icon name={feature.icon} className="size-6 sm:size-7" />
      </div>
      <div className="min-w-0">
      <h3
        className="font-sans text-[17px] font-bold leading-snug text-[var(--color-primary)]"
        style={{
          ...textStyle(feature, "title"),
          ...(feature.titleColor || feature.textColor ? { color: feature.titleColor || feature.textColor } : {}),
        }}
      >
        {feature.title}
      </h3>
      <p
        className="mt-2 text-[14px] leading-6 text-[var(--color-muted)]"
        style={{
          ...textStyle(feature, "description"),
          ...(feature.descriptionColor || feature.textColor ? { color: feature.descriptionColor || feature.textColor } : {}),
        }}
      >
        {feature.description}
      </p>
      <a
        href={href}
        onClick={leadClickHandler(href, clickSource)}
        className="mt-4 inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-[13px] font-semibold text-[var(--color-primary)] transition-colors hover:[background:var(--fill-primary)] hover:text-white"
        style={{
          ...(hasCustomButtonBackground(feature.cta, siteData.customButtonGradients)
            ? resolveButtonBackgroundStyle(feature.cta, siteData.customButtonGradients)
            : {}),
          ...(feature.cta.textColor ? { color: feature.cta.textColor } : {}),
        }}
        {...leadCtaGtmDomAttrs(clickSource)}
      >
        {feature.cta.label}
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </a>
      </div>
    </article>
  );
}
