"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Menu, Phone, X } from "lucide-react";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { resolveCtaHref } from "@/lib/cta";
import { leadClickSourceById } from "@/lib/lead-form-buttons";
import { leadClickHandler } from "@/lib/lead-click-source";
import { leadCtaGtmDomAttrs } from "@/lib/lead-form-gtm";
import { trackCtaClick } from "@/lib/analytics-events";
import {
  resolveHeaderBackgroundStyle,
  resolveHeaderButtonAppearance,
  resolveHeaderButtons,
  resolveHeaderChromeColors,
} from "@/lib/header";
import { resolveLogoBackgroundColor, resolveLogoHeights, resolveLogoWidths, hasSecondaryHeaderLogo, primaryLogoAppearance, secondaryLogoAppearance } from "@/lib/logo";
import { resolveButtonBackgroundStyle } from "@/lib/button-background";
import { sectionHash } from "@/lib/section-order";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/Container";
import type { CustomButtonGradient, HeaderButton, SiteInfo } from "@/types/site";

function HeaderAction({
  button,
  site,
  className,
  style,
  compactLabel,
  onClick,
  leadClickSource,
  customGradients,
  appearance,
}: {
  button: HeaderButton;
  site: SiteInfo;
  className?: string;
  style?: CSSProperties;
  compactLabel?: boolean;
  onClick?: () => void;
  leadClickSource?: typeof leadClickSourceById.headerBrochure;
  customGradients?: CustomButtonGradient[];
  appearance: ReturnType<typeof resolveHeaderButtonAppearance>;
}) {
  if (!button.enabled) return null;
  const isCall = button.action === "call";
  const showPhoneIcon = isCall || compactLabel;
  const href = resolveCtaHref(button, site);
  const isTel = href.startsWith("tel:");
  const isWhatsapp =
    button.action === "whatsapp" ||
    href.includes("wa.me") ||
    href.includes("whatsapp");

  const trackHeaderCta = () => {
    if (isCall || isTel) trackCtaClick("header_call", "Header · Call");
    else if (isWhatsapp) trackCtaClick("whatsapp", "Header · WhatsApp");
  };

  return (
    <a
      href={href}
      className={className}
      style={{
        ...resolveButtonBackgroundStyle(appearance, customGradients),
        color: appearance.textColor || "#FFFFFF",
        ...style,
      }}
      aria-label={button.label ? (isCall || isTel ? `Call ${button.label}` : button.label) : "Call"}
      onPointerDown={isTel || isWhatsapp ? trackHeaderCta : undefined}
      onClick={leadClickHandler(href, leadClickSource, () => {
        // click covers keyboard activation; dedupe prevents double-count with pointerdown
        trackHeaderCta();
        onClick?.();
      })}
      {...(leadClickSource ? leadCtaGtmDomAttrs(leadClickSource) : {})}
    >
      {showPhoneIcon ? <Phone className="size-4 shrink-0 sm:size-3.5" aria-hidden="true" /> : null}
      <span className={compactLabel ? "hidden sm:inline" : undefined}>{button.label}</span>
    </a>
  );
}

export function Header() {
  const siteData = useSiteData();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [offerVisible, setOfferVisible] = useState(true);
  const { site, navigation, offerBar, header, sectionSettings, customButtonGradients } = siteData;
  const { primary, secondary } = resolveHeaderButtons(header, site);
  const chrome = resolveHeaderChromeColors(header);
  const homeHash = sectionHash("hero", sectionSettings);
  const primaryAppearance = primaryLogoAppearance(site);
  const secondaryAppearance = secondaryLogoAppearance(site);
  const logoHeights = resolveLogoHeights(primaryAppearance);
  const logoWidths = resolveLogoWidths(primaryAppearance);
  const secondaryHeights = resolveLogoHeights(secondaryAppearance);
  const secondaryWidths = resolveLogoWidths(secondaryAppearance);
  const heightAdjust = (value: number | undefined) =>
    typeof value === "number" && Number.isFinite(value) ? Math.max(-160, Math.min(200, Math.round(value))) : 0;
  const logoBackground = resolveLogoBackgroundColor(primaryAppearance.backgroundColor);
  const secondaryLogoBackground = resolveLogoBackgroundColor(secondaryAppearance.backgroundColor);
  const secondaryLogoSrc = (site.secondaryLogo || "").trim();
  const showSecondaryLogo = hasSecondaryHeaderLogo(site);
  const logoPad = (logoBackground ? 8 : 0) + (showSecondaryLogo && secondaryLogoBackground ? 8 : 0);
  const tallestMobile = Math.max(logoHeights.mobile, showSecondaryLogo ? secondaryHeights.mobile : 0);
  const tallestDesktop = Math.max(logoHeights.desktop, showSecondaryLogo ? secondaryHeights.desktop : 0);
  const headerMinMobile = Math.max(32, tallestMobile + 24 + logoPad + heightAdjust(header.mobileHeightOffset));
  const headerMinDesktop = Math.max(32, tallestDesktop + 24 + logoPad + heightAdjust(header.heightOffset));

  const desktopPrimary = resolveHeaderButtonAppearance(header, primary, "primary", "desktop");
  const desktopSecondary = resolveHeaderButtonAppearance(header, secondary, "secondary", "desktop");
  const mobilePrimary = resolveHeaderButtonAppearance(header, primary, "primary", "mobile");
  const mobileSecondary = resolveHeaderButtonAppearance(header, secondary, "secondary", "mobile");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--mobile-header-offset",
      offerVisible && offerBar.enabled ? "100px" : "64px",
    );

    return () => {
      document.documentElement.style.removeProperty("--mobile-header-offset");
    };
  }, [offerBar.enabled, offerVisible]);

  const solidHeader = scrolled || open;
  const desktopBackgroundStyle = resolveHeaderBackgroundStyle(header, "desktop");
  const mobileBackgroundStyle = resolveHeaderBackgroundStyle(header, "mobile");
  const desktopBarVisible = desktopBackgroundStyle === "solid" || solidHeader;
  const mobileBarVisible = mobileBackgroundStyle === "solid" || solidHeader;
  const phoneBorderColor = (color: string | undefined, fallback: string) => {
    const value = (color || "").trim() || fallback;
    if (/^#[0-9a-f]{6}$/i.test(value)) return `${value}B3`;
    return value;
  };
  const desktopPhoneBorder = phoneBorderColor(
    desktopSecondary.backgroundType === "gradient" ? undefined : desktopSecondary.backgroundColor,
    header.phoneButtonColor || chrome.desktopBackground,
  );
  const mobilePhoneBorder = phoneBorderColor(
    mobileSecondary.backgroundType === "gradient" ? undefined : mobileSecondary.backgroundColor,
    header.phoneButtonColor || chrome.mobileBackground,
  );

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        solidHeader && "shadow-[0_8px_30px_rgba(6,20,40,0.18)] backdrop-blur-md",
      )}
      style={
        {
          "--header-background": chrome.desktopBackground,
          "--header-mobile-background": chrome.mobileBackground,
          "--header-nav-text": chrome.desktopNavText,
          "--header-mobile-nav-text": chrome.mobileNavText,
          "--header-mobile-icon": chrome.mobileIcon,
        } as React.CSSProperties
      }
    >
      {desktopBarVisible ? (
        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{
            backgroundColor: chrome.desktopBackground,
            opacity: desktopBackgroundStyle === "solid" ? 1 : 0.95,
          }}
          aria-hidden="true"
        />
      ) : null}
      {mobileBarVisible ? (
        <div
          className="pointer-events-none absolute inset-0 lg:hidden"
          style={{
            backgroundColor: chrome.mobileBackground,
            opacity: mobileBackgroundStyle === "solid" ? 1 : 0.95,
          }}
          aria-hidden="true"
        />
      ) : null}

      {offerBar.enabled && offerVisible && (
        <div className="relative flex h-9 items-center overflow-hidden border-b border-white/10 sm:h-10" style={{ backgroundColor: offerBar.backgroundColor, color: offerBar.textColor }}>
          <div className="offer-marquee flex min-w-max items-center whitespace-nowrap pr-14 text-[11px] font-semibold tracking-[0.04em] sm:text-[12px]">
            <span className="px-10">{offerBar.text}</span>
            <span aria-hidden="true" className="px-10">{offerBar.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setOfferVisible(false)}
            className="absolute inset-y-0 right-0 z-10 flex w-11 items-center justify-center transition-opacity hover:opacity-80"
            style={{
              backgroundColor:
                offerBar.closeBackgroundEnabled === false
                  ? "transparent"
                  : offerBar.closeBackgroundColor || offerBar.backgroundColor,
              color: offerBar.closeIconColor || "#FFFFFF",
            }}
            aria-label="Dismiss offer"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <Container
        className="relative flex min-h-[var(--header-min-m)] items-center gap-2 sm:min-h-[var(--header-min)] sm:gap-3"
        style={
          {
            ["--logo-h-m" as string]: `${logoHeights.mobile}px`,
            ["--logo-h" as string]: `${logoHeights.desktop}px`,
            ["--logo-w-m" as string]: logoWidths.mobile ? `${logoWidths.mobile}px` : "auto",
            ["--logo-w" as string]: logoWidths.desktop ? `${logoWidths.desktop}px` : "auto",
            ["--logo-fit-m" as string]: logoWidths.mobile ? "fill" : "contain",
            ["--logo-fit" as string]: logoWidths.desktop ? "fill" : "contain",
            ["--logo2-h-m" as string]: `${secondaryHeights.mobile}px`,
            ["--logo2-h" as string]: `${secondaryHeights.desktop}px`,
            ["--logo2-w-m" as string]: secondaryWidths.mobile ? `${secondaryWidths.mobile}px` : "auto",
            ["--logo2-w" as string]: secondaryWidths.desktop ? `${secondaryWidths.desktop}px` : "auto",
            ["--logo2-fit-m" as string]: secondaryWidths.mobile ? "fill" : "contain",
            ["--logo2-fit" as string]: secondaryWidths.desktop ? "fill" : "contain",
            ["--header-min-m" as string]: `${headerMinMobile}px`,
            ["--header-min" as string]: `${headerMinDesktop}px`,
          } as CSSProperties
        }
      >
        <a
          href={homeHash}
          className="flex shrink-0 items-center rounded-md"
          style={
            logoBackground
              ? {
                  backgroundColor: logoBackground,
                  padding: "4px 8px",
                }
              : undefined
          }
        >
          <img
            src={site.logo}
            alt={`${site.name} logo`}
            className="h-[var(--logo-h-m)] w-[var(--logo-w-m)] max-h-full object-left [object-fit:var(--logo-fit-m)] sm:h-[var(--logo-h)] sm:w-[var(--logo-w)] sm:[object-fit:var(--logo-fit)]"
            width={Math.round(logoHeights.desktop * 3.75)}
            height={logoHeights.desktop}
          />
        </a>

        <nav
          className={cn(
            "hidden min-w-0 items-center lg:flex",
            showSecondaryLogo
              ? "flex-1 justify-center gap-5 px-3 xl:gap-7"
              : "ml-6 gap-7 xl:ml-10 xl:gap-9",
          )}
          aria-label="Primary"
        >
          {navigation.items.map((item) => (
            <a
              key={`${item.label}-${item.target}`}
              href={item.target}
              className="shrink-0 text-[13px] font-medium transition-colors hover:text-[var(--color-accent)]"
              style={{ color: chrome.desktopNavText }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className={cn("flex shrink-0 items-center gap-2", !showSecondaryLogo && "ml-auto")}>
          {showSecondaryLogo ? (
            <a
              href={homeHash}
              className="mr-1 hidden items-center rounded-md sm:inline-flex"
              style={
                secondaryLogoBackground
                  ? {
                      backgroundColor: secondaryLogoBackground,
                      padding: "4px 8px",
                    }
                  : undefined
              }
              aria-label={`${site.name} partner logo`}
            >
              <img
                src={secondaryLogoSrc}
                alt=""
                className="h-[var(--logo2-h-m)] w-[var(--logo2-w-m)] max-h-full object-right [object-fit:var(--logo2-fit-m)] sm:h-[var(--logo2-h)] sm:w-[var(--logo2-w)] sm:[object-fit:var(--logo2-fit)]"
                width={Math.round(secondaryHeights.desktop * 3.75)}
                height={secondaryHeights.desktop}
              />
            </a>
          ) : null}
          <HeaderAction
            button={primary}
            site={site}
            appearance={desktopPrimary}
            leadClickSource={leadClickSourceById.headerBrochure}
            customGradients={customButtonGradients}
            className="hidden items-center justify-center gap-2 rounded-md px-4 py-2.5 text-[12px] font-semibold transition-opacity hover:opacity-90 sm:inline-flex"
          />
          {/* Desktop phone */}
          <HeaderAction
            button={secondary}
            site={site}
            appearance={desktopSecondary}
            leadClickSource={leadClickSourceById.headerPhone}
            customGradients={customButtonGradients}
            compactLabel
            className="hidden items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-[12px] font-semibold transition-opacity hover:opacity-90 sm:inline-flex"
            style={{ borderColor: `${desktopPhoneBorder}B3` }}
          />
          {/* Mobile phone (uses mobile colors) */}
          <HeaderAction
            button={secondary}
            site={site}
            appearance={mobileSecondary}
            leadClickSource={leadClickSourceById.headerPhone}
            customGradients={customButtonGradients}
            compactLabel
            className="inline-flex size-10 items-center justify-center gap-2 rounded-md border text-[12px] font-semibold transition-opacity hover:opacity-90 sm:hidden"
            style={{ borderColor: `${mobilePhoneBorder}B3` }}
          />
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border lg:hidden"
            style={{
              color: chrome.mobileIcon,
              borderColor: `${chrome.mobileIcon}33`,
            }}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </Container>

      <div
        id="mobile-navigation"
        hidden={!open}
        className={cn("relative border-t border-white/10 lg:hidden", open && "block")}
        style={{ backgroundColor: chrome.mobileBackground }}
      >
        <nav className="mx-auto flex max-h-[calc(100svh-4rem)] max-w-[1200px] flex-col overflow-y-auto px-5 py-4 sm:px-8 sm:py-6" aria-label="Mobile">
          {navigation.items.map((item) => (
            <a
              key={`mobile-${item.label}-${item.target}`}
              href={item.target}
              className="flex min-h-12 items-center border-b border-white/8 py-3 text-[13px] font-medium tracking-[0.12em] uppercase"
              style={{ color: chrome.mobileNavText }}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <HeaderAction
            button={primary}
            site={site}
            appearance={mobilePrimary}
            leadClickSource={leadClickSourceById.headerBrochure}
            customGradients={customButtonGradients}
            className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-5 text-[13px] font-semibold sm:hidden"
            onClick={() => setOpen(false)}
          />
        </nav>
      </div>
    </header>
  );
}
