import type { BuildeskCrm, SiteData } from "@/types/site";

export const DEFAULT_BUILDESK_LEAD_ENDPOINT =
  "https://buildeskapi.azurewebsites.net/api/buildeskapi/lead/create";

const REQUEST_TIMEOUT_MS = 8000;

export function normalizeBuildeskCrm(value: BuildeskCrm | undefined | null): BuildeskCrm {
  const dialRaw = value?.dialCode;
  const dialCode =
    typeof dialRaw === "number" && Number.isFinite(dialRaw) && dialRaw >= 1 && dialRaw <= 9999
      ? Math.floor(dialRaw)
      : 91;

  return {
    enabled: value?.enabled === true,
    apiKey: (value?.apiKey || "").trim(),
    endpoint: (value?.endpoint || "").trim(),
    projectName: (value?.projectName || "").trim(),
    projectUID: (value?.projectUID || "").trim(),
    source: (value?.source || "").trim() || "website",
    subSource: (value?.subSource || "").trim(),
    city: (value?.city || "").trim(),
    dialCode,
    remark: (value?.remark || "").trim(),
  };
}

export function isBuildeskCrmReady(value: BuildeskCrm | undefined | null): boolean {
  const config = normalizeBuildeskCrm(value);
  return config.enabled && Boolean(config.apiKey);
}

export type BuildeskCrmStatus = "disabled" | "incomplete" | "connected";

export function resolveBuildeskCrmStatus(value: BuildeskCrm | undefined | null): BuildeskCrmStatus {
  const config = normalizeBuildeskCrm(value);
  if (!config.enabled) return "disabled";
  if (!config.apiKey) return "incomplete";
  return "connected";
}

/** Strip ApiKey before sending site JSON to the public browser. */
export function toPublicSiteData(data: SiteData): SiteData {
  if (!data.buildeskCrm) return data;
  const config = normalizeBuildeskCrm(data.buildeskCrm);
  return {
    ...data,
    buildeskCrm: {
      ...config,
      apiKey: "",
    },
  };
}

export type BuildeskLeadInput = {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  formLabel?: string;
  formSource?: string;
  clickSource?: string;
  customFields?: Record<string, string>;
  /** Google Ads keyword from the landing URL (`utm_term`). */
  utmTerm?: string;
  /** Google Ads click id from the landing URL (`gclid`). */
  gclid?: string;
};

export type BuildeskLeadPayload = {
  ApiKey: string;
  UserId: null;
  UID: null;
  FirstName: string;
  LastName: string;
  DialCode: number;
  Source: string;
  SubSource: string;
  Mobile: string;
  SecondaryNumber: string;
  CreatedDate: string;
  Email: string;
  Remark: string;
  HasVisit: boolean;
  VisitDate: null;
  ProjectUID: string | null;
  ProjectName: string;
  City: string;
  MinBudget: null;
  MaxBudget: null;
  EmploymentType: string;
  Income: null;
  Designation: string;
  UtmCampaign: string;
  UtmMedium: string;
  UtmSource: string;
  UtmTerm: string;
  GCLId: string;
  FbId: string;
  UtmContent: string;
};

export type BuildeskForwardResult = {
  ok: boolean;
  message: string;
  skipped?: boolean;
  /** Resolved SubSource sent to Buildesk (useful for logging). */
  subSource?: string;
};

function splitName(fullName: string): { firstName: string; lastName: string } {
  const cleaned = fullName.trim().replace(/\s+/g, " ");
  if (!cleaned || cleaned === "Not provided") {
    return { firstName: "Guest", lastName: "" };
  }
  const parts = cleaned.split(" ");
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/** National mobile digits for Buildesk (DialCode is sent separately). */
export function normalizeBuildeskMobile(phone: string, dialCode = 91): string {
  let digits = phone.replace(/\D/g, "").slice(0, 20);
  if (!digits) return "";

  const dial = String(dialCode);
  // +91 99533… → strip country code when DialCode is already set
  if (dial && digits.startsWith(dial) && digits.length > dial.length + 7) {
    digits = digits.slice(dial.length);
  }
  // 0-prefixed local numbers
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 15);
}

function formatCreatedDate(date = new Date()): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function isBlankMessage(value?: string): boolean {
  const trimmed = (value || "").trim();
  return !trimmed || trimmed === "Not provided";
}

/**
 * SubSource must identify the form variant so every enquiry / contact / brochure
 * lead is distinguishable in Buildesk (not only the brochure form).
 */
export function resolveBuildeskSubSource(
  config: BuildeskCrm,
  lead: Pick<BuildeskLeadInput, "formLabel" | "formSource">,
): string {
  const normalized = normalizeBuildeskCrm(config);
  const form =
    (lead.formLabel || "").trim() ||
    (lead.formSource || "").trim() ||
    "";
  const fixed = normalized.subSource;
  if (fixed && form && fixed.toLowerCase() !== form.toLowerCase()) {
    return `${fixed} · ${form}`.slice(0, 120);
  }
  return (form || fixed || "Website form").slice(0, 120);
}

export function buildBuildeskRemark(
  config: BuildeskCrm,
  lead: BuildeskLeadInput,
): string {
  const normalized = normalizeBuildeskCrm(config);
  const parts: string[] = [];
  const formLabel = (lead.formLabel || lead.formSource || "").trim();
  if (formLabel) parts.push(`Form: ${formLabel}`);
  if (lead.formSource && lead.formSource !== formLabel) {
    parts.push(`Form id: ${lead.formSource}`);
  }
  if ((lead.clickSource || "").trim()) {
    parts.push(`Click: ${lead.clickSource!.trim()}`);
  }
  if (!isBlankMessage(lead.message)) {
    parts.push(lead.message!.trim());
  }
  if (lead.customFields) {
    for (const [label, value] of Object.entries(lead.customFields)) {
      const v = (value || "").trim();
      if (!v || v === "Not provided") continue;
      parts.push(`${label}: ${v}`);
    }
  }
  if (normalized.remark) parts.push(normalized.remark);
  return (parts.join(" | ") || "Website enquiry").slice(0, 1000);
}

export function buildBuildeskLeadPayload(
  config: BuildeskCrm,
  lead: BuildeskLeadInput,
): BuildeskLeadPayload {
  const normalized = normalizeBuildeskCrm(config);
  const { firstName, lastName } = splitName(lead.name);
  const dialCode = normalized.dialCode ?? 91;
  const mobile = normalizeBuildeskMobile(lead.phone, dialCode);
  const formLabel = (lead.formLabel || "").trim() || (lead.formSource || "").trim() || "Website form";
  const subSource = resolveBuildeskSubSource(normalized, lead);

  return {
    ApiKey: normalized.apiKey,
    UserId: null,
    UID: null,
    FirstName: firstName,
    LastName: lastName,
    DialCode: dialCode,
    Source: normalized.source,
    SubSource: subSource,
    Mobile: mobile || lead.phone.replace(/\D/g, "").slice(0, 20) || lead.phone.trim(),
    SecondaryNumber: "",
    CreatedDate: formatCreatedDate(),
    Email: (lead.email || "").trim(),
    Remark: buildBuildeskRemark(normalized, lead),
    HasVisit: false,
    VisitDate: null,
    ProjectUID: normalized.projectUID || null,
    ProjectName: normalized.projectName,
    City: normalized.city || "",
    MinBudget: null,
    MaxBudget: null,
    EmploymentType: "",
    Income: null,
    Designation: formLabel.slice(0, 80),
    UtmCampaign: formLabel.slice(0, 120),
    UtmMedium: "landing-page",
    UtmSource: normalized.source.slice(0, 120),
    UtmTerm: ((lead.utmTerm || "").trim() || (lead.clickSource || "").trim()).slice(0, 200),
    GCLId: (lead.gclid || "").trim().slice(0, 255),
    FbId: "",
    UtmContent: (lead.formSource || formLabel).slice(0, 120),
  };
}

export async function forwardLeadToBuildesk(
  config: BuildeskCrm | undefined | null,
  lead: BuildeskLeadInput,
): Promise<BuildeskForwardResult> {
  const normalized = normalizeBuildeskCrm(config);
  const subSource = resolveBuildeskSubSource(normalized, lead);

  if (!normalized.enabled) {
    return { ok: true, message: "Buildesk CRM disabled.", skipped: true, subSource };
  }
  if (!normalized.apiKey) {
    return {
      ok: false,
      message: "Buildesk CRM is enabled but ApiKey is missing.",
      skipped: true,
      subSource,
    };
  }

  const endpoint = normalized.endpoint || DEFAULT_BUILDESK_LEAD_ENDPOINT;
  const payload = buildBuildeskLeadPayload(normalized, lead);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await response.text();
    let parsed: { Success?: boolean; Message?: string; success?: boolean; message?: string } | null =
      null;
    try {
      parsed = JSON.parse(text) as {
        Success?: boolean;
        Message?: string;
        success?: boolean;
        message?: string;
      };
    } catch {
      // Buildesk sometimes returns XML-ish envelopes; fall back to text.
    }

    if (parsed) {
      const success =
        typeof parsed.Success === "boolean"
          ? parsed.Success
          : typeof parsed.success === "boolean"
            ? parsed.success
            : null;
      if (success !== null) {
        const message =
          parsed.Message ||
          parsed.message ||
          (success ? "Lead forwarded." : "Buildesk rejected the lead.");
        return { ok: success, message, subSource };
      }
    }

    if (!response.ok) {
      return {
        ok: false,
        message: `Buildesk HTTP ${response.status}: ${text.slice(0, 200)}`,
        subSource,
      };
    }

    // HTTP OK but unexpected body — treat as soft success only if text looks positive.
    const lower = text.toLowerCase();
    if (lower.includes('"success":true') || lower.includes("<success>true</success>")) {
      return { ok: true, message: "Lead forwarded.", subSource };
    }
    return {
      ok: false,
      message: `Unexpected Buildesk response: ${text.slice(0, 200)}`,
      subSource,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? "Buildesk request timed out."
          : error.message
        : "Buildesk request failed.";
    return { ok: false, message, subSource };
  } finally {
    clearTimeout(timer);
  }
}
