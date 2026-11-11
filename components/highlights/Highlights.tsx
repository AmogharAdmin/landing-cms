"use client";

import { ArrowRight } from "lucide-react";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { resolveCtaHref } from "@/lib/cta";
import { leadClickSourceById } from "@/lib/lead-form-buttons";
import { leadClickHandler } from "@/lib/lead-click-source";
import { leadCtaGtmDomAttrs } from "@/lib/lead-form-gtm";
import { resolveButtonBackgroundStyle } from "@/lib/button-background";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";

export function Highlights() {
  const siteData = useSiteData();
  const { highlights } = siteData;

  return (
    <section
      className="bg-white pb-8 text-white sm:pb-10"
      aria-label="Project highlights"
    >
      <Container>
        <div className="flex flex-col gap-7 rounded-xl [background:var(--fill-dark)] px-4 py-6 sm:gap-8 sm:px-6 sm:py-7 lg:flex-row lg:items-center lg:gap-6 lg:px-9">
          <div className="hide-scrollbar grid flex-1 grid-cols-2 gap-y-7 sm:grid-cols-3 lg:grid-cols-[repeat(var(--highlight-cols),minmax(0,1fr))] lg:gap-y-0" style={{ "--highlight-cols": Math.max(highlights.items.length, 1) } as React.CSSProperties}>
            {highlights.items.map((item, index) => (
              <div key={`${item.value}-${item.label}-${index}`} className="min-w-0 border-white/15 px-2 text-center last:col-span-2 sm:px-4 sm:first:pl-0 sm:last:col-span-1 lg:border-r lg:last:border-r-0 lg:last:col-span-1">
                <Icon name={item.icon} className="mx-auto mb-2 size-8 text-[var(--color-accent)]" style={item.iconColor ? { color: item.iconColor } : undefined} />
                <p
                  className="text-[19px] font-semibold leading-tight text-[var(--color-accent)] sm:text-[20px]"
                  style={item.valueColor || item.textColor ? { color: item.valueColor || item.textColor } : undefined}
                >
                  {item.value}
                </p>
                <p
                  className="mt-2 text-[12px] leading-5 text-white/78"
                  style={item.labelColor || item.textColor ? { color: item.labelColor || item.textColor } : undefined}
                >
                  {item.label}
                </p>
              </div>
            ))}
          </div>
          <a
            href={resolveCtaHref(highlights.cta, siteData.site)}
            onClick={leadClickHandler(resolveCtaHref(highlights.cta, siteData.site), leadClickSourceById.highlights)}
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-md [background:var(--fill-secondary)] px-5 py-3 text-[12px] font-semibold text-white transition-colors hover:[background:var(--fill-accent)] sm:w-auto sm:self-start lg:self-center"
            style={{
              ...resolveButtonBackgroundStyle(highlights.cta, siteData.customButtonGradients),
              color: highlights.cta.textColor,
            }}
            {...leadCtaGtmDomAttrs(leadClickSourceById.highlights)}
          >
            {highlights.cta.label}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      </Container>
    </section>
  );
}
