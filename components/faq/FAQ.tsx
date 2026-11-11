"use client";

import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import type { CSSProperties } from "react";
import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { isEnquireHash } from "@/lib/enquiry";
import { ensureRichHtml } from "@/lib/rich-text";
import { richTextSurfaceStyle, textStyle } from "@/lib/typography";

const DEFAULT_ITEM_SPACING = 12;
const DEFAULT_QUESTION_MIN_HEIGHT = 64;
const DEFAULT_QUESTION_PADDING_Y = 16;
const DEFAULT_ANSWER_PADDING_Y = 20;

function handleFaqLinkClick(event: React.MouseEvent<HTMLDivElement>) {
  const anchor = event.target instanceof Element ? event.target.closest("a") : null;
  if (!anchor) return;
  const href = anchor.getAttribute("href") || "";
  if (isEnquireHash(href) || href.startsWith("#enquire")) {
    event.preventDefault();
    window.location.hash = href;
  }
}

function clampNumber(value: number | undefined, fallback: number, min: number, max: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function FAQ() {
  const { faqSection, faqs } = useSiteData();
  const items = faqSection?.items?.length ? faqSection.items : faqs;
  const [openIndex, setOpenIndex] = useState<number | null>(() =>
    faqSection?.defaultOpen === "collapsed" ? null : 0,
  );

  if (faqSection?.enabled === false || items.length === 0) return null;

  const label = faqSection?.label || "FAQs";
  const heading = faqSection?.heading || "Frequently Asked Questions";
  const image = faqSection?.image || "/images/image-3.webp";
  const imageAlt = faqSection?.imageAlt || "Premium residential community";

  const itemSpacing = clampNumber(faqSection?.itemSpacing, DEFAULT_ITEM_SPACING, -80, 80);
  const questionMinHeight = clampNumber(
    faqSection?.questionMinHeight,
    DEFAULT_QUESTION_MIN_HEIGHT,
    0,
    240,
  );
  const questionPaddingY = clampNumber(
    faqSection?.questionPaddingY,
    DEFAULT_QUESTION_PADDING_Y,
    0,
    64,
  );
  const answerPaddingY = clampNumber(
    faqSection?.answerPaddingY,
    DEFAULT_ANSWER_PADDING_Y,
    0,
    80,
  );

  return (
    <section
      className="scroll-mt-24 py-16 sm:py-20 lg:py-24"
      style={{ backgroundColor: faqSection?.backgroundColor || "#f7f3ed" }}
      aria-labelledby="faq-heading"
    >
      <Container>
        <div>
          <SectionLabel style={textStyle(faqSection, "label")}>{label}</SectionLabel>
          <h2
            id="faq-heading"
              className="mt-4 max-w-[620px] font-serif text-[34px] font-medium leading-[1.12] tracking-[-0.025em] text-[var(--color-primary)] sm:text-[44px] lg:text-[48px]"
            style={textStyle(faqSection, "heading")}
          >
            {heading}
          </h2>
        </div>

        {/* Image + accordion share one row so tops align; image stretches to FAQ list height on desktop. */}
        <div className="mt-8 grid gap-8 sm:mt-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-stretch lg:gap-14 xl:gap-20">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#e9e3dc] shadow-[0_18px_45px_rgba(11,31,53,0.10)] lg:aspect-auto lg:h-full lg:min-h-[20rem]">
            <Image
              src={image}
              alt={imageAlt}
              fill
              sizes="(max-width: 1023px) 100vw, 48vw"
              quality={70}
              className="object-cover object-center"
            />
          </div>

          <div className="min-w-0">
            {items.map((item, index) => {
              const isOpen = openIndex === index;
              const answerId = `faq-answer-${index}`;
              const itemStyle: CSSProperties =
                index < items.length - 1 ? { marginBottom: itemSpacing } : {};
              const questionStyle: CSSProperties = {
                ...textStyle(item, "question"),
                minHeight: questionMinHeight,
                paddingTop: questionPaddingY,
                paddingBottom: questionPaddingY,
              };
              const answerStyle: CSSProperties = {
                ...richTextSurfaceStyle(item, "answer"),
                paddingTop: answerPaddingY,
                paddingBottom: answerPaddingY,
              };

              return (
                <article
                  key={`${item.question}-${index}`}
                  className="overflow-hidden rounded-xl border border-[#ded7ce] bg-white shadow-[0_5px_18px_rgba(11,31,53,0.04)]"
                  style={itemStyle}
                >
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={answerId}
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-5 px-5 text-left text-base font-medium leading-snug text-[#0b1f35] transition-colors hover:bg-[#fcfaf7] sm:px-6 sm:text-lg"
                      style={questionStyle}
                    >
                      <span>{item.question}</span>
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f7f3ed] text-[#b98945]" aria-hidden="true">
                        {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
                      </span>
                    </button>
                  </h3>
                  <div
                    id={answerId}
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className="overflow-hidden">
                      <div
                        className="faq-rich-text border-t border-[#eee8e1] px-5 text-sm font-normal leading-7 text-[#526176] sm:px-6 sm:text-base sm:leading-8"
                        style={answerStyle}
                        dangerouslySetInnerHTML={{ __html: ensureRichHtml(item.answer) }}
                        onClick={handleFaqLinkClick}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
