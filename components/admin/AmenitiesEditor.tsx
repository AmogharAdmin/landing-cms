"use client";

import { ChangeEvent, useState } from "react";
import { ImagePlus, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import type { AmenityItem, LifestyleCard as LifestyleCardType, SiteData } from "@/types/site";
import {
  CompactColorField,
  CompactToggle,
  CtaBox,
  StylePopup,
  type IntentOption,
  type PathPart,
} from "@/components/admin/editor-ui";
import { uploadFileAsset } from "@/lib/client/upload";
import { IconPicker } from "@/components/admin/IconPicker";
import { Icon } from "@/components/ui/Icon";
import { AmenityIcon } from "@/components/amenities/AmenityGrid";

const DEFAULT_ICON_COLOR = "#B98945";

function CustomIconUpload({
  value,
  onChange,
  uploadEnabled,
  uploadEndpoint,
}: {
  value: string;
  onChange: (value: string) => void;
  uploadEnabled: boolean;
  uploadEndpoint: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      onChange(await uploadFileAsset(file, uploadEndpoint));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <span className="admin-label">Custom icon</span>
      <div className="flex items-center gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
          {value ? (
            <img src={value} alt="" className="size-10 object-contain" />
          ) : (
            <ImagePlus className="size-5 text-slate-300" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold ${uploadEnabled ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed opacity-50"}`}>
            {uploading ? <LoaderCircle className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />} {value ? "Replace" : "Upload"}
            <input
              type="file"
              accept=".svg,.png,.webp,image/svg+xml,image/png,image/webp"
              disabled={!uploadEnabled || uploading}
              className="hidden"
              onChange={upload}
            />
          </label>
          {value ? (
            <button type="button" onClick={() => onChange("")} className="inline-flex min-h-9 items-center rounded-lg border border-red-200 px-3 text-[11px] font-semibold text-red-600 hover:bg-red-50">Remove</button>
          ) : null}
        </div>
      </div>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="/uploads/icon.svg" className="admin-input" />
      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
      <p className="text-[10px] leading-4 text-slate-500">
        Square SVG or transparent PNG works best (shown at 32×32). Uploaded icons keep their own colors.
      </p>
    </div>
  );
}

type AmenitiesEditorProps = {
  value: SiteData["amenities"];
  onUpdate: (path: PathPart[], value: unknown) => void;
  intents: IntentOption[];
  uploadEnabled: boolean;
  uploadEndpoint: string;
};

function ImageUpload({
  label,
  value,
  path,
  onUpdate,
  uploadEnabled,
  uploadEndpoint,
}: {
  label: string;
  value: string;
  path: PathPart[];
  onUpdate: (path: PathPart[], value: unknown) => void;
  uploadEnabled: boolean;
  uploadEndpoint: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const publicPath = await uploadFileAsset(file, uploadEndpoint);
      onUpdate(path, publicPath);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <span className="admin-label">{label}</span>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-40 w-full rounded-xl border border-slate-200 object-cover" />
      ) : (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-[12px] text-slate-400">No image</div>
      )}
      <input value={value} onChange={(event) => onUpdate(path, event.target.value)} placeholder="/images/example.webp" className="admin-input" />
      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <label className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold ${uploadEnabled ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed opacity-50"}`}>
          {uploading ? <LoaderCircle className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />} Upload
          <input type="file" accept="image/*" disabled={!uploadEnabled || uploading} className="hidden" onChange={upload} />
        </label>
        <button type="button" onClick={() => onUpdate(path, "")} className="inline-flex min-h-9 items-center rounded-lg border border-red-200 px-3 text-[11px] font-semibold text-red-600 hover:bg-red-50">Remove</button>
      </div>
    </div>
  );
}

export function AmenitiesEditor({
  value,
  onUpdate,
  intents,
  uploadEnabled,
  uploadEndpoint,
}: AmenitiesEditorProps) {
  const record = value as unknown as Record<string, unknown>;
  const [panel, setPanel] = useState<"left" | "right">("left");
  const [editingItem, setEditingItemState] = useState<number | null>(null);
  const [uploadMode, setUploadMode] = useState(false);
  const [editingCard, setEditingCard] = useState<number | null>(null);

  const setEditingItem = (index: number | null) => {
    setUploadMode(false);
    setEditingItemState(index);
  };

  const items = value.items || [];
  const cards = value.lifestyleCards || [];

  const saveItem = (index: number, next: AmenityItem) => onUpdate(["amenities", "items", index], next);
  const saveCard = (index: number, next: LifestyleCardType) => onUpdate(["amenities", "lifestyleCards", index], next);

  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setPanel("left")}
          className={`rounded-lg px-4 py-2 text-[12px] font-semibold transition-colors ${panel === "left" ? "bg-white text-[#0b1f35] shadow-sm" : "text-slate-500 hover:text-[#0b1f35]"}`}
        >
          Left column
        </button>
        <button
          type="button"
          onClick={() => setPanel("right")}
          className={`rounded-lg px-4 py-2 text-[12px] font-semibold transition-colors ${panel === "right" ? "bg-white text-[#0b1f35] shadow-sm" : "text-slate-500 hover:text-[#0b1f35]"}`}
        >
          Right column
        </button>
      </div>

      {panel === "left" ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="min-w-0">
              <span className="mb-1 flex items-center gap-1">
                <span className="admin-label">Section label</span>
                <StylePopup title="label" parent={record} fieldKey="label" parentPath={["amenities"]} onUpdate={onUpdate} />
              </span>
              <input value={value.label} onChange={(event) => onUpdate(["amenities", "label"], event.target.value)} className="admin-input" />
            </label>
            <label className="min-w-0">
              <span className="mb-1 flex items-center gap-1">
                <span className="admin-label">Main heading</span>
                <StylePopup title="heading" parent={record} fieldKey="heading" parentPath={["amenities"]} onUpdate={onUpdate} />
              </span>
              <input value={value.heading} onChange={(event) => onUpdate(["amenities", "heading"], event.target.value)} className="admin-input" />
            </label>
            <label className="min-w-0">
              <span className="mb-1 flex items-center gap-1">
                <span className="admin-label">Highlighted heading</span>
                <StylePopup title="highlight" parent={record} fieldKey="headingAccent" parentPath={["amenities"]} onUpdate={onUpdate} />
              </span>
              <input value={value.headingAccent} onChange={(event) => onUpdate(["amenities", "headingAccent"], event.target.value)} className="admin-input" />
            </label>
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-medium text-[#0b1f35]">Amenity icons</h2>
                <p className="text-[11px] text-slate-500">{items.length} icon{items.length === 1 ? "" : "s"} in the left grid.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onUpdate(["amenities", "items"], [...items, { icon: "building", iconColor: DEFAULT_ICON_COLOR, label: "New amenity" }]);
                  setEditingItem(items.length);
                }}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#b98945] px-3 text-[11px] font-semibold text-white hover:bg-[#a57738]"
              >
                <Plus className="size-3.5" /> Add icon
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {items.map((item, index) => {
                const iconColor = item.iconColor || DEFAULT_ICON_COLOR;
                return (
                  <article key={`${item.label}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                    <div className="mx-auto flex size-11 items-center justify-center" style={{ color: iconColor }}>
                      <AmenityIcon item={item} className="size-7" />
                    </div>
                    <p className="mt-2 truncate text-[12px] font-medium text-[#0b1f35]">{item.label}</p>
                    <button
                      type="button"
                      onClick={() => setEditingItem(index)}
                      className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[11px] font-medium text-slate-700 hover:border-[#b98945]"
                    >
                      <Pencil className="size-3.5" /> Edit
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <ImageUpload
              label="Section image"
              value={value.image}
              path={["amenities", "image"]}
              onUpdate={onUpdate}
              uploadEnabled={uploadEnabled}
              uploadEndpoint={uploadEndpoint}
            />
            <label className="block">
              <span className="admin-label">Image description</span>
              <textarea
                value={value.imageAlt}
                onChange={(event) => onUpdate(["amenities", "imageAlt"], event.target.value)}
                rows={4}
                placeholder="Briefly describe the image for screen readers"
                className="admin-input min-h-28 resize-y py-2"
              />
              <p className="mt-1 text-[10px] text-slate-500">Used for accessibility (alt text), not shown as page copy.</p>
            </label>
          </div>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <h2 className="text-[14px] font-medium text-[#0b1f35]">Lifestyle side card</h2>
                  <p className="text-[11px] text-slate-500">Floating Live / Play / Relax strip on the image.</p>
                </div>
                <CompactToggle
                  label="Show side card"
                  checked={value.lifestyleCardsEnabled !== false}
                  onChange={(checked) => onUpdate(["amenities", "lifestyleCardsEnabled"], checked)}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  onUpdate(["amenities", "lifestyleCards"], [...cards, { icon: "trees", iconColor: DEFAULT_ICON_COLOR, title: "New", subtitle: "Short line" }]);
                  setEditingCard(cards.length);
                }}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#b98945] px-3 text-[11px] font-semibold text-white hover:bg-[#a57738]"
              >
                <Plus className="size-3.5" /> Add card
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div
                className="grid divide-x divide-slate-100"
                style={{ gridTemplateColumns: `repeat(${Math.max(cards.length, 1)}, minmax(0, 1fr))` }}
              >
                {cards.length === 0 ? (
                  <p className="px-4 py-8 text-center text-[12px] text-slate-400">No lifestyle cards yet.</p>
                ) : (
                  cards.map((card, index) => {
                    const iconColor = card.iconColor || DEFAULT_ICON_COLOR;
                    return (
                      <article key={`${card.title}-${index}`} className="px-3 py-4 text-center">
                        <div className="mx-auto flex size-10 items-center justify-center" style={{ color: iconColor }}>
                          <Icon name={card.icon} className="size-7" />
                        </div>
                        <p className="mt-2 text-[13px] font-semibold" style={{ color: iconColor }}>{card.title}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{card.subtitle}</p>
                        <button
                          type="button"
                          onClick={() => setEditingCard(index)}
                          className="mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[11px] font-medium text-slate-700 hover:border-[#b98945]"
                        >
                          <Pencil className="size-3.5" /> Edit
                        </button>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <CtaBox title="Enquire button" cta={value.cta} onChange={(next) => onUpdate(["amenities", "cta"], next)} intents={intents} singleRow />
        <CtaBox
          title="Site visit button"
          enabled={value.visitCtaEnabled !== false}
          onEnabled={(checked) => onUpdate(["amenities", "visitCtaEnabled"], checked)}
          cta={value.visitCta}
          onChange={(next) => onUpdate(["amenities", "visitCta"], next)}
          intents={intents}
          singleRow
        />
      </div>

      {editingItem !== null && items[editingItem] ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24" onMouseDown={(event) => event.target === event.currentTarget && setEditingItem(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#0b1f35]">Edit amenity</h3>
              <button type="button" onClick={() => setEditingItem(null)} className="inline-flex size-8 items-center justify-center rounded-md hover:bg-slate-100" aria-label="Close"><X className="size-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5" role="group" aria-label="Icon source">
                {([
                  ["library", "Icon library"],
                  ["upload", "Upload SVG / PNG"],
                ] as const).map(([mode, label]) => {
                  const active = mode === "upload" ? Boolean(items[editingItem].iconImage) || uploadMode : !items[editingItem].iconImage && !uploadMode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        if (mode === "library") {
                          setUploadMode(false);
                          saveItem(editingItem, { ...items[editingItem], iconImage: undefined });
                        } else {
                          setUploadMode(true);
                        }
                      }}
                      className={`min-h-8 rounded-md px-3 text-[11px] font-semibold transition-colors ${active ? "bg-white text-[#0b1f35] shadow-sm" : "text-slate-500 hover:text-[#0b1f35]"}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {items[editingItem].iconImage || uploadMode ? (
                <CustomIconUpload
                  value={items[editingItem].iconImage || ""}
                  onChange={(iconImage) => saveItem(editingItem, { ...items[editingItem], iconImage: iconImage || undefined })}
                  uploadEnabled={uploadEnabled}
                  uploadEndpoint={uploadEndpoint}
                />
              ) : (
                <>
                  <IconPicker
                    label="Icon"
                    value={items[editingItem].icon}
                    color={items[editingItem].iconColor || DEFAULT_ICON_COLOR}
                    onChange={(icon) => saveItem(editingItem, { ...items[editingItem], icon })}
                  />
                  <CompactColorField
                    label="Icon color"
                    value={items[editingItem].iconColor || DEFAULT_ICON_COLOR}
                    onChange={(iconColor) => saveItem(editingItem, { ...items[editingItem], iconColor })}
                  />
                </>
              )}
              <CompactColorField
                label="Text color"
                value={items[editingItem].textColor || "#0B1F35"}
                onChange={(textColor) => saveItem(editingItem, { ...items[editingItem], textColor })}
              />
              <label>
                <span className="admin-label">Label</span>
                <input value={items[editingItem].label} onChange={(event) => saveItem(editingItem, { ...items[editingItem], label: event.target.value })} className="admin-input" />
              </label>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onUpdate(["amenities", "items"], items.filter((_, index) => index !== editingItem));
                  setEditingItem(null);
                }}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
              <button type="button" onClick={() => setEditingItem(null)} className="inline-flex min-h-9 items-center rounded-lg bg-[#0b1f35] px-4 text-[12px] font-semibold text-white">Done</button>
            </div>
          </div>
        </div>
      ) : null}

      {editingCard !== null && cards[editingCard] ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24" onMouseDown={(event) => event.target === event.currentTarget && setEditingCard(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#0b1f35]">Edit lifestyle card</h3>
              <button type="button" onClick={() => setEditingCard(null)} className="inline-flex size-8 items-center justify-center rounded-md hover:bg-slate-100" aria-label="Close"><X className="size-4" /></button>
            </div>
            <div className="space-y-3">
              <IconPicker
                label="Icon"
                value={cards[editingCard].icon}
                color={cards[editingCard].iconColor || DEFAULT_ICON_COLOR}
                onChange={(icon) => saveCard(editingCard, { ...cards[editingCard], icon })}
              />
              <CompactColorField
                label="Icon color"
                value={cards[editingCard].iconColor || DEFAULT_ICON_COLOR}
                onChange={(iconColor) => saveCard(editingCard, { ...cards[editingCard], iconColor })}
              />
              <div className="grid grid-cols-2 gap-2">
                <CompactColorField
                  label="Title color"
                  value={cards[editingCard].titleColor || cards[editingCard].textColor || "#b98945"}
                  onChange={(titleColor) => saveCard(editingCard, { ...cards[editingCard], titleColor })}
                />
                <CompactColorField
                  label="Subtitle color"
                  value={cards[editingCard].subtitleColor || cards[editingCard].textColor || "#64748b"}
                  onChange={(subtitleColor) => saveCard(editingCard, { ...cards[editingCard], subtitleColor })}
                />
              </div>
              <label>
                <span className="mb-1 flex items-center gap-1">
                  <span className="admin-label">Title</span>
                  <StylePopup
                    title="title"
                    parent={cards[editingCard] as unknown as Record<string, unknown>}
                    fieldKey="title"
                    parentPath={["amenities", "lifestyleCards", editingCard]}
                    onUpdate={onUpdate}
                  />
                </span>
                <input value={cards[editingCard].title} onChange={(event) => saveCard(editingCard, { ...cards[editingCard], title: event.target.value })} className="admin-input" />
              </label>
              <label>
                <span className="mb-1 flex items-center gap-1">
                  <span className="admin-label">Description</span>
                  <StylePopup
                    title="subtitle"
                    parent={cards[editingCard] as unknown as Record<string, unknown>}
                    fieldKey="subtitle"
                    parentPath={["amenities", "lifestyleCards", editingCard]}
                    onUpdate={onUpdate}
                  />
                </span>
                <input value={cards[editingCard].subtitle} onChange={(event) => saveCard(editingCard, { ...cards[editingCard], subtitle: event.target.value })} className="admin-input" />
              </label>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onUpdate(["amenities", "lifestyleCards"], cards.filter((_, index) => index !== editingCard));
                  setEditingCard(null);
                }}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
              <button type="button" onClick={() => setEditingCard(null)} className="inline-flex min-h-9 items-center rounded-lg bg-[#0b1f35] px-4 text-[12px] font-semibold text-white">Done</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
