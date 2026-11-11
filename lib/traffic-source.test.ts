import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyTrafficSource, channelLabel, sourceSummaryLabel } from "@/lib/traffic-source";
import { referrerHostFromUrl, sanitizeLandingPath } from "@/lib/attribution";

describe("traffic source classification", () => {
  it("treats any gclid as Google Ads", () => {
    assert.equal(classifyTrafficSource({ gclid: "Cj0_abc" }), "google_ads");
    assert.equal(classifyTrafficSource({ gclid: "Cj0_abc", referrerHost: "facebook.com" }), "google_ads");
  });

  it("detects Google paid tags", () => {
    assert.equal(classifyTrafficSource({ utmSource: "Google", utmMedium: "CPC" }), "google_ads");
    assert.equal(classifyTrafficSource({ utmSource: "google", utmMedium: "organic" }), "utm_other");
  });

  it("detects other paid mediums", () => {
    assert.equal(classifyTrafficSource({ utmSource: "facebook", utmMedium: "paid_social" }), "paid_other");
    assert.equal(classifyTrafficSource({ utmSource: "bing", utmMedium: "cpc" }), "paid_other");
  });

  it("detects email", () => {
    assert.equal(classifyTrafficSource({ utmSource: "mailchimp", utmMedium: "email" }), "email");
    assert.equal(classifyTrafficSource({ utmSource: "newsletter" }), "email");
  });

  it("detects social from tags or referrer", () => {
    assert.equal(classifyTrafficSource({ utmSource: "instagram" }), "social");
    assert.equal(classifyTrafficSource({ utmMedium: "social", utmSource: "abc" }), "social");
    assert.equal(classifyTrafficSource({ referrerHost: "l.facebook.com" }), "social");
    assert.equal(classifyTrafficSource({ referrerHost: "t.co" }), "social");
  });

  it("falls back to other UTM when tags do not match a known channel", () => {
    assert.equal(classifyTrafficSource({ utmCampaign: "launch" }), "utm_other");
    assert.equal(classifyTrafficSource({ utmTerm: "3 bhk", referrerHost: "google.com" }), "utm_other");
  });

  it("detects organic search, referral and direct", () => {
    assert.equal(classifyTrafficSource({ referrerHost: "www.google.co.in" }), "organic_search");
    assert.equal(classifyTrafficSource({ referrerHost: "duckduckgo.com" }), "organic_search");
    assert.equal(classifyTrafficSource({ referrerHost: "99acres.com" }), "referral");
    assert.equal(classifyTrafficSource({}), "direct");
  });

  it("builds readable labels with defaults", () => {
    assert.equal(sourceSummaryLabel({ utmSource: "google", utmMedium: "cpc", utmCampaign: "Villas" }), "google / cpc · Villas");
    assert.equal(sourceSummaryLabel({ utmSource: "newsletter" }), "newsletter / (not set)");
    assert.equal(sourceSummaryLabel({ referrerHost: "instagram.com" }), "instagram.com");
    assert.equal(sourceSummaryLabel({}), "Direct / not set");
    assert.equal(channelLabel("nope"), "Direct / not set");
    assert.equal(channelLabel("google_ads"), "Google Ads");
  });
});

describe("referrer and landing helpers", () => {
  it("extracts hostnames and rejects junk", () => {
    assert.equal(referrerHostFromUrl("https://www.Google.com/search?q=x"), "google.com");
    assert.equal(referrerHostFromUrl("javascript:alert(1)"), "");
    assert.equal(referrerHostFromUrl("not a url"), "");
    assert.equal(referrerHostFromUrl(""), "");
  });

  it("keeps a safe path only", () => {
    assert.equal(sanitizeLandingPath("/"), "/");
    assert.equal(sanitizeLandingPath("/offers<script>"), "/offersscript");
    assert.equal(sanitizeLandingPath("https://evil.com"), "");
  });
});
