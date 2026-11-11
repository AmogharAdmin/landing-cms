import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildBuildeskLeadPayload,
  buildBuildeskRemark,
  normalizeBuildeskMobile,
  resolveBuildeskSubSource,
} from "@/lib/buildesk-crm";

const baseConfig = {
  enabled: true,
  apiKey: "test-key",
  projectName: "District 25",
  source: "website",
  subSource: "Landing",
  dialCode: 91,
  remark: "Site lead",
};

describe("buildesk CRM payload", () => {
  it("normalizes Indian mobiles with dial code stripped", () => {
    assert.equal(normalizeBuildeskMobile("+91 9953384949", 91), "9953384949");
    assert.equal(normalizeBuildeskMobile("09953384949", 91), "9953384949");
    assert.equal(normalizeBuildeskMobile("9953384949", 91), "9953384949");
  });

  it("uses each form name in SubSource (not only brochure)", () => {
    assert.equal(
      resolveBuildeskSubSource(baseConfig, { formLabel: "Download brochure", formSource: "brochure" }),
      "Landing · Download brochure",
    );
    assert.equal(
      resolveBuildeskSubSource(baseConfig, { formLabel: "General enquiry", formSource: "default" }),
      "Landing · General enquiry",
    );
    assert.equal(
      resolveBuildeskSubSource(baseConfig, { formLabel: "New form variant", formSource: "intent-xyz" }),
      "Landing · New form variant",
    );
    assert.equal(
      resolveBuildeskSubSource({ ...baseConfig, subSource: "" }, { formLabel: "Get in Touch", formSource: "contact" }),
      "Get in Touch",
    );
  });

  it("builds remark with form + custom fields for any intent", () => {
    const remark = buildBuildeskRemark(baseConfig, {
      name: "Asha",
      phone: "9953384949",
      formLabel: "General enquiry",
      formSource: "default",
      clickSource: "Hero · Enquire",
      customFields: { Budget: "1 Cr+" },
      message: "Call me",
    });
    assert.match(remark, /Form: General enquiry/);
    assert.match(remark, /Click: Hero · Enquire/);
    assert.match(remark, /Call me/);
    assert.match(remark, /Budget: 1 Cr\+/);
  });

  it("tags UTM / Designation with the dynamic form for every lead", () => {
    const brochure = buildBuildeskLeadPayload(baseConfig, {
      name: "Ravi Kumar",
      phone: "+91 9953384949",
      formLabel: "Download brochure",
      formSource: "brochure",
    });
    assert.equal(brochure.SubSource, "Landing · Download brochure");
    assert.equal(brochure.UtmCampaign, "Download brochure");
    assert.equal(brochure.UtmContent, "brochure");
    assert.equal(brochure.Mobile, "9953384949");
    assert.equal(brochure.Designation, "Download brochure");

    const custom = buildBuildeskLeadPayload(baseConfig, {
      name: "Ravi",
      phone: "9953384949",
      formLabel: "Site visit form",
      formSource: "intent-abc",
      clickSource: "Sticky · Enquire",
    });
    assert.equal(custom.SubSource, "Landing · Site visit form");
    assert.equal(custom.UtmCampaign, "Site visit form");
    assert.equal(custom.UtmContent, "intent-abc");
    assert.equal(custom.UtmTerm, "Sticky · Enquire");
    assert.equal(custom.GCLId, "");
  });

  it("sends Google Ads utm_term and gclid when present", () => {
    const payload = buildBuildeskLeadPayload(baseConfig, {
      name: "Ravi",
      phone: "9953384949",
      formLabel: "General enquiry",
      formSource: "default",
      clickSource: "Hero · Enquire",
      utmTerm: "3 bhk villas",
      gclid: "Cj0KCQ_abc-123",
    });
    assert.equal(payload.UtmTerm, "3 bhk villas");
    assert.equal(payload.GCLId, "Cj0KCQ_abc-123");
  });
});
