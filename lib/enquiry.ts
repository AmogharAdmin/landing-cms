import { whatsappUrl } from "@/lib/cta";
import { phoneValidationError } from "@/lib/phone";
import type {
  EnquiryCustomField,
  EnquiryCustomFieldType,
  EnquiryFormField,
  EnquiryHighlight,
  EnquiryIntent,
  EnquirySuccessType,
  SiteData,
} from "@/types/site";

export const ENQUIRE_HASH_PREFIX = "#enquire";

export type ResolvedEnquiryField = Required<EnquiryFormField>;

export type ResolvedEnquiryCustomField = Required<Omit<EnquiryCustomField, "options">> & {
  options?: string[];
};

export type ResolvedEnquiryIntent = EnquiryIntent & {
  headingAccent: string;
  description: string;
  submitLabel: string;
  backgroundImage: string;
  backgroundImageAlt: string;
  logo: string;
  showLogo: boolean;
  highlightsEnabled: boolean;
  highlights: EnquiryHighlight[];
  footerText: string;
  fields: {
    name: ResolvedEnquiryField;
    phone: ResolvedEnquiryField;
    email: ResolvedEnquiryField;
    custom: ResolvedEnquiryCustomField[];
  };
};

export const CUSTOM_FIELD_TYPE_OPTIONS: Array<{ id: EnquiryCustomFieldType; label: string }> = [
  { id: "text", label: "Short text" },
  { id: "select", label: "Dropdown menu" },
  { id: "radio", label: "Radio buttons (Single choice)" },
  { id: "checkbox", label: "Checkbox (Confirmation / Toggle)" },
  { id: "textarea", label: "Long text (Paragraph)" },
  { id: "email", label: "Email" },
  { id: "tel", label: "Phone number" },
  { id: "number", label: "Number (Budget / Units)" },
  { id: "date", label: "Date (Visit / Booking date)" },
];

/** FormData key for a custom field — keeps them distinct from name/phone/email. */
export function customFieldFormName(id: string) {
  return `custom_${id}`;
}

export function enquireHash(intent?: string): string {
  const id = intent?.trim();
  if (!id || id === "default") return ENQUIRE_HASH_PREFIX;
  return `${ENQUIRE_HASH_PREFIX}=${encodeURIComponent(id)}`;
}

export function parseEnquireIntent(hash: string): string | null {
  if (!isEnquireHash(hash)) return null;
  if (hash === ENQUIRE_HASH_PREFIX || hash === `${ENQUIRE_HASH_PREFIX}=default`) return "default";
  try {
    return decodeURIComponent(hash.slice(`${ENQUIRE_HASH_PREFIX}=`.length)) || "default";
  } catch {
    return "default";
  }
}

export function isEnquireHash(hash: string): boolean {
  return hash === ENQUIRE_HASH_PREFIX || hash.startsWith(`${ENQUIRE_HASH_PREFIX}=`);
}

export function defaultEnquiryHighlights(): EnquiryHighlight[] {
  return [
    { icon: "building", value: "50+", label: "Acres Township" },
    { icon: "layers", value: "2, 3, 4 BHK", label: "& Penthouses" },
    { icon: "building", value: "G + 21", label: "Floors" },
    { icon: "map-pin", value: "North Bangalore", label: "By Sattva Group" },
  ];
}

export function defaultEnquiryFields(enquiry: SiteData["enquiry"]): ResolvedEnquiryIntent["fields"] {
  return {
    name: {
      enabled: true,
      required: true,
      label: enquiry.nameLabel || "Full Name",
      placeholder: "Enter your full name",
    },
    phone: {
      enabled: true,
      required: true,
      label: enquiry.phoneLabel || "Contact Number",
      placeholder: "Enter your contact number",
    },
    email: {
      enabled: true,
      required: false,
      label: "Email Address",
      placeholder: "Enter your email address",
    },
    custom: [],
  };
}

export function blankCustomField(
  label = "New field",
  type: EnquiryCustomFieldType = "text",
): EnquiryCustomField {
  const stem = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "field";
  return {
    id: `${stem}-${Date.now().toString(36)}`,
    type,
    enabled: true,
    required: false,
    label,
    placeholder:
      type === "select"
        ? "Select an option"
        : type === "checkbox"
        ? "I agree / Yes"
        : `Enter ${label.toLowerCase()}`,
    options: type === "select" || type === "radio" ? ["Option 1", "Option 2", "Option 3"] : undefined,
  };
}

function mergeField(base: ResolvedEnquiryField, overlay?: Partial<EnquiryFormField>): ResolvedEnquiryField {
  return {
    enabled: overlay?.enabled ?? base.enabled,
    required: overlay?.required ?? base.required,
    label: overlay?.label || base.label,
    placeholder: overlay?.placeholder || base.placeholder,
  };
}

const VALID_CUSTOM_TYPES: EnquiryCustomFieldType[] = [
  "text",
  "select",
  "radio",
  "checkbox",
  "textarea",
  "email",
  "tel",
  "number",
  "date",
];

export function resolveCustomFields(custom?: EnquiryCustomField[]): ResolvedEnquiryCustomField[] {
  if (!Array.isArray(custom)) return [];
  const seen = new Set<string>();
  return custom
    .filter((field) => field && typeof field === "object")
    .map((field, index) => {
      const rawId = String(field.id || `field-${index}`).trim().slice(0, 80) || `field-${index}`;
      let id = rawId;
      let suffix = 2;
      while (seen.has(id)) {
        id = `${rawId}-${suffix}`;
        suffix += 1;
      }
      seen.add(id);
      const type: EnquiryCustomFieldType =
        field.type && VALID_CUSTOM_TYPES.includes(field.type) ? field.type : "text";
      const rawOptions = Array.isArray(field.options) ? field.options : [];
      const options = rawOptions
        .map((opt) => String(opt ?? "").trim())
        .filter((opt) => opt.length > 0);

      return {
        id,
        type,
        enabled: field.enabled !== false,
        required: Boolean(field.required),
        label: String(field.label || "Field").trim() || "Field",
        placeholder: String(field.placeholder || "").trim() || (type === "select" ? "Select an option" : "Enter value"),
        options: options.length > 0 ? options : type === "select" || type === "radio" ? ["Option 1", "Option 2"] : [],
      };
    });
}

export function resolveIntentPresentation(
  intent: EnquiryIntent,
  enquiry: SiteData["enquiry"],
): ResolvedEnquiryIntent {
  const defaults = defaultEnquiryFields(enquiry);
  return {
    ...intent,
    headingAccent: intent.headingAccent || "",
    description: intent.description ?? enquiry.description ?? "",
    submitLabel: intent.submitLabel || enquiry.submitLabel || "Request a Callback",
    backgroundImage: intent.backgroundImage || "/images/image-1.webp",
    backgroundImageAlt: intent.backgroundImageAlt || "Project preview",
    backgroundColor: (intent.backgroundColor || "").trim() || "#061d33",
    logo: intent.logo || "",
    showLogo: intent.showLogo !== false,
    highlightsEnabled: intent.highlightsEnabled !== false,
    highlights: Array.isArray(intent.highlights) ? intent.highlights : defaultEnquiryHighlights(),
    footerText: intent.footerText || "We respect your privacy. Your details are safe with us.",
    fields: {
      name: mergeField(defaults.name, intent.fields?.name),
      phone: mergeField(defaults.phone, intent.fields?.phone),
      email: mergeField(defaults.email, intent.fields?.email),
      custom: resolveCustomFields(intent.fields?.custom),
    },
  };
}

export function defaultEnquiryIntents(enquiry: SiteData["enquiry"]): EnquiryIntent[] {
  const shared = {
    backgroundImage: "/images/image-1.webp",
    backgroundImageAlt: "Luxury residential towers",
    logo: "",
    showLogo: true,
    highlightsEnabled: true,
    highlights: defaultEnquiryHighlights(),
    footerText: "We respect your privacy. Your details are safe with us.",
    fields: defaultEnquiryFields(enquiry),
  };

  return [
    {
      id: "default",
      name: "General enquiry",
      gtmId: "enquiry_default",
      heading: enquiry.heading || "Your Dream Home",
      headingAccent: "Awaits You",
      description: enquiry.description,
      submitLabel: enquiry.submitLabel || "Request a Callback",
      successType: "message",
      successMessage: enquiry.successMessage || "Thank you. We will contact you shortly.",
      ...shared,
    },
    {
      id: "brochure",
      name: "Download brochure",
      gtmId: "enquiry_brochure",
      heading: "Download the Brochure",
      headingAccent: "Instantly",
      description: enquiry.description,
      submitLabel: "Get the Brochure",
      successType: "download",
      successMessage: "Thank you. Your brochure is ready to download.",
      successButtonLabel: "Download Brochure",
      ...shared,
    },
    {
      id: "masterplan",
      name: "View master plan",
      gtmId: "enquiry_masterplan",
      heading: "View the Master Plan",
      headingAccent: "In Detail",
      description: enquiry.description,
      submitLabel: "Request Master Plan",
      successType: "download",
      successMessage: "Thank you. The master plan is ready.",
      successButtonLabel: "View Master Plan",
      ...shared,
    },
    {
      id: "know-more",
      name: "Know more",
      gtmId: "enquiry_know_more",
      heading: "Know More About Us",
      headingAccent: "Let’s Talk",
      description: enquiry.description,
      submitLabel: "Know More",
      successType: "whatsapp",
      successMessage: "Thank you. Continue on WhatsApp if you prefer a quicker reply.",
      successButtonLabel: "Chat on WhatsApp",
      ...shared,
    },
  ];
}

export function blankEnquiryIntent(enquiry: SiteData["enquiry"]): EnquiryIntent {
  const id = `intent-${Date.now()}`;
  return resolveIntentPresentation({
    id,
    name: "New form variant",
    gtmId: `enquiry_${id}`,
    heading: "New heading",
    headingAccent: "",
    submitLabel: enquiry.submitLabel || "Submit",
    successType: "message",
    successMessage: enquiry.successMessage || "Thank you. We will contact you shortly.",
    successButtonLabel: "",
    successHref: "",
  }, enquiry);
}

export function resolveEnquiryIntents(enquiry: SiteData["enquiry"]): EnquiryIntent[] {
  return enquiry.intents?.length ? enquiry.intents : defaultEnquiryIntents(enquiry);
}

export function findEnquiryIntent(enquiry: SiteData["enquiry"], intentId?: string | null): EnquiryIntent {
  const intents = resolveEnquiryIntents(enquiry);
  return intents.find((intent) => intent.id === intentId) ?? intents.find((intent) => intent.id === "default") ?? intents[0];
}

export function isRealDocumentPath(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "#" || trimmed.startsWith("#enquire") || trimmed === "#about" || trimmed === "#location") {
    return false;
  }
  return true;
}

export function enquirySuccessHref(
  intent: EnquiryIntent,
  site: SiteData["site"],
): string {
  if (intent.successHref && isRealDocumentPath(intent.successHref)) {
    return intent.successHref.trim();
  }
  if (intent.successType === "whatsapp") {
    return whatsappUrl(site.whatsapp, `Hello, I would like to know more about ${site.name}.`);
  }
  const isMasterPlan =
    intent.id === "masterplan" ||
    (intent.name && /master\s*plan/i.test(intent.name)) ||
    (intent.heading && /master\s*plan/i.test(intent.heading));

  if (isMasterPlan) {
    if (isRealDocumentPath(site.masterPlanUrl)) return site.masterPlanUrl.trim();
    if (isRealDocumentPath(site.brochureUrl)) return site.brochureUrl.trim();
    return "";
  }
  if (isRealDocumentPath(site.brochureUrl)) return site.brochureUrl.trim();
  if (isRealDocumentPath(site.masterPlanUrl)) return site.masterPlanUrl.trim();
  return "";
}

export function validateLeadFields(
  values: { name: string; phone: string; email: string; custom: Record<string, string> },
  fields: ResolvedEnquiryIntent["fields"],
): string | null {
  const name = values.name.trim();
  const phone = values.phone.trim();
  const email = values.email.trim();

  if (fields.name.enabled && fields.name.required && name.length < 2) {
    return `Please enter a valid ${fields.name.label.toLowerCase()}.`;
  }
  if (fields.phone.enabled && fields.phone.required && !phone) {
    return `Please enter your ${fields.phone.label.toLowerCase()}.`;
  }
  if (fields.phone.enabled && phone) {
    const phoneError = phoneValidationError(phone, fields.phone.label);
    if (phoneError) return phoneError;
  }
  if (fields.email.enabled && fields.email.required && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return `Please enter a valid ${fields.email.label.toLowerCase()}.`;
  }
  if (fields.email.enabled && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return `Please enter a valid ${fields.email.label.toLowerCase()}.`;
  }

  for (const field of fields.custom) {
    if (!field.enabled) continue;
    const value = (values.custom[field.id] || "").trim();
    if (field.required && !value) {
      return `Please enter your ${field.label.toLowerCase()}.`;
    }
    if (!value) continue;
    if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return `Please enter a valid ${field.label.toLowerCase()}.`;
    }
    if (field.type === "tel") {
      const telError = phoneValidationError(value, field.label);
      if (telError) return telError;
    }
  }

  return null;
}

export const successTypeOptions: Array<{ id: EnquirySuccessType; label: string }> = [
  { id: "message", label: "Thank-you message only" },
  { id: "download", label: "Show download button" },
  { id: "whatsapp", label: "Show WhatsApp button" },
  { id: "link", label: "Show a custom link" },
];
