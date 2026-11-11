"use client";

import { ChangeEvent, useState } from "react";
import { ImagePlus, LoaderCircle, Plus, Trash2 } from "lucide-react";
import type { SiteData } from "@/types/site";
import { StylePopup, type PathPart } from "@/components/admin/editor-ui";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { uploadFileAsset } from "@/lib/client/upload";
import { richTextSurfaceStyle } from "@/lib/typography";

type FooterEditorProps = {
  value: SiteData["footer"];
  onUpdate: (path: PathPart[], value: unknown) => void;
  uploadEnabled: boolean;
  uploadEndpoint: string;
};

export function FooterEditor({
  value,
  onUpdate,
  uploadEnabled,
  uploadEndpoint,
}: FooterEditorProps) {
  const record = value as unknown as Record<string, unknown>;
  const wordLimit = typeof value.descriptionWordLimit === "number" ? value.descriptionWordLimit : 80;
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const patch = <K extends keyof SiteData["footer"]>(key: K, next: SiteData["footer"][K]) => {
    onUpdate(["footer", key], next);
  };

  const uploadLogo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const publicPath = await uploadFileAsset(file, uploadEndpoint);
      patch("logo", publicPath);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-5">
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-[12px] leading-5 text-slate-600">
        Edit legal copy, RERA details, and a free-text block with the same formatting tools as About.
      </p>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <article className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <h2 className="text-[14px] font-medium text-[#0b1f35]">Footer logo</h2>
          {value.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.logo} alt="" className="h-20 w-auto max-w-full rounded-lg border border-slate-200 bg-white object-contain p-2" />
          ) : (
            <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white text-[12px] text-slate-400">No logo</div>
          )}
          <input
            value={value.logo}
            onChange={(event) => patch("logo", event.target.value)}
            className="admin-input"
            placeholder="/images/logo.webp"
          />
          {uploadError ? <p className="text-[11px] text-red-600">{uploadError}</p> : null}
          <div className="flex flex-wrap gap-2">
            <label
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold ${
                uploadEnabled ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed opacity-50"
              }`}
            >
              {uploading ? <LoaderCircle className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />} Upload
              <input type="file" accept="image/*" disabled={!uploadEnabled || uploading} className="hidden" onChange={uploadLogo} />
            </label>
            <button
              type="button"
              onClick={() => patch("logo", "")}
              className="inline-flex min-h-9 items-center rounded-lg border border-red-200 px-3 text-[11px] font-semibold text-red-600 hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        </article>

        <article className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-[14px] font-medium text-[#0b1f35]">Managed by & copyright</h2>
          <label>
            <span className="mb-1 flex items-center gap-1">
              <span className="admin-label">Managed by</span>
              <StylePopup title="managedBy" parent={record} fieldKey="managedBy" parentPath={["footer"]} onUpdate={onUpdate} />
            </span>
            <textarea
              value={value.managedBy}
              onChange={(event) => patch("managedBy", event.target.value)}
              rows={3}
              className="admin-input min-h-20 resize-y py-3"
            />
          </label>
          <label>
            <span className="mb-1 flex items-center gap-1">
              <span className="admin-label">Copyright text</span>
              <StylePopup title="copyright" parent={record} fieldKey="copyrightText" parentPath={["footer"]} onUpdate={onUpdate} />
            </span>
            <input
              value={value.copyrightText}
              onChange={(event) => patch("copyrightText", event.target.value)}
              className="admin-input"
            />
          </label>
        </article>
      </section>

      <section className="space-y-2">
        <RichTextEditor
          label="Free text"
          value={value.description || ""}
          onChange={(next) => patch("description", next)}
          editorStyle={richTextSurfaceStyle(value, "description")}
          styleControl={<StylePopup title="description" parent={record} fieldKey="description" parentPath={["footer"]} onUpdate={onUpdate} />}
          wordLimitControl={(
            <label className="inline-flex items-center gap-2">
              <span className="text-[10px] font-medium text-slate-500">Read more after</span>
              <input
                type="number"
                min={0}
                max={500}
                placeholder="All"
                value={typeof value.descriptionWordLimit === "number" && value.descriptionWordLimit > 0 ? value.descriptionWordLimit : ""}
                onChange={(event) => {
                  const val = event.target.value.trim();
                  patch("descriptionWordLimit", val === "" ? undefined : Math.max(0, Number(val)));
                }}
                className="h-7 w-16 rounded border border-slate-200 px-2 text-[11px] outline-none focus:border-[#b98945]"
              />
              <span className="text-[10px] text-slate-500">words</span>
            </label>
          )}
        />
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-[14px] font-medium text-[#0b1f35]">RERA</h2>
        <label>
          <span className="admin-label">RERA title</span>
          <input value={value.reraTitle} onChange={(event) => patch("reraTitle", event.target.value)} className="admin-input" />
        </label>
        <StringListEditor
          title="RERA phases"
          items={value.reraPhases || []}
          onChange={(next) => patch("reraPhases", next)}
          placeholder="Phase registration number"
        />
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-[14px] font-medium text-[#0b1f35]">Disclaimer</h2>
        <label>
          <span className="admin-label">Disclaimer title</span>
          <input
            value={value.disclaimerTitle}
            onChange={(event) => patch("disclaimerTitle", event.target.value)}
            className="admin-input"
          />
        </label>
        <StringListEditor
          title="Disclaimer paragraphs"
          items={value.disclaimerParagraphs || []}
          onChange={(next) => patch("disclaimerParagraphs", next)}
          placeholder="Disclaimer paragraph"
          multiline
        />
      </section>
    </div>
  );
}

function StringListEditor({
  title,
  items,
  onChange,
  placeholder,
  multiline = false,
}: {
  title: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-medium text-slate-600">
          {title} · {items.length} item{items.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-[#b98945] px-3 text-[11px] font-semibold text-white hover:bg-[#a57738]"
        >
          <Plus className="size-3.5" /> Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="flex items-start gap-2">
            {multiline ? (
              <textarea
                value={item}
                onChange={(event) => onChange(items.map((value, itemIndex) => (itemIndex === index ? event.target.value : value)))}
                rows={3}
                placeholder={placeholder}
                className="admin-input min-h-20 flex-1 resize-y py-3"
              />
            ) : (
              <input
                value={item}
                onChange={(event) => onChange(items.map((value, itemIndex) => (itemIndex === index ? event.target.value : value)))}
                placeholder={placeholder}
                className="admin-input flex-1"
              />
            )}
            <button
              type="button"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
              aria-label={`Remove ${title} item`}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        {!items.length ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-[11px] text-slate-500">
            No items yet. Click Add.
          </p>
        ) : null}
      </div>
    </div>
  );
}
