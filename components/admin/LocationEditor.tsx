"use client";

import { ChangeEvent, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, LoaderCircle, LockKeyhole, Pencil, Plus, Trash2, X } from "lucide-react";
import type { ConnectivityItem, NearbyPlace, SiteData } from "@/types/site";
import {
  CompactColorField,
  CompactToggle,
  CtaBox,
  StylePopup,
  type IntentOption,
  type PathPart,
} from "@/components/admin/editor-ui";
import { uploadFileAsset } from "@/lib/client/upload";
import { toMapEmbedUrl } from "@/lib/map-embed";
import { IconPicker } from "@/components/admin/IconPicker";
import { Icon } from "@/components/ui/Icon";
import {
  DEFAULT_LOCATION_COLUMNS,
  resolveLocationColumns,
  type LocationColumn,
} from "@/components/location/Location";

const COLUMN_LABELS: Record<LocationColumn, string> = {
  connectivity: "Connectivity text",
  map: "Interactive map",
  masterPlan: "Master / illustration map",
};

const SLOT_LABELS = ["Left", "Center", "Right"] as const;
const DEFAULT_ICON_COLOR = "#B98945";

type LocationEditorProps = {
  value: SiteData["location"];
  onUpdate: (path: PathPart[], value: unknown) => void;
  intents: IntentOption[];
  uploadEnabled: boolean;
  uploadEndpoint: string;
};

export function LocationEditor({
  value,
  onUpdate,
  intents,
  uploadEnabled,
  uploadEndpoint,
}: LocationEditorProps) {
  const record = value as unknown as Record<string, unknown>;
  const [panel, setPanel] = useState<"layout" | "connectivity" | "map" | "master" | "nearby">("layout");
  const [editingGroup, setEditingGroup] = useState<number | null>(null);
  const [editingPlace, setEditingPlace] = useState<number | null>(null);
  const columns = resolveLocationColumns(value.columnOrder);
  const groups = value.connectivity || [];
  const places = value.nearbyPlaces || [];

  const setColumnAt = (slot: number, nextKey: LocationColumn) => {
    const current = [...columns];
    const swapWith = current.indexOf(nextKey);
    if (swapWith === slot) return;
    if (swapWith >= 0) current[swapWith] = current[slot];
    current[slot] = nextKey;
    onUpdate(["location", "columnOrder"], current);
  };

  const moveColumn = (slot: number, direction: -1 | 1) => {
    const nextSlot = slot + direction;
    if (nextSlot < 0 || nextSlot >= columns.length) return;
    const next = [...columns];
    [next[slot], next[nextSlot]] = [next[nextSlot], next[slot]];
    onUpdate(["location", "columnOrder"], next);
  };

  const saveGroup = (index: number, next: ConnectivityItem) => {
    onUpdate(["location", "connectivity", index], next);
  };

  const savePlace = (index: number, next: NearbyPlace) => {
    onUpdate(["location", "nearbyPlaces", index], next);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="min-w-0">
          <span className="mb-1 flex items-center gap-1">
            <span className="admin-label">Section label</span>
            <StylePopup title="label" parent={record} fieldKey="label" parentPath={["location"]} onUpdate={onUpdate} />
          </span>
          <input value={value.label || ""} onChange={(event) => onUpdate(["location", "label"], event.target.value)} className="admin-input" />
        </label>
        <label className="min-w-0">
          <span className="admin-label">Title alignment</span>
          <select value={value.titleAlign || "left"} onChange={(event) => onUpdate(["location", "titleAlign"], event.target.value)} className="admin-input">
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>
        <label className="min-w-0">
          <span className="mb-1 flex items-center gap-1">
            <span className="admin-label">Main heading</span>
            <StylePopup title="heading" parent={record} fieldKey="heading" parentPath={["location"]} onUpdate={onUpdate} />
          </span>
          <input value={value.heading} onChange={(event) => onUpdate(["location", "heading"], event.target.value)} className="admin-input" />
        </label>
        <label className="min-w-0">
          <span className="mb-1 flex items-center gap-1">
            <span className="admin-label">Highlighted heading</span>
            <StylePopup title="highlight" parent={record} fieldKey="headingAccent" parentPath={["location"]} onUpdate={onUpdate} />
          </span>
          <input value={value.headingAccent} onChange={(event) => onUpdate(["location", "headingAccent"], event.target.value)} className="admin-input" />
        </label>
      </div>

      <div className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-slate-50 p-1">
        {(
          [
            ["layout", "Column layout"],
            ["connectivity", "Connectivity"],
            ["map", "Map"],
            ["master", "Master plan"],
            ["nearby", "Nearby places"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPanel(key)}
            className={`rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors ${panel === key ? "bg-white text-[#0b1f35] shadow-sm" : "text-slate-500 hover:text-[#0b1f35]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {panel === "layout" ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-[14px] font-medium text-[#0b1f35]">Desktop column order</h2>
            <p className="text-[11px] text-slate-500">Choose what appears on the left, center, and right. Turn a column off to hide it on the landing page.</p>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {columns.map((key, slot) => (
              <article key={`${key}-${slot}`} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{SLOT_LABELS[slot]}</p>
                <select
                  value={key}
                  onChange={(event) => setColumnAt(slot, event.target.value as LocationColumn)}
                  className="admin-input mt-2"
                >
                  {(Object.keys(COLUMN_LABELS) as LocationColumn[]).map((option) => (
                    <option key={option} value={option}>{COLUMN_LABELS[option]}</option>
                  ))}
                </select>
                <div className="mt-3">
                  <CompactToggle
                    label="Show on page"
                    checked={value.columnsEnabled?.[key] !== false}
                    onChange={(checked) =>
                      onUpdate(["location", "columnsEnabled"], {
                        ...(value.columnsEnabled || {}),
                        [key]: checked,
                      })
                    }
                  />
                </div>
                <div className="mt-3 flex items-center gap-1">
                  <button type="button" onClick={() => moveColumn(slot, -1)} disabled={slot === 0} className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 disabled:opacity-25" aria-label={`Move ${SLOT_LABELS[slot]} left`}>
                    <ArrowUp className="size-3.5 rotate-[-90deg]" />
                  </button>
                  <button type="button" onClick={() => moveColumn(slot, 1)} disabled={slot === columns.length - 1} className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 disabled:opacity-25" aria-label={`Move ${SLOT_LABELS[slot]} right`}>
                    <ArrowDown className="size-3.5 rotate-[-90deg]" />
                  </button>
                </div>
                <div className={`mt-4 rounded-lg p-3 text-[11px] ${key === "connectivity" ? "bg-[#0b1f35] text-white" : key === "map" ? "bg-slate-100 text-slate-600" : "bg-[#f7f5f0] text-slate-600"}`}>
                  {COLUMN_LABELS[key]}
                </div>
              </article>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onUpdate(["location", "columnOrder"], [...DEFAULT_LOCATION_COLUMNS])}
            className="text-[11px] font-medium text-slate-500 hover:text-[#0b1f35]"
          >
            Reset to default order
          </button>
        </section>
      ) : null}

      {panel === "connectivity" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-medium text-[#0b1f35]">Connectivity accordion</h2>
              <p className="text-[11px] text-slate-500">{groups.length} group{groups.length === 1 ? "" : "s"} in the dark text panel.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                onUpdate(["location", "connectivity"], [...groups, { label: "New group", items: [{ label: "New place", time: "" }] }]);
                setEditingGroup(groups.length);
              }}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#b98945] px-3 text-[11px] font-semibold text-white hover:bg-[#a57738]"
            >
              <Plus className="size-3.5" /> Add group
            </button>
          </div>
          <article className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-[13px] font-medium text-[#0b1f35]">Panel colors</h3>
              <p className="text-[10px] text-slate-500">Leave empty to use the global theme colors. Use the palette buttons for font size and weight.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div>
                <CompactColorField
                  label="Group title"
                  value={(record.connectivityGroupColor as string) || ""}
                  placeholder="#FFFFFF"
                  onChange={(next) => onUpdate(["location", "connectivityGroupColor"], next)}
                />
                <div className="mt-1"><StylePopup title="group title" parent={record} fieldKey="connectivityGroup" parentPath={["location"]} onUpdate={onUpdate} /></div>
              </div>
              <div>
                <CompactColorField
                  label="Place name"
                  value={(record.connectivityItemColor as string) || ""}
                  placeholder="#CBD5E1"
                  onChange={(next) => onUpdate(["location", "connectivityItemColor"], next)}
                />
                <div className="mt-1"><StylePopup title="place name" parent={record} fieldKey="connectivityItem" parentPath={["location"]} onUpdate={onUpdate} /></div>
              </div>
              <div>
                <CompactColorField
                  label="Travel time"
                  value={(record.connectivityTimeColor as string) || ""}
                  placeholder="Accent"
                  onChange={(next) => onUpdate(["location", "connectivityTimeColor"], next)}
                />
                <div className="mt-1"><StylePopup title="travel time" parent={record} fieldKey="connectivityTime" parentPath={["location"]} onUpdate={onUpdate} /></div>
              </div>
              <CompactColorField
                label="Arrow icon"
                value={value.connectivityIconColor || ""}
                placeholder="Accent"
                onChange={(next) => onUpdate(["location", "connectivityIconColor"], next)}
              />
              <CompactColorField
                label="Panel background"
                value={value.connectivityBackgroundColor || ""}
                placeholder="Theme dark"
                onChange={(next) => onUpdate(["location", "connectivityBackgroundColor"], next)}
              />
            </div>
          </article>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {groups.map((group, index) => (
              <article key={`${group.label}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[13px] font-semibold text-[#0b1f35]">{group.label}</p>
                <p className="mt-1 text-[11px] text-slate-500">{group.items.length} item{group.items.length === 1 ? "" : "s"}</p>
                <ul className="mt-3 space-y-1">
                  {group.items.slice(0, 3).map((item, itemIndex) => (
                    <li key={`${item.label}-${itemIndex}`} className="truncate text-[11px] text-slate-600">
                      {item.label}{item.time ? ` · ${item.time}` : ""}
                    </li>
                  ))}
                  {group.items.length > 3 ? <li className="text-[10px] text-slate-400">+{group.items.length - 3} more</li> : null}
                </ul>
                <button type="button" onClick={() => setEditingGroup(index)} className="mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-medium text-slate-700 hover:border-[#b98945]">
                  <Pencil className="size-3.5" /> Edit
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {panel === "map" ? (
        <section className="space-y-4">
          <label className="block">
            <span className="admin-label">Google Maps embed URL</span>
            <textarea
              value={value.mapEmbedUrl}
              onChange={(event) => onUpdate(["location", "mapEmbedUrl"], event.target.value)}
              rows={3}
              className="admin-input min-h-24 resize-y py-2"
              placeholder="Paste a Google Maps link or an embed URL"
            />
            <span className="mt-1 block text-[11px] text-slate-500">A normal Maps place link works. The page turns it into an embed.</span>
          </label>
          <label className="block max-w-2xl">
            <span className="admin-label">Map title (accessibility)</span>
            <input value={value.mapTitle} onChange={(event) => onUpdate(["location", "mapTitle"], event.target.value)} className="admin-input" />
          </label>
          {value.mapEmbedUrl ? (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <iframe title={value.mapTitle || "Map preview"} src={toMapEmbedUrl(value.mapEmbedUrl)} className="h-56 w-full border-0" loading="lazy" />
            </div>
          ) : null}
        </section>
      ) : null}

      {panel === "master" ? (
        <MasterPlanPanel
          value={value}
          onUpdate={onUpdate}
          uploadEnabled={uploadEnabled}
          uploadEndpoint={uploadEndpoint}
        />
      ) : null}

      {panel === "nearby" ? (
        <section className="space-y-4">
          <label className="block max-w-xl">
            <span className="mb-1 flex items-center gap-1">
              <span className="admin-label">Nearby heading</span>
              <StylePopup title="nearby heading" parent={record} fieldKey="nearbyHeading" parentPath={["location"]} onUpdate={onUpdate} />
            </span>
            <input value={value.nearbyHeading} onChange={(event) => onUpdate(["location", "nearbyHeading"], event.target.value)} className="admin-input" />
          </label>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-medium text-[#0b1f35]">Nearby place icons</h2>
              <p className="text-[11px] text-slate-500">{places.length} place{places.length === 1 ? "" : "s"}.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                onUpdate(["location", "nearbyPlaces"], [...places, { icon: "building", iconColor: DEFAULT_ICON_COLOR, label: "New place" }]);
                setEditingPlace(places.length);
              }}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#b98945] px-3 text-[11px] font-semibold text-white hover:bg-[#a57738]"
            >
              <Plus className="size-3.5" /> Add place
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {places.map((place, index) => (
              <article key={`${place.label}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                <div className="mx-auto flex size-10 items-center justify-center" style={{ color: place.iconColor || DEFAULT_ICON_COLOR }}>
                  <Icon name={place.icon} className="size-6" />
                </div>
                <p className="mt-2 truncate text-[12px] font-medium text-[#0b1f35]">{place.label}</p>
                <button type="button" onClick={() => setEditingPlace(index)} className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[11px] font-medium text-slate-700 hover:border-[#b98945]">
                  <Pencil className="size-3.5" /> Edit
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <CtaBox title="Map button" cta={value.mapCta} onChange={(next) => onUpdate(["location", "mapCta"], next)} intents={intents} singleRow />
        <CtaBox title="Nearby / explore button" cta={value.nearbyCta} onChange={(next) => onUpdate(["location", "nearbyCta"], next)} intents={intents} singleRow />
      </div>

      {editingGroup !== null && groups[editingGroup] ? (
        <ConnectivityEditModal
          group={groups[editingGroup]}
          onClose={() => setEditingGroup(null)}
          onChange={(next) => saveGroup(editingGroup, next)}
          onDelete={() => {
            onUpdate(["location", "connectivity"], groups.filter((_, index) => index !== editingGroup));
            setEditingGroup(null);
          }}
        />
      ) : null}

      {editingPlace !== null && places[editingPlace] ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24" onMouseDown={(event) => event.target === event.currentTarget && setEditingPlace(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#0b1f35]">Edit nearby place</h3>
              <button type="button" onClick={() => setEditingPlace(null)} className="inline-flex size-8 items-center justify-center rounded-md hover:bg-slate-100" aria-label="Close"><X className="size-4" /></button>
            </div>
            <div className="space-y-3">
              <IconPicker
                label="Icon"
                value={places[editingPlace].icon}
                color={places[editingPlace].iconColor || DEFAULT_ICON_COLOR}
                onChange={(icon) => savePlace(editingPlace, { ...places[editingPlace], icon })}
              />
              <CompactColorField
                label="Icon color"
                value={places[editingPlace].iconColor || DEFAULT_ICON_COLOR}
                onChange={(iconColor) => savePlace(editingPlace, { ...places[editingPlace], iconColor })}
              />
              <CompactColorField
                label="Text color"
                value={places[editingPlace].textColor || "#0B1F35"}
                onChange={(textColor) => savePlace(editingPlace, { ...places[editingPlace], textColor })}
              />
              <label>
                <span className="admin-label">Label</span>
                <input value={places[editingPlace].label} onChange={(event) => savePlace(editingPlace, { ...places[editingPlace], label: event.target.value })} className="admin-input" />
              </label>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onUpdate(["location", "nearbyPlaces"], places.filter((_, index) => index !== editingPlace));
                  setEditingPlace(null);
                }}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
              <button type="button" onClick={() => setEditingPlace(null)} className="inline-flex min-h-9 items-center rounded-lg bg-[#0b1f35] px-4 text-[12px] font-semibold text-white">Done</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MasterPlanPanel({
  value,
  onUpdate,
  uploadEnabled,
  uploadEndpoint,
}: {
  value: SiteData["location"];
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
      onUpdate(["location", "masterPlanImage"], publicPath);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <CompactToggle
          label="Lock & blur preview"
          checked={Boolean(value.masterPlanLocked)}
          onChange={(checked) => onUpdate(["location", "masterPlanLocked"], checked)}
        />
        {value.masterPlanLocked ? (
          <label className="flex items-center gap-1.5 text-[12px] font-medium text-slate-700">
            <span className="admin-label text-[11px]">Blur strength</span>
            <input
              type="number"
              min={0}
              max={30}
              value={value.masterPlanBlur ?? 8}
              onChange={(event) => onUpdate(["location", "masterPlanBlur"], Number(event.target.value))}
              className="admin-input !h-8 !w-20 text-center"
            />
          </label>
        ) : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-2">
          <span className="admin-label">Master / illustration map image</span>
          <div className="relative">
            {value.masterPlanImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value.masterPlanImage}
                alt=""
                className="h-56 w-full rounded-xl border border-slate-200 object-cover"
                style={value.masterPlanLocked ? { filter: `blur(${value.masterPlanBlur ?? 8}px)` } : undefined}
              />
            ) : (
              <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-[12px] text-slate-400">No image</div>
            )}
            {value.masterPlanLocked && value.masterPlanImage ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-10 items-center justify-center rounded-full border border-white/80 bg-[#071d31]/85 text-white shadow">
                  <LockKeyhole className="size-5" />
                </span>
              </div>
            ) : null}
          </div>
          <input value={value.masterPlanImage} onChange={(event) => onUpdate(["location", "masterPlanImage"], event.target.value)} className="admin-input" />
          {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <label className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold ${uploadEnabled ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed opacity-50"}`}>
              {uploading ? <LoaderCircle className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />} Upload
              <input type="file" accept="image/*" disabled={!uploadEnabled || uploading} className="hidden" onChange={upload} />
            </label>
            <button type="button" onClick={() => onUpdate(["location", "masterPlanImage"], "")} className="inline-flex min-h-9 items-center rounded-lg border border-red-200 px-3 text-[11px] font-semibold text-red-600 hover:bg-red-50">Remove</button>
          </div>
        </div>
        <label className="block">
          <span className="admin-label">Image description</span>
          <textarea
            value={value.masterPlanAlt}
            onChange={(event) => onUpdate(["location", "masterPlanAlt"], event.target.value)}
            rows={5}
            className="admin-input min-h-32 resize-y py-2"
          />
        </label>
      </div>
    </section>
  );
}

function ConnectivityEditModal({
  group,
  onClose,
  onChange,
  onDelete,
}: {
  group: ConnectivityItem;
  onClose: () => void;
  onChange: (next: ConnectivityItem) => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="mb-10 w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-[#0b1f35]">Edit connectivity group</h3>
          <button type="button" onClick={onClose} className="inline-flex size-8 items-center justify-center rounded-md hover:bg-slate-100" aria-label="Close"><X className="size-4" /></button>
        </div>
        <div className="space-y-3">
          <label>
            <span className="admin-label">Group title</span>
            <input value={group.label} onChange={(event) => onChange({ ...group, label: event.target.value })} className="admin-input" />
          </label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="admin-label !mt-0">Items</span>
              <button
                type="button"
                onClick={() => onChange({ ...group, items: [...group.items, { label: "New item", time: "" }] })}
                className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-[#b98945] px-2.5 text-[11px] font-semibold text-white"
              >
                <Plus className="size-3.5" /> Add item
              </button>
            </div>
            {group.items.map((item, index) => (
              <div key={index} className="grid grid-cols-[minmax(0,1fr)_7rem_auto] gap-2">
                <input
                  value={item.label}
                  onChange={(event) => onChange({
                    ...group,
                    items: group.items.map((entry, entryIndex) => entryIndex === index ? { ...entry, label: event.target.value } : entry),
                  })}
                  className="admin-input"
                  placeholder="Place or description"
                />
                <input
                  value={item.time}
                  onChange={(event) => onChange({
                    ...group,
                    items: group.items.map((entry, entryIndex) => entryIndex === index ? { ...entry, time: event.target.value } : entry),
                  })}
                  className="admin-input"
                  placeholder="Time"
                />
                <button
                  type="button"
                  onClick={() => onChange({ ...group, items: group.items.filter((_, entryIndex) => entryIndex !== index) })}
                  className="inline-flex size-10 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                  aria-label="Remove item"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button type="button" onClick={onDelete} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-red-600 hover:bg-red-50">
            <Trash2 className="size-3.5" /> Delete group
          </button>
          <button type="button" onClick={onClose} className="inline-flex min-h-9 items-center rounded-lg bg-[#0b1f35] px-4 text-[12px] font-semibold text-white">Done</button>
        </div>
      </div>
    </div>
  );
}
