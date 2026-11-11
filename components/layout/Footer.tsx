"use client";

import { useMemo, useState } from "react";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { Container } from "@/components/ui/Container";
import { countWords, ensureRichHtml, truncateHtmlByWords } from "@/lib/rich-text";
import { richTextSurfaceStyle, textStyle } from "@/lib/typography";

export function Footer() {
  const siteData = useSiteData();
  const { footer } = siteData;
  const [expanded, setExpanded] = useState(false);
  const wordLimit =
    typeof footer.descriptionWordLimit === "number" && footer.descriptionWordLimit > 0
      ? footer.descriptionWordLimit
      : undefined;
  const richDescription = useMemo(() => ensureRichHtml(footer.description || ""), [footer.description]);
  const totalWords = countWords(richDescription);
  const preview = useMemo(
    () => (wordLimit ? truncateHtmlByWords(richDescription, wordLimit) : { html: richDescription, truncated: false }),
    [richDescription, wordLimit],
  );
  const needsReadMore = Boolean(wordLimit && footer.description?.trim() && preview.truncated && totalWords > wordLimit);
  const shownHtml = expanded || !needsReadMore ? richDescription : preview.html;
  const hasFreeText = Boolean(plainHasContent(footer.description || ""));

  return (
    <footer className="bg-[#050706] py-10 text-white sm:py-12">
      <Container>
        <div className="space-y-5 text-[12px] leading-5 text-white/58 sm:text-[13px] sm:leading-6">
          <p>
            <strong className="text-white/82">Website Managed By:</strong>{" "}
            <span style={textStyle(footer, "managedBy")}>{footer.managedBy}</span>
          </p>

          {hasFreeText ? (
            <div>
              <div
                className="footer-rich-text font-normal"
                style={richTextSurfaceStyle(footer, "description")}
                dangerouslySetInnerHTML={{ __html: shownHtml }}
              />
              {needsReadMore ? (
                <button
                  type="button"
                  onClick={() => setExpanded((value) => !value)}
                  className="mt-2 text-[12px] font-semibold text-[var(--color-secondary)] transition-colors hover:text-white"
                >
                  {expanded ? "Read Less" : "Read More"}
                </button>
              ) : null}
            </div>
          ) : null}

          <div>
            <p className="font-semibold text-white/82" style={textStyle(footer, "reraTitle")}>{footer.reraTitle}</p>
            <ul className="mt-2 space-y-0.5">
              {footer.reraPhases.map((phase) => <li key={phase}>{phase}</li>)}
            </ul>
          </div>

          <div className="space-y-3">
            <p className="font-semibold text-white/82" style={textStyle(footer, "disclaimerTitle")}>{footer.disclaimerTitle}</p>
            {footer.disclaimerParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-6 border-t border-white/10 pt-7 sm:flex-row sm:items-end sm:justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={footer.logo} alt="Footer logo" className="h-12 w-auto object-contain object-left sm:h-14" width={200} height={56} />
          <div className="text-left text-[12px] leading-5 text-white/65 sm:text-right">
            <p style={textStyle(footer, "copyrightText")}>{footer.copyrightText}</p>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function plainHasContent(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim().length > 0;
}
