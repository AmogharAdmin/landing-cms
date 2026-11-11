import type {
  KeywordAboutOverride,
  KeywordBookingCardOverride,
  KeywordContent,
  KeywordHeroOverride,
  KeywordRule,
  SiteData,
} from "@/types/site";

export function normalizeKeyword(value: string | null | undefined) {
  return (value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function ruleMatches(rule: KeywordRule, term: string) {
  return rule.tags.some((tag) => {
    const normalizedTag = normalizeKeyword(tag);
    if (!normalizedTag) return false;
    return rule.match === "contains" ? term.includes(normalizedTag) : term === normalizedTag;
  });
}

/** Rule order is priority: the first enabled rule with a matching tag wins. */
export function matchKeywordRule(
  config: KeywordContent | undefined,
  utmTerm: string | null | undefined,
): KeywordRule | null {
  if (!config || config.enabled === false || !Array.isArray(config.rules)) return null;
  const term = normalizeKeyword(utmTerm);
  if (!term) return null;
  return config.rules.find((rule) => rule.enabled && Array.isArray(rule.tags) && ruleMatches(rule, term)) ?? null;
}

function filled(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function pickFilled<T extends Record<string, unknown>>(override: T | undefined, keys: Array<keyof T>) {
  const result: Partial<Record<keyof T, string>> = {};
  if (!override) return result;
  for (const key of keys) {
    const value = override[key];
    if (typeof value === "string" && filled(value)) result[key] = value;
  }
  return result;
}

function applyHero(hero: SiteData["hero"], override: KeywordHeroOverride | undefined): SiteData["hero"] {
  if (!override) return hero;
  const text = pickFilled(override, ["eyebrow", "heading", "headingAccent", "description"]);
  return {
    ...hero,
    ...text,
    primaryCTA: filled(override.primaryCtaLabel) ? { ...hero.primaryCTA, label: override.primaryCtaLabel } : hero.primaryCTA,
    secondaryCTA: filled(override.secondaryCtaLabel) ? { ...hero.secondaryCTA, label: override.secondaryCtaLabel } : hero.secondaryCTA,
  };
}

function applyBookingCard(
  card: SiteData["bookingCard"],
  override: KeywordBookingCardOverride | undefined,
): SiteData["bookingCard"] {
  if (!override) return card;
  const text = pickFilled(override, [
    "offerTitle",
    "title",
    "description",
    "benefitsTitle",
    "propertyText",
    "pricePrefix",
    "price",
    "priceSuffix",
  ]);
  const benefits = (override.benefits || []).filter(filled);
  return {
    ...card,
    ...text,
    benefits: benefits.length ? benefits : card.benefits,
    button: filled(override.buttonLabel) ? { ...card.button, label: override.buttonLabel } : card.button,
  };
}

/** True when rich HTML has visible text (an empty editor still emits `<p></p>`). */
export function hasRichText(html: string | undefined) {
  if (!html) return false;
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;|&#160;/gi, " ").trim().length > 0;
}

function applyAbout(about: SiteData["about"], override: KeywordAboutOverride | undefined): SiteData["about"] {
  if (!override) return about;
  return {
    ...about,
    ...pickFilled(override, ["label", "heading", "headingAccent"]),
    ...(hasRichText(override.description) ? { description: override.description } : {}),
  };
}

/** Returns new site data with only hero, bookingCard and about copy overridden. */
export function applyKeywordContent(siteData: SiteData, rule: KeywordRule | null): SiteData {
  if (!rule) return siteData;
  return {
    ...siteData,
    hero: applyHero(siteData.hero, rule.hero),
    bookingCard: applyBookingCard(siteData.bookingCard, rule.bookingCard),
    about: applyAbout(siteData.about, rule.about),
  };
}

/** Drops the rule list so other keywords' copy is never sent to the browser. */
export function stripKeywordContent(siteData: SiteData): SiteData {
  if (!siteData.keywordContent) return siteData;
  const rest = { ...siteData };
  delete rest.keywordContent;
  return rest;
}
