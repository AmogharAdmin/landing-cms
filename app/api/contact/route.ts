import nodemailer from "nodemailer";
import { insertFormSubmission, markSessionConverted } from "@/lib/server/analytics";
import { resolveGeoLocation } from "@/lib/server/geo-location";
import { getSiteData } from "@/lib/server/site-data";
import { hasValidMutationOrigin, jsonError, requestIp } from "@/lib/server/security";
import {
  customFieldFormName,
  findEnquiryIntent,
  resolveIntentPresentation,
  validateLeadFields,
} from "@/lib/enquiry";
import {
  CONTACT_SECTION_INTENT_ID,
  resolveContactSection,
  validateContactFields,
} from "@/lib/contact-section";
import {
  HERO_MOBILE_LEAD_FORM_INTENT_ID,
  resolveHeroMobileLeadForm,
  validateHeroMobileLeadFields,
} from "@/lib/hero-mobile";
import { forwardLeadToBuildesk, normalizeBuildeskCrm } from "@/lib/buildesk-crm";
import { insertCrmLeadForward } from "@/lib/server/crm-leads";
import { attributionFromCookieHeader, sanitizeGclid, sanitizeUtmTerm, type Attribution } from "@/lib/attribution";
import type { SiteData } from "@/types/site";

export const runtime = "nodejs";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] || character);
}

/** Parse lead posts from urlencoded or multipart bodies reliably. */
async function readLeadFormData(request: Request): Promise<FormData> {
  const contentType = (request.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await request.text();
    const params = new URLSearchParams(text);
    const form = new FormData();
    for (const [key, value] of params.entries()) {
      form.append(key, value);
    }
    return form;
  }
  return request.formData();
}

function buildCustomFieldMap(
  fields: Array<{ id: string; label: string; enabled?: boolean }>,
  customValues: Record<string, string>,
) {
  const result: Record<string, string> = {};
  for (const field of fields) {
    if (field.enabled === false) continue;
    const value = (customValues[field.id] || "").trim();
    if (value) result[field.label] = value;
  }
  return result;
}

/** Body values win; stored cookies cover clients that could not append them. */
function readLeadAttribution(form: FormData, request: Request): Attribution {
  const cookies = attributionFromCookieHeader(request.headers.get("cookie"));
  return {
    utmTerm: sanitizeUtmTerm(String(form.get("utm_term") || "")) || cookies.utmTerm,
    gclid: sanitizeGclid(String(form.get("gclid") || "")) || cookies.gclid,
  };
}

function attributionMailLines(attribution: Attribution) {
  const text = [
    attribution.utmTerm ? `UTM term: ${attribution.utmTerm}` : "",
    attribution.gclid ? `GCLID: ${attribution.gclid}` : "",
  ].filter(Boolean).join("\n");
  const html = [
    attribution.utmTerm ? `<p><strong>UTM term:</strong> ${escapeHtml(attribution.utmTerm)}</p>` : "",
    attribution.gclid ? `<p><strong>GCLID:</strong> ${escapeHtml(attribution.gclid)}</p>` : "",
  ].join("");
  return { text: text ? `\n${text}` : "", html };
}

async function persistSubmission(
  request: Request,
  input: {
    formSource: string;
    formLabel: string;
    clickSource?: string;
    name: string;
    phone: string;
    email?: string;
    message?: string;
    customFields?: Record<string, string>;
    sessionKey?: string;
    attribution: Attribution;
  },
) {
  const ipAddress = requestIp(request);
  const geo = await resolveGeoLocation(request, ipAddress);
  try {
    const id = await insertFormSubmission({
      formSource: input.formSource,
      formLabel: input.formLabel,
      clickSource: input.clickSource,
      name: input.name,
      phone: input.phone,
      email: input.email,
      message: input.message,
      customFields: input.customFields,
      utmTerm: input.attribution.utmTerm || undefined,
      gclid: input.attribution.gclid || undefined,
      sessionKey: input.sessionKey,
      ipAddress: ipAddress === "unknown" ? undefined : ipAddress,
      country: geo.country,
      region: geo.region,
      city: geo.city,
    });
    if (input.sessionKey) {
      await markSessionConverted(input.sessionKey);
    }
    return { ok: true as const, id: id ?? null };
  } catch (error) {
    console.error("Form submission persist failed", error);
    return { ok: false as const, id: null };
  }
}

async function forwardToCrm(
  siteData: SiteData,
  lead: {
    name: string;
    phone: string;
    email?: string;
    message?: string;
    formLabel?: string;
    formSource: string;
    clickSource?: string;
    customFields?: Record<string, string>;
    formSubmissionId?: number | null;
    attribution: Attribution;
  },
) {
  const crm = normalizeBuildeskCrm(siteData.buildeskCrm);
  const formLabel = lead.formLabel || "Lead form";
  const utmTerm = lead.attribution.utmTerm || undefined;
  const gclid = lead.attribution.gclid || undefined;

  try {
    const result = await forwardLeadToBuildesk(siteData.buildeskCrm, {
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      message: lead.message,
      formLabel,
      formSource: lead.formSource,
      clickSource: lead.clickSource,
      customFields: lead.customFields,
      utmTerm,
      gclid,
    });

    // Log every attempt when CRM is enabled (including incomplete ApiKey / rejections).
    if (!result.skipped || !result.ok) {
      await insertCrmLeadForward({
        status: result.ok ? "success" : "failed",
        formSource: lead.formSource,
        formLabel,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        message: lead.message,
        projectName: crm.projectName,
        source: crm.source,
        subSource: result.subSource || crm.subSource,
        responseMessage: result.message,
        formSubmissionId: lead.formSubmissionId,
        utmTerm,
        gclid,
      });
    }

    if (result.skipped && result.ok) {
      console.info("Buildesk CRM skipped:", result.message, `(${formLabel})`);
    } else if (!result.ok) {
      console.error("Buildesk CRM forward failed:", result.message, `(${formLabel})`);
    } else {
      console.info("Buildesk CRM forward ok:", result.message, `(${formLabel})`);
    }
  } catch (error) {
    console.error("Buildesk CRM forward threw", error);
    await insertCrmLeadForward({
      status: "failed",
      formSource: lead.formSource,
      formLabel,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      message: lead.message,
      projectName: crm.projectName,
      source: crm.source,
      subSource: crm.subSource,
      responseMessage: error instanceof Error ? error.message : "CRM forward threw",
      formSubmissionId: lead.formSubmissionId,
      utmTerm,
      gclid,
    });
  }
}

function createTransporter() {
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPassword = process.env.SMTP_PASS?.trim();
  const recipient = process.env.MAIL_RECIPIENT?.trim();
  if (!smtpUser || !smtpPassword || !recipient) return null;

  const port = Number(process.env.SMTP_PORT || 465);
  return {
    recipient,
    fromName: process.env.MAIL_FROM_NAME?.trim(),
    transporter: nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
      auth: { user: smtpUser, pass: smtpPassword },
    }),
    smtpUser,
  };
}

export async function POST(request: Request) {
  if (!hasValidMutationOrigin(request)) return jsonError("There was a problem with your submission.", 403);

  try {
    const form = await readLeadFormData(request);
    if (String(form.get("website") || "").trim()) return Response.json({ ok: true });

    const siteData = await getSiteData();
    const intentId = String(form.get("intent") || "default").trim().slice(0, 80) || "default";
    const sessionKey = String(form.get("sessionKey") || "").trim().slice(0, 64);
    const clickSource = String(form.get("clickSource") || "").trim().slice(0, 120) || undefined;
    const attribution = readLeadAttribution(form, request);
    const attributionMail = attributionMailLines(attribution);

    if (intentId === CONTACT_SECTION_INTENT_ID) {
      const section = resolveContactSection(siteData.contactSection, siteData.enquiry);
      const customValues: Record<string, string> = {};
      for (const field of section.fields.custom) {
        if (!field.enabled) continue;
        customValues[field.id] = String(form.get(customFieldFormName(field.id)) || "").slice(0, 2000);
      }

      const values = {
        name: String(form.get("name") || "").slice(0, 200),
        phone: String(form.get("phone") || "").slice(0, 40),
        email: String(form.get("email") || "").slice(0, 200),
        message: String(form.get("message") || "").slice(0, 4000),
        custom: customValues,
      };
      const fieldError = validateContactFields(values, section.fields);
      if (fieldError) return jsonError(fieldError, 400);

      const name = values.name.trim() || "Not provided";
      const phone = values.phone.trim() || "Not provided";
      const email = values.email.trim();
      const message = values.message.trim() || "Not provided";
      const customFields = buildCustomFieldMap(section.fields.custom, customValues);
      const formLabel = section.heading?.trim() || "Contact form";
      const resolvedClickSource = clickSource || "Contact form · Page section";

      const saved = await persistSubmission(request, {
        formSource: CONTACT_SECTION_INTENT_ID,
        formLabel,
        clickSource: resolvedClickSource,
        name,
        phone,
        email: email || undefined,
        message,
        customFields,
        sessionKey: sessionKey || undefined,
        attribution,
      });

      // Every contact-section lead → CRM (independent of email success).
      await forwardToCrm(siteData, {
        name,
        phone,
        email: email || undefined,
        message,
        formLabel,
        formSource: CONTACT_SECTION_INTENT_ID,
        clickSource: resolvedClickSource,
        customFields,
        formSubmissionId: saved.id,
        attribution,
      });

      try {
        const mail = createTransporter();
        if (!mail) {
          if (saved.ok) return Response.json({ ok: true });
          return jsonError("Email is not configured on the server.", 500);
        }

        const fromName = mail.fromName || siteData.site.name;
        const customLines = section.fields.custom
          .filter((field) => field.enabled)
          .map((field) => {
            const value = (customValues[field.id] || "").trim() || "Not provided";
            return { label: field.label, value };
          });

        const textExtra = customLines.map((line) => `${line.label}: ${line.value}`).join("\n");
        const htmlExtra = customLines
          .map((line) => `<p><strong>${escapeHtml(line.label)}:</strong> ${escapeHtml(line.value)}</p>`)
          .join("");

        await mail.transporter.sendMail({
          from: { address: mail.smtpUser, name: fromName },
          to: mail.recipient,
          replyTo: email || undefined,
          subject: `New ${siteData.site.name} contact form: ${name}`,
          text: `New ${siteData.site.name} contact form\n\nFull Name: ${name}\nContact Number: ${phone}\nEmail: ${email || "Not provided"}\nMessage: ${message}${textExtra ? `\n${textExtra}` : ""}${attributionMail.text}`,
          html: `<h2>New ${escapeHtml(siteData.site.name)} contact form</h2><p><strong>Full Name:</strong> ${escapeHtml(name)}</p><p><strong>Contact Number:</strong> ${escapeHtml(phone)}</p><p><strong>Email:</strong> ${escapeHtml(email || "Not provided")}</p><p><strong>Message:</strong> ${escapeHtml(message)}</p>${htmlExtra}${attributionMail.html}`,
        });

        if (email && siteData.site.sendLeadConfirmationEmail !== false) {
          try {
            await mail.transporter.sendMail({
              from: { address: mail.smtpUser, name: fromName },
              to: email,
              subject: `We received your ${siteData.site.name} enquiry`,
              text: `Hi ${name},\n\nThank you for contacting ${siteData.site.name}. Our team will reach out shortly.\n\nRegards,\n${fromName}`,
              html: `<p>Hi ${escapeHtml(name)},</p><p>Thank you for contacting ${siteData.site.name}. Our team will reach out shortly.</p><p>Regards,<br><strong>${escapeHtml(fromName)}</strong></p>`,
            });
          } catch (error) {
            console.error("Contact confirmation email failed", error);
          }
        }
      } catch (error) {
        console.error("Contact notification email failed (CRM already forwarded)", error);
        if (!saved.ok) return jsonError("Unable to send your enquiry. Please try again.", 500);
      }

      return Response.json({ ok: true });
    }

    if (intentId === HERO_MOBILE_LEAD_FORM_INTENT_ID) {
      const mobileForm = resolveHeroMobileLeadForm(siteData.hero, siteData.enquiry);
      const values = {
        name: String(form.get("name") || "").slice(0, 200),
        phone: String(form.get("phone") || "").slice(0, 40),
      };
      const fieldError = validateHeroMobileLeadFields(values, mobileForm.fields);
      if (fieldError) return jsonError(fieldError, 400);

      const name = values.name.trim() || "Not provided";
      const phone = values.phone.trim() || "Not provided";
      const formLabel = mobileForm.title?.trim() || "Hero mobile lead form";
      const resolvedClickSource = clickSource || "Hero · Mobile lead form";

      const saved = await persistSubmission(request, {
        formSource: HERO_MOBILE_LEAD_FORM_INTENT_ID,
        formLabel,
        clickSource: resolvedClickSource,
        name,
        phone,
        sessionKey: sessionKey || undefined,
        attribution,
      });

      await forwardToCrm(siteData, {
        name,
        phone,
        formLabel,
        formSource: HERO_MOBILE_LEAD_FORM_INTENT_ID,
        clickSource: resolvedClickSource,
        formSubmissionId: saved.id,
        attribution,
      });

      try {
        const mail = createTransporter();
        if (!mail) {
          if (saved.ok) return Response.json({ ok: true });
          return jsonError("Email is not configured on the server.", 500);
        }

        const fromName = mail.fromName || siteData.site.name;
        await mail.transporter.sendMail({
          from: { address: mail.smtpUser, name: fromName },
          to: mail.recipient,
          subject: `New ${siteData.site.name} mobile hero lead: ${name}`,
          text: `New ${siteData.site.name} mobile hero lead\n\nSource: ${formLabel}\nForm id: ${HERO_MOBILE_LEAD_FORM_INTENT_ID}\nFull Name: ${name}\nContact Number: ${phone}${attributionMail.text}`,
          html: `<h2>New ${escapeHtml(siteData.site.name)} mobile hero lead</h2><p><strong>Source:</strong> ${escapeHtml(formLabel)}</p><p><strong>Form id:</strong> ${escapeHtml(HERO_MOBILE_LEAD_FORM_INTENT_ID)}</p><p><strong>Full Name:</strong> ${escapeHtml(name)}</p><p><strong>Contact Number:</strong> ${escapeHtml(phone)}</p>${attributionMail.html}`,
        });
      } catch (error) {
        console.error("Hero mobile lead notification email failed (CRM already forwarded)", error);
        if (!saved.ok) return jsonError("Unable to send your enquiry. Please try again.", 500);
      }

      return Response.json({ ok: true });
    }

    // All enquiry modal intents (default, brochure, masterplan, newly created, …)
    const intent = resolveIntentPresentation(findEnquiryIntent(siteData.enquiry, intentId), siteData.enquiry);
    const formLabel = intent.name?.trim() || intentId;

    const customValues: Record<string, string> = {};
    for (const field of intent.fields.custom) {
      if (!field.enabled) continue;
      customValues[field.id] = String(form.get(customFieldFormName(field.id)) || "").slice(0, 2000);
    }

    const values = {
      name: String(form.get("name") || "").slice(0, 200),
      phone: String(form.get("phone") || "").slice(0, 40),
      email: String(form.get("email") || "").slice(0, 200),
      custom: customValues,
    };
    const fieldError = validateLeadFields(values, intent.fields);
    if (fieldError) return jsonError(fieldError, 400);

    const name = values.name.trim() || "Not provided";
    const phone = values.phone.trim() || "Not provided";
    const email = values.email.trim();
    const customFields = buildCustomFieldMap(intent.fields.custom, customValues);

    const saved = await persistSubmission(request, {
      formSource: intentId,
      formLabel,
      clickSource,
      name,
      phone,
      email: email || undefined,
      customFields,
      sessionKey: sessionKey || undefined,
      attribution,
    });

    // Every enquiry intent → CRM (brochure, default, custom forms, etc.).
    await forwardToCrm(siteData, {
      name,
      phone,
      email: email || undefined,
      formLabel,
      formSource: intentId,
      clickSource,
      customFields,
      formSubmissionId: saved.id,
      attribution,
    });

    try {
      const mail = createTransporter();
      if (!mail) {
        if (saved.ok) return Response.json({ ok: true });
        return jsonError("Email is not configured on the server.", 500);
      }

      const fromName = mail.fromName || siteData.site.name;
      const customLines = intent.fields.custom
        .filter((field) => field.enabled)
        .map((field) => {
          const value = (customValues[field.id] || "").trim() || "Not provided";
          return { label: field.label, value };
        });

      const textExtra = customLines.map((line) => `${line.label}: ${line.value}`).join("\n");
      const htmlExtra = customLines
        .map((line) => `<p><strong>${escapeHtml(line.label)}:</strong> ${escapeHtml(line.value)}</p>`)
        .join("");

      await mail.transporter.sendMail({
        from: { address: mail.smtpUser, name: fromName },
        to: mail.recipient,
        replyTo: email || undefined,
        subject: `New ${siteData.site.name} enquiry (${formLabel}): ${name}`,
        text: `New ${siteData.site.name} enquiry\n\nSource: ${formLabel}\nForm id: ${intentId}\nFull Name: ${name}\nContact Number: ${phone}\nEmail: ${email || "Not provided"}${textExtra ? `\n${textExtra}` : ""}${attributionMail.text}`,
        html: `<h2>New ${escapeHtml(siteData.site.name)} enquiry</h2><p><strong>Source:</strong> ${escapeHtml(formLabel)}</p><p><strong>Form id:</strong> ${escapeHtml(intentId)}</p><p><strong>Full Name:</strong> ${escapeHtml(name)}</p><p><strong>Contact Number:</strong> ${escapeHtml(phone)}</p><p><strong>Email:</strong> ${escapeHtml(email || "Not provided")}</p>${htmlExtra}${attributionMail.html}`,
      });

      if (email && siteData.site.sendLeadConfirmationEmail !== false) {
        try {
          await mail.transporter.sendMail({
            from: { address: mail.smtpUser, name: fromName },
            to: email,
            subject: `We received your ${siteData.site.name} enquiry`,
            text: `Hi ${name},\n\nThank you for your interest in ${siteData.site.name}. Our team will contact you shortly.\n\nRegards,\n${fromName}`,
            html: `<p>Hi ${escapeHtml(name)},</p><p>Thank you for your interest in ${siteData.site.name}. Our team will contact you shortly.</p><p>Regards,<br><strong>${escapeHtml(fromName)}</strong></p>`,
          });
        } catch (error) {
          console.error("Lead confirmation email failed", error);
        }
      }
    } catch (error) {
      console.error("Lead notification email failed (CRM already forwarded)", error);
      if (!saved.ok) return jsonError("Unable to send your enquiry. Please try again.", 500);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Lead submission failed", error);
    return jsonError("Unable to send your enquiry. Please try again.", 500);
  }
}
