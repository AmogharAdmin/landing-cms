import { isEnquireHash } from "@/lib/enquiry";

export type LeadClickSource = {
  id: string;
  section: string;
  label: string;
};

const STORAGE_KEY = "amoghaa_lead_click";

export function isLeadFormHref(href: string): boolean {
  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : href;
  return isEnquireHash(hash);
}

export function setLeadClickSource(source: LeadClickSource) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(source));
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function peekLeadClickSource(): LeadClickSource | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LeadClickSource;
    if (!parsed?.label?.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function consumeLeadClickSource(): LeadClickSource | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(STORAGE_KEY);
  try {
    const parsed = JSON.parse(raw) as LeadClickSource;
    if (!parsed?.label?.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function appendLeadClickSource(params: URLSearchParams, fallback?: LeadClickSource) {
  const source = consumeLeadClickSource() || fallback;
  if (!source?.label?.trim()) return;
  params.set("clickSource", source.label.trim().slice(0, 120));
  if (source.section?.trim()) {
    params.set("clickSection", source.section.trim().slice(0, 80));
  }
}

export function leadClickHandler(
  href: string,
  source: LeadClickSource | undefined,
  onClick?: () => void,
) {
  return () => {
    if (source && isLeadFormHref(href)) setLeadClickSource(source);
    onClick?.();
  };
}
