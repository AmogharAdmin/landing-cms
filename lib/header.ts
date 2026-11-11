import type { HeaderButton, SiteData, SiteInfo } from "@/types/site";
import type { ButtonBackgroundSource } from "@/lib/button-background";

export function defaultPhoneHeaderButton(site: SiteInfo, backgroundColor = "#0B1F35"): HeaderButton {
  return {
    enabled: true,
    label: site.phone,
    action: "call",
    href: "",
    backgroundColor,
    textColor: "#FFFFFF",
  };
}

export function resolveHeaderButtons(header: SiteData["header"], site: SiteInfo): {
  primary: HeaderButton;
  secondary: HeaderButton;
} {
  return {
    primary: header.brochureButton,
    secondary: header.phoneButton ?? defaultPhoneHeaderButton(site, header.phoneButtonColor),
  };
}

export function headerButtonLink(button: HeaderButton): string {
  return button.href || button.target || "";
}

/** Desktop uses the button's own colors; mobile can override via header.mobile* fields. */
export function resolveHeaderButtonAppearance(
  header: SiteData["header"],
  button: HeaderButton,
  which: "primary" | "secondary",
  viewport: "desktop" | "mobile",
): ButtonBackgroundSource & { textColor?: string } {
  if (viewport === "desktop") {
    const isGradient =
      which === "secondary"
        ? button.backgroundType === "gradient" && Boolean(button.backgroundGradient?.trim())
        : button.backgroundType === "gradient";
    return {
      backgroundType: isGradient ? "gradient" : "plain",
      // phoneButtonColor is the legacy / synced solid fill for Button 2
      backgroundColor:
        which === "secondary"
          ? button.backgroundColor || header.phoneButtonColor
          : button.backgroundColor,
      backgroundGradient: button.backgroundGradient,
      textColor: button.textColor,
    };
  }

  if (which === "primary") {
    return {
      backgroundType: header.mobileBrochureBackgroundType || button.backgroundType,
      backgroundColor: header.mobileBrochureBackgroundColor || button.backgroundColor,
      backgroundGradient: header.mobileBrochureBackgroundGradient || button.backgroundGradient,
      textColor: header.mobileBrochureTextColor || button.textColor,
    };
  }

  return {
    backgroundType: header.mobilePhoneBackgroundType || button.backgroundType,
    backgroundColor: header.mobilePhoneBackgroundColor || button.backgroundColor || header.phoneButtonColor,
    backgroundGradient: header.mobilePhoneBackgroundGradient || button.backgroundGradient,
    textColor: header.mobilePhoneTextColor || button.textColor,
  };
}

export type HeaderBackgroundStyle = "scroll" | "solid";

/** Desktop defaults to transparent until scroll. Mobile defaults to a solid bar. */
export function resolveHeaderBackgroundStyle(
  header: SiteData["header"],
  viewport: "desktop" | "mobile",
): HeaderBackgroundStyle {
  const value = viewport === "desktop" ? header.backgroundStyle : header.mobileBackgroundStyle;
  if (value === "solid" || value === "scroll") return value;
  return viewport === "desktop" ? "scroll" : "solid";
}

export function resolveHeaderChromeColors(header: SiteData["header"]) {
  const desktopBg = (header.backgroundColor || "#0B1F35").trim() || "#0B1F35";
  const mobileBg = (header.mobileBackgroundColor || desktopBg).trim() || desktopBg;
  return {
    desktopBackground: desktopBg,
    desktopNavText: (header.navTextColor || "#FFFFFF").trim() || "#FFFFFF",
    mobileBackground: mobileBg,
    mobileNavText: (header.mobileNavTextColor || "#FFFFFF").trim() || "#FFFFFF",
    mobileIcon: (header.mobileIconColor || "#FFFFFF").trim() || "#FFFFFF",
  };
}
