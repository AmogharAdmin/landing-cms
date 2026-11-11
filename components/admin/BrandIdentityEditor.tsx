"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { Copy, Download, FileText, ImagePlus, LoaderCircle, RotateCcw, Settings2, Trash2, X } from "lucide-react";
import type { SiteData, SiteInfo } from "@/types/site";
import { ButtonBackgroundPicker, CompactColorField, CompactToggle, type PathPart } from "@/components/admin/editor-ui";
import { uploadFileAsset } from "@/lib/client/upload";
import { DEFAULT_CALL_BUTTON_COLOR, DEFAULT_WHATSAPP_BUTTON_COLOR, DEFAULT_WHATSAPP_MESSAGE } from "@/lib/cta";
import { DEFAULT_LOGO_HEIGHT, DEFAULT_LOGO_HEIGHT_MOBILE } from "@/lib/logo";

type BrandIdentityEditorProps = {
  value: SiteData["site"];
  onUpdate: (path: PathPart[], value: unknown) => void;
  uploadEnabled: boolean;
  uploadEndpoint: string;
};

type LogoAppearanceConfig = {
  height?: number;
  heightMobile?: number;
  width?: number;
  widthMobile?: number;
  backgroundColor?: string;
  onHeightChange: (next: number | undefined) => void;
  onHeightMobileChange: (next: number | undefined) => void;
  onWidthChange: (next: number | undefined) => void;
  onWidthMobileChange: (next: number | undefined) => void;
  onBackgroundChange: (next: string) => void;
  onReset: () => void;
};

export function BrandIdentityEditor({
  value,
  onUpdate,
  uploadEnabled,
  uploadEndpoint,
}: BrandIdentityEditorProps) {
  const patch = <K extends keyof SiteInfo>(key: K, next: SiteInfo[K]) => {
    onUpdate(["site", key], next);
  };

  const patchSite = (partial: Partial<SiteInfo>) => {
    onUpdate(["site"], { ...value, ...partial });
  };

  const primaryAppearance: LogoAppearanceConfig = {
    height: value.logoHeight,
    heightMobile: value.logoHeightMobile,
    width: value.logoWidth,
    widthMobile: value.logoWidthMobile,
    backgroundColor: value.logoBackgroundColor,
    onHeightChange: (next) => onUpdate(["site", "logoHeight"], next),
    onHeightMobileChange: (next) => onUpdate(["site", "logoHeightMobile"], next),
    onWidthChange: (next) => onUpdate(["site", "logoWidth"], next),
    onWidthMobileChange: (next) => onUpdate(["site", "logoWidthMobile"], next),
    onBackgroundChange: (next) => patch("logoBackgroundColor", next),
    onReset: () =>
      patchSite({
        logoHeight: undefined,
        logoHeightMobile: undefined,
        logoWidth: undefined,
        logoWidthMobile: undefined,
        logoBackgroundColor: "",
      }),
  };

  const secondaryAppearance: LogoAppearanceConfig = {
    height: value.secondaryLogoHeight,
    heightMobile: value.secondaryLogoHeightMobile,
    width: value.secondaryLogoWidth,
    widthMobile: value.secondaryLogoWidthMobile,
    backgroundColor: value.secondaryLogoBackgroundColor,
    onHeightChange: (next) => onUpdate(["site", "secondaryLogoHeight"], next),
    onHeightMobileChange: (next) => onUpdate(["site", "secondaryLogoHeightMobile"], next),
    onWidthChange: (next) => onUpdate(["site", "secondaryLogoWidth"], next),
    onWidthMobileChange: (next) => onUpdate(["site", "secondaryLogoWidthMobile"], next),
    onBackgroundChange: (next) => patch("secondaryLogoBackgroundColor", next),
    onReset: () =>
      patchSite({
        secondaryLogoHeight: undefined,
        secondaryLogoHeightMobile: undefined,
        secondaryLogoWidth: undefined,
        secondaryLogoWidthMobile: undefined,
        secondaryLogoBackgroundColor: "",
      }),
  };

  return (
    <div className="space-y-5">
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-[12px] leading-5 text-slate-600">
        Upload your project <span className="font-medium text-[#0b1f35]">logo</span> (header, footer, forms), optional{" "}
        <span className="font-medium text-[#0b1f35]">secondary header logo</span>,{" "}
        <span className="font-medium text-[#0b1f35]">dashboard logo</span>, and{" "}
        <span className="font-medium text-[#0b1f35]">favicon</span>. Use the settings icon beside Upload to size each header logo.
      </p>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <AssetUploadCard
          title="Logo"
          description="Primary logo for header (left), footer, and lead forms. Prefer a transparent PNG or WebP."
          value={value.logo}
          onChange={(next) => patch("logo", next)}
          uploadEnabled={uploadEnabled}
          uploadEndpoint={uploadEndpoint}
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
          previewBackground={value.logoBackgroundColor}
          appearance={primaryAppearance}
        />
        <AssetUploadCard
          title="Secondary header logo"
          description="Optional. When set, appears on the right of the header and nav floats in the space between."
          value={value.secondaryLogo || ""}
          onChange={(next) => patch("secondaryLogo", next)}
          uploadEnabled={uploadEnabled}
          uploadEndpoint={uploadEndpoint}
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
          previewBackground={value.secondaryLogoBackgroundColor}
          appearance={secondaryAppearance}
        />
        <AssetUploadCard
          title="Dashboard Logo"
          description="Shown in the admin dashboard navigation bar. Falls back to project logo if empty."
          value={value.dashboardLogo || ""}
          onChange={(next) => patch("dashboardLogo", next)}
          uploadEnabled={uploadEnabled}
          uploadEndpoint={uploadEndpoint}
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
        />
        <AssetUploadCard
          title="Favicon"
          description="Small icon in the browser tab. Square PNG, ICO, or SVG works best (32×32 or 64×64)."
          value={value.favicon}
          onChange={(next) => patch("favicon", next)}
          uploadEnabled={uploadEnabled}
          uploadEndpoint={uploadEndpoint}
          accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml,image/webp,.ico"
          compactPreview
        />
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-[14px] font-medium text-[#0b1f35]">Project identity</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="admin-label">Name</span>
            <input value={value.name} onChange={(event) => patch("name", event.target.value)} className="admin-input" />
          </label>
          <label>
            <span className="admin-label">Developer</span>
            <input value={value.developer} onChange={(event) => patch("developer", event.target.value)} className="admin-input" />
          </label>
          <label>
            <span className="admin-label">Location</span>
            <input value={value.location} onChange={(event) => patch("location", event.target.value)} className="admin-input" />
          </label>
          <label>
            <span className="admin-label">Address</span>
            <input value={value.address} onChange={(event) => patch("address", event.target.value)} className="admin-input" />
          </label>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-[14px] font-medium text-[#0b1f35]">Contact</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="admin-label">Phone</span>
            <input value={value.phone} onChange={(event) => patch("phone", event.target.value)} className="admin-input" />
          </label>
          <label>
            <span className="admin-label">WhatsApp</span>
            <input value={value.whatsapp} onChange={(event) => patch("whatsapp", event.target.value)} className="admin-input" />
          </label>
          <label className="sm:col-span-2">
            <span className="admin-label">WhatsApp message text</span>
            <textarea
              value={value.whatsappMessage ?? DEFAULT_WHATSAPP_MESSAGE}
              onChange={(event) => patch("whatsappMessage", event.target.value)}
              rows={3}
              className="admin-input min-h-[4.5rem] resize-y py-2"
              placeholder={DEFAULT_WHATSAPP_MESSAGE}
            />
            <span className="mt-1 block text-[10px] text-slate-500">
              Prefills the chat when someone taps the floating WhatsApp button (and other WhatsApp CTAs).
            </span>
          </label>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
          <CompactToggle
            label="Send confirmation email to visitor"
            checked={value.sendLeadConfirmationEmail !== false}
            onChange={(checked) => patch("sendLeadConfirmationEmail", checked)}
          />
          <p className="mt-2 text-[11px] leading-4 text-slate-500">
            When off, you still get the lead email. The visitor does not get a “we received your enquiry” confirmation.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <section className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
            <h3 className="text-[12px] font-semibold text-[#0b1f35]">Call button</h3>
            <ButtonBackgroundPicker
              value={{
                backgroundType: value.callButtonBackgroundType,
                backgroundColor: value.callButtonColor || DEFAULT_CALL_BUTTON_COLOR,
                backgroundGradient: value.callButtonGradient,
              }}
              onChange={(next) =>
                patchSite({
                  callButtonBackgroundType: (next.backgroundType as "plain" | "gradient") || "plain",
                  callButtonColor: next.backgroundColor,
                  callButtonGradient: next.backgroundGradient,
                })
              }
              showTextColor={false}
              plainLabel="Call button fill"
            />
          </section>
          <section className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
            <h3 className="text-[12px] font-semibold text-[#0b1f35]">WhatsApp button</h3>
            <ButtonBackgroundPicker
              value={{
                backgroundType: value.whatsappButtonBackgroundType,
                backgroundColor: value.whatsappButtonColor || DEFAULT_WHATSAPP_BUTTON_COLOR,
                backgroundGradient: value.whatsappButtonGradient,
              }}
              onChange={(next) =>
                patchSite({
                  whatsappButtonBackgroundType: (next.backgroundType as "plain" | "gradient") || "plain",
                  whatsappButtonColor: next.backgroundColor,
                  whatsappButtonGradient: next.backgroundGradient,
                })
              }
              showTextColor={false}
              plainLabel="WhatsApp button fill"
            />
          </section>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-[14px] font-medium text-[#0b1f35]">Documents</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <DocumentPathField
            label="Brochure file"
            value={value.brochureUrl}
            onChange={(next) => patch("brochureUrl", next)}
            uploadEnabled={uploadEnabled}
            uploadEndpoint={uploadEndpoint}
          />
          <DocumentPathField
            label="Master plan file"
            value={value.masterPlanUrl}
            onChange={(next) => patch("masterPlanUrl", next)}
            uploadEnabled={uploadEnabled}
            uploadEndpoint={uploadEndpoint}
          />
        </div>
      </section>
    </div>
  );
}

function LogoHeightField({
  label,
  value,
  placeholder,
  min,
  max,
  onCommit,
}: {
  label: string;
  value?: number;
  placeholder: string;
  min: number;
  max: number;
  onCommit: (next: number | undefined) => void;
}) {
  const [local, setLocal] = useState(value != null ? String(value) : "");

  useEffect(() => {
    setLocal(value != null ? String(value) : "");
  }, [value]);

  return (
    <label>
      <span className="admin-label">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        value={local}
        placeholder={placeholder}
        onChange={(event) => {
          const raw = event.target.value.trim();
          if (raw === "" || /^\d+$/.test(raw)) setLocal(raw);
        }}
        onBlur={() => {
          if (local === "") {
            onCommit(undefined);
            return;
          }
          const parsed = Number(local);
          if (Number.isNaN(parsed)) {
            setLocal(value != null ? String(value) : "");
            return;
          }
          const clamped = Math.min(max, Math.max(min, Math.round(parsed)));
          setLocal(String(clamped));
          onCommit(clamped);
        }}
        className="admin-input"
      />
    </label>
  );
}

function LogoAppearancePopup({
  open,
  onClose,
  appearance,
}: {
  open: boolean;
  onClose: () => void;
  appearance: LogoAppearanceConfig;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-24"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-[#0b1f35]">Customize logo</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-3 px-4 py-4">
          <p className="text-[11px] leading-4 text-slate-500">
            Leave height blank for defaults ({DEFAULT_LOGO_HEIGHT_MOBILE}px mobile / {DEFAULT_LOGO_HEIGHT}px desktop). Leave width blank to keep the logo’s natural shape. Set a width to stretch it.
          </p>
          <LogoHeightField
            label="Height · mobile (px)"
            value={appearance.heightMobile}
            placeholder={String(DEFAULT_LOGO_HEIGHT_MOBILE)}
            min={20}
            max={120}
            onCommit={appearance.onHeightMobileChange}
          />
          <LogoHeightField
            label="Width · mobile (px)"
            value={appearance.widthMobile}
            placeholder="Auto"
            min={20}
            max={360}
            onCommit={appearance.onWidthMobileChange}
          />
          <LogoHeightField
            label="Height · desktop (px)"
            value={appearance.height}
            placeholder={String(DEFAULT_LOGO_HEIGHT)}
            min={20}
            max={160}
            onCommit={appearance.onHeightChange}
          />
          <LogoHeightField
            label="Width · desktop (px)"
            value={appearance.width}
            placeholder="Auto"
            min={20}
            max={480}
            onCommit={appearance.onWidthChange}
          />
          <CompactColorField
            label="Logo background"
            value={appearance.backgroundColor || ""}
            onChange={appearance.onBackgroundChange}
            placeholder="Transparent"
          />
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={() => appearance.onReset()}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="size-3.5" /> Reset to default
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-9 items-center rounded-lg bg-[#0b1f35] px-4 text-[12px] font-semibold text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function AssetUploadCard({
  title,
  description,
  value,
  onChange,
  uploadEnabled,
  uploadEndpoint,
  accept,
  compactPreview = false,
  previewBackground,
  appearance,
}: {
  title: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  uploadEnabled: boolean;
  uploadEndpoint: string;
  accept: string;
  compactPreview?: boolean;
  previewBackground?: string;
  appearance?: LogoAppearanceConfig;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const previewBg = (previewBackground || "").trim() || "#ffffff";

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const publicPath = await uploadFileAsset(file, uploadEndpoint);
      onChange(publicPath);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <article className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div>
        <h2 className="text-[14px] font-medium text-[#0b1f35]">{title}</h2>
        <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{description}</p>
      </div>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className={`rounded-lg border border-slate-200 object-contain ${
            compactPreview ? "mx-auto h-20 w-20 p-2" : "h-28 w-full max-w-xs object-left p-3"
          }`}
          style={{ backgroundColor: previewBg }}
        />
      ) : (
        <div
          className={`flex items-center justify-center rounded-lg border border-dashed border-slate-200 text-[12px] text-slate-400 ${
            compactPreview ? "mx-auto h-20 w-20" : "h-28"
          }`}
          style={{ backgroundColor: previewBg }}
        >
          No file
        </div>
      )}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="admin-input"
        placeholder="/images/example.webp"
      />
      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <label
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold ${
            uploadEnabled ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed opacity-50"
          }`}
        >
          {uploading ? <LoaderCircle className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />} Upload
          <input type="file" accept={accept} disabled={!uploadEnabled || uploading} className="hidden" onChange={upload} />
        </label>
        {appearance ? (
          <button
            type="button"
            onClick={() => setCustomizeOpen(true)}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-[#b98945] hover:text-[#0b1f35]"
            aria-label={`Customize ${title}`}
            title="Customize size & background"
          >
            <Settings2 className="size-3.5" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onChange("")}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-[11px] font-semibold text-red-600 hover:bg-red-50"
        >
          <Trash2 className="size-3.5" /> Remove
        </button>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(value)}
          className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          aria-label="Copy path"
        >
          <Copy className="size-3.5" />
        </button>
      </div>
      {appearance ? (
        <LogoAppearancePopup
          open={customizeOpen}
          onClose={() => setCustomizeOpen(false)}
          appearance={appearance}
        />
      ) : null}
    </article>
  );
}

function DocumentPathField({
  label,
  value,
  onChange,
  uploadEnabled,
  uploadEndpoint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  uploadEnabled: boolean;
  uploadEndpoint: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const displayValue = value === "#enquire" ? "" : value;
  const hasFile = Boolean(displayValue && displayValue !== "#");

  const cleanFileName = (() => {
    if (!hasFile) return "";
    try {
      const parsed = new URL(displayValue);
      const raw = parsed.pathname.split("/").pop() || "document.pdf";
      return decodeURIComponent(raw);
    } catch {
      const raw = displayValue.split("/").pop() || "document.pdf";
      return decodeURIComponent(raw);
    }
  })();

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const publicPath = await uploadFileAsset(file, uploadEndpoint);
      onChange(publicPath);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDownload = async () => {
    if (!hasFile) return;
    setDownloading(true);
    try {
      const downloadEndpoint = `/api/download?url=${encodeURIComponent(displayValue)}&name=${encodeURIComponent(cleanFileName)}`;
      const response = await fetch(downloadEndpoint);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = cleanFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      const fallbackLink = document.createElement("a");
      fallbackLink.href = `/api/download?url=${encodeURIComponent(displayValue)}&name=${encodeURIComponent(cleanFileName)}`;
      fallbackLink.rel = "noopener";
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <span className="text-[13px] font-semibold text-[#0b1f35]">{label}</span>

      {hasFile ? (
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
          <FileText className="size-5 shrink-0 text-[#b98945]" />
          <p className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#0b1f35]" title={cleanFileName}>
            {cleanFileName}
          </p>
        </div>
      ) : (
        <div className="flex h-11 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white text-[12px] text-slate-400">
          No document uploaded
        </div>
      )}

      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <label
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[11px] font-semibold text-slate-700 shadow-sm ${
            uploadEnabled ? "cursor-pointer hover:bg-slate-50 hover:text-[#0b1f35]" : "cursor-not-allowed opacity-50"
          }`}
        >
          {uploading ? <LoaderCircle className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />} Upload
          <input type="file" accept="image/*,.pdf,application/pdf" disabled={!uploadEnabled || uploading} className="hidden" onChange={upload} />
        </label>

        {hasFile ? (
          <>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-[#0b1f35] disabled:cursor-wait disabled:opacity-60"
            >
              {downloading ? <LoaderCircle className="size-3.5 animate-spin" /> : <Download className="size-3.5" />} Download
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 text-[11px] font-semibold text-red-600 shadow-sm hover:bg-red-50"
            >
              <Trash2 className="size-3.5" /> Delete
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
