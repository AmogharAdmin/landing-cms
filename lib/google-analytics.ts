import type { GoogleAnalytics } from "@/types/site";

const GA4_ID = /^G-[A-Z0-9]+$/i;

export function isValidGa4MeasurementId(value: string | undefined | null): boolean {
  return Boolean(value && GA4_ID.test(value.trim()));
}

export function normalizeGoogleAnalytics(
  value: GoogleAnalytics | undefined | null,
): GoogleAnalytics {
  return {
    enabled: value?.enabled === true,
    measurementId: (value?.measurementId || "").trim(),
    gtmContainerId: (value?.gtmContainerId || "").trim().toUpperCase(),
  };
}

/** Ready to inject on the public site: enabled + valid GA4 Measurement ID. */
export function isGoogleAnalyticsConnected(
  value: GoogleAnalytics | undefined | null,
): boolean {
  const config = normalizeGoogleAnalytics(value);
  return config.enabled && isValidGa4MeasurementId(config.measurementId);
}

export type GoogleAnalyticsStatus = "disabled" | "incomplete" | "connected";

export function resolveGoogleAnalyticsStatus(
  value: GoogleAnalytics | undefined | null,
): GoogleAnalyticsStatus {
  const config = normalizeGoogleAnalytics(value);
  if (!config.enabled) return "disabled";
  if (!isValidGa4MeasurementId(config.measurementId)) return "incomplete";
  return "connected";
}
