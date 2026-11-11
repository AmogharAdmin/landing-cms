"use client";

import { ChangeEvent, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import type { FaqItem, FaqSection, SiteData } from "@/types/site";
import {
  CompactColorField,
  CompactToggle,
  defaultSectionOptions,
  StylePopup,
  type PathPart,
} from "@/components/admin/editor-ui";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { resolveEnquiryIntents } from "@/lib/enquiry";
import { uploadFileAsset } from "@/lib/client/upload";
import { plainTextFromHtml } from "@/lib/rich-text";
import { richTextSurfaceStyle } from "@/lib/typography";

const DEFAULT_FAQ: FaqSection = {
  enabled: true,
  label: "FAQs",
  heading: "Frequently Asked Questions",
  image: "/images/image-3.webp",
  imageAlt: "FAQ section image",
  backgroundColor: "#f7f3ed",
  defaultOpen: "first",
  itemSpacing: 12,
  questionMinHeight: 64,
  questionPaddingY: 16,
  answerPaddingY: 20,
  items: [],
};

type FaqEditorProps = {
  value: SiteData["faqSection"];
  site: SiteData["site"];
  enquiry: SiteData["enquiry"];
  onUpdate: (path: PathPart[], value: unknown) => void;
  uploadEnabled: boolean;
  uploadEndpoint: string;
};

export function FaqEditor({
  value,
  site,
  enquiry,
  onUpdate,
  uploadEnabled,
  uploadEndpoint,
}: FaqEditorProps) {
  const section = value ?? DEFAULT_FAQ;
  const record = section as unknown as Record<string, unknown>;
  const items = section.items || [];
  const [editing, setEditing] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const linkContext = {
    intents: resolveEnquiryIntents(enquiry),
    sections: defaultSectionOptions(),
    sitePhone: site.phone,
    siteWhatsapp: site.whatsapp,
  };

  const patch = (key: keyof FaqSection, next: unknown) => {
    if (!value) {
      onUpdate(["faqSection"], { ...DEFAULT_FAQ, [key]: next });
      return;
    }
    onUpdate(["faqSection", key], next);
  };

  const saveItem = (index: number, next: FaqItem) => {
    if (!value) {
      const nextItems = [...items];
      nextItems[index] = next;
      onUpdate(["faqSection"], { ...DEFAULT_FAQ, items: nextItems });
      return;
    }
    onUpdate(["faqSection", "items", index], next);
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const next = [...items];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    patch("items", next);
  };

  const addItem = () => {
    const next = [...items, { question: "New question?", answer: "Add the answer here." }];
    patch("items", next);
    setEditing(next.length - 1);
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
    <div className="space-y-5">
      <CompactToggle label="Show section" checked={section.enabled !== false} onChange={(checked) => patch("enabled", checked)} />

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <span className="admin-label">Accordion on load</span>
        <div className="mt-1.5 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {([
            { id: "first" as const, label: "Open first" },
            { id: "collapsed" as const, label: "All collapsed" },
          ]).map((option) => {
            const active = (section.defaultOpen || "first") === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => patch("defaultOpen", option.id)}
                className={`min-h-8 rounded-md px-3 text-[11px] font-semibold transition-colors ${
                  active ? "bg-[#0b1f35] text-white" : "text-slate-600 hover:bg-white"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] leading-4 text-slate-500">
          {(section.defaultOpen || "first") === "collapsed"
            ? "Every FAQ starts closed. Visitors open the ones they need."
            : "The first FAQ opens by default; the rest stay closed."}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <h2 className="text-[14px] font-medium text-[#0b1f35]">Accordion spacing</h2>
        <p className="mt-1 text-[11px] leading-4 text-slate-500">
          Tighten question/answer height, or use a negative item spacing (e.g. -8) to reduce the gap between cards.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FaqPxField
            label="Item spacing"
            hint="Gap between cards. Negative pulls them closer."
            value={section.itemSpacing}
            fallback={12}
            min={-80}
            max={80}
            onChange={(next) => patch("itemSpacing", next)}
          />
          <FaqPxField
            label="Question min height"
            hint="Minimum height of the question row."
            value={section.questionMinHeight}
            fallback={64}
            min={0}
            max={240}
            onChange={(next) => patch("questionMinHeight", next)}
          />
          <FaqPxField
            label="Question padding Y"
            hint="Top/bottom padding inside the question."
            value={section.questionPaddingY}
            fallback={16}
            min={0}
            max={64}
            onChange={(next) => patch("questionPaddingY", next)}
          />
          <FaqPxField
            label="Answer padding Y"
            hint="Top/bottom padding inside the answer."
            value={section.answerPaddingY}
            fallback={20}
            min={0}
            max={80}
            onChange={(next) => patch("answerPaddingY", next)}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="min-w-0">
          <span className="mb-1 flex items-center gap-1">
            <span className="admin-label">Section label</span>
            <StylePopup title="label" parent={record} fieldKey="label" parentPath={["faqSection"]} onUpdate={onUpdate} />
          </span>
          <input value={section.label} onChange={(event) => patch("label", event.target.value)} className="admin-input" />
        </label>
        <label className="min-w-0">
          <span className="mb-1 flex items-center gap-1">
            <span className="admin-label">Main heading</span>
            <StylePopup title="heading" parent={record} fieldKey="heading" parentPath={["faqSection"]} onUpdate={onUpdate} />
          </span>
          <input value={section.heading} onChange={(event) => patch("heading", event.target.value)} className="admin-input" />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <h2 className="text-[14px] font-medium text-[#0b1f35]">Side image</h2>
          <CompactColorField label="Section background" value={section.backgroundColor || "#f7f3ed"} onChange={(next) => patch("backgroundColor", next)} />
          {section.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={section.image} alt="" className="h-44 w-full rounded-xl border border-slate-200 object-cover" />
          ) : (
            <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-[12px] text-slate-400">No image</div>
          )}
          <input value={section.image} onChange={(event) => patch("image", event.target.value)} className="admin-input" placeholder="/images/example.webp" />
          {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <label className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold ${uploadEnabled ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed opacity-50"}`}>
              {uploading ? <LoaderCircle className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />} Upload
              <input type="file" accept="image/*" disabled={!uploadEnabled || uploading} className="hidden" onChange={upload} />
            </label>
            <button type="button" onClick={() => patch("image", "")} className="inline-flex min-h-9 items-center rounded-lg border border-red-200 px-3 text-[11px] font-semibold text-red-600 hover:bg-red-50">Remove</button>
          </div>
          <label>
            <span className="admin-label">Image description</span>
            <input value={section.imageAlt} onChange={(event) => patch("imageAlt", event.target.value)} className="admin-input" />
          </label>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-medium text-[#0b1f35]">Questions</h2>
              <p className="text-[11px] text-slate-500">{items.length} FAQ{items.length === 1 ? "" : "s"} in the accordion list.</p>
            </div>
            <button type="button" onClick={addItem} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#b98945] px-3 text-[11px] font-semibold text-white hover:bg-[#a57738]">
              <Plus className="size-3.5" /> Add question
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <article key={`${item.question}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#0b1f35]">{item.question || "Untitled question"}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">{plainTextFromHtml(item.answer) || "No answer yet"}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => setEditing(index)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[11px] font-medium text-slate-700 hover:border-[#b98945]">
                      <Pencil className="size-3.5" /> Edit
                    </button>
                    <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 disabled:opacity-25" aria-label="Move up">
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 disabled:opacity-25" aria-label="Move down">
                      <ArrowDown className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        patch("items", items.filter((_, itemIndex) => itemIndex !== index));
                        if (editing === index) setEditing(null);
                      }}
                      className="inline-flex size-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                      aria-label="Delete question"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {!items.length ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-[12px] text-slate-500">
                No questions yet. Click Add question.
              </p>
            ) : null}
          </div>
        </section>
      </div>

      {editing !== null && items[editing] ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-20" onMouseDown={(event) => event.target === event.currentTarget && setEditing(null)}>
          <div className="mb-10 w-full max-w-2xl rounded-2xl bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#0b1f35]">Edit FAQ</h3>
              <button type="button" onClick={() => setEditing(null)} className="inline-flex size-8 items-center justify-center rounded-md hover:bg-slate-100" aria-label="Close"><X className="size-4" /></button>
            </div>
            <div className="space-y-3">
              <label>
                <span className="mb-1 flex items-center gap-1">
                  <span className="admin-label">Question</span>
                  <StylePopup
                    title="question"
                    parent={items[editing] as unknown as Record<string, unknown>}
                    fieldKey="question"
                    parentPath={["faqSection", "items", editing]}
                    onUpdate={onUpdate}
                  />
                </span>
                <input
                  value={items[editing].question}
                  onChange={(event) => saveItem(editing, { ...items[editing], question: event.target.value })}
                  className="admin-input"
                />
              </label>
              <RichTextEditor
                key={editing}
                label="Answer"
                value={items[editing].answer}
                onChange={(next) => saveItem(editing, { ...items[editing], answer: next })}
                linkContext={linkContext}
                editorStyle={richTextSurfaceStyle(items[editing], "answer")}
                styleControl={(
                  <StylePopup
                    title="answer"
                    parent={items[editing] as unknown as Record<string, unknown>}
                    fieldKey="answer"
                    parentPath={["faqSection", "items", editing]}
                    onUpdate={onUpdate}
                  />
                )}
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  patch("items", items.filter((_, itemIndex) => itemIndex !== editing));
                  setEditing(null);
                }}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
              <button type="button" onClick={() => setEditing(null)} className="inline-flex min-h-9 items-center rounded-lg bg-[#0b1f35] px-4 text-[12px] font-semibold text-white">Done</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FaqPxField({
  label,
  hint,
  value,
  fallback,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number | undefined;
  fallback: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  const display = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return (
    <label className="min-w-0">
      <span className="admin-label">{label} (px)</span>
      <input
        type="number"
        min={min}
        max={max}
        step={1}
        value={display}
        onChange={(event) => {
          const raw = event.target.value.trim();
          if (raw === "" || raw === "-") {
            onChange(fallback);
            return;
          }
          const next = Number(raw);
          if (!Number.isFinite(next)) return;
          onChange(Math.min(max, Math.max(min, Math.round(next))));
        }}
        className="admin-input"
      />
      <span className="mt-1 block text-[10px] leading-4 text-slate-500">{hint}</span>
    </label>
  );
}
