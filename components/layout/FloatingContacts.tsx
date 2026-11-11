"use client";

import { Phone } from "lucide-react";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import {
  DEFAULT_CALL_BUTTON_COLOR,
  DEFAULT_WHATSAPP_BUTTON_COLOR,
  resolveWhatsappMessage,
  telUrl,
  whatsappUrl,
} from "@/lib/cta";
import { enquireHash } from "@/lib/enquiry";
import { extraLeadClickSources } from "@/lib/lead-form-buttons";
import { leadClickHandler } from "@/lib/lead-click-source";
import { leadCtaGtmDomAttrs } from "@/lib/lead-form-gtm";
import { ctaClickHandler } from "@/lib/analytics-events";
import { resolveButtonBackgroundStyle } from "@/lib/button-background";
import { floatingButtonLabelStyle } from "@/lib/typography";
import { Icon } from "@/components/ui/Icon";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" className="size-6 fill-current" aria-hidden="true">
      <path d="M16.05 3A12.82 12.82 0 0 0 5.1 22.48L3.4 28.7l6.37-1.67A12.83 12.83 0 1 0 16.05 3Zm0 23.47a10.62 10.62 0 0 1-5.42-1.48l-.39-.23-3.78.99 1.01-3.68-.25-.4a10.63 10.63 0 1 1 8.83 4.8Zm5.83-7.96c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.72.16-.21.32-.82 1.04-1.01 1.25-.18.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.58a9.54 9.54 0 0 1-1.77-2.2c-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.18.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.66s1.14 3.08 1.3 3.29c.16.21 2.25 3.43 5.44 4.81.76.33 1.35.52 1.81.67.76.24 1.46.21 2.01.13.61-.09 1.89-.77 2.15-1.52.27-.74.27-1.38.19-1.52-.08-.13-.29-.21-.61-.37Z" />
    </svg>
  );
}

export function FloatingContacts() {
  const siteData = useSiteData();
  const { site, floatingButton, customButtonGradients } = siteData;
  const message = resolveWhatsappMessage(site);
  const callBgStyle = resolveButtonBackgroundStyle(
    {
      backgroundType: site.callButtonBackgroundType,
      backgroundColor: (site.callButtonColor || "").trim() || DEFAULT_CALL_BUTTON_COLOR,
      backgroundGradient: site.callButtonGradient,
    },
    customButtonGradients,
  );
  const whatsappBgStyle = resolveButtonBackgroundStyle(
    {
      backgroundType: site.whatsappButtonBackgroundType,
      backgroundColor: (site.whatsappButtonColor || "").trim() || DEFAULT_WHATSAPP_BUTTON_COLOR,
      backgroundGradient: site.whatsappButtonGradient,
    },
    customButtonGradients,
  );

  const showFormButton = floatingButton?.enabled !== false;
  const formLabel = floatingButton?.label?.trim() || "Enquire Now";
  const formIcon = floatingButton?.icon?.trim() || "file-text";
  const formIntent = floatingButton?.intent?.trim() || "default";
  const formColor = floatingButton?.textColor || "#ffffff";
  const formBgStyle = resolveButtonBackgroundStyle(
    {
      backgroundType: floatingButton?.backgroundType,
      backgroundColor: floatingButton?.backgroundColor || "#b98945",
      backgroundGradient: floatingButton?.backgroundGradient,
    },
    customButtonGradients,
  );
  const labelStyle = floatingButton ? floatingButtonLabelStyle(floatingButton) : {};

  return (
    <>
      {showFormButton ? (
        <aside aria-label="Quick enquiry side button" className="fixed right-0 top-1/2 z-40 -translate-y-1/2">
          <a
            href={enquireHash(formIntent)}
            onClick={leadClickHandler(enquireHash(formIntent), extraLeadClickSources.floatingSideTab)}
            aria-label={formLabel}
            className="group flex flex-col items-center justify-center gap-2 rounded-l-xl rounded-r-none border-y-2 border-l-2 border-white/90 py-3.5 px-2 text-center font-medium shadow-[-4px_6px_25px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-x-1 hover:brightness-105 active:scale-95 sm:px-2.5 sm:py-4"
            style={{ ...formBgStyle, color: formColor }}
            {...leadCtaGtmDomAttrs(extraLeadClickSources.floatingSideTab)}
          >
            <Icon
              name={formIcon}
              className="size-4 shrink-0 transition-transform duration-300 group-hover:scale-115"
            />
            <span
              className={`flex flex-col items-center font-semibold uppercase leading-none tracking-normal select-none${labelStyle.fontSize ? "" : " text-[10px] sm:text-[11px]"}`}
              style={labelStyle}
              aria-hidden="true"
            >
              {formLabel.split("").map((char, index) =>
                char === " " ? (
                  <span key={index} className="h-1.5 sm:h-2" />
                ) : (
                  <span key={index} className="my-[1px]">
                    {char}
                  </span>
                ),
              )}
            </span>
          </a>
        </aside>
      ) : null}

      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex items-center justify-between px-5 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:px-0">
        <a
          href={telUrl(site.phone)}
          aria-label={`Call ${site.phone}`}
          className="pointer-events-auto inline-flex size-13 items-center justify-center rounded-full border-2 border-white text-white shadow-[0_8px_28px_rgba(0,0,0,0.28)] transition-opacity hover:opacity-90 sm:hidden"
          style={callBgStyle}
          onPointerDown={ctaClickHandler("floating_call", "Floating · Call")}
          onClick={ctaClickHandler("floating_call", "Floating · Call")}
        >
          <Phone className="size-5" aria-hidden="true" />
        </a>

        <a
          href={whatsappUrl(site.whatsapp, message)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="pointer-events-auto inline-flex size-13 items-center justify-center rounded-full border-2 border-white text-white shadow-[0_8px_28px_rgba(0,0,0,0.28)] transition-opacity hover:opacity-90 sm:size-14"
          style={whatsappBgStyle}
          onPointerDown={ctaClickHandler("whatsapp", "Floating · WhatsApp")}
          onClick={ctaClickHandler("whatsapp", "Floating · WhatsApp")}
        >
          <WhatsAppIcon />
        </a>
      </div>
    </>
  );
}
