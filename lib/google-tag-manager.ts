import type { GoogleAnalytics, GoogleTagManager } from "@/types/site";

const GTM_CONTAINER_ID = /^GTM-[A-Z0-9]+$/i;

export function isValidGtmContainerId(value: string | undefined | null): boolean {
  return Boolean(value && GTM_CONTAINER_ID.test(value.trim()));
}

export function normalizeGoogleTagManager(
  value: GoogleTagManager | undefined | null,
  legacyGoogleAnalytics?: GoogleAnalytics | undefined | null,
): GoogleTagManager {
  if (value) {
    return {
      enabled: value.enabled === true,
      containerId: (value.containerId || "").trim().toUpperCase(),
    };
  }

  const legacyContainerId = (legacyGoogleAnalytics?.gtmContainerId || "").trim().toUpperCase();
  return {
    enabled: legacyGoogleAnalytics?.enabled === true && isValidGtmContainerId(legacyContainerId),
    containerId: legacyContainerId,
  };
}

export function isGoogleTagManagerConnected(
  value: GoogleTagManager | undefined | null,
  legacyGoogleAnalytics?: GoogleAnalytics | undefined | null,
): boolean {
  const config = normalizeGoogleTagManager(value, legacyGoogleAnalytics);
  return config.enabled && isValidGtmContainerId(config.containerId);
}

export type GoogleTagManagerStatus = "disabled" | "incomplete" | "connected";

export function resolveGoogleTagManagerStatus(
  value: GoogleTagManager | undefined | null,
  legacyGoogleAnalytics?: GoogleAnalytics | undefined | null,
): GoogleTagManagerStatus {
  const config = normalizeGoogleTagManager(value, legacyGoogleAnalytics);
  if (!config.enabled) return "disabled";
  if (!isValidGtmContainerId(config.containerId)) return "incomplete";
  return "connected";
}
