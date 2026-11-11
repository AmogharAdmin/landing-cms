"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { resolveCtaHref } from "@/lib/cta";
import { plansCardClickSource } from "@/lib/lead-form-buttons";
import { leadClickHandler } from "@/lib/lead-click-source";
import { leadCtaGtmDomAttrs } from "@/lib/lead-form-gtm";
import { resolveButtonBackgroundStyle } from "@/lib/button-background";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/cn";
import type { CustomButtonGradient, PlanCard, SiteInfo } from "@/types/site";

function PlanCardItem({
  card,
  site,
  isMultiple,
  sectionLocked,
  sectionBlur,
  cardIndex,
  customGradients,
}: {
  card: PlanCard;
  site: SiteInfo;
  isMultiple: boolean;
  sectionLocked?: boolean;
  sectionBlur?: number;
  cardIndex: number;
  customGradients?: CustomButtonGradient[];
}) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const isLandscape = aspectRatio !== null ? aspectRatio > 1.15 : true;
  const isLocked = card.isLocked !== undefined ? Boolean(card.isLocked) : Boolean(sectionLocked);
  const blurAmount = Math.min(30, Math.max(0, card.blurAmount ?? sectionBlur ?? 8));

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#f2efe9] shadow-[0_24px_70px_rgba(0,0,0,0.24)] transition-all duration-300",
        isLandscape
          ? "min-h-[270px] sm:min-h-[340px] lg:min-h-[400px]"
          : "min-h-[370px] sm:min-h-[450px] lg:min-h-[490px]",
      )}
    >
      <Image
        src={card.image}
        alt={card.imageAlt || ""}
        fill
        sizes={isMultiple ? "(max-width: 1023px) 100vw, 50vw" : "100vw"}
        quality={70}
        className="object-contain p-3 pb-24 transition-transform duration-700 ease-out group-hover:scale-[1.015] sm:p-5 sm:pb-24"
        style={isLocked ? { filter: `blur(${blurAmount}px)` } : undefined}
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth && img.naturalHeight) {
            setAspectRatio(img.naturalWidth / img.naturalHeight);
          }
        }}
      />

      {isLocked ? (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center pb-20 sm:pb-24"
          aria-label="Master plan preview locked"
        >
          <span className="flex size-14 items-center justify-center rounded-full border border-white/80 bg-[#071d31]/85 text-white shadow-xl backdrop-blur-sm sm:size-16">
            <LockKeyhole className="size-6 sm:size-7" aria-hidden="true" />
          </span>
        </div>
      ) : null}

      {card.textEnabled || card.buttonEnabled ? (
        <div
          className="absolute inset-x-3 bottom-3 flex flex-col items-stretch gap-2.5 rounded-2xl border border-white/15 p-3.5 shadow-2xl sm:inset-x-5 sm:bottom-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5"
          style={{ backgroundColor: card.overlayColor }}
        >
          {card.textEnabled ? (
            <div className="min-w-0 text-white text-center sm:text-left">
              <h3
                className="font-serif text-[17px] font-semibold leading-tight tracking-[-0.02em] sm:text-xl md:text-2xl"
                style={textStyle(card, "title")}
              >
                {card.title}
              </h3>
            </div>
          ) : null}

          {card.buttonEnabled ? (
            <a
              href={resolveCtaHref(card.button, site)}
              onClick={leadClickHandler(
                resolveCtaHref(card.button, site),
                plansCardClickSource(cardIndex, card.title),
              )}
              className="inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold transition-[filter] duration-300 hover:brightness-110 sm:min-h-12 sm:w-auto sm:px-5 sm:text-sm"
              style={{
                ...resolveButtonBackgroundStyle(
                  {
                    backgroundType: card.button.backgroundType,
                    backgroundColor: card.button.backgroundColor || card.buttonColor,
                    backgroundGradient: card.button.backgroundGradient,
                  },
                  customGradients,
                ),
                color: card.button.textColor || card.buttonTextColor,
              }}
              {...leadCtaGtmDomAttrs(plansCardClickSource(cardIndex, card.title))}
            >
              <span className="whitespace-nowrap">{card.button.label}</span>
              <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function Plans() {
  const { plansSection, site, customButtonGradients } = useSiteData();

  if (!plansSection?.enabled) return null;

  const cards = plansSection.cards
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => card.enabled);
  if (cards.length === 0) return null;

  return (
    <section
      className="scroll-mt-28 py-16 sm:py-20 lg:py-24"
      style={{ backgroundColor: plansSection.backgroundColor, color: plansSection.textColor }}
      aria-labelledby="plans-heading"
    >
      <Container>
        <div className="mb-8 max-w-3xl sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d6a75d]" style={textStyle(plansSection, "label")}>
            {plansSection.label}
          </p>
          <h2 id="plans-heading" className="mt-4 font-serif text-[34px] font-medium leading-[1.12] tracking-[-0.025em] sm:text-[44px] lg:text-[48px]" style={textStyle(plansSection, "heading")}>
            {plansSection.heading}
          </h2>
        </div>

        <div className={`grid gap-5 ${cards.length > 1 ? "lg:grid-cols-2" : "mx-auto w-full max-w-[900px]"}`}>
          {cards.map(({ card, index }) => (
            <PlanCardItem
              key={`${card.title}-${index}`}
              card={card}
              site={site}
              isMultiple={cards.length > 1}
              sectionLocked={plansSection.isLocked}
              sectionBlur={plansSection.blurAmount}
              cardIndex={index}
              customGradients={customButtonGradients}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
