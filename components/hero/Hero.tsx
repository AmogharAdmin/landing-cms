"use client";

import { useMemo } from "react";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { resolveCtaHref } from "@/lib/cta";
import { leadClickSourceById } from "@/lib/lead-form-buttons";
import { heroMobileBandHasMedia, resolveHeroMobileLayout } from "@/lib/hero-mobile";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { HeroBackground } from "@/components/hero/HeroBackground";
import { HeroFacts } from "@/components/hero/HeroFacts";
import { BookingCard } from "@/components/hero/BookingCard";
import { HeroMobileMediaBand } from "@/components/hero/HeroMobileMediaBand";
import { HeroMobileLeadForm } from "@/components/hero/HeroMobileLeadForm";
import { HeroOverlay } from "@/components/hero/HeroOverlay";
import { hasCustomHeroOverlay } from "@/lib/hero-overlay";
import { textStyle } from "@/lib/typography";

export function Hero() {
  const siteData = useSiteData();
  const { hero, site } = siteData;
  const mobileLayout = useMemo(() => resolveHeroMobileLayout(hero), [hero]);
  const mobileImageFirst = heroMobileBandHasMedia(mobileLayout);
  const mobileContentTop = `calc(var(--mobile-header-offset, 100px) + ${mobileLayout.headerGap}px + ${mobileLayout.cardOffset}px)`;
  const customOverlay = hasCustomHeroOverlay(hero);

  return (
    <section className="relative" aria-label="Hero">
      {/* Mobile: landscape image on top, then offer card + compact lead form */}
      <div className="sm:hidden">
        {mobileImageFirst ? (
          <div style={{ paddingTop: `calc(var(--mobile-header-offset, 100px) + ${mobileLayout.headerGap}px)` }}>
            <HeroMobileMediaBand layout={mobileLayout} />
          </div>
        ) : null}

        {!mobileImageFirst ? (
          <div className="relative isolate min-h-[100svh] overflow-hidden">
            <HeroBackground hero={hero} />
            {customOverlay ? (
              <HeroOverlay hero={hero} />
            ) : (
              <>
                <div
                  className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,18,32,0.28)_0%,transparent_28%,rgba(6,18,32,0.35)_100%)]"
                  aria-hidden="true"
                />
                <div className="absolute inset-0 bg-black/25" aria-hidden="true" />
              </>
            )}
            <Container
              className="relative z-10 flex min-h-[100svh] flex-col justify-start pb-6"
              style={{ paddingTop: mobileContentTop }}
            >
              <div
                className="grid justify-items-center"
                style={{ gap: mobileLayout.formGap }}
              >
                <BookingCard />
                <HeroMobileLeadForm />
              </div>
            </Container>
          </div>
        ) : (
          <div
            className="pb-6"
            style={{
              paddingTop: mobileLayout.cardOffset,
              backgroundColor: mobileLayout.contentBackgroundColor,
            }}
          >
            <Container className="relative z-10">
              <div
                className="grid justify-items-center"
                style={{ gap: mobileLayout.formGap }}
              >
                <BookingCard />
                <HeroMobileLeadForm />
              </div>
            </Container>
          </div>
        )}
      </div>

      {/* Tablet / desktop: full-bleed media + copy + offer card */}
      <div className="relative isolate hidden min-h-[660px] overflow-hidden sm:block lg:min-h-[700px]">
        <HeroBackground hero={hero} />
        {customOverlay ? (
          <HeroOverlay hero={hero} />
        ) : (
          <>
            <div
              className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,17,31,0.88)_0%,rgba(5,17,31,0.55)_42%,rgba(5,17,31,0.12)_78%)]"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,18,32,0.28)_0%,transparent_28%,rgba(6,18,32,0.35)_100%)]"
              aria-hidden="true"
            />
          </>
        )}

        <Container className="relative z-10 flex min-h-[660px] flex-col justify-center pb-28 pt-28 lg:min-h-[700px]">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="max-w-[610px]">
              <p className="eyebrow" style={textStyle(hero, "eyebrow", { color: hero.eyebrowColor })}>
                {hero.eyebrow}
              </p>
              <h1
                className="mt-4 font-serif text-[36px] font-medium leading-[1.08] sm:mt-5 sm:text-6xl lg:text-[70px]"
                style={textStyle(hero, "heading", { color: hero.headingColor })}
              >
                {hero.heading}
                <span
                  className="mt-1 block"
                  style={textStyle(hero, "headingAccent", { color: hero.headingAccentColor })}
                >
                  {hero.headingAccent}
                </span>
              </h1>
              <p
                className="mt-6 max-w-[520px] text-justify text-[15px] leading-7 sm:text-left sm:text-base"
                style={textStyle(hero, "description", { color: hero.descriptionColor })}
              >
                {hero.description}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
                {hero.primaryCTAEnabled ? (
                  <Button
                    href={resolveCtaHref(hero.primaryCTA, site)}
                    leadClickSource={leadClickSourceById.heroPrimary}
                    backgroundType={hero.primaryCTA.backgroundType}
                    backgroundColor={hero.primaryCTA.backgroundColor}
                    backgroundGradient={hero.primaryCTA.backgroundGradient}
                    textColor={hero.primaryCTA.textColor}
                    className="w-full py-3.5 sm:min-w-48 sm:w-auto sm:py-4"
                  >
                    {hero.primaryCTA.label}
                  </Button>
                ) : null}
                {hero.secondaryCTAEnabled ? (
                  <Button
                    href={resolveCtaHref(hero.secondaryCTA, site)}
                    leadClickSource={leadClickSourceById.heroSecondary}
                    variant="secondary"
                    backgroundType={hero.secondaryCTA.backgroundType}
                    backgroundColor={hero.secondaryCTA.backgroundColor}
                    backgroundGradient={hero.secondaryCTA.backgroundGradient}
                    textColor={hero.secondaryCTA.textColor}
                    className="w-full py-3.5 sm:min-w-48 sm:w-auto sm:py-4"
                  >
                    {hero.secondaryCTA.label}
                  </Button>
                ) : null}
              </div>
            </div>
            <BookingCard />
          </div>
        </Container>
      </div>

      <HeroFacts />
    </section>
  );
}
