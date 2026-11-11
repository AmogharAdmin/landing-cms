import type { CSSProperties } from "react";
import { z } from "zod";

export const TEXT_STYLE_FIELDS = new Set([
  "answer",
  "area",
  "description",
  "eyebrow",
  "footerText",
  "heading",
  "headingAccent",
  "label",
  "message",
  "nearbyHeading",
  "offerTitle",
  "price",
  "priceNote",
  "question",
  "subtitle",
  "title",
]);

export const FONT_WEIGHTS = [
  { value: 300, label: "Light" },
  { value: 400, label: "Regular" },
  { value: 500, label: "Medium" },
  { value: 600, label: "Semibold" },
  { value: 700, label: "Bold" },
  { value: 800, label: "Extra bold" },
] as const;

export const FONT_FAMILIES = [
  { value: "", label: "Default" },
  { value: "var(--font-inter), ui-sans-serif, system-ui, sans-serif", label: "Sans (Inter)" },
  { value: "Georgia, \"Times New Roman\", Times, serif", label: "Serif" },
  { value: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif", label: "System UI" },
  { value: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", label: "Monospace" },
] as const;

const fontSizeSchema = z.number().min(8).max(160).optional();
const fontWeightSchema = z.union([z.number().min(100).max(900), z.string()]).optional();
const fontFamilySchema = z.string().optional();
const lineHeightSchema = z.number().min(0.8).max(3).optional();
/** Letter spacing in em (e.g. 0.04). */
const letterSpacingSchema = z.number().min(-0.1).max(0.5).optional();
/** Word spacing in em (e.g. 0.1). */
const wordSpacingSchema = z.number().min(-0.2).max(1).optional();
const colorSchema = z.string().optional();

export function fontFields(...names: string[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const name of names) {
    shape[`${name}FontSize`] = fontSizeSchema;
    shape[`${name}FontWeight`] = fontWeightSchema;
    shape[`${name}FontFamily`] = fontFamilySchema;
    shape[`${name}LineHeight`] = lineHeightSchema;
    shape[`${name}LetterSpacing`] = letterSpacingSchema;
    shape[`${name}WordSpacing`] = wordSpacingSchema;
  }
  return shape;
}

/** Optional text colors for sections that do not already declare required *Color fields. */
export function colorFields(...names: string[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const name of names) {
    shape[`${name}Color`] = colorSchema;
  }
  return shape;
}

export function isTextStyleField(key: string) {
  return TEXT_STYLE_FIELDS.has(key);
}

export function isFontMetaField(key: string) {
  return /Font(Size|Weight|Family)$/.test(key) || /(LineHeight|LetterSpacing|WordSpacing)$/.test(key);
}

function numeric(value: unknown): number | undefined {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? amount : undefined;
}

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

export function floatingButtonLabelStyle(source: {
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
}): CSSProperties {
  const style: CSSProperties = {};
  const size = numeric(source.fontSize);
  const weight = numeric(source.fontWeight);
  if (size && size >= 8) style.fontSize = `${size}px`;
  if (weight && weight >= 100) style.fontWeight = weight;
  if (source.fontFamily?.trim()) style.fontFamily = source.fontFamily;
  return style;
}

export function textStyle(source: unknown, field: string, extra?: CSSProperties): CSSProperties {
  const record = source && typeof source === "object" ? (source as Record<string, unknown>) : {};
  const size = numeric(record[`${field}FontSize`]);
  const weight = numeric(record[`${field}FontWeight`]);
  const family = record[`${field}FontFamily`];
  const lineHeight = numeric(record[`${field}LineHeight`]);
  const letterSpacing = numeric(record[`${field}LetterSpacing`]);
  const wordSpacing = numeric(record[`${field}WordSpacing`]);
  const color = record[`${field}Color`];
  const style: CSSProperties = { ...extra };
  if (size && size >= 8) {
    style.fontSize = `${size}px`;
  }
  if (lineHeight && lineHeight >= 0.8) {
    style.lineHeight = lineHeight;
  } else if (size && size >= 8) {
    style.lineHeight = 1.25;
  }
  if (weight && weight >= 100) style.fontWeight = weight;
  if (typeof family === "string" && family.trim()) style.fontFamily = family;
  if (letterSpacing !== undefined && letterSpacing >= -0.1 && letterSpacing <= 0.5) {
    style.letterSpacing = `${letterSpacing}em`;
  }
  if (wordSpacing !== undefined && wordSpacing >= -0.2 && wordSpacing <= 1) {
    style.wordSpacing = `${wordSpacing}em`;
  }
  if (isHexColor(color)) style.color = color.trim();
  return style;
}

/**
 * Typography for rich-text surfaces (FAQ answers, About, Footer).
 * Omits container font-weight so toolbar bold/unbold can control emphasis;
 * size/color/family/line-height still apply.
 */
export function richTextSurfaceStyle(source: unknown, field: string, extra?: CSSProperties): CSSProperties {
  const style = textStyle(source, field, extra);
  delete style.fontWeight;
  return style;
}
