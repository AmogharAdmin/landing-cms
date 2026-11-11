import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyGtmClick,
  configureGtmEventContext,
  pushGtmEvent,
  safeGtmLinkDestination,
} from "./google-tag-manager-events";

test("classifies public CTA destinations into stable GTM event names", () => {
  assert.equal(classifyGtmClick("tel:+919999999999"), "phone_click");
  assert.equal(classifyGtmClick("https://wa.me/919999999999?text=Hello"), "whatsapp_click");
  assert.equal(classifyGtmClick("#enquire/form/brochure"), "form_cta_click");
  assert.equal(classifyGtmClick("/brochure.pdf"), "file_download");
  assert.equal(classifyGtmClick("/about"), "link_click");
  assert.equal(classifyGtmClick(""), "button_click");
  assert.equal(classifyGtmClick("", "file_download"), "file_download");
});

test("removes sensitive phone numbers and query strings from link context", () => {
  assert.equal(safeGtmLinkDestination("tel:+919999999999"), "");
  assert.equal(safeGtmLinkDestination("https://wa.me/919999999999?text=Hello"), "whatsapp");
  assert.equal(safeGtmLinkDestination("/brochure.pdf?token=secret"), "/brochure.pdf");
  assert.equal(safeGtmLinkDestination("https://example.com/path?token=secret#details"), "example.com/path#details");
});

test("queues project-scoped events only while GTM is enabled", () => {
  const globals = globalThis as typeof globalThis & { window?: Window };
  const previousWindow = globals.window;
  const dataLayer: unknown[] = [];
  globals.window = {
    __landingPageGtmEnabled: true,
    dataLayer,
    location: { pathname: "/" },
  } as unknown as Window & typeof globalThis;

  try {
    configureGtmEventContext("Example Project");
    assert.equal(pushGtmEvent("Form Submit Success", { form_id: "brochure", empty: "" }), true);
    assert.deepEqual(dataLayer[0], {
      event: "form_submit_success",
      project_name: "Example Project",
      page_path: "/",
      form_id: "brochure",
    });

    globals.window.__landingPageGtmEnabled = false;
    assert.equal(pushGtmEvent("button_click"), false);
    assert.equal(dataLayer.length, 1);
  } finally {
    if (previousWindow) globals.window = previousWindow;
    else Reflect.deleteProperty(globals, "window");
  }
});
