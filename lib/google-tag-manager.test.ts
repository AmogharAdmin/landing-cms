import assert from "node:assert/strict";
import test from "node:test";
import {
  isGoogleTagManagerConnected,
  isValidGtmContainerId,
  normalizeGoogleTagManager,
  resolveGoogleTagManagerStatus,
} from "./google-tag-manager";

test("validates GTM web container IDs", () => {
  assert.equal(isValidGtmContainerId("GTM-ABC1234"), true);
  assert.equal(isValidGtmContainerId(" gtm-abc1234 "), true);
  assert.equal(isValidGtmContainerId("G-ABC1234"), false);
  assert.equal(isValidGtmContainerId("GTM-ABC 1234"), false);
  assert.equal(isValidGtmContainerId("<script>"), false);
});

test("requires both the toggle and a valid ID before connecting", () => {
  assert.equal(resolveGoogleTagManagerStatus({ enabled: false, containerId: "GTM-ABC1234" }), "disabled");
  assert.equal(resolveGoogleTagManagerStatus({ enabled: true, containerId: "" }), "incomplete");
  assert.equal(resolveGoogleTagManagerStatus({ enabled: true, containerId: "invalid" }), "incomplete");
  assert.equal(resolveGoogleTagManagerStatus({ enabled: true, containerId: "GTM-ABC1234" }), "connected");
  assert.equal(isGoogleTagManagerConnected({ enabled: true, containerId: "GTM-ABC1234" }), true);
});

test("normalizes dashboard input and migrates the legacy GA-coupled GTM field", () => {
  assert.deepEqual(normalizeGoogleTagManager({ enabled: true, containerId: " gtm-AbC1234 " }), {
    enabled: true,
    containerId: "GTM-ABC1234",
  });

  assert.deepEqual(
    normalizeGoogleTagManager(undefined, {
      enabled: true,
      measurementId: "G-TEST123",
      gtmContainerId: "gtm-old123",
    }),
    { enabled: true, containerId: "GTM-OLD123" },
  );
});
