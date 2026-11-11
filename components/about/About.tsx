"use client";

import { useMemo, useState } from "react";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { CtaLink } from "@/components/ui/CtaLink";
import { leadClickSourceById } from "@/lib/lead-form-buttons";
import { FeatureCard } from "@/components/about/FeatureCard";
import { richTextSurfaceStyle, textStyle } from "@/lib/typography";
import { countWords, ensureRichHtml, truncateHtmlByWords } from "@/lib/rich-text";

export function About() {
  const siteData = useSiteData();
  const { about } = siteData;
  const [expanded, setExpanded] = useState(false);
  const visibleFeatures = about.features.filter((feature) => feature.enabled !== false);
  const hasFeatures = visibleFeatures.length > 0;
  const wordLimit =
    typeof about.descriptionWordLimit === "number" && about.descriptionWordLimit > 0
      ? about.descriptionWordLimit
      : undefined;
  const richDescription = useMemo(() => ensureRichHtml(about.description), [about.description]);
  const totalWords = countWords(richDescription);
  const preview = useMemo(
    () => (wordLimit ? truncateHtmlByWords(richDescription, wordLimit) : { html: richDescription, truncated: false }),
    [richDescription, wordLimit],
  );
  const needsReadMore = Boolean(wordLimit && preview.truncated && totalWords > wordLimit);
  const shownHtml = expanded || !needsReadMore ? richDescription : preview.html;
  const readMoreStyle = textStyle(about, "readMore");

  return (
    <section className="section bg-white" aria-labelledby="about-heading">
      <Container>
        <div className={`grid items-center gap-9 sm:gap-12 ${hasFeatures ? "lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-16" : ""}`}>
          <div className={`${hasFeatures ? "max-w-xl" : "w-full"} pt-2`}>
            <SectionLabel style={textStyle(about, "label")}>{about.label}</SectionLabel>
            <h2
              id="about-heading"
              className="mt-4 font-serif text-[34px] font-medium leading-[1.12] text-[var(--color-primary)] sm:text-[44px] lg:text-[48px]"
              style={textStyle(about, "heading")}
            >
              {about.heading}
              {about.headingAccent ? <span className="mt-1 block text-[var(--color-secondary)]" style={textStyle(about, "headingAccent")}>{about.headingAccent}</span> : null}
            </h2>
            <div
              className="about-rich-text mt-6 text-justify text-[15px] font-normal leading-7 text-[var(--color-muted)] sm:text-left"
              style={richTextSurfaceStyle(about, "description")}
              dangerouslySetInnerHTML={{ __html: shownHtml }}
            />
            {needsReadMore ? (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className={`mt-2 text-[13px] font-semibold transition-[color,opacity] ${readMoreStyle.color ? "hover:opacity-75" : "text-[var(--color-secondary)] hover:text-[var(--color-primary)]"}`}
                style={readMoreStyle}
              >
                {expanded ? "Read Less" : "Read More"}
              </button>
            ) : null}
            <div className="mt-8">
              <CtaLink cta={about.cta} variant="primary" className="w-full sm:w-auto" leadClickSource={leadClickSourceById.aboutMain} />
            </div>
          </div>

          {hasFeatures ? <div className={`grid gap-4 ${visibleFeatures.length > 1 ? "sm:grid-cols-2" : ""}`}>
            {visibleFeatures.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} featureIndex={index} />
            ))}
          </div> : null}
        </div>
      </Container>
    </section>
  );
}
