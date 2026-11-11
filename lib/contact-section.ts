import { phoneValidationError } from "@/lib/phone";
import {
  blankCustomField,
  customFieldFormName,
  defaultEnquiryFields,
  resolveCustomFields,
  type ResolvedEnquiryCustomField,
  type ResolvedEnquiryField,
} from "@/lib/enquiry";
import type { ContactSection, ContactSectionFields, SiteData } from "@/types/site";

export const CONTACT_SECTION_INTENT_ID = "contact-section";

export type ResolvedContactFields = {
  name: ResolvedEnquiryField;
  phone: ResolvedEnquiryField;
  email: ResolvedEnquiryField;
  message: ResolvedEnquiryField;
  custom: ResolvedEnquiryCustomField[];
};

export type ResolvedContactSection = ContactSection & {
  headingAccent: string;
  description: string;
  imageAlt: string;
  layout: NonNullable<ContactSection["layout"]>;
  submitLabel: string;
  successMessage: string;
  footerText: string;
  fields: ResolvedContactFields;
};

export const DEFAULT_CONTACT_SECTION: ContactSection = {
  enabled: true,
  label: "Contact Us",
  heading: "Get in Touch",
  headingAccent: "With Our Team",
  description: "Share your details and our team will reach out shortly.",
  image: "/images/image-3.webp",
  imageAlt: "Contact section image",
  layout: "imageLeft",
  submitLabel: "Send Message",
  successMessage: "Thank you. We will contact you shortly.",
  footerText: "We respect your privacy. Your details are safe with us.",
  gtmId: "contact_page_form",
  backgroundColor: "#f7f3ed",
  formBackgroundColor: "#ffffff",
  formTextColor: "#0b1f35",
  inputBackgroundColor: "#ffffff",
  inputBorderColor: "#d8dde6",
  inputTextColor: "#0b1f35",
  // Omit fieldLabelColor so labels inherit formTextColor (avoids navy labels on dark forms).
  buttonBackgroundColor: "#b98945",
  buttonTextColor: "#ffffff",
  fields: {
    name: { enabled: true, required: true, label: "Full Name", placeholder: "Enter your full name" },
    phone: { enabled: true, required: true, label: "Phone Number", placeholder: "Enter your phone number" },
    email: { enabled: true, required: false, label: "Email Address", placeholder: "Enter your email address" },
    message: { enabled: true, required: true, label: "Message", placeholder: "How can we help you?" },
    custom: [],
  },
};

function mergeField(base: ResolvedEnquiryField, overlay?: Partial<ResolvedEnquiryField>): ResolvedEnquiryField {
  return {
    enabled: overlay?.enabled ?? base.enabled,
    required: overlay?.required ?? base.required,
    label: overlay?.label || base.label,
    placeholder: overlay?.placeholder || base.placeholder,
  };
}

function defaultContactFields(enquiry: SiteData["enquiry"]): ResolvedContactFields {
  const enquiryDefaults = defaultEnquiryFields(enquiry);
  return {
    name: enquiryDefaults.name,
    phone: enquiryDefaults.phone,
    email: enquiryDefaults.email,
    message: {
      enabled: true,
      required: true,
      label: "Message",
      placeholder: "How can we help you?",
    },
    custom: [],
  };
}

function resolveContactFields(
  fields: ContactSectionFields | undefined,
  enquiry: SiteData["enquiry"],
): ResolvedContactFields {
  const defaults = defaultContactFields(enquiry);
  return {
    name: mergeField(defaults.name, fields?.name),
    phone: mergeField(defaults.phone, fields?.phone),
    email: mergeField(defaults.email, fields?.email),
    message: mergeField(defaults.message, fields?.message),
    custom: resolveCustomFields(fields?.custom),
  };
}

/** Historical seed / default — treat as “inherit form text” when form text is no longer navy. */
const LEGACY_FIELD_LABEL_COLOR = "#0b1f35";

function normalizeHexColor(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Resolve the color used for contact field labels.
 * Empty or legacy-default navy falls back to form text so dark forms with white text work.
 */
export function resolveContactFieldLabelColor(
  fieldLabelColor: string | undefined,
  formTextColor: string | undefined,
): string {
  const formText = (formTextColor || "").trim() || LEGACY_FIELD_LABEL_COLOR;
  const label = (fieldLabelColor || "").trim();
  if (!label) return formText;
  if (
    normalizeHexColor(label) === LEGACY_FIELD_LABEL_COLOR &&
    normalizeHexColor(formText) !== LEGACY_FIELD_LABEL_COLOR
  ) {
    return formText;
  }
  return label;
}

export function resolveContactSection(
  section: ContactSection | undefined,
  enquiry: SiteData["enquiry"],
): ResolvedContactSection {
  const base = section ?? DEFAULT_CONTACT_SECTION;
  const formTextColor = base.formTextColor || DEFAULT_CONTACT_SECTION.formTextColor;
  return {
    ...DEFAULT_CONTACT_SECTION,
    ...base,
    formTextColor,
    // Persist empty when inheriting so CMS can distinguish “unset” from an explicit navy.
    fieldLabelColor: (() => {
      const raw = (base.fieldLabelColor || "").trim();
      if (!raw) return undefined;
      if (
        normalizeHexColor(raw) === LEGACY_FIELD_LABEL_COLOR &&
        normalizeHexColor(formTextColor || "") !== LEGACY_FIELD_LABEL_COLOR
      ) {
        return undefined;
      }
      return raw;
    })(),
    headingAccent: base.headingAccent || "",
    description: base.description || DEFAULT_CONTACT_SECTION.description || "",
    imageAlt: base.imageAlt || DEFAULT_CONTACT_SECTION.imageAlt || "Contact section image",
    layout: base.layout === "imageRight" ? "imageRight" : "imageLeft",
    submitLabel: base.submitLabel || DEFAULT_CONTACT_SECTION.submitLabel || "Send Message",
    successMessage: base.successMessage || DEFAULT_CONTACT_SECTION.successMessage || "Thank you. We will contact you shortly.",
    footerText: base.footerText || DEFAULT_CONTACT_SECTION.footerText || "",
    fields: resolveContactFields(base.fields, enquiry),
  };
}

export function blankContactCustomField(label = "New field") {
  return blankCustomField(label);
}

export { customFieldFormName };

export function validateContactFields(
  values: { name: string; phone: string; email: string; message: string; custom: Record<string, string> },
  fields: ResolvedContactFields,
): string | null {
  const name = values.name.trim();
  const phone = values.phone.trim();
  const email = values.email.trim();
  const message = values.message.trim();

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
  if (fields.message.enabled && fields.message.required && message.length < 2) {
    return `Please enter your ${fields.message.label.toLowerCase()}.`;
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
