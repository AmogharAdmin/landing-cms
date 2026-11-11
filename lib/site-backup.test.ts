import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SiteData } from "../types/site";
import {
  deepMergeSiteData,
  prepareSiteDataForExport,
  siteDataToExportJson,
} from "./site-backup";

function partialSite(partial: Record<string, unknown>): SiteData {
  return partial as unknown as SiteData;
}

describe("deepMergeSiteData", () => {
  it("keeps baseline fields when overlay only changes one nested value", () => {
    const base = partialSite({
      site: { name: "Amoghaa" },
      about: {
        label: "About",
        heading: "Welcome",
        headingAccent: "Home",
        description: "Original description",
        cta: { label: "Enquire", action: "enquire" },
        features: [{ enabled: true, icon: "building", title: "Feature", description: "Desc" }],
      },
    });
    const overlay = partialSite({
      about: {
        description: "Updated description",
      },
    });

    const merged = deepMergeSiteData(base, overlay);
    assert.equal(merged.about.description, "Updated description");
    assert.equal(merged.about.heading, "Welcome");
    assert.equal(merged.about.features?.length, 1);
    assert.equal(merged.about.features?.[0]?.title, "Feature");
  });

  it("keeps optional root keys from baseline when missing in overlay", () => {
    const base = partialSite({
      site: { name: "Amoghaa" },
      floatingButton: { enabled: true, label: "Enquire", action: "enquire" },
    });
    const overlay = partialSite({
      site: { name: "Amoghaa" },
    });

    const merged = deepMergeSiteData(base, overlay);
    assert.deepEqual(merged.floatingButton, { enabled: true, label: "Enquire", action: "enquire" });
  });

  it("replaces arrays from overlay entirely", () => {
    const base = partialSite({
      faqs: [{ question: "Q1", answer: "A1" }],
    });
    const overlay = partialSite({
      faqs: [{ question: "Q2", answer: "A2" }],
    });

    const merged = deepMergeSiteData(base, overlay);
    assert.equal(merged.faqs.length, 1);
    assert.equal(merged.faqs[0]?.question, "Q2");
  });
});

describe("prepareSiteDataForExport", () => {
  it("preserves disabled section settings when draft omits sectionSettings", () => {
    const saved = partialSite({
      site: { name: "Amoghaa" },
      sectionSettings: {
        hero: { enabled: false, anchor: "overview", paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0 },
      },
    });
    const draft = partialSite({
      site: { name: "Amoghaa" },
    });

    const exported = prepareSiteDataForExport(draft, saved);
    assert.equal(exported.sectionSettings?.hero?.enabled, false);
  });

  it("keeps newly added button gradient fields from the editor draft", () => {
    const saved = partialSite({
      site: { name: "Amoghaa" },
      header: {
        backgroundColor: "#0B1F35",
        brochureButton: {
          enabled: true,
          label: "Download Brochure",
          action: "enquire",
          backgroundColor: "#B98945",
          textColor: "#FFFFFF",
        },
        phoneButtonColor: "#0B1F35",
      },
      stickyCTA: {
        enabled: true,
        message: "Hello",
        enquireLabel: "Enquire",
        whatsappLabel: "WhatsApp",
      },
      floatingButton: {
        enabled: true,
        label: "Enquire Now",
        backgroundColor: "#b98945",
      },
      contactSection: {
        enabled: true,
        label: "Contact",
        heading: "Get in Touch",
        image: "/images/image-3.webp",
        buttonBackgroundColor: "#b98945",
      },
      hero: {
        eyebrow: "E",
        heading: "H",
        headingAccent: "A",
        description: "D",
        backgroundImage: "/images/hero.webp",
        backgroundAlt: "Hero",
        primaryCTA: { label: "One", action: "enquire", backgroundColor: "#B98945" },
        secondaryCTA: { label: "Two", action: "call", backgroundColor: "#0B1F35" },
        primaryCTAEnabled: true,
        secondaryCTAEnabled: true,
        eyebrowColor: "#fff",
        headingColor: "#fff",
        headingAccentColor: "#fff",
        descriptionColor: "#fff",
      },
    });

    const draft = partialSite({
      ...saved,
      header: {
        ...saved.header,
        brochureButton: {
          ...saved.header!.brochureButton,
          backgroundType: "gradient",
          backgroundGradient: "golden",
        },
      },
      stickyCTA: {
        ...saved.stickyCTA!,
        enquireButtonBackgroundType: "gradient",
        enquireButtonGradient: "metallic",
        enquireButtonTextColor: "#FFFFFF",
        whatsappButtonBackgroundType: "plain",
        whatsappButtonColor: "#25D366",
      },
      floatingButton: {
        ...saved.floatingButton!,
        backgroundType: "gradient",
        backgroundGradient: "dark-golden",
      },
      contactSection: {
        ...saved.contactSection!,
        buttonBackgroundType: "gradient",
        buttonBackgroundGradient: "champagne",
        buttonTextColor: "#0b1f35",
      },
      hero: {
        ...saved.hero!,
        backgroundMode: "carousel",
        backgroundCarouselImages: [{ src: "/images/a.webp", alt: "A" }],
        backgroundCarouselIntervalMs: 4000,
        primaryCTA: {
          ...saved.hero!.primaryCTA,
          backgroundType: "gradient",
          backgroundGradient: "bronze",
        },
      },
      about: {
        label: "ABOUT",
        heading: "Heading",
        headingAccent: "Accent",
        description: '<p>Size <span style="font-size: 20px">twenty</span></p>',
        cta: { label: "Know more", action: "enquire" },
        features: [],
      },
    });

    const exported = prepareSiteDataForExport(draft, saved);
    const json = siteDataToExportJson(exported);
    const parsed = JSON.parse(json) as SiteData;

    assert.equal(parsed.header.brochureButton.backgroundType, "gradient");
    assert.equal(parsed.header.brochureButton.backgroundGradient, "golden");
    assert.equal(parsed.stickyCTA.enquireButtonBackgroundType, "gradient");
    assert.equal(parsed.stickyCTA.enquireButtonGradient, "metallic");
    assert.equal(parsed.floatingButton?.backgroundType, "gradient");
    assert.equal(parsed.floatingButton?.backgroundGradient, "dark-golden");
    assert.equal(parsed.contactSection?.buttonBackgroundType, "gradient");
    assert.equal(parsed.contactSection?.buttonBackgroundGradient, "champagne");
    assert.equal(parsed.hero.backgroundMode, "carousel");
    assert.equal(parsed.hero.primaryCTA.backgroundGradient, "bronze");
    assert.ok(parsed.about.description.includes('font-size: 20px'));
    assert.ok(json.includes('"backgroundGradient": "golden"'));
    assert.ok(json.includes('"backgroundMode": "carousel"'));
  });

  it("preserves disabled buttons and section toggles through export JSON", () => {
    const saved = partialSite({
      site: { name: "Amoghaa" },
      header: {
        backgroundColor: "#0B1F35",
        brochureButton: {
          enabled: true,
          label: "Brochure",
          action: "enquire",
          backgroundColor: "#B98945",
        },
        phoneButtonColor: "#0B1F35",
      },
      hero: {
        eyebrow: "E",
        heading: "H",
        headingAccent: "A",
        description: "D",
        backgroundImage: "/images/hero.webp",
        backgroundAlt: "Hero",
        primaryCTA: { label: "One", action: "enquire" },
        secondaryCTA: { label: "Two", action: "call" },
        primaryCTAEnabled: true,
        secondaryCTAEnabled: true,
        eyebrowColor: "#fff",
        headingColor: "#fff",
        headingAccentColor: "#fff",
        descriptionColor: "#fff",
      },
      amenities: {
        label: "Amenities",
        heading: "Heading",
        headingAccent: "Accent",
        items: [],
        image: "/images/a.webp",
        imageAlt: "A",
        lifestyleCards: [],
        lifestyleCardsEnabled: true,
        visitCtaEnabled: true,
        cta: { label: "Know", action: "enquire" },
        visitCta: { label: "Visit", action: "enquire" },
      },
      homes: {
        label: "Homes",
        heading: "Homes",
        tabs: [{ id: "2bhk", label: "2BHK" }],
        properties: [],
        floorPlans: [],
        floorPlanPanelEnabled: true,
        downloadCta: { label: "Download", action: "enquire" },
        visitCta: { label: "Visit", action: "enquire" },
      },
      sectionSettings: {
        hero: { enabled: true, anchor: "overview", paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0 },
      },
    });

    const draft = partialSite({
      ...saved,
      header: {
        ...saved.header,
        brochureButton: {
          ...saved.header!.brochureButton,
          enabled: false,
        },
      },
      hero: {
        ...saved.hero!,
        primaryCTAEnabled: false,
      },
      amenities: {
        ...saved.amenities!,
        lifestyleCardsEnabled: false,
        visitCtaEnabled: false,
      },
      homes: {
        ...saved.homes!,
        floorPlanPanelEnabled: false,
      },
      sectionSettings: {
        hero: { enabled: false, anchor: "overview", paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0 },
      },
    });

    const exported = prepareSiteDataForExport(draft, saved);
    const parsed = JSON.parse(siteDataToExportJson(exported)) as SiteData;

    assert.equal(parsed.header.brochureButton.enabled, false);
    assert.equal(parsed.hero.primaryCTAEnabled, false);
    assert.equal(parsed.amenities.lifestyleCardsEnabled, false);
    assert.equal(parsed.amenities.visitCtaEnabled, false);
    assert.equal(parsed.homes.floorPlanPanelEnabled, false);
    assert.equal(parsed.sectionSettings?.hero?.enabled, false);
  });

  it("keeps theme gradients and custom gradients when draft theme is incomplete", () => {
    const saved = partialSite({
      site: { name: "Amoghaa" },
      theme: {
        primary: "#0B1F35",
        secondary: "#B98945",
        accent: "#D3A45F",
        button: "#B98945",
        buttonText: "#FFFFFF",
        background: "#FFFFFF",
        lightBackground: "#F7F5F0",
        text: "#142033",
        mutedText: "#667085",
        darkSection: "#062536",
        whatsapp: "#2E7D4F",
        titleColor: "#0B1F35",
        descriptionColor: "#667085",
        primaryButton: "#B98945",
        primaryButtonText: "#FFFFFF",
        secondaryButton: "#0B1F35",
        secondaryButtonText: "#FFFFFF",
        cardBackground: "#FFFFFF",
        borderColor: "#E5E7EB",
        gradients: {
          secondary: "golden",
          primaryButton: "metallic",
        },
      },
      customButtonGradients: [
        {
          id: "custom-sunset",
          label: "Sunset",
          css: "linear-gradient(135deg, #ff7a18, #af002d)",
        },
      ],
    });

    const draft = partialSite({
      site: { name: "Amoghaa" },
      theme: {
        primary: "#061820",
        secondary: "#B98945",
        accent: "#D3A45F",
        button: "#B98945",
        buttonText: "#FFFFFF",
        background: "#FFFFFF",
        lightBackground: "#F7F5F0",
        text: "#142033",
        mutedText: "#667085",
        darkSection: "#062536",
        whatsapp: "#2E7D4F",
        titleColor: "#0B1F35",
        descriptionColor: "#667085",
        primaryButton: "#B98945",
        primaryButtonText: "#FFFFFF",
        secondaryButton: "#0B1F35",
        secondaryButtonText: "#FFFFFF",
        cardBackground: "#FFFFFF",
        borderColor: "#E5E7EB",
      },
    });

    const exported = prepareSiteDataForExport(draft, saved);
    const parsed = JSON.parse(siteDataToExportJson(exported)) as SiteData;

    assert.equal(parsed.theme.primary, "#061820");
    assert.equal(parsed.theme.gradients?.secondary, "golden");
    assert.equal(parsed.theme.gradients?.primaryButton, "metallic");
    assert.equal(parsed.customButtonGradients?.[0]?.id, "custom-sunset");
    assert.ok(parsed.customButtonGradients?.[0]?.css.includes("linear-gradient"));
  });

  it("preserves nested text colors, FAQ defaultOpen, and contact form height", () => {
    const saved = partialSite({
      site: { name: "Amoghaa" },
      homes: {
        label: "Homes",
        heading: "Homes",
        tabs: [{ id: "2bhk", label: "2BHK" }],
        properties: [
          {
            id: "home-1",
            tab: "2bhk",
            title: "2 BHK",
            subtitle: "Apartment",
            area: "1259 Sq.Ft.",
            price: "₹1.73 Cr*",
            priceNote: "Onwards",
            cta: { label: "View Details", action: "enquire", textColor: "#B98945" },
            floorPlanId: "plan-1",
            areaColor: "#142033",
            priceColor: "#B98945",
          },
        ],
        floorPlans: [
          {
            id: "plan-1",
            propertyId: "home-1",
            label: "2 BHK Plan",
            area: "1259 Sq.Ft.",
            image: "/images/floor-plan.webp",
            alt: "Plan",
            downloadUrl: "#enquire",
            labelColor: "#0B1F35",
            areaColor: "#667085",
          },
        ],
        downloadCta: { label: "Download", action: "enquire" },
        visitCta: { label: "Visit", action: "enquire" },
      },
      faqSection: {
        enabled: true,
        label: "FAQs",
        heading: "Questions",
        image: "/images/faq.webp",
        imageAlt: "FAQ",
        backgroundColor: "#f7f3ed",
        defaultOpen: "collapsed",
        itemSpacing: -8,
        questionMinHeight: 56,
        questionPaddingY: 12,
        answerPaddingY: 16,
        items: [{ question: "Q?", answer: "<p>A</p>" }],
      },
      contactSection: {
        enabled: true,
        label: "Contact",
        heading: "Get in Touch",
        image: "/images/contact.webp",
        formMinHeight: 640,
        fieldLabelColor: "#9b6d30",
      },
    });

    const draft = partialSite({
      site: { name: "Amoghaa" },
      homes: saved.homes,
      faqSection: {
        enabled: true,
        label: "FAQs",
        heading: "Questions",
        image: "/images/faq.webp",
        imageAlt: "FAQ",
        backgroundColor: "#f7f3ed",
        items: [{ question: "Q?", answer: "<p>A</p>" }],
      },
      contactSection: {
        enabled: true,
        label: "Contact",
        heading: "Get in Touch",
        image: "/images/contact.webp",
      },
    });

    const exported = prepareSiteDataForExport(draft, saved);
    const parsed = JSON.parse(siteDataToExportJson(exported)) as SiteData;

    assert.equal(parsed.homes.properties[0]?.areaColor, "#142033");
    assert.equal(parsed.homes.properties[0]?.priceColor, "#B98945");
    assert.equal(parsed.homes.properties[0]?.cta.textColor, "#B98945");
    assert.equal(parsed.homes.floorPlans[0]?.labelColor, "#0B1F35");
    assert.equal(parsed.homes.floorPlans[0]?.areaColor, "#667085");
    assert.equal(parsed.faqSection?.defaultOpen, "collapsed");
    assert.equal(parsed.faqSection?.itemSpacing, -8);
    assert.equal(parsed.faqSection?.questionMinHeight, 56);
    assert.equal(parsed.faqSection?.questionPaddingY, 12);
    assert.equal(parsed.faqSection?.answerPaddingY, 16);
    assert.equal(parsed.contactSection?.formMinHeight, 640);
    assert.equal(parsed.contactSection?.fieldLabelColor, "#9b6d30");
  });
});

describe("siteDataToExportJson", () => {
  it("preserves rich HTML in FAQ answers", () => {
    const html = "<p>Text with <b>bold</b> and <a href=\"#enquire\">link</a></p>";
    const data = partialSite({
      site: { name: "Amoghaa" },
      faqSection: {
        enabled: true,
        label: "FAQ",
        heading: "Questions",
        items: [{ question: "Q?", answer: html }],
      },
    });

    const json = siteDataToExportJson(data);
    const parsed = JSON.parse(json) as SiteData;
    assert.equal(parsed.faqSection?.items?.[0]?.answer, html);
    assert.ok(json.includes("<b>bold</b>"));
    assert.ok(json.includes("#enquire"));
  });

  it("preserves image URLs unchanged", () => {
    const data = partialSite({
      site: { name: "Amoghaa" },
      hero: {
        backgroundImage: "/uploads/hero.webp",
        description: "Hero",
      },
    });

    const json = siteDataToExportJson(data);
    assert.ok(json.includes('"/uploads/hero.webp"'));
    const parsed = JSON.parse(json) as SiteData;
    assert.equal(parsed.hero?.backgroundImage, "/uploads/hero.webp");
  });

  it("does not alphabetize nested object keys", () => {
    const data = partialSite({
      site: { name: "Amoghaa" },
      about: {
        zebra: "last",
        alpha: "first",
      },
    });

    const json = siteDataToExportJson(data);
  const zebraIndex = json.indexOf('"zebra"');
  const alphaIndex = json.indexOf('"alpha"');
    assert.ok(zebraIndex > -1 && alphaIndex > -1);
    assert.ok(zebraIndex < alphaIndex, "nested keys should keep insertion order, not be sorted");
  });
});
