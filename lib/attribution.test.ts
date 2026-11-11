import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  GCLID_COOKIE,
  UTM_TERM_COOKIE,
  appendAttribution,
  attributionFromCookieHeader,
  attributionFromSearch,
  captureAttributionFromUrl,
  mergeAttribution,
  readAttribution,
  sanitizeGclid,
  sanitizeUtmTerm,
} from "@/lib/attribution";

type FakeBrowser = { jar: Map<string, string>; writes: string[]; setSearch: (search: string) => void };

function installFakeBrowser(protocol = "https:"): FakeBrowser {
  const jar = new Map<string, string>();
  const writes: string[] = [];
  const location = { protocol, search: "" };
  const fakeDocument = {
    get cookie() {
      return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
    },
    set cookie(raw: string) {
      writes.push(raw);
      const [pair] = raw.split(";");
      const index = pair.indexOf("=");
      jar.set(pair.slice(0, index), pair.slice(index + 1));
    },
  };
  Object.assign(globalThis, { window: { location }, document: fakeDocument });
  return { jar, writes, setSearch: (search) => { location.search = search; } };
}

function removeFakeBrowser() {
  const scope = globalThis as Record<string, unknown>;
  delete scope.window;
  delete scope.document;
}

describe("attribution sanitizing", () => {
  it("decodes + and %20 in utm_term", () => {
    assert.equal(sanitizeUtmTerm("3+bhk+villas"), "3 bhk villas");
    assert.equal(sanitizeUtmTerm("3%20bhk%20villas"), "3 bhk villas");
    assert.equal(sanitizeUtmTerm("3%2520bhk"), "3 bhk");
    assert.equal(attributionFromSearch("?utm_term=luxury+villas%20bangalore").utmTerm, "luxury villas bangalore");
  });

  it("strips markup characters, control characters and bad encodings", () => {
    assert.equal(sanitizeUtmTerm("<script>alert(1)</script>"), "script alert(1) /script");
    assert.equal(sanitizeUtmTerm("villa\u0000\nplots"), "villa plots");
    assert.equal(sanitizeUtmTerm("%E0%A4%A"), "%E0%A4%A");
    assert.equal(sanitizeUtmTerm(undefined), "");
  });

  it("limits lengths", () => {
    assert.equal(sanitizeUtmTerm("a".repeat(500)).length, 200);
    assert.equal(sanitizeGclid("a".repeat(255)).length, 255);
    assert.equal(sanitizeGclid("a".repeat(256)), "");
  });

  it("drops gclids with invalid characters", () => {
    assert.equal(sanitizeGclid("Cj0KCQiA_abc-123"), "Cj0KCQiA_abc-123");
    assert.equal(sanitizeGclid("abc<script>"), "");
    assert.equal(sanitizeGclid("abc def"), "");
    assert.equal(sanitizeGclid("abc;drop"), "");
  });

  it("reads both values from a cookie header on the server", () => {
    const header = `foo=1; ${UTM_TERM_COOKIE}=3%20bhk%20villas; ${GCLID_COOKIE}=Cj0_x-1`;
    assert.deepEqual(attributionFromCookieHeader(header), { utmTerm: "3 bhk villas", gclid: "Cj0_x-1" });
    assert.deepEqual(attributionFromCookieHeader(null), { utmTerm: "", gclid: "" });
  });
});

describe("attribution merge", () => {
  it("never overwrites a stored value with an empty one", () => {
    const stored = { utmTerm: "villas", gclid: "G1" };
    assert.deepEqual(mergeAttribution(stored, { utmTerm: "", gclid: "" }), stored);
    assert.deepEqual(mergeAttribution(stored, { utmTerm: "", gclid: "G2" }), { utmTerm: "villas", gclid: "G2" });
  });

  it("lets the latest valid click win", () => {
    assert.deepEqual(
      mergeAttribution({ utmTerm: "villas", gclid: "G1" }, { utmTerm: "plots", gclid: "G2" }),
      { utmTerm: "plots", gclid: "G2" },
    );
  });
});

describe("attribution cookies in the browser", () => {
  let browser: FakeBrowser;
  beforeEach(() => { browser = installFakeBrowser(); });
  afterEach(removeFakeBrowser);

  it("A: stores both values with 90-day, Lax, Secure cookies", () => {
    captureAttributionFromUrl("?utm_term=3+bhk&gclid=G1");
    assert.deepEqual(readAttribution(), { utmTerm: "3 bhk", gclid: "G1" });
    assert.equal(browser.writes.length, 2);
    for (const write of browser.writes) {
      assert.match(write, /; path=\/; max-age=7776000; SameSite=Lax; Secure$/);
    }
  });

  it("B/C: stores only the value that is present", () => {
    captureAttributionFromUrl("?utm_term=villas");
    assert.deepEqual(readAttribution(), { utmTerm: "villas", gclid: "" });
    captureAttributionFromUrl("?gclid=G9");
    assert.deepEqual(readAttribution(), { utmTerm: "villas", gclid: "G9" });
  });

  it("D: a later visit without parameters keeps the stored values", () => {
    captureAttributionFromUrl("?utm_term=villas&gclid=G1");
    const writes = browser.writes.length;
    captureAttributionFromUrl("");
    captureAttributionFromUrl("?utm_term=&gclid=");
    captureAttributionFromUrl("?gclid=not%20valid");
    assert.equal(browser.writes.length, writes);
    assert.deepEqual(readAttribution(), { utmTerm: "villas", gclid: "G1" });
  });

  it("E: a new ad click replaces the old values", () => {
    captureAttributionFromUrl("?utm_term=villas&gclid=G1");
    captureAttributionFromUrl("?utm_term=plots&gclid=G2");
    assert.deepEqual(readAttribution(), { utmTerm: "plots", gclid: "G2" });
  });

  it("omits Secure on plain http", () => {
    removeFakeBrowser();
    browser = installFakeBrowser("http:");
    captureAttributionFromUrl("?utm_term=villas");
    assert.doesNotMatch(browser.writes[0], /Secure/);
  });

  it("appends utm_term and gclid to lead submissions only when present", () => {
    const empty = new URLSearchParams({ name: "Asha" });
    appendAttribution(empty);
    assert.equal(empty.has("utm_term"), false);
    assert.equal(empty.has("gclid"), false);

    captureAttributionFromUrl("?utm_term=villas&gclid=G1");
    browser.setSearch("");
    const params = new URLSearchParams({ name: "Asha" });
    appendAttribution(params);
    assert.equal(params.get("utm_term"), "villas");
    assert.equal(params.get("gclid"), "G1");
  });
});

describe("attribution on the server", () => {
  it("is a no-op without window or document", () => {
    removeFakeBrowser();
    assert.deepEqual(captureAttributionFromUrl("?utm_term=x"), { utmTerm: "", gclid: "" });
    assert.deepEqual(readAttribution(), { utmTerm: "", gclid: "" });
    const params = new URLSearchParams();
    appendAttribution(params);
    assert.equal(params.toString(), "");
  });
});
