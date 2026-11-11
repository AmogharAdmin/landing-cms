"use client";

import { MessageCircle } from "lucide-react";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { whatsappUrl, resolveWhatsappMessage } from "@/lib/cta";
import { enquireHash } from "@/lib/enquiry";
import { leadClickSourceById } from "@/lib/lead-form-buttons";
import { ctaClickHandler } from "@/lib/analytics-events";
import { Button } from "@/components/ui/Button";
import { textStyle } from "@/lib/typography";

export function StickyCTA() {
  const siteData = useSiteData();
  const { stickyCTA, site } = siteData;

  if (!stickyCTA.enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="pointer-events-auto border-t border-[var(--color-primary)]/8 bg-white/95 shadow-[0_-10px_30px_rgba(11,31,53,0.08)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p className="hidden font-serif text-[18px] text-[var(--color-primary)] sm:block" style={textStyle(stickyCTA, "message")}>
            {stickyCTA.message}
          </p>
          <div className="flex w-full items-center gap-2 sm:w-auto sm:justify-end">
            <Button
              href={enquireHash(stickyCTA.enquireIntent)}
              leadClickSource={leadClickSourceById.stickyEnquire}
              className="flex-1 sm:flex-none"
              showArrow
              backgroundType={stickyCTA.enquireButtonBackgroundType}
              backgroundColor={stickyCTA.enquireButtonColor}
              backgroundGradient={stickyCTA.enquireButtonGradient}
              textColor={stickyCTA.enquireButtonTextColor}
            >
              {stickyCTA.enquireLabel}
            </Button>
            <Button
              href={whatsappUrl(site.whatsapp, resolveWhatsappMessage(site))}
              variant="whatsapp"
              className="flex-1 sm:flex-none"
              showArrow={false}
              ariaLabel={stickyCTA.whatsappLabel}
              backgroundType={stickyCTA.whatsappButtonBackgroundType}
              backgroundColor={stickyCTA.whatsappButtonColor}
              backgroundGradient={stickyCTA.whatsappButtonGradient}
              textColor={stickyCTA.whatsappButtonTextColor}
              onClick={ctaClickHandler("whatsapp", "Sticky bar · WhatsApp")}
            >
              <span className="inline-flex items-center gap-2">
                <MessageCircle className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{stickyCTA.whatsappLabel}</span>
                <span className="sm:hidden">WhatsApp</span>
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
