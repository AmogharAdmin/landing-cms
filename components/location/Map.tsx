"use client";

import { useSiteData } from "@/components/providers/SiteDataProvider";
import { toMapEmbedUrl } from "@/lib/map-embed";

export function Map() {
  const siteData = useSiteData();
  const { location } = siteData;
  const embedUrl = toMapEmbedUrl(location.mapEmbedUrl);

  return (
    <div
      id="location-map"
      className="h-full min-h-[280px] overflow-hidden rounded-lg [background:var(--fill-light)] sm:min-h-[320px]"
    >
      {embedUrl ? (
        <iframe
          title={location.mapTitle}
          src={embedUrl}
          className="h-[280px] min-h-[280px] w-full border-0 sm:h-[320px] sm:min-h-[320px] lg:h-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : null}
    </div>
  );
}
