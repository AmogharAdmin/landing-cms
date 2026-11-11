import type { LandingSectionKey, SectionLayoutSetting } from "@/types/site";

export const DEFAULT_SECTION_ORDER: LandingSectionKey[] = [
  "hero",
  "about",
  "highlights",
  "amenities",
  "homes",
  "gallery",
  "location",
  "virtualTourSection",
  "plansSection",
  "faqSection",
  "contactSection",
];

export const SECTION_ANCHORS: Record<LandingSectionKey, string> = {
  hero: "overview",
  about: "about",
  highlights: "highlights",
  amenities: "amenities",
  homes: "homes",
  gallery: "gallery",
  location: "location",
  virtualTourSection: "virtual-tour",
  plansSection: "plans",
  faqSection: "faqs",
  contactSection: "contact",
};

export const SECTION_LABELS: Record<LandingSectionKey, string> = {
  hero: "Hero",
  about: "About",
  highlights: "Project Highlights",
  amenities: "World Class Amenities",
  homes: "Choose Your Home",
  gallery: "Gallery",
  location: "Location & Connectivity",
  virtualTourSection: "Virtual Tour",
  plansSection: "Project Plans",
  faqSection: "FAQs",
  contactSection: "Contact Us",
};

export function sanitizeSectionAnchor(value: string, fallback: string): string {
  const cleaned = value
    .replace(/^#/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || fallback;
}

export function sectionAnchor(
  section: LandingSectionKey,
  settings?: Partial<Record<LandingSectionKey, Pick<SectionLayoutSetting, "anchor">>>,
): string {
  const custom = settings?.[section]?.anchor?.trim();
  return custom ? sanitizeSectionAnchor(custom, SECTION_ANCHORS[section]) : SECTION_ANCHORS[section];
}

export function sectionHash(
  section: LandingSectionKey,
  settings?: Partial<Record<LandingSectionKey, Pick<SectionLayoutSetting, "anchor">>>,
): string {
  return `#${sectionAnchor(section, settings)}`;
}

const VALID_SECTIONS = new Set<string>(DEFAULT_SECTION_ORDER);

export function normalizeSectionOrder(order?: readonly string[]): LandingSectionKey[] {
  const normalized: LandingSectionKey[] = [];

  for (const section of order ?? []) {
    if (VALID_SECTIONS.has(section) && !normalized.includes(section as LandingSectionKey)) {
      normalized.push(section as LandingSectionKey);
    }
  }

  for (const section of DEFAULT_SECTION_ORDER) {
    if (!normalized.includes(section)) normalized.push(section);
  }

  return normalized;
}

export const DEFAULT_SECTION_LAYOUT: Omit<SectionLayoutSetting, "anchor"> = {
  enabled: true,
  paddingTop: 0,
  paddingBottom: 0,
  marginTop: 0,
  marginBottom: 0,
  backgroundColor: "",
  textColor: "",
};

export function normalizeSectionSettings(
  settings?: Partial<Record<LandingSectionKey, Partial<SectionLayoutSetting>>>,
): Record<LandingSectionKey, SectionLayoutSetting> {
  return Object.fromEntries(
    DEFAULT_SECTION_ORDER.map((section) => {
      const item = settings?.[section];
      return [
        section,
        {
          ...DEFAULT_SECTION_LAYOUT,
          ...item,
          anchor: sanitizeSectionAnchor(item?.anchor || SECTION_ANCHORS[section], SECTION_ANCHORS[section]),
          paddingTop: typeof item?.paddingTop === "number" && !isNaN(item.paddingTop) ? Math.min(500, Math.max(-500, item.paddingTop)) : 0,
          paddingBottom: typeof item?.paddingBottom === "number" && !isNaN(item.paddingBottom) ? Math.min(500, Math.max(-500, item.paddingBottom)) : 0,
          marginTop: typeof item?.marginTop === "number" && !isNaN(item.marginTop) ? Math.min(500, Math.max(-500, item.marginTop)) : 0,
          marginBottom: typeof item?.marginBottom === "number" && !isNaN(item.marginBottom) ? Math.min(500, Math.max(-500, item.marginBottom)) : 0,
          backgroundColor: typeof item?.backgroundColor === "string" ? item.backgroundColor.trim() : "",
          textColor: typeof item?.textColor === "string" ? item.textColor.trim() : "",
        },
      ];
    }),
  ) as Record<LandingSectionKey, SectionLayoutSetting>;
}
