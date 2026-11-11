"use client";

import { Star } from "lucide-react";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { resolveCtaHref } from "@/lib/cta";
import { leadClickSourceById } from "@/lib/lead-form-buttons";
import { leadClickHandler } from "@/lib/lead-click-source";
import { leadCtaGtmDomAttrs } from "@/lib/lead-form-gtm";
import {
  resolveBenefitsBackgroundStyle,
  resolveBookingCardBackgroundStyle,
  resolveBookingCardMobileChrome,
  resolveBookingHeaderBackgroundStyle,
  resolveBookingSpecs,
  resolveOfferTitleBackgroundStyle,
  resolveSpecsBackgroundColor,
} from "@/lib/booking-card";
import { resolveButtonBackgroundStyle } from "@/lib/button-background";
import { textStyle } from "@/lib/typography";

export function BookingCard() {
  const siteData = useSiteData();
  const { bookingCard, site } = siteData;
  if (!bookingCard.enabled) return null;

  const specifications = resolveBookingSpecs(bookingCard);
  const customs = siteData.customButtonGradients;
  const mobileChrome = resolveBookingCardMobileChrome(bookingCard);

  return (
    <aside
      className="block w-full justify-self-stretch overflow-hidden border-y border-white/45 shadow-[0_24px_70px_rgba(0,0,0,0.28)] max-sm:mx-[var(--booking-mx)] max-sm:w-[calc(100%-2*var(--booking-mx))] max-sm:rounded-none max-sm:border-solid max-sm:[border-width:var(--booking-border-w)] max-sm:[border-color:var(--booking-border-c)] max-sm:shadow-none sm:hidden lg:mx-0 lg:block lg:w-full lg:max-w-[430px] lg:justify-self-end lg:rounded-[15px] lg:border lg:shadow-[0_24px_70px_rgba(0,0,0,0.28)]"
      aria-label="Limited time booking offer"
      style={{
        color: bookingCard.textColor,
        ...resolveBookingCardBackgroundStyle(bookingCard, customs),
        ["--booking-border-w" as string]: `${mobileChrome.borderWidth}px`,
        ["--booking-border-c" as string]: mobileChrome.borderColor,
        ["--booking-mx" as string]: `${mobileChrome.marginX}px`,
      }}
    >
      <div
        className="flex min-h-12 items-center justify-center px-4 py-2"
        style={resolveBookingHeaderBackgroundStyle(bookingCard, customs)}
      >
        <p
          className="rounded-[5px] px-4 py-1 text-center text-[11px] font-bold tracking-[0.02em] text-[#293342] shadow-sm"
          style={{
            ...resolveOfferTitleBackgroundStyle(bookingCard, customs),
            ...textStyle(bookingCard, "offerTitle"),
          }}
        >
          {bookingCard.offerTitle}
        </p>
      </div>

      <div className="px-5 pb-4 pt-4 sm:px-6 lg:px-7">
        <h2 className="text-center text-[27px] font-extrabold leading-tight tracking-[-0.025em] lg:text-[30px]" style={textStyle(bookingCard, "title")}>
          {bookingCard.title}
        </h2>
        <p className="mt-1.5 text-center text-[12px] leading-5 lg:text-[13px]" style={textStyle(bookingCard, "description")}>{bookingCard.description}</p>

        <dl
          className="mt-3.5 rounded-[10px] px-5 py-2.5 text-[11px] uppercase text-[#4e5b6b] lg:text-[12px]"
          style={{ backgroundColor: resolveSpecsBackgroundColor(bookingCard) }}
        >
          {specifications.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className={`grid grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] items-center gap-4 py-2 ${index ? "border-t border-[#e4e1da]" : ""}`}
            >
              <dt className="font-medium">{item.label}</dt>
              <dd className="font-bold normal-case text-[#172238]">{item.value}</dd>
            </div>
          ))}
        </dl>

        <div
          className="mt-3.5 rounded-[8px] p-2.5 text-center text-white"
          style={resolveBenefitsBackgroundStyle(bookingCard, customs)}
        >
          <div className="border border-dashed border-white/65 px-4 py-2.5">
            <div className="flex items-center gap-3 text-[#f2cd75]">
              <span className="h-px flex-1 bg-[#f2cd75]/45" />
              <p className="text-[12px] font-bold tracking-[0.04em]">{bookingCard.benefitsTitle ?? "EARLY BUYER BENEFITS"}</p>
              <span className="h-px flex-1 bg-[#f2cd75]/45" />
            </div>
            <div className="mt-1 text-[11px] leading-5 lg:text-[12px]">
              {bookingCard.benefits.map((benefit, index) => (
                <p key={benefit} className={index ? "border-t border-white/15" : ""}>{benefit}</p>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-3 text-center text-[10px] leading-4 text-[var(--color-muted)] lg:text-[11px]">{bookingCard.propertyText}</p>
        <p className="text-center text-[11px] leading-4">{bookingCard.pricePrefix}</p>
        <p className="mt-0.5 text-center text-[31px] font-extrabold leading-none tracking-[-0.025em] lg:text-[35px]">
          {bookingCard.price} <span className="text-[11px] font-medium tracking-normal">{bookingCard.priceSuffix}</span>
        </p>

        <a
          href={resolveCtaHref(bookingCard.button, site)}
          onClick={leadClickHandler(resolveCtaHref(bookingCard.button, site), leadClickSourceById.bookingCard)}
          className="mt-3 flex min-h-10 items-center justify-center rounded-[6px] [background:var(--fill-secondary)] px-5 text-[12px] font-bold text-white transition-colors hover:[background:var(--fill-accent)] lg:text-[13px]"
          style={{
            ...resolveButtonBackgroundStyle(bookingCard.button, customs),
            color: bookingCard.button.textColor,
          }}
          {...leadCtaGtmDomAttrs(leadClickSourceById.bookingCard)}
        >
          {bookingCard.button.label}
        </a>

        <div className="mt-3 flex items-center justify-center gap-1.5 border-t border-[#ece9e3] pt-3 text-[var(--color-secondary)]">
          <span className="mr-1 rounded bg-white px-1 text-[12px] font-bold text-[#4285f4] shadow">{bookingCard.ratingSource}</span>
          {Array.from({ length: bookingCard.ratingStars }, (_, star) => <Star key={star} className="size-3 fill-current" />)}
          <span className="mx-1 h-4 w-px bg-[#d8d5ce]" />
          <span className="text-[10px] text-[var(--color-muted)]">{bookingCard.ratingLabel}</span>
        </div>
      </div>
    </aside>
  );
}
