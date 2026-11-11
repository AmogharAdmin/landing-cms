"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import type { Highlight, SiteData } from "@/types/site";
import { CompactColorField, CtaBox, type IntentOption, type PathPart } from "@/components/admin/editor-ui";
import { IconPicker } from "@/components/admin/IconPicker";
import { Icon } from "@/components/ui/Icon";

const DEFAULT_ICON_COLOR = "#D3A45F";

export function HighlightsEditor({
  value,
  onUpdate,
  intents,
}: {
  value: SiteData["highlights"];
  onUpdate: (path: PathPart[], value: unknown) => void;
  intents: IntentOption[];
}) {
  const [editing, setEditing] = useState<number | null>(null);
  const items = value.items || [];

  const saveItem = (index: number, next: Highlight) => {
    onUpdate(["highlights", "items", index], next);
  };

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-medium text-[#0b1f35]">Highlight icons</h2>
            <p className="text-[11px] text-slate-500">{items.length} item{items.length === 1 ? "" : "s"} in the dark strip.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onUpdate(["highlights", "items"], [...items, { icon: "building", iconColor: DEFAULT_ICON_COLOR, value: "New", label: "New highlight" }]);
              setEditing(items.length);
            }}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#b98945] px-3 text-[11px] font-semibold text-white hover:bg-[#a57738]"
          >
            <Plus className="size-3.5" /> Add item
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {items.map((item, index) => {
            const iconColor = item.iconColor || DEFAULT_ICON_COLOR;
            const valueColor = item.valueColor || item.textColor || "#0b1f35";
            const labelColor = item.labelColor || item.textColor || "#64748b";
            return (
              <article key={`${item.label}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                <div className="mx-auto flex size-12 items-center justify-center" style={{ color: iconColor }}>
                  <Icon name={item.icon} className="size-8" />
                </div>
                <p className="mt-2 text-[14px] font-semibold" style={{ color: valueColor }}>{item.value}</p>
                <p className="mt-1 text-[12px]" style={{ color: labelColor }}>{item.label}</p>
                <button
                  type="button"
                  onClick={() => setEditing(index)}
                  className="mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-medium text-slate-700 hover:border-[#b98945]"
                >
                  <Pencil className="size-3.5" /> Edit
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <CtaBox title="Strip button" cta={value.cta} onChange={(next) => onUpdate(["highlights", "cta"], next)} intents={intents} singleRow />

      {editing !== null && items[editing] ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24" onMouseDown={(event) => event.target === event.currentTarget && setEditing(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#0b1f35]">Edit highlight</h3>
              <button type="button" onClick={() => setEditing(null)} className="inline-flex size-8 items-center justify-center rounded-md hover:bg-slate-100" aria-label="Close"><X className="size-4" /></button>
            </div>
            <div className="space-y-3">
              <IconPicker
                label="Icon"
                value={items[editing].icon}
                color={items[editing].iconColor || DEFAULT_ICON_COLOR}
                onChange={(icon) => saveItem(editing, { ...items[editing], icon })}
              />
              <CompactColorField
                label="Icon color"
                value={items[editing].iconColor || DEFAULT_ICON_COLOR}
                onChange={(iconColor) => saveItem(editing, { ...items[editing], iconColor })}
              />
              <div className="grid grid-cols-2 gap-2">
                <CompactColorField
                  label="Value color"
                  value={items[editing].valueColor || items[editing].textColor || DEFAULT_ICON_COLOR}
                  onChange={(valueColor) => saveItem(editing, { ...items[editing], valueColor })}
                />
                <CompactColorField
                  label="Label color"
                  value={items[editing].labelColor || items[editing].textColor || "#FFFFFF"}
                  onChange={(labelColor) => saveItem(editing, { ...items[editing], labelColor })}
                />
              </div>
              <label>
                <span className="admin-label">Value</span>
                <input value={items[editing].value} onChange={(event) => saveItem(editing, { ...items[editing], value: event.target.value })} className="admin-input" />
              </label>
              <label>
                <span className="admin-label">Label</span>
                <input value={items[editing].label} onChange={(event) => saveItem(editing, { ...items[editing], label: event.target.value })} className="admin-input" />
              </label>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onUpdate(["highlights", "items"], items.filter((_, index) => index !== editing));
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
