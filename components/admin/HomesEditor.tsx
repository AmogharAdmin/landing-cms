"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Home, ImagePlus, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import type { Cta, FloorPlan, Property, SiteData } from "@/types/site";
import { findFloorPlan } from "@/lib/homes";
import {
  CompactColorField,
  CompactToggle,
  CtaBox,
  CtaFields,
  StylePopup,
  type IntentOption,
  type PathPart,
} from "@/components/admin/editor-ui";
import { uploadFileAsset } from "@/lib/client/upload";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function defaultHomeCta(): Cta {
  return { label: "View Details", action: "enquire", intent: "default" };
}

function defaultListCta(): Cta {
  return { label: "Download Costing Details", action: "download", intent: "brochure" };
}

function defaultRowCta(): Cta {
  return { label: "Price Breakup", action: "enquire", intent: "default" };
}

function ImageUpload({
  label,
  value,
  path,
  onUpdate,
  uploadEnabled,
  uploadEndpoint,
  emptyLabel = "No floor plan image",
}: {
  label: string;
  value: string;
  path: PathPart[];
  onUpdate: (path: PathPart[], value: unknown) => void;
  uploadEnabled: boolean;
  uploadEndpoint: string;
  emptyLabel?: string;
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
        <img src={value} alt="" className="h-36 w-full rounded-xl border border-slate-200 object-contain bg-slate-50" />
      ) : (
        <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-[12px] text-slate-400">{emptyLabel}</div>
      )}
      <input value={value} onChange={(event) => onUpdate(path, event.target.value)} placeholder="/images/floor-plan.webp" className="admin-input" />
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

export function HomesEditor({
  value,
  onUpdate,
  onRemove,
  uploadEnabled,
  uploadEndpoint,
  intents,
}: {
  value: SiteData["homes"];
  onUpdate: (path: PathPart[], value: unknown) => void;
  onRemove: (path: PathPart[]) => void;
  uploadEnabled: boolean;
  uploadEndpoint: string;
  intents: IntentOption[];
}) {
  const record = value as unknown as Record<string, unknown>;
  const listView = value.layout === "list";
  const [activeTab, setActiveTab] = useState(value.tabs[0]?.id ?? "");
  const [editingHomeId, setEditingHomeId] = useState<string | null>(null);
  const [renamingTab, setRenamingTab] = useState<string | null>(null);

  const currentTab = value.tabs.some((tab) => tab.id === activeTab) ? activeTab : value.tabs[0]?.id ?? "";

  useEffect(() => {
    if (!value.tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(value.tabs[0]?.id ?? "");
    }
  }, [value.tabs, activeTab]);

  const properties = value.properties
    .map((property, index) => ({ property, index }))
    .filter(({ property }) => property.tab === currentTab);

  const tabIds = new Set(value.tabs.map((tab) => tab.id));
  const unassigned = value.properties
    .map((property, index) => ({ property, index }))
    .filter(({ property }) => !tabIds.has(property.tab));

  const editingHome = editingHomeId !== null
    ? value.properties.map((property, index) => ({ property, index })).find(({ property }) => property.id === editingHomeId) ?? null
    : null;
  const editing = editingHome?.property ?? null;
  const editingIndex = editingHome?.index ?? -1;
  const editingPlan = editing ? findFloorPlan(editing, value.floorPlans) : undefined;
  const editingPlanIndex = editingPlan ? value.floorPlans.indexOf(editingPlan) : -1;

  const addTab = () => {
    const id = `tab-${Date.now()}`;
    onUpdate(["homes", "tabs"], [...value.tabs, { id, label: "New category" }]);
    setActiveTab(id);
    setRenamingTab(id);
  };

  const moveTab = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= value.tabs.length) return;
    const next = [...value.tabs];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onUpdate(["homes", "tabs"], next);
  };

  const deleteTab = (index: number) => {
    const tabId = value.tabs[index]?.id;
    const nextTabs = value.tabs.filter((_, tabIndex) => tabIndex !== index);
    const nextProperties = value.properties.filter((property) => property.tab !== tabId);
    const keptIds = new Set(nextProperties.map((property) => property.id));
    const nextPlans = value.floorPlans.filter((plan) => keptIds.has(plan.propertyId) || nextProperties.some((property) => property.floorPlanId === plan.id));
    onUpdate(["homes", "tabs"], nextTabs);
    onUpdate(["homes", "properties"], nextProperties);
    onUpdate(["homes", "floorPlans"], nextPlans);
    if (activeTab === tabId) setActiveTab(nextTabs[0]?.id ?? "");
  };

  const addProperty = () => {
    if (!currentTab) return;
    const id = `home-${Date.now()}`;
    const source = value.properties.find((property) => property.tab === currentTab) ?? value.properties[0];
    const property: Property = source
      ? {
          ...clone(source),
          id,
          tab: currentTab,
          title: listView ? "New type" : "New home",
          floorPlanId: id,
          cta: listView ? { ...clone(source.cta), label: source.cta.label?.trim() && source.cta.label !== "View Details" ? source.cta.label : "Price Breakup" } : source.cta,
        }
      : {
          id,
          tab: currentTab,
          title: listView ? "New type" : "New home",
          subtitle: listView ? "" : "Apartment",
          area: "",
          price: "",
          priceNote: "Onwards",
          cta: listView ? defaultRowCta() : defaultHomeCta(),
          floorPlanId: id,
        };
    const planSource = source ? value.floorPlans.find((plan) => plan.id === source.floorPlanId) ?? value.floorPlans[0] : undefined;
    const plan: FloorPlan = planSource
      ? { ...clone(planSource), id, propertyId: id, label: "New floor plan" }
      : { id, propertyId: id, label: "New floor plan", area: "", image: "/images/floor-plan.webp", alt: "Floor plan", downloadUrl: "#enquire" };
    onUpdate(["homes", "properties"], [...value.properties, property]);
    onUpdate(["homes", "floorPlans"], [...value.floorPlans, plan]);
    setEditingHomeId(id);
  };

  const patchProperty = (index: number, patch: Partial<Property>) => {
    onUpdate(["homes", "properties", index], { ...value.properties[index], ...patch });
  };

  const moveProperty = (index: number, direction: -1 | 1) => {
    const position = properties.findIndex((item) => item.index === index);
    const neighbor = properties[position + direction];
    if (!neighbor) return;
    const next = [...value.properties];
    [next[index], next[neighbor.index]] = [next[neighbor.index], next[index]];
    onUpdate(["homes", "properties"], next);
  };

  const chooseLayout = (layout: "grid" | "list") => {
    onUpdate(["homes", "layout"], layout);
    if (layout === "list" && !value.listCta) onUpdate(["homes", "listCta"], defaultListCta());
  };

  const patchPlan = (index: number, patch: Partial<FloorPlan>) => {
    onUpdate(["homes", "floorPlans", index], { ...value.floorPlans[index], ...patch });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="min-w-0">
          <span className="mb-1 flex items-center gap-1">
            <span className="admin-label">Section label</span>
            <StylePopup title="label" parent={record} fieldKey="label" parentPath={["homes"]} onUpdate={onUpdate} />
          </span>
          <input value={value.label} onChange={(event) => onUpdate(["homes", "label"], event.target.value)} className="admin-input" />
        </label>
        <label className="min-w-0">
          <span className="mb-1 flex items-center gap-1">
            <span className="admin-label">Main heading</span>
            <StylePopup title="heading" parent={record} fieldKey="heading" parentPath={["homes"]} onUpdate={onUpdate} />
          </span>
          <input value={value.heading} onChange={(event) => onUpdate(["homes", "heading"], event.target.value)} className="admin-input" />
        </label>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-medium text-[#0b1f35]">Layout</h2>
            <p className="text-[11px] text-slate-500">Grid keeps the pricing cards. List shows a table with an image on the right.</p>
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button type="button" onClick={() => chooseLayout("grid")} className={`min-h-8 rounded-md px-3 text-[12px] font-semibold ${listView ? "text-slate-600" : "bg-[#0b1f35] text-white"}`}>Grid view</button>
            <button type="button" onClick={() => chooseLayout("list")} className={`min-h-8 rounded-md px-3 text-[12px] font-semibold ${listView ? "bg-[#0b1f35] text-white" : "text-slate-600"}`}>List view</button>
          </div>
        </div>
        {listView ? (
          <div className="space-y-4 border-t border-slate-100 pt-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <label>
                <span className="admin-label">Type column</span>
                <input value={value.listTypeLabel ?? ""} onChange={(event) => onUpdate(["homes", "listTypeLabel"], event.target.value)} className="admin-input" placeholder="Type" />
              </label>
              <label>
                <span className="admin-label">Area column</span>
                <input value={value.listAreaLabel ?? ""} onChange={(event) => onUpdate(["homes", "listAreaLabel"], event.target.value)} className="admin-input" placeholder="Saleable Area" />
              </label>
              <label>
                <span className="admin-label">Price column</span>
                <input value={value.listPriceLabel ?? ""} onChange={(event) => onUpdate(["homes", "listPriceLabel"], event.target.value)} className="admin-input" placeholder="Price" />
              </label>
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="space-y-3">
                <ImageUpload
                  label="Side image"
                  value={value.listImage || ""}
                  path={["homes", "listImage"]}
                  onUpdate={onUpdate}
                  uploadEnabled={uploadEnabled}
                  uploadEndpoint={uploadEndpoint}
                  emptyLabel="No image yet"
                />
                <label>
                  <span className="admin-label">Image description</span>
                  <input value={value.listImageAlt ?? ""} onChange={(event) => onUpdate(["homes", "listImageAlt"], event.target.value)} className="admin-input" placeholder="Costing sheet" />
                </label>
              </div>
              <CtaBox title="Image button" cta={value.listCta ?? defaultListCta()} onChange={(next) => onUpdate(["homes", "listCta"], next)} intents={intents} />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
        {listView ? null : (
          <CompactToggle
            label="Show floor plan panel"
            checked={value.floorPlanPanelEnabled !== false}
            onChange={(checked) => onUpdate(["homes", "floorPlanPanelEnabled"], checked)}
          />
        )}
        <CompactToggle
          label={listView ? "Lock side image" : "Lock floor-plan previews"}
          checked={value.floorPlanLocked !== false}
          onChange={(checked) => onUpdate(["homes", "floorPlanLocked"], checked)}
        />
        <label className="min-w-[7rem]">
          <span className="admin-label">Blur strength</span>
          <input
            type="number"
            min={0}
            max={20}
            value={value.floorPlanBlur ?? 3}
            onChange={(event) => onUpdate(["homes", "floorPlanBlur"], Number(event.target.value))}
            className="admin-input"
            disabled={value.floorPlanLocked === false || (!listView && value.floorPlanPanelEnabled === false)}
          />
        </label>
        {listView ? null : (
          <label className="min-w-[9rem]">
            <span className="admin-label">Image size</span>
            <select value={value.floorPlanImageSize ?? "standard"} onChange={(event) => onUpdate(["homes", "floorPlanImageSize"], event.target.value)} className="admin-input" disabled={value.floorPlanPanelEnabled === false}>
              <option value="compact">Compact</option>
              <option value="standard">Standard</option>
              <option value="large">Large</option>
            </select>
          </label>
        )}
        {value.floorPlanLocked === false ? (
          <p className="w-full text-[11px] text-slate-500">Turn lock on to blur the {listView ? "side image" : "floor plan"} and show the lock icon.</p>
        ) : listView ? (
          <p className="w-full text-[11px] text-slate-500">Blur and lock apply to the image on the right of the pricing table.</p>
        ) : value.floorPlanPanelEnabled === false ? (
          <p className="w-full text-[11px] text-slate-500">Floor plan box is hidden on the landing page. Pricing cards show in a 3-column grid.</p>
        ) : null}
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-medium text-[#0b1f35]">Category tabs</h2>
            <p className="text-[11px] text-slate-500">Outline and the selected tab button. Leave a color blank to keep the current look.</p>
          </div>
          <CompactToggle
            label="Hide tabs on page"
            checked={value.hideCategoryTabs === true}
            onChange={(checked) => onUpdate(["homes", "hideCategoryTabs"], checked)}
          />
        </div>
        {value.hideCategoryTabs ? (
          <p className="text-[11px] text-slate-500">Category tabs are hidden on the landing page. The first category still supplies the homes shown.</p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <CompactColorField
            label="Border color"
            value={value.tabBorderColor}
            onChange={(color) => onUpdate(["homes", "tabBorderColor"], color || undefined)}
            placeholder="#0B1F35"
          />
          <label className="min-w-0">
            <span className="admin-label">Border size</span>
            <input
              type="number"
              min={0}
              max={12}
              value={value.tabBorderWidth ?? ""}
              placeholder="1"
              onChange={(event) => {
                const next = event.target.value.trim();
                onUpdate(["homes", "tabBorderWidth"], next === "" ? undefined : Math.min(12, Math.max(0, Number(next))));
              }}
              className="admin-input"
            />
          </label>
          <CompactColorField
            label="Button color"
            value={value.tabActiveColor}
            onChange={(color) => onUpdate(["homes", "tabActiveColor"], color || undefined)}
            placeholder="#0B1F35"
          />
          <CompactColorField
            label="Button text"
            value={value.tabActiveTextColor}
            onChange={(color) => onUpdate(["homes", "tabActiveTextColor"], color || undefined)}
            placeholder="#FFFFFF"
          />
        </div>

        <div>
          <h2 className="text-[14px] font-medium text-[#0b1f35]">Pricing cards</h2>
          <p className="text-[11px] text-slate-500">Background and outline for the home boxes.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <CompactToggle
            label="Show border"
            checked={value.cardBorderEnabled !== false}
            onChange={(checked) => onUpdate(["homes", "cardBorderEnabled"], checked)}
          />
          <CompactColorField
            label="Card color"
            value={value.cardBackgroundColor}
            onChange={(color) => onUpdate(["homes", "cardBackgroundColor"], color || undefined)}
            placeholder="#FFFFFF"
          />
          <CompactColorField
            label="Border color"
            value={value.cardBorderColor}
            onChange={(color) => onUpdate(["homes", "cardBorderColor"], color || undefined)}
            placeholder="#B98945"
          />
          <label className="min-w-[7rem]">
            <span className="admin-label">Stroke</span>
            <input
              type="number"
              min={0}
              max={12}
              value={value.cardBorderWidth ?? ""}
              placeholder="1"
              disabled={value.cardBorderEnabled === false}
              onChange={(event) => {
                const next = event.target.value.trim();
                onUpdate(["homes", "cardBorderWidth"], next === "" ? undefined : Math.min(12, Math.max(0, Number(next))));
              }}
              className="admin-input"
            />
          </label>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-medium text-[#0b1f35]">Categories</h2>
            <p className="text-[11px] text-slate-500">Website tabs like 2BHK / 3BHK. Select one to edit its homes.</p>
          </div>
          <button type="button" onClick={addTab} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#b98945] px-3 text-[11px] font-semibold text-white hover:bg-[#a57738]">
            <Plus className="size-3.5" /> Add category
          </button>
        </div>

        {value.tabs.length === 0 ? (
          <p className="rounded-lg bg-slate-50 p-4 text-[12px] text-slate-500">No categories yet. Add a category, then add homes to it.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {value.tabs.map((tab, index) => {
              const count = value.properties.filter((property) => property.tab === tab.id).length;
              const selected = currentTab === tab.id;
              const renaming = renamingTab === tab.id;
              return (
                <div
                  key={tab.id}
                  className={`flex items-center gap-1 rounded-xl border px-1.5 py-1.5 ${selected ? "border-[#0b1f35] bg-[#0b1f35] text-white" : "border-slate-200 bg-white text-[#0b1f35]"}`}
                >
                  {renaming ? (
                    <input
                      autoFocus
                      value={tab.label}
                      onChange={(event) => onUpdate(["homes", "tabs", index, "label"], event.target.value)}
                      onBlur={() => setRenamingTab(null)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === "Escape") setRenamingTab(null);
                      }}
                      className="h-8 w-24 rounded-md border-0 bg-white px-2 text-[12px] font-medium text-[#0b1f35] outline-none"
                    />
                  ) : (
                    <button type="button" onClick={() => setActiveTab(tab.id)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-semibold">
                      {tab.label}
                      <span className={`rounded-full px-1.5 text-[10px] ${selected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>{count}</span>
                    </button>
                  )}
                  <button type="button" onClick={() => { setActiveTab(tab.id); setRenamingTab(tab.id); }} className={`inline-flex size-7 items-center justify-center rounded-md ${selected ? "hover:bg-white/10" : "text-slate-400 hover:bg-slate-50 hover:text-[#0b1f35]"}`} aria-label={`Rename ${tab.label}`}>
                    <Pencil className="size-3" />
                  </button>
                  <button type="button" onClick={() => moveTab(index, -1)} disabled={index === 0} className={`inline-flex size-7 items-center justify-center rounded-md disabled:opacity-25 ${selected ? "hover:bg-white/10" : "text-slate-400 hover:bg-slate-50"}`} aria-label={`Move ${tab.label} left`}>
                    <ArrowUp className="size-3 rotate-[-90deg]" />
                  </button>
                  <button type="button" onClick={() => moveTab(index, 1)} disabled={index === value.tabs.length - 1} className={`inline-flex size-7 items-center justify-center rounded-md disabled:opacity-25 ${selected ? "hover:bg-white/10" : "text-slate-400 hover:bg-slate-50"}`} aria-label={`Move ${tab.label} right`}>
                    <ArrowDown className="size-3 rotate-[-90deg]" />
                  </button>
                  <button type="button" onClick={() => deleteTab(index)} className={`inline-flex size-7 items-center justify-center rounded-md ${selected ? "text-red-200 hover:bg-white/10 hover:text-white" : "text-red-500 hover:bg-red-50"}`} aria-label={`Delete ${tab.label}`}>
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-medium text-[#0b1f35]">
              {listView ? "Rows" : "Homes"} in {value.tabs.find((tab) => tab.id === currentTab)?.label || "this category"}
            </h2>
            <p className="text-[11px] text-slate-500">{listView ? "Each row is one line in the pricing table. Add, reorder, or delete rows here." : "Each card is the pricing tile. Edit opens pricing + floor plan together."}</p>
          </div>
          <button type="button" onClick={addProperty} disabled={!currentTab} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#b98945] px-3 text-[11px] font-semibold text-white hover:bg-[#a57738] disabled:opacity-50">
            <Plus className="size-3.5" /> {listView ? "Add row" : "Add home"}
          </button>
        </div>

        {listView ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-medium text-slate-500">
                  <th className="px-3 py-2 font-medium">{value.listTypeLabel?.trim() || "Type"}</th>
                  <th className="px-3 py-2 font-medium">{value.listAreaLabel?.trim() || "Saleable Area"}</th>
                  <th className="px-3 py-2 font-medium">{value.listPriceLabel?.trim() || "Price"}</th>
                  <th className="px-3 py-2 font-medium">Button</th>
                  <th className="px-3 py-2 font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {properties.map(({ property, index }, rowIndex) => {
                  const plan = findFloorPlan(property, value.floorPlans);
                  return (
                    <tr key={property.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-2.5 text-[13px] font-medium text-[#0b1f35]">{property.title || "Untitled"}</td>
                      <td className="px-3 py-2.5 text-[13px] text-slate-600">{property.area || "—"}</td>
                      <td className="px-3 py-2.5 text-[13px] text-slate-600">{[property.price, property.priceNote].filter(Boolean).join(" ") || "—"}</td>
                      <td className="px-3 py-2.5 text-[13px] text-slate-600">{property.cta.label || "—"}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => moveProperty(index, -1)} disabled={rowIndex === 0} className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 disabled:opacity-30" aria-label={`Move ${property.title} up`}><ArrowUp className="size-3.5" /></button>
                          <button type="button" onClick={() => moveProperty(index, 1)} disabled={rowIndex === properties.length - 1} className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 disabled:opacity-30" aria-label={`Move ${property.title} down`}><ArrowDown className="size-3.5" /></button>
                          <button type="button" onClick={() => setEditingHomeId(property.id)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-700 hover:border-[#b98945]"><Pencil className="size-3.5" /> Edit</button>
                          <button
                            type="button"
                            onClick={() => {
                              const planIndex = plan ? value.floorPlans.indexOf(plan) : -1;
                              onRemove(["homes", "properties", index]);
                              if (planIndex >= 0) onRemove(["homes", "floorPlans", planIndex]);
                              if (editingHomeId === property.id) setEditingHomeId(null);
                            }}
                            className="inline-flex size-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                            aria-label={`Delete ${property.title}`}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!properties.length ? (
              <p className="px-4 py-8 text-center text-[12px] text-slate-500">No rows in this category yet. Click Add row.</p>
            ) : null}
          </div>
        ) : null}

        {listView ? null : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map(({ property, index }) => {
            const plan = findFloorPlan(property, value.floorPlans);
            return (
              <article key={property.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex min-h-[170px] flex-col items-center justify-center px-4 py-5 text-center">
                  <p className="text-[18px] font-semibold text-[#0b1f35]">{property.title || "Untitled"}</p>
                  <p className="mt-1 text-[12px] text-slate-500">{property.subtitle || "—"}</p>
                  <p className="mt-4 text-[12px] font-medium text-[#142033]">{property.area || "Area"}</p>
                  <p className="mt-3 font-serif text-[22px] font-bold text-[#b98945]">{property.price || "Price"}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{property.priceNote || ""}</p>
                  {plan ? <p className="mt-3 max-w-full truncate text-[10px] text-slate-400">Plan: {plan.label}</p> : <p className="mt-3 text-[10px] text-amber-600">No floor plan linked</p>}
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingHomeId(property.id)}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-700 hover:border-[#b98945]"
                  >
                    <Pencil className="size-3.5" /> Edit pricing & plan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const planIndex = plan ? value.floorPlans.indexOf(plan) : -1;
                      onRemove(["homes", "properties", index]);
                      if (planIndex >= 0) onRemove(["homes", "floorPlans", planIndex]);
                      if (editingHomeId === property.id) setEditingHomeId(null);
                    }}
                    className="inline-flex size-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                    aria-label={`Delete ${property.title}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </article>
            );
          })}
          {!properties.length ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-[12px] text-slate-500 sm:col-span-2 xl:col-span-3">
              No homes in this category yet. Click Add home.
            </p>
          ) : null}
        </div>}

        {unassigned.length ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-medium text-amber-950">Homes not linked to a category</p>
            <p className="mt-1 text-[10px] text-amber-900">Pick a category so they show on the website again.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {unassigned.map(({ property, index }) => (
                <div key={property.id} className="flex items-center gap-2 rounded-lg border border-amber-200 bg-white p-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-[#0b1f35] text-white"><Home className="size-3.5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-[#0b1f35]">{property.title}</p>
                    <select value="" onChange={(event) => onUpdate(["homes", "properties", index, "tab"], event.target.value)} className="admin-input mt-1">
                      <option value="">Choose category</option>
                      {value.tabs.map((tab) => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <CtaBox title="Get floor plan button" cta={value.downloadCta} onChange={(next) => onUpdate(["homes", "downloadCta"], next)} intents={intents} singleRow />
        <CtaBox title="Site visit / price button" cta={value.visitCta} onChange={(next) => onUpdate(["homes", "visitCta"], next)} intents={intents} singleRow />
      </div>

      {editing && editingIndex >= 0 ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-6"
          onMouseDown={(event) => event.target === event.currentTarget && setEditingHomeId(null)}
        >
          <div className="flex max-h-[min(92svh,880px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
              <div>
                <h3 className="text-sm font-medium text-[#0b1f35]">{listView ? "Edit row" : "Edit home"}</h3>
                <p className="text-[11px] text-slate-500">{listView ? "These values are one line in the pricing table." : "Left = pricing card · Right = floor plan preview"}</p>
              </div>
              <button type="button" onClick={() => setEditingHomeId(null)} className="inline-flex size-8 items-center justify-center rounded-md hover:bg-slate-100" aria-label="Close"><X className="size-4" /></button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4">
                  <p className="text-[12px] font-semibold text-[#0b1f35]">{listView ? "Table row" : "Pricing card"}</p>
                  <label>
                    <span className="admin-label">Show under category</span>
                    <select value={tabIds.has(editing.tab) ? editing.tab : ""} onChange={(event) => patchProperty(editingIndex, { tab: event.target.value })} className="admin-input">
                      {!tabIds.has(editing.tab) ? <option value="">Choose a category</option> : null}
                      {value.tabs.map((tab) => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="mb-1 flex items-center gap-1">
                      <span className="admin-label">{listView ? "Type" : "Title"}</span>
                      <StylePopup title="title" parent={editing as unknown as Record<string, unknown>} fieldKey="title" parentPath={["homes", "properties", editingIndex]} onUpdate={onUpdate} />
                    </span>
                    <input value={editing.title} onChange={(event) => patchProperty(editingIndex, { title: event.target.value })} className="admin-input" />
                  </label>
                  {listView ? null : (
                    <label>
                      <span className="mb-1 flex items-center gap-1">
                        <span className="admin-label">Subtitle</span>
                        <StylePopup title="subtitle" parent={editing as unknown as Record<string, unknown>} fieldKey="subtitle" parentPath={["homes", "properties", editingIndex]} onUpdate={onUpdate} />
                      </span>
                      <input value={editing.subtitle} onChange={(event) => patchProperty(editingIndex, { subtitle: event.target.value })} className="admin-input" />
                    </label>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <label>
                      <span className="mb-1 flex items-center gap-1">
                        <span className="admin-label">{listView ? "Saleable area" : "Area"}</span>
                        <StylePopup title="area" parent={editing as unknown as Record<string, unknown>} fieldKey="area" parentPath={["homes", "properties", editingIndex]} onUpdate={onUpdate} />
                      </span>
                      <input value={editing.area} onChange={(event) => patchProperty(editingIndex, { area: event.target.value })} className="admin-input" placeholder="1259 Sq.Ft." />
                    </label>
                    <label>
                      <span className="mb-1 flex items-center gap-1">
                        <span className="admin-label">Price</span>
                        <StylePopup title="price" parent={editing as unknown as Record<string, unknown>} fieldKey="price" parentPath={["homes", "properties", editingIndex]} onUpdate={onUpdate} />
                      </span>
                      <input value={editing.price} onChange={(event) => patchProperty(editingIndex, { price: event.target.value })} className="admin-input" placeholder="₹1.73 Cr*" />
                    </label>
                  </div>
                  <label>
                    <span className="mb-1 flex items-center gap-1">
                      <span className="admin-label">Price note</span>
                      <StylePopup title="price note" parent={editing as unknown as Record<string, unknown>} fieldKey="priceNote" parentPath={["homes", "properties", editingIndex]} onUpdate={onUpdate} />
                    </span>
                    <input value={editing.priceNote} onChange={(event) => patchProperty(editingIndex, { priceNote: event.target.value })} className="admin-input" placeholder="Onwards" />
                  </label>
                  {listView ? (
                    <div className="space-y-2">
                      <p className="text-[12px] font-semibold text-[#0b1f35]">Price breakup button</p>
                      <CtaFields cta={editing.cta} onChange={(next) => patchProperty(editingIndex, { cta: next })} intents={intents} />
                    </div>
                  ) : (
                    <label>
                      <span className="mb-1 flex items-center gap-1">
                        <span className="admin-label">Card link text</span>
                        <StylePopup
                          title="link text"
                          parent={editing.cta as unknown as Record<string, unknown>}
                          fieldKey="label"
                          colorKey="textColor"
                          parentPath={["homes", "properties", editingIndex, "cta"]}
                          onUpdate={onUpdate}
                        />
                      </span>
                      <input
                        value={editing.cta.label}
                        onChange={(event) => patchProperty(editingIndex, { cta: { ...editing.cta, label: event.target.value } })}
                        className="admin-input"
                        placeholder="View Details"
                      />
                    </label>
                  )}
                </div>

                <div className={`space-y-3 rounded-xl border p-3 sm:p-4 ${value.floorPlanPanelEnabled === false ? "border-dashed border-slate-200 bg-slate-50/40 opacity-70" : "border-slate-200 bg-slate-50/60"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold text-[#0b1f35]">Floor plan</p>
                    <CompactToggle
                      label="Show on landing page"
                      checked={value.floorPlanPanelEnabled !== false}
                      onChange={(checked) => onUpdate(["homes", "floorPlanPanelEnabled"], checked)}
                    />
                  </div>
                  {value.floorPlanPanelEnabled === false ? (
                    <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600">
                      Floor plan box is hidden. Pricing cards will appear in a 3-column grid on the landing page.
                    </p>
                  ) : null}
                  {editingPlan && editingPlanIndex >= 0 ? (
                    <>
                      <label>
                        <span className="mb-1 flex items-center gap-1">
                          <span className="admin-label">Plan title</span>
                          <StylePopup
                            title="plan title"
                            parent={editingPlan as unknown as Record<string, unknown>}
                            fieldKey="label"
                            parentPath={["homes", "floorPlans", editingPlanIndex]}
                            onUpdate={onUpdate}
                          />
                        </span>
                        <input value={editingPlan.label} onChange={(event) => patchPlan(editingPlanIndex, { label: event.target.value })} className="admin-input" disabled={value.floorPlanPanelEnabled === false} />
                      </label>
                      <label>
                        <span className="mb-1 flex items-center gap-1">
                          <span className="admin-label">Plan area</span>
                          <StylePopup
                            title="plan area"
                            parent={editingPlan as unknown as Record<string, unknown>}
                            fieldKey="area"
                            parentPath={["homes", "floorPlans", editingPlanIndex]}
                            onUpdate={onUpdate}
                          />
                        </span>
                        <input value={editingPlan.area} onChange={(event) => patchPlan(editingPlanIndex, { area: event.target.value })} className="admin-input" disabled={value.floorPlanPanelEnabled === false} />
                      </label>
                      <ImageUpload
                        label="Floor plan image"
                        value={editingPlan.image}
                        path={["homes", "floorPlans", editingPlanIndex, "image"]}
                        onUpdate={onUpdate}
                        uploadEnabled={uploadEnabled && value.floorPlanPanelEnabled !== false}
                        uploadEndpoint={uploadEndpoint}
                      />
                      <label>
                        <span className="admin-label">Image description</span>
                        <input value={editingPlan.alt} onChange={(event) => patchPlan(editingPlanIndex, { alt: event.target.value })} className="admin-input" disabled={value.floorPlanPanelEnabled === false} />
                      </label>
                      <label>
                        <span className="admin-label">Download / request link</span>
                        <input value={editingPlan.downloadUrl} onChange={(event) => patchPlan(editingPlanIndex, { downloadUrl: event.target.value })} className="admin-input" placeholder="#enquire" disabled={value.floorPlanPanelEnabled === false} />
                      </label>
                    </>
                  ) : (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900">No floor plan is connected. Delete this home and add it again, or restore from a previous save.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 justify-end border-t border-slate-100 px-4 py-3 sm:px-5">
              <button type="button" onClick={() => setEditingHomeId(null)} className="inline-flex min-h-9 items-center rounded-lg bg-[#0b1f35] px-4 text-[12px] font-semibold text-white">Done</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
