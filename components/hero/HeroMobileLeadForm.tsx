"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, LoaderCircle, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { getAnalyticsSessionKey } from "@/lib/analytics-session";
import { appendAttribution } from "@/lib/attribution";
import { resolveButtonBackgroundStyle } from "@/lib/button-background";
import { appendLeadClickSource } from "@/lib/lead-click-source";
import { extraLeadClickSources } from "@/lib/lead-form-buttons";
import {
  leadFormGtmDomAttrs,
  leadFormGtmEventParams,
  leadFormGtmSuccessDomAttrs,
  resolveLeadFormGtmContext,
} from "@/lib/lead-form-gtm";
import { pushGtmEvent } from "@/lib/google-tag-manager-events";
import {
  HERO_MOBILE_LEAD_FORM_INTENT_ID,
  resolveHeroMobileFieldLabelColor,
  resolveHeroMobileLeadForm,
  validateHeroMobileLeadFields,
} from "@/lib/hero-mobile";

function MobileLeadField({
  icon: IconComponent,
  label,
  name,
  placeholder,
  type = "text",
  required,
  inputMode,
  maxLength,
  labelColor,
  inputBackgroundColor,
  inputBorderColor,
  inputTextColor,
}: {
  icon: typeof UserRound;
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  inputMode?: "numeric" | "text" | "tel";
  maxLength?: number;
  labelColor: string;
  inputBackgroundColor: string;
  inputBorderColor: string;
  inputTextColor: string;
}) {
  return (
    <label className="block text-[13px] font-medium" style={{ color: labelColor }}>
      <span>{label}</span>
      <span className="relative mt-1.5 block">
        <IconComponent
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-60"
          style={{ color: labelColor }}
          aria-hidden="true"
        />
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          inputMode={inputMode}
          maxLength={maxLength}
          autoComplete={name === "phone" ? "tel" : "name"}
          className="w-full rounded-lg border py-2.5 pr-3 pl-10 text-[16px] outline-none transition-colors focus:ring-2 focus:ring-[var(--color-secondary)]/30"
          style={{
            backgroundColor: inputBackgroundColor,
            borderColor: inputBorderColor,
            color: inputTextColor,
          }}
        />
      </span>
    </label>
  );
}

/** Compact Name + Phone lead form — mobile only, sits below the hero offer card. */
export function HeroMobileLeadForm() {
  const siteData = useSiteData();
  const formConfig = useMemo(
    () => resolveHeroMobileLeadForm(siteData.hero, siteData.enquiry),
    [siteData.hero, siteData.enquiry],
  );
  const customGradients = siteData.customButtonGradients;

  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const trackedThankYouKey = useRef("");

  const gtmContext = useMemo(
    () =>
      resolveLeadFormGtmContext({
        formId: HERO_MOBILE_LEAD_FORM_INTENT_ID,
        formName: formConfig.title || "Hero mobile lead form",
        formLocation: "hero_mobile",
        gtmId: formConfig.gtmId,
      }),
    [formConfig.title, formConfig.gtmId],
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

  if (!formConfig.enabled) return null;

  const labelColor = resolveHeroMobileFieldLabelColor(formConfig.fieldLabelColor, formConfig.formTextColor);
  const visibleFields = (["name", "phone"] as const).filter((key) => formConfig.fields[key].enabled);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setError("");

    const values = {
      name: String(form.get("name") || ""),
      phone: String(form.get("phone") || ""),
    };
    const fieldError = validateHeroMobileLeadFields(values, formConfig.fields);
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
      appendLeadClickSource(params, extraLeadClickSources.heroMobileLeadForm);
      appendAttribution(params);

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: params,
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Unable to send your details. Please try again.");
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
          : "Unable to send your details. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="mt-4 w-full justify-self-stretch overflow-hidden max-sm:mx-[var(--lead-mx)] max-sm:w-[calc(100%-2*var(--lead-mx))] max-sm:rounded-none max-sm:border-solid max-sm:[border-width:var(--lead-border-w)] max-sm:[border-color:var(--lead-border-c)] max-sm:shadow-none sm:hidden"
      style={{
        backgroundColor: formConfig.formBackgroundColor,
        color: formConfig.formTextColor,
        minHeight:
          typeof formConfig.formMinHeight === "number" && formConfig.formMinHeight > 0
            ? `${formConfig.formMinHeight}px`
            : undefined,
        ["--lead-border-w" as string]: `${formConfig.chrome.borderWidth}px`,
        ["--lead-border-c" as string]: formConfig.chrome.borderColor,
        ["--lead-mx" as string]: `${formConfig.chrome.marginX}px`,
      }}
      data-managed-section="hero-mobile-lead"
    >
      <div className="flex h-full flex-col justify-center p-4">
        {formConfig.title ? (
          <h3 className="font-serif text-[20px] font-semibold leading-tight">{formConfig.title}</h3>
        ) : null}

        {sent ? (
          <div className="py-5 text-center" {...leadFormGtmSuccessDomAttrs(gtmContext)}>
            <ShieldCheck className="mx-auto size-9 text-[var(--color-secondary)]" />
            <p className="mt-3 text-[14px] leading-relaxed opacity-90">{formConfig.successMessage}</p>
            <button
              type="button"
              onClick={() => setSent(false)}
              data-gtm-id={`${gtmContext.formKey}.success-again`}
              data-gtm-form-key={gtmContext.formKey}
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border px-4 text-[13px] font-semibold transition-colors hover:bg-black/5"
              style={{ borderColor: formConfig.inputBorderColor }}
            >
              Submit again
            </button>
          </div>
        ) : (
          <form
            className={`${formConfig.title ? "mt-3" : ""} space-y-3`}
            onSubmit={onSubmit}
            {...leadFormGtmDomAttrs(gtmContext)}
          >
            <input name="website" type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <input name="intent" type="hidden" value={HERO_MOBILE_LEAD_FORM_INTENT_ID} />

            {visibleFields.map((key) => {
              const field = formConfig.fields[key];
              const label = field.required ? field.label : `${field.label} (Optional)`;
              return (
                <MobileLeadField
                  key={key}
                  icon={key === "phone" ? Phone : UserRound}
                  label={label}
                  name={key}
                  placeholder={field.placeholder}
                  type={key === "phone" ? "tel" : "text"}
                  required={field.required}
                  inputMode={key === "phone" ? "numeric" : undefined}
                  maxLength={key === "phone" ? 14 : undefined}
                  labelColor={labelColor}
                  inputBackgroundColor={formConfig.inputBackgroundColor}
                  inputBorderColor={formConfig.inputBorderColor}
                  inputTextColor={formConfig.inputTextColor}
                />
              );
            })}

            {error ? <p className="text-[12px] font-medium text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={sending}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md px-4 text-[13px] font-semibold text-white transition-[filter] hover:brightness-105 disabled:opacity-70"
              style={{
                ...resolveButtonBackgroundStyle(
                  {
                    backgroundType: formConfig.buttonBackgroundType,
                    backgroundColor: formConfig.buttonBackgroundColor,
                    backgroundGradient: formConfig.buttonBackgroundGradient,
                  },
                  customGradients,
                ),
                color: formConfig.buttonTextColor,
              }}
              data-gtm-id="hero.mobileLeadForm.submit"
              data-gtm-label={formConfig.submitLabel}
              data-gtm-section="Hero"
            >
              {sending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
              <span>{sending ? "Sending…" : formConfig.submitLabel}</span>
              {!sending ? <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" /> : null}
            </button>

            {formConfig.footerText ? (
              <p className="text-center text-[11px] leading-4 opacity-70">{formConfig.footerText}</p>
            ) : null}
          </form>
        )}
      </div>
    </div>
  );
}
