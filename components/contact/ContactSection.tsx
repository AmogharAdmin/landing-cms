"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlignLeft,
  ArrowRight,
  Calendar,
  ChevronDown,
  Hash,
  LoaderCircle,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import {
  CONTACT_SECTION_INTENT_ID,
  customFieldFormName,
  resolveContactFieldLabelColor,
  resolveContactSection,
  validateContactFields,
} from "@/lib/contact-section";
import { getAnalyticsSessionKey } from "@/lib/analytics-session";
import { appendAttribution } from "@/lib/attribution";
import { appendLeadClickSource } from "@/lib/lead-click-source";
import {
  leadFormGtmDomAttrs,
  leadFormGtmEventParams,
  leadFormGtmSuccessDomAttrs,
  resolveLeadFormGtmContext,
} from "@/lib/lead-form-gtm";
import { pushGtmEvent } from "@/lib/google-tag-manager-events";
import { extraLeadClickSources } from "@/lib/lead-form-buttons";
import { resolveButtonBackgroundStyle } from "@/lib/button-background";
import { textStyle } from "@/lib/typography";

const coreFieldIcons = {
  name: UserRound,
  phone: Phone,
  email: Mail,
  message: MessageSquare,
} as const;

type FieldStyle = {
  labelColor: string;
  inputBackgroundColor: string;
  inputBorderColor: string;
  inputTextColor: string;
};

function ContactField({
  icon: IconComponent,
  label,
  name,
  placeholder,
  type = "text",
  required,
  inputMode,
  maxLength,
  rows,
  style,
}: {
  icon: typeof UserRound;
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  inputMode?: "numeric" | "text" | "email" | "tel";
  maxLength?: number;
  rows?: number;
  style: FieldStyle;
}) {
  const inputClass =
    "w-full rounded-lg border py-2.5 pr-3 pl-10 text-[16px] outline-none transition-colors focus:ring-2 focus:ring-[var(--color-secondary)]/30 sm:text-[14px]";

  return (
    <label className="block text-[13px] font-medium" style={{ color: style.labelColor }}>
      <span className="bg-transparent">{label}</span>
      <span className="relative mt-1.5 block">
        <IconComponent
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-60"
          style={{ color: style.labelColor }}
          aria-hidden
        />
        {rows ? (
          <textarea
            name={name}
            required={required}
            rows={rows}
            placeholder={placeholder}
            className={`${inputClass} min-h-[6rem] resize-y`}
            style={{
              backgroundColor: style.inputBackgroundColor,
              borderColor: style.inputBorderColor,
              color: style.inputTextColor,
            }}
          />
        ) : (
          <input
            name={name}
            type={type}
            required={required}
            placeholder={placeholder}
            autoComplete="off"
            inputMode={inputMode}
            maxLength={maxLength}
            className={`${inputClass} min-h-11`}
            style={{
              backgroundColor: style.inputBackgroundColor,
              borderColor: style.inputBorderColor,
              color: style.inputTextColor,
            }}
          />
        )}
      </span>
    </label>
  );
}

export function ContactSection() {
  const siteData = useSiteData();
  const section = useMemo(
    () => resolveContactSection(siteData.contactSection, siteData.enquiry),
    [siteData.contactSection, siteData.enquiry],
  );

  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const trackedThankYouKey = useRef("");

  const gtmContext = useMemo(
    () =>
      resolveLeadFormGtmContext({
        formId: CONTACT_SECTION_INTENT_ID,
        formName: section.heading || "Contact form",
        formLocation: "contact_section",
        gtmId: section.gtmId,
      }),
    [section.heading, section.gtmId],
  );

  useEffect(() => {
    if (!sent) {
      trackedThankYouKey.current = "";
      return;
    }
    const key = gtmContext.formKey;
    if (trackedThankYouKey.current === key) return;
    trackedThankYouKey.current = key;
    pushGtmEvent("form_thank_you_view", {
      ...leadFormGtmEventParams(gtmContext),
      success_type: "message",
    });
  }, [sent, gtmContext]);

  if (section.enabled === false) return null;

  const imageOnRight = section.layout === "imageRight";
  const fieldStyle: FieldStyle = {
    labelColor: resolveContactFieldLabelColor(section.fieldLabelColor, section.formTextColor),
    inputBackgroundColor: section.inputBackgroundColor || "#ffffff",
    inputBorderColor: section.inputBorderColor || "#d8dde6",
    inputTextColor: section.inputTextColor || "#0b1f35",
  };

  const visibleCore = (["name", "phone", "email", "message"] as const).filter(
    (key) => section.fields[key].enabled,
  );
  const visibleCustom = section.fields.custom.filter((field) => field.enabled);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setError("");

    const customValues: Record<string, string> = {};
    for (const field of section.fields.custom) {
      if (!field.enabled) continue;
      customValues[field.id] = String(form.get(customFieldFormName(field.id)) || "");
    }

    const fieldError = validateContactFields(
      {
        name: String(form.get("name") || ""),
        phone: String(form.get("phone") || ""),
        email: String(form.get("email") || ""),
        message: String(form.get("message") || ""),
        custom: customValues,
      },
      section.fields,
    );
    if (fieldError) {
      setError(fieldError);
      pushGtmEvent("form_submit_error", {
        ...leadFormGtmEventParams(gtmContext),
        error_type: "validation",
      });
      return;
    }

    setSending(true);
    try {
      const params = new URLSearchParams(
        Array.from(form.entries()).map(([key, value]) => [key, String(value)]),
      );
      const sessionKey = getAnalyticsSessionKey();
      if (sessionKey) params.set("sessionKey", sessionKey);
      appendLeadClickSource(params, extraLeadClickSources.contactSectionForm);
      appendAttribution(params);

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: params,
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Unable to send your message. Please try again.");
      }
      formElement.reset();
      setSent(true);
      pushGtmEvent("form_submit_success", {
        ...leadFormGtmEventParams(gtmContext),
        success_type: "message",
      });
    } catch (submissionError) {
      pushGtmEvent("form_submit_error", {
        ...leadFormGtmEventParams(gtmContext),
        error_type: "request",
      });
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to send your message. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      className="section"
      style={{ backgroundColor: section.backgroundColor || "#f7f3ed" }}
      aria-labelledby="contact-section-heading"
    >
      <Container>
        <div className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
          <div className={`flex flex-col justify-center ${imageOnRight ? "lg:order-2" : ""}`}>
            <SectionLabel style={textStyle(section, "label")}>{section.label}</SectionLabel>
            <h2
              id="contact-section-heading"
              className="mt-4 font-serif text-[34px] leading-[1.12] text-[var(--color-primary)] sm:text-[40px]"
              style={textStyle(section, "heading")}
            >
              {section.heading}
              {section.headingAccent ? (
                <span className="mt-1 block text-[var(--color-secondary)]" style={textStyle(section, "headingAccent")}>
                  {section.headingAccent}
                </span>
              ) : null}
            </h2>
            {section.description ? (
              <p className="mt-4 text-[15px] leading-7 text-[var(--color-muted)]" style={textStyle(section, "description")}>
                {section.description}
              </p>
            ) : null}
            {section.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={section.image}
                alt={section.imageAlt}
                className="mt-6 w-full rounded-2xl border border-black/5 object-cover shadow-[0_18px_50px_rgba(11,31,53,0.12)]"
              />
            ) : null}
          </div>

          <div className={`flex w-full ${imageOnRight ? "lg:order-1" : ""}`}>
            <div
              className="flex w-full flex-1 flex-col justify-center rounded-2xl border border-black/5 p-5 shadow-[0_18px_50px_rgba(11,31,53,0.08)] sm:p-7"
              style={{
                backgroundColor: section.formBackgroundColor || "#ffffff",
                color: section.formTextColor || "#0b1f35",
                minHeight:
                  typeof section.formMinHeight === "number" && section.formMinHeight > 0
                    ? `${section.formMinHeight}px`
                    : undefined,
              }}
            >
              {sent ? (
                <div
                  className="py-6 text-center"
                  {...leadFormGtmSuccessDomAttrs(gtmContext)}
                >
                  <ShieldCheck className="mx-auto size-10 text-[var(--color-secondary)]" />
                  <h3 className="mt-3 font-serif text-[22px]">Thank you</h3>
                  <p className="mt-2 text-[14px] leading-relaxed opacity-80">{section.successMessage}</p>
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    data-gtm-id={`${gtmContext.formKey}.success-again`}
                    data-gtm-form-key={gtmContext.formKey}
                    className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg border px-4 text-[13px] font-semibold transition-colors hover:bg-black/5"
                    style={{ borderColor: section.inputBorderColor || "#d8dde6" }}
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form
                  className="space-y-3.5"
                  onSubmit={onSubmit}
                  {...leadFormGtmDomAttrs(gtmContext)}
                >
                  <input name="website" type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                  <input name="intent" type="hidden" value={CONTACT_SECTION_INTENT_ID} />

                  {visibleCore.map((key) => {
                    const field = section.fields[key];
                    const FieldIcon = coreFieldIcons[key];
                    const label = field.required ? field.label : `${field.label} (Optional)`;
                    return (
                      <ContactField
                        key={key}
                        icon={FieldIcon}
                        label={label}
                        name={key}
                        placeholder={field.placeholder}
                        type={key === "phone" ? "tel" : key === "email" ? "email" : "text"}
                        required={field.required}
                        inputMode={key === "phone" ? "numeric" : undefined}
                        maxLength={key === "phone" ? 14 : undefined}
                        rows={key === "message" ? 4 : undefined}
                        style={fieldStyle}
                      />
                    );
                  })}

                  {visibleCustom.map((field) => {
                    const label = field.required ? field.label : `${field.label} (Optional)`;
                    if (field.type === "textarea") {
                      return (
                        <ContactField
                          key={field.id}
                          icon={AlignLeft}
                          label={label}
                          name={customFieldFormName(field.id)}
                          placeholder={field.placeholder}
                          required={field.required}
                          rows={4}
                          style={fieldStyle}
                        />
                      );
                    }
                    if (field.type === "select") {
                      return (
                        <label key={field.id} className="block text-[13px] font-medium" style={{ color: fieldStyle.labelColor }}>
                          {label}
                          <span className="relative mt-1.5 block">
                            <select
                              name={customFieldFormName(field.id)}
                              required={field.required}
                              defaultValue=""
                              className="min-h-11 w-full appearance-none rounded-lg border py-2.5 pr-9 pl-3 text-[16px] outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/30 sm:text-[14px]"
                              style={{
                                backgroundColor: fieldStyle.inputBackgroundColor,
                                borderColor: fieldStyle.inputBorderColor,
                                color: fieldStyle.inputTextColor,
                              }}
                            >
                              <option value="" disabled>
                                {field.placeholder || "Select an option"}
                              </option>
                              {(field.options || []).map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 opacity-60" />
                          </span>
                        </label>
                      );
                    }
                    if (field.type === "radio") {
                      return (
                        <div key={field.id} className="text-[13px] font-medium" style={{ color: fieldStyle.labelColor }}>
                          <span className="block">{label}</span>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(field.options || []).map((option) => (
                              <label
                                key={option}
                                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[13px]"
                                style={{ borderColor: fieldStyle.inputBorderColor }}
                              >
                                <input type="radio" name={customFieldFormName(field.id)} value={option} required={field.required} />
                                {option}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    if (field.type === "checkbox") {
                      return (
                        <label key={field.id} className="flex items-start gap-2 text-[13px]" style={{ color: fieldStyle.labelColor }}>
                          <input
                            type="checkbox"
                            name={customFieldFormName(field.id)}
                            value="yes"
                            required={field.required}
                            className="mt-1"
                          />
                          <span>{field.placeholder || field.label}</span>
                        </label>
                      );
                    }

                    const CustomIcon =
                      field.type === "email"
                        ? Mail
                        : field.type === "tel"
                        ? Phone
                        : field.type === "date"
                        ? Calendar
                        : field.type === "number"
                        ? Hash
                        : AlignLeft;

                    return (
                      <ContactField
                        key={field.id}
                        icon={CustomIcon}
                        label={label}
                        name={customFieldFormName(field.id)}
                        placeholder={field.placeholder}
                        type={
                          field.type === "email"
                            ? "email"
                            : field.type === "tel"
                            ? "tel"
                            : field.type === "date"
                            ? "date"
                            : field.type === "number"
                            ? "number"
                            : "text"
                        }
                        required={field.required}
                        inputMode={field.type === "tel" ? "numeric" : undefined}
                        maxLength={field.type === "tel" ? 14 : undefined}
                        style={fieldStyle}
                      />
                    );
                  })}

                  {error ? (
                    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={sending}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-[14px] font-semibold transition-opacity disabled:cursor-wait disabled:opacity-70"
                    style={{
                      ...resolveButtonBackgroundStyle(
                        {
                          backgroundType: section.buttonBackgroundType,
                          backgroundColor: section.buttonBackgroundColor || "var(--fill-secondary)",
                          backgroundGradient: section.buttonBackgroundGradient,
                        },
                        siteData.customButtonGradients,
                      ),
                      color: section.buttonTextColor || "#ffffff",
                    }}
                  >
                    {sending ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        {section.submitLabel}
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {section.footerText ? (
                <div className="mt-4 flex items-start gap-2 opacity-70">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--color-secondary)]" />
                  <p className="text-[12px] leading-5">{section.footerText}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
