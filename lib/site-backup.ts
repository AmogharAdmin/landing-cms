import type { SiteData } from "@/types/site";
import { safeParseSiteData } from "@/lib/content-schema";
import { normalizeSectionOrder, normalizeSectionSettings } from "@/lib/section-order";

/** Stable root key order for readable backups (matches a full site.json). */
export const SITE_DATA_ROOT_KEYS = [
  "seo",
  "site",
  "theme",
  "customButtonGradients",
  "googleAnalytics",
  "googleTagManager",
  "buildeskCrm",
  "offerBar",
  "header",
  "navigation",
  "sectionOrder",
  "sectionSettings",
  "hero",
  "bookingCard",
  "heroFacts",
  "about",
  "highlights",
  "amenities",
  "homes",
  "gallery",
  "location",
  "virtualTourSection",
  "plansSection",
  "faqSection",
  "contactSection",
  "faqs",
  "enquiry",
  "stickyCTA",
  "floatingButton",
  "footer",
  "blogs",
] as const satisfies ReadonlyArray<keyof SiteData>;

export type SiteExportSummary = {
  sections: number;
  rootKeys: string[];
  missingKeys: string[];
  bytes: number;
  homes: number;
  galleryImages: number;
  amenities: number;
  faqs: number;
  navItems: number;
  enquiryForms: number;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Deep clone via JSON so the export is a plain serializable snapshot. */
export function cloneSiteData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Sort object keys recursively for stable diffs (import/debug only — not used on export). */
export function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (!isPlainObject(value)) return value;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort((a, b) => a.localeCompare(b))) {
    sorted[key] = sortKeysDeep(value[key]);
  }
  return sorted;
}

function deepMergeValue(base: unknown, overlay: unknown): unknown {
  if (overlay === undefined) return cloneSiteData(base);
  if (base === undefined || base === null) return cloneSiteData(overlay);
  if (Array.isArray(overlay)) return cloneSiteData(overlay);
  if (!isPlainObject(overlay)) return cloneSiteData(overlay);
  if (!isPlainObject(base)) return cloneSiteData(overlay);

  const result = { ...cloneSiteData(base) } as Record<string, unknown>;
  for (const key of Object.keys(overlay)) {
    if (overlay[key] === undefined) continue;
    result[key] = deepMergeValue(base[key], overlay[key]);
  }
  return result;
}

/**
 * Deep-merge overlay onto base: unsaved editor values win at leaves,
 * arrays replace entirely, undefined in overlay does not erase base fields.
 */
export function deepMergeSiteData(base: SiteData, overlay: SiteData): SiteData {
  return deepMergeValue(cloneSiteData(base), cloneSiteData(overlay)) as SiteData;
}

/**
 * Build a complete export/import payload:
 * - starts from the saved baseline when provided
 * - deep-merges the current editor/backup draft on top (draft wins at leaves,
 *   including false / "" / 0; arrays replace entirely; undefined does not erase baseline)
 * - fills nested gaps from baseline so incomplete drafts keep gradients, colors, disables
 * - normalizes section order/settings
 */
export function prepareSiteDataForExport(current: SiteData, fallback?: SiteData): SiteData {
  const result = fallback ? deepMergeSiteData(fallback, current) : cloneSiteData(current);
  return {
    ...result,
    sectionOrder: normalizeSectionOrder(result.sectionOrder),
    sectionSettings: normalizeSectionSettings(result.sectionSettings),
  };
}

export function siteDataToExportJson(data: SiteData): string {
  const ordered: Record<string, unknown> = {};
  const used = new Set<string>();

  for (const key of SITE_DATA_ROOT_KEYS) {
    if (data[key] !== undefined) {
      ordered[key] = data[key];
      used.add(key);
    }
  }

  // Preserve any extra root keys so nothing is silently dropped.
  for (const key of Object.keys(data)) {
    if (used.has(key)) continue;
    ordered[key] = (data as Record<string, unknown>)[key];
  }

  return `${JSON.stringify(ordered, null, 2)}\n`;
}

export function summarizeSiteData(data: SiteData, json = siteDataToExportJson(data)): SiteExportSummary {
  const rootKeys = Object.keys(data).sort((a, b) => a.localeCompare(b));
  const missingKeys = SITE_DATA_ROOT_KEYS.filter((key) => data[key] === undefined);
  return {
    sections: data.sectionOrder?.length || 0,
    rootKeys,
    missingKeys: [...missingKeys],
    bytes: new TextEncoder().encode(json).length,
    homes: data.homes?.properties?.length || 0,
    galleryImages: data.gallery?.images?.length || 0,
    amenities: data.amenities?.items?.length || 0,
    faqs: (data.faqSection?.items?.length || data.faqs?.length || 0),
    navItems: data.navigation?.items?.length || 0,
    enquiryForms: data.enquiry?.intents?.length || 0,
  };
}

export function buildSiteExportFilename(data: SiteData, at = new Date()) {
  const slug = (data.site?.name || "site")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "site";
  const stamp = [
    at.getFullYear(),
    String(at.getMonth() + 1).padStart(2, "0"),
    String(at.getDate()).padStart(2, "0"),
  ].join("-");
  return `${slug}-backup-${stamp}.json`;
}

export function downloadSiteDataJson(data: SiteData, fallback?: SiteData) {
  const payload = prepareSiteDataForExport(data, fallback);
  const json = siteDataToExportJson(payload);
  const summary = summarizeSiteData(payload, json);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = buildSiteExportFilename(payload);
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  return summary;
}

export function formatExportSummary(summary: SiteExportSummary) {
  const kb = Math.max(1, Math.round(summary.bytes / 1024));
  const parts = [
    `${summary.rootKeys.length} sections`,
    `${summary.navItems} menu items`,
    `${summary.homes} homes`,
    `${summary.galleryImages} gallery images`,
    `${summary.amenities} amenities`,
    `${summary.faqs} FAQs`,
    `${summary.enquiryForms} lead forms`,
    `${kb} KB`,
  ];
  return `Exported full site backup (${parts.join(" · ")}).`;
}

export type SiteImportResult =
  | { ok: true; data: SiteData; summary: SiteExportSummary; warnings: string[] }
  | { ok: false; error: string };

/** Accept a raw site.json object or a wrapped `{ data: SiteData }` backup. */
export function parseImportedSiteData(raw: unknown, fallback?: SiteData): SiteImportResult {
  const candidate = isPlainObject(raw) && isPlainObject(raw.data) && !("site" in raw)
    ? raw.data
    : raw;

  if (!isPlainObject(candidate) || !isPlainObject(candidate.site)) {
    return { ok: false, error: "This file is not a site content backup (missing site identity)." };
  }

  const prepared = prepareSiteDataForExport(candidate as SiteData, fallback);
  const warnings: string[] = [];
  const parsed = safeParseSiteData(prepared);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path?.length ? issue.path.join(".") : "root";
    warnings.push(
      `Schema warning at ${path}: ${issue?.message || "invalid value"}. Content was still loaded — review before Save.`,
    );
  }

  const incomingKeys = new Set(Object.keys(candidate));
  const filledKeys = SITE_DATA_ROOT_KEYS.filter(
    (key) => !incomingKeys.has(key) && fallback && fallback[key] !== undefined,
  );
  if (filledKeys.length) {
    warnings.push(`Filled missing sections from current project: ${filledKeys.join(", ")}.`);
  }

  if (!String((prepared.site as { name?: string })?.name || "").trim()) {
    return { ok: false, error: "This backup is missing the project name under site.name." };
  }

  const summary = summarizeSiteData(prepared);
  return { ok: true, data: prepared, summary, warnings };
}

export async function readImportedSiteFile(file: File, fallback?: SiteData): Promise<SiteImportResult> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    return { ok: false, error: "Unable to read the selected file." };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "The selected file is not valid JSON." };
  }

  return parseImportedSiteData(raw, fallback);
}
