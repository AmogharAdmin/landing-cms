"use client";

import Image from "next/image";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { CtaLink } from "@/components/ui/CtaLink";
import { leadClickSourceById } from "@/lib/lead-form-buttons";
import { AmenityGrid } from "@/components/amenities/AmenityGrid";
import { LifestyleCard } from "@/components/amenities/LifestyleCard";
import { textStyle } from "@/lib/typography";

export function Amenities() {
  const siteData = useSiteData();
  const { amenities } = siteData;
  const showLifestyleCards = amenities.lifestyleCardsEnabled !== false && amenities.lifestyleCards.length > 0;
  const showVisitButton = amenities.visitCtaEnabled !== false;

  return (
    <section
      className="section bg-white"
      aria-labelledby="amenities-heading"
    >
      <Container>
        <div className="grid items-stretch gap-10 sm:gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-14">
          <div className="flex flex-col">
            <SectionLabel style={textStyle(amenities, "label")}>{amenities.label}</SectionLabel>
            <h2
              id="amenities-heading"
              className="mt-3 max-w-md font-serif text-[30px] font-medium leading-[1.1] text-[var(--color-primary)] sm:mt-4 sm:text-[44px] sm:leading-[1.15]"
              style={textStyle(amenities, "heading")}
            >
              {amenities.heading}
              <span className="mt-1 block text-[var(--color-secondary)]" style={textStyle(amenities, "headingAccent")}>{amenities.headingAccent}</span>
            </h2>
            <div className="mt-7 sm:mt-10">
              <AmenityGrid items={amenities.items} />
            </div>
            <div className="mt-auto pt-8 sm:pt-10">
              <CtaLink cta={amenities.cta} variant="dark" className="w-full px-6 py-3 sm:w-auto" leadClickSource={leadClickSourceById.amenitiesEnquire} />
            </div>
          </div>

          <div className="hidden sm:flex sm:flex-col lg:pl-4">
            <div className="relative">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl sm:aspect-[5/4] sm:rounded-[28px] lg:aspect-[4/3]">
                <Image
                  src={amenities.image}
                  alt={amenities.imageAlt}
                  fill
                  sizes="(max-width: 1023px) 100vw, 48vw"
                  quality={70}
                  className="object-cover object-[center_60%]"
                />
              </div>
              {showLifestyleCards ? <div className="absolute -bottom-7 left-1/2 -translate-x-1/2">
                <LifestyleCard cards={amenities.lifestyleCards} />
              </div> : null}
            </div>
            {showVisitButton ? (
              <div className={`mt-auto flex justify-center ${showLifestyleCards ? "pt-11 sm:pt-10" : "pt-5"}`}>
                <CtaLink cta={amenities.visitCta} variant="primary" className="w-full sm:w-auto" leadClickSource={leadClickSourceById.amenitiesVisit} />
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
