"use client";

import { ChangeEvent, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, LoaderCircle, Plus, Trash2 } from "lucide-react";
import type { ContactSection, EnquiryCustomField, EnquiryFormField, SiteData } from "@/types/site";
import {
  ButtonBackgroundPicker,
  CompactColorField,
  CompactToggle,
  StylePopup,
  type PathPart,
} from "@/components/admin/editor-ui";
import { uploadFileAsset } from "@/lib/client/upload";
import { textStyle } from "@/lib/typography";
import {
  DEFAULT_CONTACT_SECTION,
  blankContactCustomField,
  resolveContactFieldLabelColor,
  resolveContactSection,
} from "@/lib/contact-section";
import { CUSTOM_FIELD_TYPE_OPTIONS } from "@/lib/enquiry";

const CORE_FIELD_KEYS = ["name", "phone", "email", "message"] as const;

type ContactSectionEditorProps = {
  value: SiteData["contactSection"];
  enquiry: SiteData["enquiry"];
  onUpdate: (path: PathPart[], value: unknown) => void;
  uploadEnabled: boolean;
  uploadEndpoint: string;
};

export function ContactSectionEditor({
  value,
  enquiry,
  onUpdate,
  uploadEnabled,
  uploadEndpoint,
}: ContactSectionEditorProps) {
  const section = resolveContactSection(value, enquiry);
  const record = section as unknown as Record<string, unknown>;
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const patch = (key: keyof ContactSection, next: unknown) => {
    if (!value) {
      onUpdate(["contactSection"], { ...DEFAULT_CONTACT_SECTION, [key]: next });
      return;
    }
    onUpdate(["contactSection", key], next);
  };

  const patchCoreField = (key: (typeof CORE_FIELD_KEYS)[number], fieldPatch: Partial<EnquiryFormField>) => {
    const current = section.fields[key];
    const nextFields = {
      ...section.fields,
      [key]: { ...current, ...fieldPatch },
    };
    patch("fields", nextFields);
  };

  const setCustom = (custom: EnquiryCustomField[]) => {
    patch("fields", { ...section.fields, custom });
  };

  const patchCustom = (index: number, fieldPatch: Partial<EnquiryCustomField>) => {
    setCustom(section.fields.custom.map((field, fieldIndex) => (fieldIndex === index ? { ...field, ...fieldPatch } : field)));
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const publicPath = await uploadFileAsset(file, uploadEndpoint);
      patch("image", publicPath);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <CompactToggle label="Show section" checked={section.enabled !== false} onChange={(checked) => patch("enabled", checked)} />

      <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <h2 className="text-[14px] font-medium text-[#0b1f35]">Section content</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="min-w-0">
            <span className="mb-1 flex items-center gap-1">
              <span className="admin-label">Section label</span>
              <StylePopup title="label" parent={record} fieldKey="label" parentPath={["contactSection"]} onUpdate={onUpdate} />
            </span>
            <input value={section.label} onChange={(event) => patch("label", event.target.value)} className="admin-input" />
          </label>
          <label className="min-w-0">
            <span className="mb-1 flex items-center gap-1">
              <span className="admin-label">Main heading</span>
              <StylePopup title="heading" parent={record} fieldKey="heading" parentPath={["contactSection"]} onUpdate={onUpdate} />
            </span>
            <input value={section.heading} onChange={(event) => patch("heading", event.target.value)} className="admin-input" />
          </label>
          <label className="min-w-0 sm:col-span-2">
            <span className="mb-1 flex items-center gap-1">
              <span className="admin-label">Heading accent</span>
              <StylePopup title="headingAccent" parent={record} fieldKey="headingAccent" parentPath={["contactSection"]} onUpdate={onUpdate} />
            </span>
            <input value={section.headingAccent || ""} onChange={(event) => patch("headingAccent", event.target.value)} className="admin-input" />
          </label>
          <label className="min-w-0 sm:col-span-2">
            <span className="mb-1 flex items-center gap-1">
              <span className="admin-label">Description</span>
              <StylePopup title="description" parent={record} fieldKey="description" parentPath={["contactSection"]} onUpdate={onUpdate} />
            </span>
            <textarea value={section.description || ""} onChange={(event) => patch("description", event.target.value)} rows={3} className="admin-input" style={textStyle(section, "description")} />
          </label>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <h2 className="text-[14px] font-medium text-[#0b1f35]">Layout & image</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="min-w-0">
            <span className="admin-label">Image position</span>
            <select value={section.layout || "imageLeft"} onChange={(event) => patch("layout", event.target.value)} className="admin-input">
              <option value="imageLeft">Image left, form right</option>
              <option value="imageRight">Image right, form left</option>
            </select>
          </label>
          <CompactColorField label="Section background" value={section.backgroundColor || "#f7f3ed"} onChange={(next) => patch("backgroundColor", next)} />
        </div>

        {section.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={section.image} alt="" className="h-44 w-full rounded-xl border border-slate-200 object-cover" />
        ) : (
          <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-[12px] text-slate-500">
            No image selected
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <label className="admin-tool-button cursor-pointer">
            {uploading ? <LoaderCircle className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {uploading ? "Uploading…" : "Upload image"}
            <input type="file" accept="image/*" className="hidden" disabled={!uploadEnabled || uploading} onChange={upload} />
          </label>
          {section.image ? (
            <button type="button" onClick={() => patch("image", "")} className="admin-tool-button">
              Remove image
            </button>
          ) : null}
        </div>
        <label className="min-w-0">
          <span className="admin-label">Image alt text</span>
          <input value={section.imageAlt || ""} onChange={(event) => patch("imageAlt", event.target.value)} className="admin-input" />
        </label>
        {error ? <p className="text-[12px] text-red-600">{error}</p> : null}
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <h2 className="text-[14px] font-medium text-[#0b1f35]">Form settings</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="min-w-0">
            <span className="admin-label">Submit button label</span>
            <input value={section.submitLabel || ""} onChange={(event) => patch("submitLabel", event.target.value)} className="admin-input" />
          </label>
          <label className="min-w-0">
            <span className="admin-label">Success message</span>
            <input value={section.successMessage || ""} onChange={(event) => patch("successMessage", event.target.value)} className="admin-input" />
          </label>
          <label className="min-w-0 sm:col-span-2">
            <span className="admin-label">Footer note</span>
            <input value={section.footerText || ""} onChange={(event) => patch("footerText", event.target.value)} className="admin-input" />
          </label>
          <label className="min-w-0 sm:col-span-2">
            <span className="admin-label">Form tracking ID</span>
            <input
              value={section.gtmId || ""}
              onChange={(event) => patch("gtmId", event.target.value.trim() || undefined)}
              className="admin-input font-mono text-[12px]"
              placeholder="contact_page_form"
            />
            <span className="mt-1 block text-[10px] text-slate-500">
              Unique ID for GTM on this page form and its thank-you state. Default:{" "}
              <code className="rounded bg-white px-1">contact_page_form</code>
            </span>
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <div>
          <h2 className="text-[14px] font-medium text-[#0b1f35]">Form fields</h2>
          <p className="text-[11px] text-slate-500">Choose which fields appear and whether they are required.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {CORE_FIELD_KEYS.map((key) => {
            const field = section.fields[key];
            return (
              <article key={key} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">{key}</p>
                  <div className="flex items-center gap-1.5">
                    <CompactToggle label="Show" checked={field.enabled} onChange={(enabled) => patchCoreField(key, { enabled })} />
                    <CompactToggle
                      label="Req"
                      checked={field.required}
                      onChange={(required) => patchCoreField(key, { required, enabled: required ? true : field.enabled })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label>
                    <span className="admin-label">Label</span>
                    <input value={field.label} onChange={(event) => patchCoreField(key, { label: event.target.value })} className="admin-input" />
                  </label>
                  <label>
                    <span className="admin-label">Placeholder</span>
                    <input value={field.placeholder} onChange={(event) => patchCoreField(key, { placeholder: event.target.value })} className="admin-input" />
                  </label>
                </div>
              </article>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-4">
          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              Custom fields ({section.fields.custom.length})
            </h3>
            <p className="text-[11px] text-slate-400">Add dropdowns, radio choices, checkboxes, and more.</p>
          </div>
          <button
            type="button"
            onClick={() => setCustom([...section.fields.custom, blankContactCustomField(`Field ${section.fields.custom.length + 1}`)])}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#b98945] px-3.5 text-[12px] font-semibold text-white shadow-sm hover:bg-[#a57738]"
          >
            <Plus className="size-3.5" /> Add custom field
          </button>
        </div>

        {section.fields.custom.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-[12px] text-slate-500">
            No custom fields yet.
          </p>
        ) : (
          <div className="space-y-3">
            {section.fields.custom.map((field, index) => (
              <article key={field.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12px] font-semibold text-[#0b1f35]">{field.label || `Field ${index + 1}`}</p>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => index > 0 && setCustom(section.fields.custom.toSpliced(index - 1, 2, section.fields.custom[index], section.fields.custom[index - 1]))} disabled={index === 0} className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 disabled:opacity-25" aria-label="Move up"><ArrowUp className="size-3.5" /></button>
                    <button type="button" onClick={() => index < section.fields.custom.length - 1 && setCustom(section.fields.custom.toSpliced(index, 2, section.fields.custom[index + 1], section.fields.custom[index]))} disabled={index === section.fields.custom.length - 1} className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 disabled:opacity-25" aria-label="Move down"><ArrowDown className="size-3.5" /></button>
                    <button type="button" onClick={() => setCustom(section.fields.custom.filter((_, fieldIndex) => fieldIndex !== index))} className="inline-flex size-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50" aria-label="Delete"><Trash2 className="size-3.5" /></button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label>
                    <span className="admin-label">Type</span>
                    <select value={field.type} onChange={(event) => patchCustom(index, { type: event.target.value as EnquiryCustomField["type"] })} className="admin-input">
                      {CUSTOM_FIELD_TYPE_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <div className="flex items-end gap-2">
                    <CompactToggle label="Show" checked={field.enabled} onChange={(enabled) => patchCustom(index, { enabled })} />
                    <CompactToggle label="Required" checked={field.required} onChange={(required) => patchCustom(index, { required, enabled: required ? true : field.enabled })} />
                  </div>
                  <label>
                    <span className="admin-label">Label</span>
                    <input value={field.label} onChange={(event) => patchCustom(index, { label: event.target.value })} className="admin-input" />
                  </label>
                  <label>
                    <span className="admin-label">Placeholder</span>
                    <input value={field.placeholder} onChange={(event) => patchCustom(index, { placeholder: event.target.value })} className="admin-input" />
                  </label>
                  {(field.type === "select" || field.type === "radio") ? (
                    <label className="sm:col-span-2">
                      <span className="admin-label">Options (one per line)</span>
                      <textarea
                        value={(field.options || []).join("\n")}
                        onChange={(event) => patchCustom(index, { options: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean) })}
                        rows={3}
                        className="admin-input"
                      />
                    </label>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <h2 className="text-[14px] font-medium text-[#0b1f35]">Form styling</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <CompactColorField label="Form background" value={section.formBackgroundColor || "#ffffff"} onChange={(next) => patch("formBackgroundColor", next)} />
          <CompactColorField label="Form text" value={section.formTextColor || "#0b1f35"} onChange={(next) => patch("formTextColor", next)} />
          <CompactColorField
            label="Field label color"
            value={resolveContactFieldLabelColor(value?.fieldLabelColor, section.formTextColor)}
            onChange={(next) => patch("fieldLabelColor", next)}
          />
          <CompactColorField label="Input background" value={section.inputBackgroundColor || "#ffffff"} onChange={(next) => patch("inputBackgroundColor", next)} />
          <CompactColorField label="Input border" value={section.inputBorderColor || "#d8dde6"} onChange={(next) => patch("inputBorderColor", next)} />
          <CompactColorField label="Input text" value={section.inputTextColor || "#0b1f35"} onChange={(next) => patch("inputTextColor", next)} />
          <label className="min-w-0 sm:col-span-2 lg:col-span-1">
            <span className="admin-label">Form min height (px)</span>
            <input
              type="number"
              min={0}
              max={2000}
              step={10}
              placeholder="Auto"
              value={typeof section.formMinHeight === "number" && section.formMinHeight > 0 ? section.formMinHeight : ""}
              onChange={(event) => {
                const raw = event.target.value.trim();
                if (!raw) {
                  patch("formMinHeight", undefined);
                  return;
                }
                const next = Number(raw);
                if (!Number.isFinite(next)) return;
                patch("formMinHeight", Math.min(2000, Math.max(0, Math.round(next))));
              }}
              className="admin-input"
            />
            <span className="mt-1 block text-[11px] leading-4 text-slate-500">
              Leave empty for auto height. Raise this to make the form card taller (e.g. 560–720).
            </span>
          </label>
        </div>
        <div className="mt-3">
          <ButtonBackgroundPicker
            value={{
              backgroundType: section.buttonBackgroundType,
              backgroundColor: section.buttonBackgroundColor,
              backgroundGradient: section.buttonBackgroundGradient,
            }}
            onChange={(next) => {
              patch("buttonBackgroundType", next.backgroundType || "plain");
              patch("buttonBackgroundColor", next.backgroundColor || "#b98945");
              patch("buttonBackgroundGradient", next.backgroundGradient || "golden");
            }}
            textColor={section.buttonTextColor || "#ffffff"}
            onTextColorChange={(next) => patch("buttonTextColor", next)}
            plainLabel="Submit button bg"
          />
        </div>
      </section>
    </div>
  );
}
