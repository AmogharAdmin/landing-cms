"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { Feature, SiteData } from "@/types/site";
import { CtaBox, CompactColorField, StylePopup, type IntentOption, type PathPart } from "@/components/admin/editor-ui";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { IconPicker } from "@/components/admin/IconPicker";
import { Icon } from "@/components/ui/Icon";
import { richTextSurfaceStyle, textStyle } from "@/lib/typography";

export function AboutEditor({
  value,
  onUpdate,
  intents,
}: {
  value: SiteData["about"];
  onUpdate: (path: PathPart[], value: unknown) => void;
  intents: IntentOption[];
}) {
  const record = value as unknown as Record<string, unknown>;
  const [editingFeature, setEditingFeature] = useState<number | null>(null);
  const features = value.features || [];
  const wordLimit = typeof value.descriptionWordLimit === "number" ? value.descriptionWordLimit : 80;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="min-w-0">
          <span className="mb-1 flex items-center gap-1">
            <span className="admin-label">Section label</span>
            <StylePopup title="label" parent={record} fieldKey="label" parentPath={["about"]} onUpdate={onUpdate} />
          </span>
          <input value={value.label} onChange={(event) => onUpdate(["about", "label"], event.target.value)} className="admin-input" />
        </label>
        <label className="min-w-0">
          <span className="mb-1 flex items-center gap-1">
            <span className="admin-label">Main heading</span>
            <StylePopup title="heading" parent={record} fieldKey="heading" parentPath={["about"]} onUpdate={onUpdate} />
          </span>
          <input value={value.heading} onChange={(event) => onUpdate(["about", "heading"], event.target.value)} className="admin-input" />
        </label>
        <label className="min-w-0">
          <span className="mb-1 flex items-center gap-1">
            <span className="admin-label">Highlighted heading</span>
            <StylePopup title="highlight" parent={record} fieldKey="headingAccent" parentPath={["about"]} onUpdate={onUpdate} />
          </span>
          <input value={value.headingAccent} onChange={(event) => onUpdate(["about", "headingAccent"], event.target.value)} className="admin-input" />
        </label>
      </div>

      <div className="space-y-2">
        <RichTextEditor
          label="Description"
          value={value.description}
          onChange={(next) => onUpdate(["about", "description"], next)}
          editorStyle={richTextSurfaceStyle(value, "description")}
          styleControl={<StylePopup title="description" parent={record} fieldKey="description" parentPath={["about"]} onUpdate={onUpdate} />}
          wordLimitControl={(
            <span className="inline-flex flex-wrap items-center gap-2">
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
                  onUpdate(["about", "descriptionWordLimit"], val === "" ? undefined : Math.max(0, Number(val)));
                }}
                className="h-7 w-16 rounded border border-slate-200 px-2 text-[11px] outline-none focus:border-[#b98945]"
              />
              <span className="text-[10px] text-slate-500">words</span>
            </label>
              <span className="inline-flex items-center gap-1 border-l border-slate-200 pl-2">
                <span
                  className="text-[11px] font-semibold"
                  style={textStyle(value, "readMore", { color: (record.readMoreColor as string) || "#b98945" })}
                >
                  Read More
                </span>
                <StylePopup title="Read More" parent={record} fieldKey="readMore" parentPath={["about"]} onUpdate={onUpdate} />
              </span>
            </span>
          )}
        />
      </div>

      <CtaBox title="About button" cta={value.cta} onChange={(next) => onUpdate(["about", "cta"], next)} intents={intents} singleRow />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-medium text-[#0b1f35]">Feature cards</h2>
            <p className="text-[11px] text-slate-500">{features.length} card{features.length === 1 ? "" : "s"} beside the About text.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const next: Feature = { enabled: true, icon: "building", title: "New feature", description: "Add a short description", cta: { label: "Learn more", action: "enquire" } };
              onUpdate(["about", "features"], [...features, next]);
              setEditingFeature(features.length);
            }}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#b98945] px-3 text-[11px] font-semibold text-white hover:bg-[#a57738]"
          >
            <Plus className="size-3.5" /> Add card
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {features.map((feature, index) => (
            <article key={`${feature.title}-${index}`} className={`rounded-xl border bg-white p-4 ${feature.enabled === false ? "border-slate-200 opacity-60" : "border-slate-200"}`}>
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-50" style={{ color: feature.iconColor || "#B98945" }}><Icon name={feature.icon} className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[#0b1f35]">{feature.title}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">{feature.description}</p>
                </div>
                <button type="button" onClick={() => setEditingFeature(index)} className="inline-flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-50" aria-label={`Edit ${feature.title}`}><Pencil className="size-3.5" /></button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {editingFeature !== null && features[editingFeature] ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20" onMouseDown={(event) => event.target === event.currentTarget && setEditingFeature(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#0b1f35]">Edit feature card</h3>
              <button type="button" onClick={() => setEditingFeature(null)} className="inline-flex size-8 items-center justify-center rounded-md hover:bg-slate-100" aria-label="Close"><X className="size-4" /></button>
            </div>
            <div className="space-y-3">
              <IconPicker
                label="Icon"
                value={features[editingFeature].icon}
                color={features[editingFeature].iconColor || "#B98945"}
                onChange={(icon) => onUpdate(["about", "features", editingFeature, "icon"], icon)}
              />
              <CompactColorField
                label="Icon color"
                value={features[editingFeature].iconColor || "#B98945"}
                onChange={(iconColor) => onUpdate(["about", "features", editingFeature, "iconColor"], iconColor)}
              />
              <div className="grid grid-cols-2 gap-2">
                <CompactColorField
                  label="Title color"
                  value={features[editingFeature].titleColor || features[editingFeature].textColor || "#0B1F35"}
                  onChange={(titleColor) => onUpdate(["about", "features", editingFeature, "titleColor"], titleColor)}
                />
                <CompactColorField
                  label="Desc color"
                  value={features[editingFeature].descriptionColor || features[editingFeature].textColor || "#64748b"}
                  onChange={(descriptionColor) => onUpdate(["about", "features", editingFeature, "descriptionColor"], descriptionColor)}
                />
              </div>
              <label><span className="admin-label">Title</span><input value={features[editingFeature].title} onChange={(event) => onUpdate(["about", "features", editingFeature, "title"], event.target.value)} className="admin-input" /></label>
              <label><span className="admin-label">Description</span><textarea value={features[editingFeature].description} onChange={(event) => onUpdate(["about", "features", editingFeature, "description"], event.target.value)} rows={3} className="admin-input min-h-20 resize-y py-2" /></label>
              <CtaBox
                title="Feature link / button"
                cta={features[editingFeature].cta}
                onChange={(next) => onUpdate(["about", "features", editingFeature, "cta"], next)}
                intents={intents}
                singleRow
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button type="button" onClick={() => { onUpdate(["about", "features"], features.filter((_, index) => index !== editingFeature)); setEditingFeature(null); }} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-red-600 hover:bg-red-50"><Trash2 className="size-3.5" /> Delete</button>
              <button type="button" onClick={() => setEditingFeature(null)} className="inline-flex min-h-9 items-center rounded-lg bg-[#0b1f35] px-4 text-[12px] font-semibold text-white">Done</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
