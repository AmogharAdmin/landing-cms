import { plainTextFromHtml } from "@/lib/rich-text";
import type { FaqItem } from "@/types/site";

export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  if (!items.length) return null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: plainTextFromHtml(item.answer) },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
