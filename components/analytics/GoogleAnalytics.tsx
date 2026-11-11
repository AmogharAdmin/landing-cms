"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import type { GoogleAnalytics as GoogleAnalyticsConfig } from "@/types/site";
import {
  isGoogleAnalyticsConnected,
  normalizeGoogleAnalytics,
} from "@/lib/google-analytics";

export function GoogleAnalytics({ config }: { config?: GoogleAnalyticsConfig }) {
  const pathname = usePathname() || "";
  if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
    return null;
  }

  const resolved = normalizeGoogleAnalytics(config);
  if (!isGoogleAnalyticsConnected(resolved)) return null;

  const measurementId = resolved.measurementId.trim().toUpperCase();

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="lazyOnload"
      />
      <Script id="ga4-config" strategy="lazyOnload">{`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}', { send_page_view: true });
      `}</Script>
    </>
  );
}
