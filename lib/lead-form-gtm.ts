/** Stable GTM / dataLayer identifiers for lead forms and open-form CTAs. */

export type LeadFormGtmContext = {
  formId: string;
  formName: string;
  formLocation: "enquiry_modal" | "contact_section" | "hero_mobile";
  /** Unique key for GTM triggers — prefer custom gtmId, else location + form id. */
  formKey: string;
};

export function slugGtmPart(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/** Hardcoded defaults for built-in forms; new admin variants get `enquiry-{id}`. */
export function defaultEnquiryFormTrackingId(intentId: string) {
  const id = slugGtmPart(intentId) || "default";
  const builtins: Record<string, string> = {
    default: "enquiry_default",
    brochure: "enquiry_brochure",
    masterplan: "enquiry_masterplan",
    "know-more": "enquiry_know_more",
  };
  return builtins[id] || `enquiry_${id}`;
}

export function defaultContactFormTrackingId() {
  return "contact_page_form";
}

export function defaultHeroMobileFormTrackingId() {
  return "hero_mobile_lead";
}

/**
 * Resolve the public tracking id for a form.
 * Admin override (gtmId) wins; otherwise a stable default is used.
 */
export function resolveLeadFormGtmContext(input: {
  formId: string;
  formName: string;
  formLocation: LeadFormGtmContext["formLocation"];
  /** Optional admin override for GTM (must stay unique across forms). */
  gtmId?: string;
}): LeadFormGtmContext {
  const formId = slugGtmPart(input.formId) || "default";
  const custom = slugGtmPart(input.gtmId || "");
  let formKey = custom;
  if (!formKey) {
    if (input.formLocation === "enquiry_modal") formKey = defaultEnquiryFormTrackingId(formId);
    else if (input.formLocation === "contact_section") formKey = defaultContactFormTrackingId();
    else if (input.formLocation === "hero_mobile") formKey = defaultHeroMobileFormTrackingId();
    else formKey = `${input.formLocation}__${formId}`;
  }
  return {
    formId,
    formName: String(input.formName || formId).trim().slice(0, 120) || formId,
    formLocation: input.formLocation,
    formKey,
  };
}

/** DOM dataset attributes GTM can read without relying only on dataLayer. */
export function leadFormGtmDomAttrs(context: LeadFormGtmContext) {
  return {
    id: `lead-form-${context.formKey}`,
    "data-gtm-form-id": context.formId,
    "data-gtm-form-name": context.formName,
    "data-gtm-form-location": context.formLocation,
    "data-gtm-form-key": context.formKey,
    "data-gtm-form-state": "form",
  } as const;
}

/**
 * Thank-you / success panel attrs — form node is gone after submit, so GTM
 * needs these IDs on the success UI to attribute the conversion.
 */
export function leadFormGtmSuccessDomAttrs(context: LeadFormGtmContext) {
  return {
    id: `lead-form-success-${context.formKey}`,
    "data-gtm-form-id": context.formId,
    "data-gtm-form-name": context.formName,
    "data-gtm-form-location": context.formLocation,
    "data-gtm-form-key": context.formKey,
    "data-gtm-form-state": "success",
    "data-gtm-event": "form_thank_you",
  } as const;
}

/** Persist on a parent wrapper (modal dialog) so open + success stay identifiable. */
export function leadFormGtmShellAttrs(context: LeadFormGtmContext, state: "form" | "success" | "open") {
  return {
    "data-gtm-form-id": context.formId,
    "data-gtm-form-name": context.formName,
    "data-gtm-form-location": context.formLocation,
    "data-gtm-form-key": context.formKey,
    "data-gtm-form-state": state,
  } as const;
}

export function leadFormGtmEventParams(context: LeadFormGtmContext) {
  return {
    form_id: context.formId,
    form_name: context.formName,
    form_location: context.formLocation,
    form_key: context.formKey,
  };
}

/** CTA / open-form button attributes so GTM can tell which control opened a form. */
export function leadCtaGtmDomAttrs(source: {
  id: string;
  section?: string;
  label: string;
}) {
  return {
    "data-gtm-id": source.id,
    "data-gtm-label": source.label,
    "data-gtm-section": source.section || undefined,
    "data-gtm-event": "form_cta_click",
  } as const;
}

export function leadClickGtmEventParams(source: {
  id: string;
  section?: string;
  label: string;
} | null | undefined) {
  if (!source?.label?.trim()) return {};
  return {
    cta_id: source.id,
    cta_label: source.label.trim().slice(0, 120),
    cta_section: source.section?.trim().slice(0, 80) || undefined,
  };
}
