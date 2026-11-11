import type { Theme } from "@/types/site";
import {
  findButtonGradientPreset,
  type CustomButtonGradient,
} from "@/lib/button-background";

/** Theme tokens that can use a solid color or a shared gradient fill. */
export const THEME_FILL_KEYS = [
  "primary",
  "secondary",
  "accent",
  "button",
  "primaryButton",
  "secondaryButton",
  "background",
  "lightBackground",
  "darkSection",
  "cardBackground",
  "whatsapp",
] as const;

export type ThemeFillKey = (typeof THEME_FILL_KEYS)[number];

export function isThemeFillKey(key: string): key is ThemeFillKey {
  return (THEME_FILL_KEYS as readonly string[]).includes(key);
}

export function resolveThemeFillCss(
  theme: Theme,
  key: ThemeFillKey,
  customGradients: CustomButtonGradient[] = [],
): string {
  const gradientId = theme.gradients?.[key];
  if (gradientId) {
    const preset = findButtonGradientPreset(gradientId, customGradients);
    if (preset?.css) return preset.css;
  }
  const solid = theme[key];
  return typeof solid === "string" && solid.trim() ? solid.trim() : "#000000";
}

export function themeToCssVars(
  theme: Theme,
  customGradients: CustomButtonGradient[] = [],
): string {
  const fill = (key: ThemeFillKey) => resolveThemeFillCss(theme, key, customGradients);

  return `
    :root {
      --color-primary: ${theme.primary};
      --color-secondary: ${theme.secondary};
      --color-accent: ${theme.accent};
      --color-button: ${theme.button};
      --color-button-text: ${theme.buttonText};
      --color-background: ${theme.background};
      --color-light: ${theme.lightBackground};
      --color-text: ${theme.text};
      --color-muted: ${theme.mutedText};
      --color-dark: ${theme.darkSection};
      --color-whatsapp: ${theme.whatsapp};
      --color-title: ${theme.titleColor};
      --color-description: ${theme.descriptionColor};
      --color-primary-button: ${theme.primaryButton};
      --color-primary-button-text: ${theme.primaryButtonText};
      --color-secondary-button: ${theme.secondaryButton};
      --color-secondary-button-text: ${theme.secondaryButtonText};
      --color-card: ${theme.cardBackground};
      --color-border: ${theme.borderColor};

      --fill-primary: ${fill("primary")};
      --fill-secondary: ${fill("secondary")};
      --fill-accent: ${fill("accent")};
      --fill-button: ${fill("button")};
      --fill-background: ${fill("background")};
      --fill-light: ${fill("lightBackground")};
      --fill-dark: ${fill("darkSection")};
      --fill-whatsapp: ${fill("whatsapp")};
      --fill-primary-button: ${fill("primaryButton")};
      --fill-secondary-button: ${fill("secondaryButton")};
      --fill-card: ${fill("cardBackground")};
    }
  `.trim();
}
