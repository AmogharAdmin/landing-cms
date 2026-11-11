"use client";

import type { CSSProperties } from "react";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { resolveHeroFactsMobileStyle } from "@/lib/hero-mobile";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { Container } from "@/components/ui/Container";

export function HeroFacts() {
  const siteData = useSiteData();
  if (siteData.hero.factsEnabled === false || siteData.heroFacts.length === 0) return null;
  const count = siteData.heroFacts.length;
  const mobileFactsStyle = resolveHeroFactsMobileStyle(siteData.hero);

  const containerStyle =
    mobileFactsStyle.marginTop != null
      ? ({ ["--hero-facts-mt-mobile" as string]: `${mobileFactsStyle.marginTop}px` } as CSSProperties)
      : undefined;

  const sectionStyle = {
    ...(mobileFactsStyle.sectionBackgroundColor
      ? ({ ["--hero-facts-section-bg-mobile" as string]: mobileFactsStyle.sectionBackgroundColor } as CSSProperties)
      : {}),
    ...containerStyle,
  } as CSSProperties | undefined;

  const gridStyle = {
    ...(mobileFactsStyle.backgroundColor
      ? ({ ["--hero-facts-bg-mobile" as string]: mobileFactsStyle.backgroundColor } as CSSProperties)
      : {}),
    ["--hero-facts-border-w" as string]: `${mobileFactsStyle.chrome.borderWidth}px`,
    ["--hero-facts-border-c" as string]: mobileFactsStyle.chrome.borderColor,
    ["--hero-facts-mx" as string]: `${mobileFactsStyle.chrome.marginX}px`,
  } as CSSProperties;

  return (
    <div
      className={cn(
        "relative z-20 w-full sm:-mt-16 lg:-mt-20",
        mobileFactsStyle.marginTop != null
          ? "mt-[var(--hero-facts-mt-mobile)] max-sm:mt-[var(--hero-facts-mt-mobile)]"
          : "mt-6",
        mobileFactsStyle.sectionBackgroundColor && "max-sm:bg-[var(--hero-facts-section-bg-mobile)]",
      )}
      style={sectionStyle}
      data-managed-section="hero-facts"
    >
      <Container className="max-sm:px-0">
        <div
          className={cn(
            "grid overflow-hidden bg-white shadow-[0_18px_50px_rgba(11,31,53,0.15)]",
            "rounded-none sm:rounded-2xl",
            "max-sm:mx-[var(--hero-facts-mx)] max-sm:w-[calc(100%-2*var(--hero-facts-mx))] max-sm:border-solid max-sm:[border-width:var(--hero-facts-border-w)] max-sm:[border-color:var(--hero-facts-border-c)] max-sm:shadow-none",
            mobileFactsStyle.backgroundColor && "max-sm:!bg-[var(--hero-facts-bg-mobile)]",
            count === 1 && "grid-cols-1",
            count === 2 && "grid-cols-2",
            count === 3 && "grid-cols-1 sm:grid-cols-3",
            count >= 4 && "grid-cols-2 sm:grid-cols-4",
          )}
          style={gridStyle}
        >
          {siteData.heroFacts.map((fact, index) => (
            <div
              key={`${fact.label}-${index}`}
              className={cn(
                "flex flex-col items-center gap-2 px-3 py-5 text-center sm:flex-row sm:gap-4 sm:px-6 sm:py-7 sm:text-left lg:px-8",
                index % 2 === 1 && "border-l border-[#EFE8DC]",
                index >= 2 && "border-t border-[#EFE8DC] sm:border-t-0",
                index > 0 && "sm:border-l sm:border-[#EFE8DC]",
              )}
            >
              <div
                className="flex size-10 shrink-0 items-center justify-center text-[var(--color-secondary)] sm:size-12"
                style={fact.iconColor ? { color: fact.iconColor } : undefined}
              >
                <Icon name={fact.icon} className="size-7 sm:size-8" />
              </div>
              <div>
                <p
                  className="text-[14px] font-bold leading-tight text-[var(--color-primary)] sm:text-[15px]"
                  style={
                    fact.valueColor || fact.textColor
                      ? { color: fact.valueColor || fact.textColor }
                      : undefined
                  }
                >
                  {fact.value}
                </p>
                <p
                  className="mt-2 text-[12px] leading-snug text-[var(--color-muted)]"
                  style={
                    fact.labelColor || fact.textColor
                      ? { color: fact.labelColor || fact.textColor }
                      : undefined
                  }
                >
                  {fact.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
