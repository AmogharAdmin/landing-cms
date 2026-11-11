import Script from "next/script";
import type { GoogleAnalytics, GoogleTagManager as GoogleTagManagerConfig } from "@/types/site";
import {
  isGoogleTagManagerConnected,
  normalizeGoogleTagManager,
} from "@/lib/google-tag-manager";
import { GtmInteractionTracker } from "@/components/analytics/GtmInteractionTracker";

export function GoogleTagManager({
  config,
  legacyGoogleAnalytics,
  projectName,
}: {
  config?: GoogleTagManagerConfig;
  legacyGoogleAnalytics?: GoogleAnalytics;
  projectName: string;
}) {
  const resolved = normalizeGoogleTagManager(config, legacyGoogleAnalytics);
  if (!isGoogleTagManagerConnected(resolved)) return null;

  // IDs are allow-listed before being embedded, preventing arbitrary CMS script injection.
  const containerId = resolved.containerId;

  return (
    <>
      <Script id="google-tag-manager" strategy="afterInteractive">{`
(function(w,d,s,l,i){w.__landingPageGtmEnabled=true;w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId}');
      `}</Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${containerId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
          aria-hidden="true"
        />
      </noscript>
      <GtmInteractionTracker projectName={projectName} />
    </>
  );
}
