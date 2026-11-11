"use client";

import { useEffect, useRef } from "react";
import { getAnalyticsSessionKey } from "@/lib/analytics-session";

const HEARTBEAT_MS = 60_000;
const SCROLL_THRESHOLD = 50;

type BrowserUserAgentData = {
  brands?: Array<{ brand: string; version: string }>;
  mobile?: boolean;
  platform?: string;
};

function clientContext() {
  const navigatorWithHints = navigator as Navigator & { userAgentData?: BrowserUserAgentData };
  const hints = navigatorWithHints.userAgentData;
  if (!hints) return undefined;

  const brands = hints.brands?.map((entry) => entry.brand.toLowerCase()) || [];
  let browser: string | undefined;
  if (brands.some((brand) => brand.includes("edge"))) browser = "Edge";
  else if (brands.some((brand) => brand.includes("opera"))) browser = "Opera";
  else if (brands.some((brand) => brand.includes("chrome") || brand.includes("chromium"))) browser = "Chrome";

  const platform = hints.platform?.toLowerCase();
  const os = platform === "macos" ? "macOS"
    : platform === "windows" ? "Windows"
      : platform === "android" ? "Android"
        : platform === "ios" ? "iOS"
          : platform === "linux" ? "Linux"
            : undefined;

  return {
    browser,
    os,
    deviceType: hints.mobile ? "mobile" : "desktop",
  };
}

function shouldTrack() {
  if (process.env.NODE_ENV !== "production") return false;
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  return !path.startsWith("/admin") && !path.startsWith("/dashboard");
}

function trafficSource() {
  const params = new URLSearchParams(window.location.search);
  let referrer = "";
  try {
    if (document.referrer) {
      const url = new URL(document.referrer);
      if (url.hostname !== window.location.hostname) referrer = document.referrer;
    }
  } catch {
    referrer = "";
  }

  return {
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
    utmTerm: params.get("utm_term") || undefined,
    utmContent: params.get("utm_content") || undefined,
    gclid: params.get("gclid") || undefined,
    referrer: referrer || undefined,
    landingPath: window.location.pathname,
  };
}

function sendCollect(payload: {
  sessionKey: string;
  scrolled?: boolean;
  maxScrollPct?: number;
  durationSeconds?: number;
  client?: ReturnType<typeof clientContext>;
  source?: ReturnType<typeof trafficSource>;
}) {
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/collect", blob);
    return;
  }
  void fetch("/api/analytics/collect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}

export function AnalyticsTracker() {
  const startedAt = useRef(0);
  const maxScrollPct = useRef(0);
  const scrolled = useRef(false);
  const lastSentAt = useRef(0);

  useEffect(() => {
    if (!shouldTrack()) return;

    startedAt.current = Date.now();
    const sessionKey = getAnalyticsSessionKey();
    if (!sessionKey) return;
    const client = clientContext();
    let source: ReturnType<typeof trafficSource> | undefined = trafficSource();

    const flush = (force = false) => {
      const now = Date.now();
      if (!force && now - lastSentAt.current < 10_000) return;
      lastSentAt.current = now;
      sendCollect({
        sessionKey,
        scrolled: scrolled.current,
        maxScrollPct: maxScrollPct.current,
        durationSeconds: Math.round((now - startedAt.current) / 1000),
        client,
        source,
      });
      source = undefined;
    };

    flush(true);

    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const scrollHeight = doc.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const pct = Math.round((scrollTop / scrollHeight) * 100);
      if (pct > maxScrollPct.current) maxScrollPct.current = pct;
      if (pct >= SCROLL_THRESHOLD) scrolled.current = true;
      flush();
    };

    let scrollTimer: number | undefined;
    const throttledScroll = () => {
      if (scrollTimer) return;
      scrollTimer = window.setTimeout(() => {
        scrollTimer = undefined;
        onScroll();
      }, 400);
    };

    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === "visible") flush();
    }, HEARTBEAT_MS);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush(true);
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", () => flush(true));

    return () => {
      window.clearInterval(heartbeat);
      if (scrollTimer) window.clearTimeout(scrollTimer);
      window.removeEventListener("scroll", throttledScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
