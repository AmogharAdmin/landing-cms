"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlignLeft,
  ArrowRight,
  Calendar,
  ChevronDown,
  Download,
  ExternalLink,
  Hash,
  LoaderCircle,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { Icon } from "@/components/ui/Icon";
import {
  customFieldFormName,
  enquirySuccessHref,
  findEnquiryIntent,
  isEnquireHash,
  parseEnquireIntent,
  resolveIntentPresentation,
  validateLeadFields,
} from "@/lib/enquiry";
import { getAnalyticsSessionKey } from "@/lib/analytics-session";
import { appendAttribution } from "@/lib/attribution";
import { appendLeadClickSource, peekLeadClickSource } from "@/lib/lead-click-source";
import {
  leadClickGtmEventParams,
  leadFormGtmDomAttrs,
  leadFormGtmEventParams,
  leadFormGtmShellAttrs,
  leadFormGtmSuccessDomAttrs,
  resolveLeadFormGtmContext,
} from "@/lib/lead-form-gtm";
import { pushGtmEvent } from "@/lib/google-tag-manager-events";
import { textStyle } from "@/lib/typography";

const fieldIcons = {
  name: UserRound,
  phone: Phone,
  email: Mail,
} as const;

export function EnquiryModal() {
  const siteData = useSiteData();
  const { site, enquiry } = siteData;
  const [intentId, setIntentId] = useState("default");
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const trackedOpenKey = useRef("");
  const trackedThankYouKey = useRef("");

  const intent = useMemo(
    () => resolveIntentPresentation(findEnquiryIntent(enquiry, intentId), enquiry),
    [enquiry, intentId],
  );

  const gtmContext = useMemo(
    () =>
      resolveLeadFormGtmContext({
        formId: intent.id,
        formName: intent.name,
        formLocation: "enquiry_modal",
        gtmId: intent.gtmId,
      }),
    [intent.id, intent.name, intent.gtmId],
  );

  useEffect(() => {
    const syncHash = () => {
      const parsed = parseEnquireIntent(window.location.hash);
      const isOpen = isEnquireHash(window.location.hash);
      setOpen(isOpen);
      if (isOpen && parsed) setIntentId(parsed);
      if (!isOpen) {
        setSent(false);
        setSending(false);
        setDownloading(false);
        setError("");
      }
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    if (!open) {
      trackedOpenKey.current = "";
      trackedThankYouKey.current = "";
      return;
    }
    const expectedIntent = parseEnquireIntent(window.location.hash) || "default";
    if (intent.id !== expectedIntent) return;
    const key = `${window.location.hash}:${intent.id}`;
    if (trackedOpenKey.current === key) return;
    trackedOpenKey.current = key;
    pushGtmEvent("form_open", {
      ...leadFormGtmEventParams(gtmContext),
      ...leadClickGtmEventParams(peekLeadClickSource()),
    });
  }, [open, intent.id, intent.name, gtmContext]);

  useEffect(() => {
    if (!open || !sent) {
      if (!sent) trackedThankYouKey.current = "";
      return;
    }
    const key = `${gtmContext.formKey}:${intent.id}`;
    if (trackedThankYouKey.current === key) return;
    trackedThankYouKey.current = key;
    pushGtmEvent("form_thank_you_view", {
      ...leadFormGtmEventParams(gtmContext),
      success_type: intent.successType,
    });
  }, [open, sent, gtmContext, intent.id, intent.successType]);

  const close = useCallback(() => {
    setOpen(false);
    setSent(false);
    setSending(false);
    setDownloading(false);
    setError("");
    if (isEnquireHash(window.location.hash)) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setError("");

    const customValues: Record<string, string> = {};
    for (const field of intent.fields.custom) {
      if (!field.enabled) continue;
      customValues[field.id] = String(form.get(customFieldFormName(field.id)) || "");
    }

    const fieldError = validateLeadFields(
      {
        name: String(form.get("name") || ""),
        phone: String(form.get("phone") || ""),
        email: String(form.get("email") || ""),
        custom: customValues,
      },
      intent.fields,
    );
    if (fieldError) {
      setError(fieldError);
      pushGtmEvent("form_submit_error", {
        ...leadFormGtmEventParams(gtmContext),
        ...leadClickGtmEventParams(peekLeadClickSource()),
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
      appendLeadClickSource(params);
      appendAttribution(params);

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: params,
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Unable to send your enquiry. Please try again.");
      }
      formElement.reset();
      setSent(true);
      pushGtmEvent("form_submit_success", {
        ...leadFormGtmEventParams(gtmContext),
        success_type: intent.successType,
      });
    } catch (submissionError) {
      pushGtmEvent("form_submit_error", {
        ...leadFormGtmEventParams(gtmContext),
        error_type: "request",
      });
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to send your enquiry. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  const handleDirectDownload = async (fileUrl: string, defaultName: string) => {
    if (!fileUrl || fileUrl === "#") return;
    setDownloading(true);
    try {
      const downloadEndpoint = `/api/download?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(defaultName)}`;
      const response = await fetch(downloadEndpoint);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = defaultName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: direct browser download via attachment endpoint
      const downloadEndpoint = `/api/download?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(defaultName)}`;
      const fallbackLink = document.createElement("a");
      fallbackLink.href = downloadEndpoint;
      fallbackLink.rel = "noopener";
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
    } finally {
      setDownloading(false);
    }
  };

  if (!open) return null;

  const successHref = enquirySuccessHref(intent, site);
  const isDownload = intent.successType === "download";
  const isWhatsapp = intent.successType === "whatsapp";
  const isLink = intent.successType === "link";

  const isMasterPlan =
    intent.id === "masterplan" ||
    (intent.name && /master\s*plan/i.test(intent.name)) ||
    (intent.heading && /master\s*plan/i.test(intent.heading));

  const defaultDownloadLabel = isMasterPlan ? "Download Master Plan" : "Download Brochure";

  const successLabel =
    intent.successButtonLabel?.trim() ||
    (isWhatsapp ? "Chat on WhatsApp" : isDownload ? defaultDownloadLabel : "Visit Link");

  const siteSlug = (site.name || "Project").trim().replace(/[^a-zA-Z0-9_-]+/g, "-");
  const rawPath = successHref ? successHref.split("?")[0] : "";
  const extMatch = rawPath.match(/\.[a-zA-Z0-9]+$/);
  const ext = extMatch ? extMatch[0] : ".pdf";
  const downloadFileName = isMasterPlan
    ? `${siteSlug}-Master-Plan${ext}`
    : `${siteSlug}-Brochure${ext}`;

  const formBackground = (intent.backgroundColor || "").trim() || "#061d33";
  const visibleHighlights = intent.highlightsEnabled ? intent.highlights : [];
  const visibleFields = (["name", "phone", "email"] as const).filter((key) => intent.fields[key].enabled);
  const visibleCustom = intent.fields.custom.filter((field) => field.enabled);

  return (
    <div className="fixed inset-0 z-[70] flex items-stretch justify-center bg-[#020914]/85 backdrop-blur-md sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0" aria-label="Close enquiry form" onClick={close} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="enquiry-title"
        className="relative grid h-[100svh] max-h-none w-full max-w-[880px] overflow-y-auto overscroll-contain border-0 shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:h-auto sm:max-h-[min(540px,calc(100svh-32px))] sm:overflow-hidden sm:rounded-2xl sm:border sm:border-white/10 lg:grid-cols-2"
        style={{ backgroundColor: formBackground }}
        {...leadFormGtmShellAttrs(gtmContext, sent ? "success" : "form")}
      >
        <button type="button" onClick={close} className="absolute top-3 right-3 z-30 flex size-9 items-center justify-center rounded-full bg-[var(--enquiry-form-bg)] text-white backdrop-blur transition-colors hover:bg-white/10 sm:top-4 sm:right-4 sm:bg-transparent" style={{ ["--enquiry-form-bg" as string]: formBackground }} aria-label="Close">
          <X className="size-5" />
        </button>

        <div className="relative flex max-h-[28svh] min-h-0 flex-col overflow-hidden sm:max-h-none sm:min-h-[240px] lg:h-full">
          <div className="relative min-h-[120px] flex-1 overflow-hidden sm:min-h-[180px]">
            <img src={intent.backgroundImage} alt={intent.backgroundImageAlt} className="absolute inset-0 size-full object-cover" />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(to bottom, ${formBackground}59, transparent 40%, ${formBackground}cc)`,
              }}
            />
            {intent.showLogo ? (
              <img src={intent.logo || site.logo} alt={site.name} className="absolute top-3 left-3 z-10 h-8 w-auto sm:top-5 sm:left-5 sm:h-11" />
            ) : null}
          </div>
          {visibleHighlights.length ? (
            <div
              className="grid shrink-0 divide-x divide-white/20 px-2 py-2.5 sm:px-3 sm:py-3"
              style={{
                backgroundColor: formBackground,
                gridTemplateColumns: `repeat(${visibleHighlights.length}, minmax(0, 1fr))`,
              }}
            >
              {visibleHighlights.map((fact, index) => (
                <div key={`${fact.label}-${index}`} className="min-w-0 px-1 text-center text-white sm:px-1.5">
                  <Icon
                    name={fact.icon}
                    className="mx-auto size-4 text-[var(--color-accent)] sm:size-5"
                    style={fact.iconColor ? { color: fact.iconColor } : undefined}
                  />
                  <p
                    className="mt-1 text-[9px] font-semibold leading-snug break-words sm:text-[10px]"
                    style={fact.valueColor || fact.textColor ? { color: fact.valueColor || fact.textColor } : undefined}
                  >
                    {fact.value}
                  </p>
                  <p
                    className="mt-0.5 text-[8px] leading-snug break-words text-white/70 sm:text-[9px]"
                    style={fact.labelColor || fact.textColor ? { color: fact.labelColor || fact.textColor } : undefined}
                  >
                    {fact.label}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-5 py-4 text-white sm:overflow-y-auto sm:px-7 sm:py-5 lg:px-8">
          <div className="mb-2.5 flex items-center gap-2" aria-hidden="true">
            <span className="h-[2px] w-10 rounded-full [background:var(--fill-secondary)]" />
            <span className="size-1 rounded-full [background:var(--fill-secondary)]" />
          </div>
          <h2 id="enquiry-title" className="font-serif text-[26px] leading-[1.15] sm:text-[28px] lg:text-[30px]" style={textStyle(intent, "heading")}>
            {intent.heading}
            {intent.headingAccent ? <span className="block text-[var(--color-secondary)]" style={textStyle(intent, "headingAccent")}>{intent.headingAccent}</span> : null}
          </h2>
          {intent.description ? <p className="mt-1.5 text-[12px] leading-5 text-white/70" style={textStyle(intent, "description")}>{intent.description}</p> : null}
          {sent ? (
            <div
              className="mt-5 rounded-xl border border-[var(--color-secondary)]/35 bg-white/5 p-5 text-center"
              {...leadFormGtmSuccessDomAttrs(gtmContext)}
            >
              <ShieldCheck className="mx-auto size-9 text-[var(--color-secondary)]" />
              <h3 className="mt-2.5 font-serif text-[18px] text-white">Thank you</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-white/80">
                {intent.successMessage || enquiry.successMessage || "We will contact you shortly."}
              </p>

              {isDownload ? (
                successHref ? (
                  <button
                    type="button"
                    onClick={() => handleDirectDownload(successHref, downloadFileName)}
                    data-gtm-event="file_download"
                    data-gtm-label={successLabel}
                    data-gtm-id={`${gtmContext.formKey}.success-download`}
                    data-gtm-form-key={gtmContext.formKey}
                    disabled={downloading}
                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md [background:var(--fill-secondary)] px-4 text-[13px] font-semibold text-white shadow-lg transition-colors hover:[background:var(--fill-accent)] disabled:cursor-wait disabled:opacity-75"
                  >
                    {downloading ? (
                      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Download className="size-4" aria-hidden="true" />
                    )}
                    {downloading ? "Downloading…" : successLabel}
                  </button>
                ) : (
                  <div className="mt-4 space-y-2">
                    <p className="text-[12px] text-white/60">
                      Our team will share the document with you shortly.
                    </p>
                    <button
                      type="button"
                      onClick={close}
                      data-gtm-id={`${gtmContext.formKey}.success-close`}
                      data-gtm-form-key={gtmContext.formKey}
                      className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-white/10 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-white/15"
                    >
                      Close
                    </button>
                  </div>
                )
              ) : isWhatsapp && successHref ? (
                <a
                  href={successHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-gtm-event="whatsapp_click"
                  data-gtm-id={`${gtmContext.formKey}.success-whatsapp`}
                  data-gtm-form-key={gtmContext.formKey}
                  data-gtm-label={successLabel}
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 text-[13px] font-semibold text-white shadow-lg transition-colors hover:bg-[#20bd5a]"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  {successLabel}
                </a>
              ) : isLink && successHref ? (
                <a
                  href={successHref}
                  target={successHref.startsWith("http") ? "_blank" : undefined}
                  rel={successHref.startsWith("http") ? "noopener noreferrer" : undefined}
                  data-gtm-id={`${gtmContext.formKey}.success-link`}
                  data-gtm-form-key={gtmContext.formKey}
                  data-gtm-label={successLabel}
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md [background:var(--fill-secondary)] px-4 text-[13px] font-semibold text-white shadow-lg transition-colors hover:[background:var(--fill-accent)]"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  {successLabel}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={close}
                  data-gtm-id={`${gtmContext.formKey}.success-close`}
                  data-gtm-form-key={gtmContext.formKey}
                  className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-md bg-white/10 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-white/15"
                >
                  Close
                </button>
              )}
            </div>
          ) : (
            <form
              className="mt-3.5 space-y-2.5"
              onSubmit={onSubmit}
              {...leadFormGtmDomAttrs(gtmContext)}
            >
              <input name="website" type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              <input name="intent" type="hidden" value={intent.id} />
              {visibleFields.map((key) => {
                const field = intent.fields[key];
                const FieldIcon = fieldIcons[key];
                const label = field.required ? field.label : `${field.label} (Optional)`;
                return (
                  <LeadField
                    key={key}
                    icon={FieldIcon}
                    label={label}
                    name={key}
                    placeholder={field.placeholder}
                    autoComplete={key === "name" ? "name" : key === "phone" ? "tel" : "email"}
                    type={key === "phone" ? "tel" : key === "email" ? "email" : "text"}
                    required={field.required}
                    inputMode={key === "phone" ? "numeric" : undefined}
                    maxLength={key === "phone" ? 14 : undefined}
                  />
                );
              })}
              {visibleCustom.map((field) => {
                const label = field.required ? field.label : `${field.label} (Optional)`;
                if (field.type === "textarea") {
                  return (
                    <label key={field.id} className="block text-[12px] font-medium text-white/90">
                      {label}
                      <span className="relative mt-1 block">
                        <AlignLeft className="pointer-events-none absolute top-3 left-3 size-4 text-white/65" />
                        <textarea
                          name={customFieldFormName(field.id)}
                          required={field.required}
                          rows={3}
                          placeholder={field.placeholder}
                          className="min-h-[4.5rem] w-full resize-y rounded-md border border-white/20 bg-black/25 py-2.5 pr-3 pl-10 text-[16px] text-white outline-none placeholder:text-white/35 focus:border-[var(--color-secondary)] sm:text-[13px]"
                        />
                      </span>
                    </label>
                  );
                }

                if (field.type === "select") {
                  return (
                    <label key={field.id} className="block text-[12px] font-medium text-white/90">
                      {label}
                      <span className="relative mt-1 block">
                        <select
                          name={customFieldFormName(field.id)}
                          required={field.required}
                          defaultValue=""
                          className="min-h-10 w-full appearance-none rounded-md border border-white/20 py-2 pr-9 pl-3 text-[16px] text-white outline-none focus:border-[var(--color-secondary)] sm:text-[13px]"
                          style={{ backgroundColor: formBackground }}
                        >
                          <option value="" disabled className="bg-[#0b1f35] text-white/40">
                            {field.placeholder || "Select an option"}
                          </option>
                          {(field.options || []).map((option) => (
                            <option key={option} value={option} className="bg-[#0b1f35] text-white">
                              {option}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-white/60" />
                      </span>
                    </label>
                  );
                }

                if (field.type === "radio") {
                  return (
                    <div key={field.id} className="block text-[12px] font-medium text-white/90">
                      <span className="block">{label}</span>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {(field.options || []).map((option, optIdx) => (
                          <label
                            key={option}
                            className="group relative inline-flex cursor-pointer select-none items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-white/90 transition hover:bg-white/10 has-[:checked]:border-[var(--color-secondary)] has-[:checked]:bg-[var(--color-secondary)]/25 has-[:checked]:text-white"
                          >
                            <input
                              type="radio"
                              name={customFieldFormName(field.id)}
                              value={option}
                              required={field.required && optIdx === 0}
                              className="size-3.5 border-white/40 text-[var(--color-secondary)] focus:ring-[var(--color-secondary)]"
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (field.type === "checkbox") {
                  return (
                    <label key={field.id} className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-white/15 bg-white/5 p-2.5 text-[12px] text-white/90 transition hover:bg-white/10">
                      <input
                        type="checkbox"
                        name={customFieldFormName(field.id)}
                        value="Yes"
                        required={field.required}
                        className="mt-0.5 size-4 rounded border-white/30 bg-transparent text-[var(--color-secondary)] focus:ring-[var(--color-secondary)]"
                      />
                      <span className="leading-snug">{field.placeholder || field.label}</span>
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
                  <LeadField
                    key={field.id}
                    icon={CustomIcon}
                    label={label}
                    name={customFieldFormName(field.id)}
                    placeholder={field.placeholder}
                    autoComplete="off"
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
                  />
                );
              })}
              {error ? <p role="alert" className="rounded-md border border-red-300/25 bg-red-500/10 px-3 py-1.5 text-[11px] leading-4 text-red-100">{error}</p> : null}
              <button type="submit" disabled={sending} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md [background:var(--fill-secondary)] px-4 text-[13px] font-semibold text-white transition-colors hover:[background:var(--fill-accent)] disabled:cursor-wait disabled:opacity-65">
                {sending ? "Sending…" : intent.submitLabel}
                {!sending ? <ArrowRight className="size-4" /> : null}
              </button>
            </form>
          )}

          {intent.footerText ? (
            <div className="mt-3 flex items-start gap-2 text-white/60">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--color-secondary)]" />
              <p className="text-[11px] leading-4" style={textStyle(intent, "footerText")}>{intent.footerText}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type LeadFieldProps = {
  icon: typeof UserRound;
  label: string;
  name: string;
  placeholder: string;
  autoComplete: string;
  type?: "text" | "tel" | "email" | "date" | "number";
  required?: boolean;
  inputMode?: "numeric" | "text" | "email" | "tel";
  maxLength?: number;
};

function LeadField({
  icon: FieldIcon,
  label,
  name,
  placeholder,
  autoComplete,
  type = "text",
  required,
  inputMode,
  maxLength,
}: LeadFieldProps) {
  return (
    <label className="block text-[12px] font-medium text-white/90">
      {label}
      <span className="relative mt-1 block">
        <FieldIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/65" />
        <input
          name={name}
          type={type}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          inputMode={inputMode}
          maxLength={maxLength}
          className="min-h-10 w-full rounded-md border border-white/20 bg-transparent pr-3 pl-10 text-[16px] text-white outline-none placeholder:text-white/35 focus:border-[var(--color-secondary)] sm:text-[13px]"
        />
      </span>
    </label>
  );
}
