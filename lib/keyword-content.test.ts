import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { KeywordContent, KeywordRule, SiteData } from "@/types/site";
import {
  applyKeywordContent,
  hasRichText,
  matchKeywordRule,
  stripKeywordContent,
} from "@/lib/keyword-content";

function rule(partial: Partial<KeywordRule> & Pick<KeywordRule, "id">): KeywordRule {
  return { enabled: true, name: partial.id, tags: [], match: "exact", ...partial };
}

const baseSite = {
  hero: {
    eyebrow: "Default eyebrow",
    heading: "Default heading",
    headingAccent: "Default accent",
    description: "Default hero description",
    primaryCTA: { label: "Enquire", action: "enquire" },
    secondaryCTA: { label: "Brochure", action: "brochure" },
    headingColor: "#fff",
  },
  bookingCard: {
    offerTitle: "Launch offer",
    title: "Villas",
    description: "Card description",
    benefits: ["A", "B"],
    price: "1 Cr",
    button: { label: "Book now", action: "enquire" },
  },
  about: {
    label: "About",
    heading: "About heading",
    headingAccent: "Accent",
    description: "<p>Default about</p>",
    features: [],
  },
  highlights: { items: [], cta: { label: "x", action: "enquire" } },
  seo: { title: "SEO" },
} as unknown as SiteData;

describe("keyword rule matching", () => {
  const config: KeywordContent = {
    enabled: true,
    rules: [
      rule({ id: "exact", tags: ["3 BHK Villas"], match: "exact" }),
      rule({ id: "contains", tags: ["villas"], match: "contains" }),
      rule({ id: "off", enabled: false, tags: ["plots"], match: "contains" }),
    ],
  };

  it("matches exact terms case-insensitively and ignoring extra spaces", () => {
    assert.equal(matchKeywordRule(config, "  3   bhk villas ")?.id, "exact");
  });

  it("uses contains when the term only includes a tag", () => {
    assert.equal(matchKeywordRule(config, "3 bhk villas bangalore")?.id, "contains");
  });

  it("checks rules in order so the first match wins", () => {
    const reordered: KeywordContent = { ...config, rules: [config.rules[1], config.rules[0]] };
    assert.equal(matchKeywordRule(reordered, "3 bhk villas")?.id, "contains");
  });

  it("skips disabled rules, a disabled config and empty terms", () => {
    assert.equal(matchKeywordRule(config, "plots"), null);
    assert.equal(matchKeywordRule({ ...config, enabled: false }, "3 bhk villas"), null);
    assert.equal(matchKeywordRule(config, ""), null);
    assert.equal(matchKeywordRule(undefined, "villas"), null);
  });

  it("does not partially match in exact mode", () => {
    const exactOnly: KeywordContent = { rules: [rule({ id: "x", tags: ["villas"] })] };
    assert.equal(matchKeywordRule(exactOnly, "luxury villas"), null);
    assert.equal(matchKeywordRule(exactOnly, "villas")?.id, "x");
  });
});

describe("keyword content merge", () => {
  it("returns the same data when nothing matched", () => {
    assert.equal(applyKeywordContent(baseSite, null), baseSite);
  });

  it("overrides only filled fields in hero, bookingCard and about", () => {
    const merged = applyKeywordContent(baseSite, rule({
      id: "r",
      hero: { heading: "Villas for you", description: "  ", primaryCtaLabel: "Get price" },
      bookingCard: { price: "95 L", benefits: ["Free parking", ""], buttonLabel: "Reserve" },
      about: { heading: "Why these villas", description: "<p></p>" },
    }));

    assert.equal(merged.hero.heading, "Villas for you");
    assert.equal(merged.hero.description, "Default hero description");
    assert.equal(merged.hero.eyebrow, "Default eyebrow");
    assert.equal(merged.hero.primaryCTA.label, "Get price");
    assert.equal(merged.hero.primaryCTA.action, "enquire");
    assert.equal(merged.hero.secondaryCTA.label, "Brochure");
    assert.equal(merged.hero.headingColor, "#fff");

    assert.equal(merged.bookingCard.price, "95 L");
    assert.equal(merged.bookingCard.title, "Villas");
    assert.deepEqual(merged.bookingCard.benefits, ["Free parking"]);
    assert.equal(merged.bookingCard.button.label, "Reserve");

    assert.equal(merged.about.heading, "Why these villas");
    assert.equal(merged.about.description, "<p>Default about</p>");

    assert.equal(merged.highlights, baseSite.highlights);
    assert.equal(merged.seo, baseSite.seo);
    assert.equal(baseSite.hero.heading, "Default heading");
  });

  it("keeps default benefits when the override list is empty", () => {
    const merged = applyKeywordContent(baseSite, rule({ id: "r", bookingCard: { benefits: [] } }));
    assert.deepEqual(merged.bookingCard.benefits, ["A", "B"]);
  });

  it("uses a rich About description when it has text", () => {
    const merged = applyKeywordContent(baseSite, rule({ id: "r", about: { description: "<p>New <strong>copy</strong></p>" } }));
    assert.equal(merged.about.description, "<p>New <strong>copy</strong></p>");
  });

  it("detects empty rich text", () => {
    assert.equal(hasRichText("<p><br></p>"), false);
    assert.equal(hasRichText("<p>&nbsp;</p>"), false);
    assert.equal(hasRichText("<p>x</p>"), true);
  });

  it("strips the rule list from public data", () => {
    const withRules = { ...baseSite, keywordContent: { rules: [rule({ id: "r" })] } } as SiteData;
    assert.equal("keywordContent" in stripKeywordContent(withRules), false);
  });
});
