"use client";

import { ChangeEvent, useEffect, useState } from "react";
import {
  AlignLeft,
  Calendar,
  CheckSquare,
  Copy,
  Download,
  FileText,
  Hash,
  ImagePlus,
  List,
  LoaderCircle,
  Mail,
  Pencil,
  Phone,
  Plus,
  Radio,
  Trash2,
  Type,
  X,
} from "lucide-react";
import type {
  EnquiryCustomField,
  EnquiryCustomFieldType,
  EnquiryFormField,
  EnquiryHighlight,
  EnquirySuccessType,
  SiteData,
} from "@/types/site";
import { uploadFileAsset } from "@/lib/client/upload";
import {
  blankCustomField,
  blankEnquiryIntent,
  CUSTOM_FIELD_TYPE_OPTIONS,
  resolveEnquiryIntents,
  resolveIntentPresentation,
  successTypeOptions,
  type ResolvedEnquiryIntent,
} from "@/lib/enquiry";
import {
  buttonsGroupedBySection,
  countButtonsForIntent,
  listLeadFormButtons,
  toggleButtonForIntent,
  type LeadFormButton,
} from "@/lib/lead-form-buttons";
import { defaultEnquiryFormTrackingId } from "@/lib/lead-form-gtm";
import {
  CompactColorField,
  CompactToggle,
  StylePopup,
  type PathPart,
} from "@/components/admin/editor-ui";
import { IconPicker } from "@/components/admin/IconPicker";
import { Icon } from "@/components/ui/Icon";
import { textStyle } from "@/lib/typography";

type TabId = "content" | "media" | "fields" | "success" | "when";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "content", label: "Content" },
  { id: "media", label: "Image & facts" },
  { id: "fields", label: "Form fields" },
  { id: "success", label: "After submit" },
  { id: "when", label: "When to open" },
];

const FIELD_KEYS = ["name", "phone", "email"] as const;
const DEFAULT_ICON_COLOR = "#D3A45F";

const OPTION_PRESETS = [
  {
    label: "BHK Units",
    options: ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "Penthouse"],
  },
  {
    label: "Budget Range",
    options: ["Under ₹1 Cr", "₹1 Cr - ₹2 Cr", "₹2 Cr - ₹4 Cr", "₹4 Cr+"],
  },
  {
    label: "Possession / Timeline",
    options: ["Ready to Move", "Under Construction", "Within 6 Months", "1+ Year"],
  },
  {
    label: "Property Type",
    options: ["Apartment", "Villa", "Plot / Land", "Commercial"],
  },
  {
    label: "Purpose",
    options: ["Self Use", "Investment"],
  },
];

function successLabel(type: EnquirySuccessType) {
  return successTypeOptions.find((option) => option.id === type)?.label ?? type;
}

export function EnquiryEditor({
  value,
  siteData,
  onUpdate,
  uploadEnabled,
  uploadEndpoint,
}: {
  value: SiteData["enquiry"];
  siteData: SiteData;
  onUpdate: (path: PathPart[], value: unknown) => void;
  uploadEnabled: boolean;
  uploadEndpoint: string;
}) {
  const intents = resolveEnquiryIntents(value).map((intent) => resolveIntentPresentation(intent, value));
  const siteButtons = listLeadFormButtons(siteData);
  const [editing, setEditing] = useState<number | null>(null);
  const [tab, setTab] = useState<TabId>("content");

  useEffect(() => {
    if (editing !== null) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [editing]);

  const saveIntents = (next: ResolvedEnquiryIntent[]) => onUpdate(["enquiry", "intents"], next);

  const updateIntent = (index: number, patch: Partial<ResolvedEnquiryIntent>) => {
    saveIntents(intents.map((intent, intentIndex) => (intentIndex === index ? { ...intent, ...patch } : intent)));
  };

  const addIntent = () => {
    const next = [...intents, resolveIntentPresentation(blankEnquiryIntent(value), value)];
    saveIntents(next);
    setTab("content");
    setEditing(next.length - 1);
  };

  const removeIntent = (index: number) => {
    saveIntents(intents.filter((_, intentIndex) => intentIndex !== index));
    if (editing === index) setEditing(null);
    else if (editing !== null && editing > index) setEditing(editing - 1);
  };

  const editingIntent = editing !== null ? intents[editing] : null;

  return (
    <div className="space-y-5">
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-[12px] leading-5 text-slate-600">
        Create form variants here, then configure which buttons open each one under{" "}
        <span className="font-medium text-[#0b1f35]">When to open</span>. You can also set{" "}
        <span className="font-medium text-[#0b1f35]">Lead form variant</span> on any Form button in a section — both stay in sync.
      </p>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-medium text-[#0b1f35]">Lead form variants</h2>
            <p className="text-[11px] text-slate-500">
              {intents.length} variant{intents.length === 1 ? "" : "s"} · Each can have custom fields, brochures, images, and messaging.
            </p>
          </div>
          <button
            type="button"
            onClick={addIntent}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#b98945] px-3.5 text-[12px] font-semibold text-white shadow-sm hover:bg-[#a57738]"
          >
            <Plus className="size-3.5" /> Add form variant
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {intents.map((intent, index) => {
            const connected = countButtonsForIntent(siteData, intent.id);
            return (
              <article
                key={intent.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-[#b98945]/60 hover:shadow-md"
              >
                <div className="relative h-28 bg-[#0b1f35] sm:h-32">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={intent.backgroundImage || "/images/image-1.webp"}
                    alt={intent.backgroundImageAlt || ""}
                    className="size-full object-cover opacity-60 transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute inset-x-3 bottom-2.5 flex items-end justify-between gap-2 text-white">
                    <p className="truncate font-serif text-[15px] font-semibold">{intent.name}</p>
                    <span className="shrink-0 rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-medium backdrop-blur">
                      {successLabel(intent.successType)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between gap-3 p-3.5">
                  <div>
                    <p className="text-[13px] font-semibold text-[#0b1f35]">{intent.name || "Untitled variant"}</p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                      {intent.heading}
                      {intent.headingAccent ? ` ${intent.headingAccent}` : ""}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Opens from {connected} button{connected === 1 ? "" : "s"} · id: {intent.id}
                      {" · "}
                      track: {intent.gtmId?.trim() || defaultEnquiryFormTrackingId(intent.id)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setTab("content");
                        setEditing(index);
                      }}
                      className="inline-flex min-h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-700 hover:border-[#b98945] hover:bg-slate-50"
                    >
                      <Pencil className="size-3.5" /> Edit form
                    </button>
                    <button
                      type="button"
                      onClick={() => removeIntent(index)}
                      disabled={intents.length <= 1}
                      className="inline-flex size-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50 disabled:opacity-25"
                      aria-label={`Delete ${intent.name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {editingIntent && editing !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/60 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditing(null);
          }}
        >
          <div className="relative flex h-[90vh] max-h-[820px] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-3.5 sm:px-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#0b1f35]">Edit lead form</h3>
                  <span className="rounded-md bg-[#b98945]/10 px-2 py-0.5 text-[11px] font-medium text-[#b98945]">
                    {editingIntent.name}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">
                  Configure form content, fields, imagery, post-submission actions, and connected buttons.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Landscape Tabs Navigation */}
            <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200/80 bg-white px-4 pt-2.5 sm:px-6 hide-scrollbar">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`min-h-9 shrink-0 rounded-t-lg px-4 text-[12px] font-medium transition-all ${
                    tab === item.id
                      ? "border-b-2 border-[#b98945] bg-slate-50 font-semibold text-[#0b1f35]"
                      : "text-slate-500 hover:bg-slate-50/50 hover:text-[#0b1f35]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Scrollable Landscape Body - Scrollbar strictly attached to popup form only */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {tab === "content" ? (
                <ContentTab intent={editingIntent} index={editing} onUpdate={onUpdate} updateIntent={updateIntent} />
              ) : null}
              {tab === "media" ? (
                <MediaTab
                  intent={editingIntent}
                  index={editing}
                  updateIntent={updateIntent}
                  uploadEnabled={uploadEnabled}
                  uploadEndpoint={uploadEndpoint}
                />
              ) : null}
              {tab === "fields" ? (
                <FieldsTab intent={editingIntent} updateIntent={(patch) => updateIntent(editing, patch)} />
              ) : null}
              {tab === "success" ? (
                <SuccessTab
                  intent={editingIntent}
                  updateIntent={(patch) => updateIntent(editing, patch)}
                  siteData={siteData}
                  uploadEnabled={uploadEnabled}
                  uploadEndpoint={uploadEndpoint}
                />
              ) : null}
              {tab === "when" ? (
                <WhenToOpenTab
                  intentId={editingIntent.id}
                  intentName={editingIntent.name}
                  siteData={siteData}
                  allIntents={intents.map((intent) => ({ id: intent.id, name: intent.name }))}
                  onUpdate={onUpdate}
                />
              ) : null}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/80 px-5 py-3 sm:px-6">
              <span className="text-[11px] text-slate-400">All edits are auto-saved to your draft. Click Save Changes at top right to publish.</span>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="inline-flex min-h-9 items-center rounded-lg bg-[#0b1f35] px-5 text-[12px] font-semibold text-white transition hover:bg-[#153457]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function WhenToOpenTab({
  intentId,
  intentName,
  siteData,
  allIntents,
  onUpdate,
}: {
  intentId: string;
  intentName: string;
  siteData: SiteData;
  allIntents: Array<{ id: string; name: string }>;
  onUpdate: (path: PathPart[], value: unknown) => void;
}) {
  const buttons = listLeadFormButtons(siteData);
  const groups = buttonsGroupedBySection(buttons);
  const connected = buttons.filter((button) => button.intent === intentId);

  const intentNameById = (id: string) => allIntents.find((intent) => intent.id === id)?.name || id;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
        <p className="text-[12px] leading-5 text-slate-700">
          Tick the buttons that should open <span className="font-semibold text-[#0b1f35]">{intentName}</span>. A button can only open one form — choosing it here moves it from any other variant.
        </p>
        <p className="mt-1 text-[11px] font-medium text-slate-500">
          Currently connected ({connected.length}): {connected.length ? connected.map((button) => button.label).join(", ") : "none yet"}
        </p>
      </div>

      {!buttons.length ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-[12px] text-slate-500">
          No connectable buttons found yet. Add section buttons in the dashboard, then return here.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <section key={group.section} className="space-y-2 rounded-xl border border-slate-200 bg-white p-3.5">
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{group.section}</h4>
              <div className="space-y-1.5">
                {group.buttons.map((button) => (
                  <ButtonConnectionRow
                    key={button.id}
                    button={button}
                    intentId={intentId}
                    otherIntentLabel={button.intent && button.intent !== intentId ? intentNameById(button.intent) : null}
                    onToggle={(checked) => toggleButtonForIntent(siteData, button, intentId, checked, onUpdate)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ButtonConnectionRow({
  button,
  intentId,
  otherIntentLabel,
  onToggle,
}: {
  button: LeadFormButton;
  intentId: string;
  otherIntentLabel: string | null;
  onToggle: (checked: boolean) => void;
}) {
  const checked = button.intent === intentId;
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 transition hover:border-[#b98945]/50 hover:bg-white">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          event.stopPropagation();
          onToggle(event.target.checked);
        }}
        className="mt-0.5 size-4 rounded border-slate-300 text-[#b98945] focus:ring-[#b98945]"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-medium text-[#0b1f35]">{button.label}</span>
        <span className="mt-0.5 block text-[10px] text-slate-500">
          Button text: “{button.buttonLabel}”
          {otherIntentLabel ? ` · currently opens “${otherIntentLabel}”` : null}
          {checked ? " · connected to this form" : null}
        </span>
      </span>
    </label>
  );
}

function ContentTab({
  intent,
  index,
  onUpdate,
  updateIntent,
}: {
  intent: ResolvedEnquiryIntent;
  index: number;
  onUpdate: (path: PathPart[], value: unknown) => void;
  updateIntent: (index: number, patch: Partial<ResolvedEnquiryIntent>) => void;
}) {
  const record = intent as unknown as Record<string, unknown>;
  const parentPath: PathPart[] = ["enquiry", "intents", index];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
        <h4 className="text-[12px] font-semibold text-[#0b1f35]">Variant Identifiers</h4>
        <label className="block">
          <span className="admin-label">Variant name</span>
          <input
            value={intent.name}
            onChange={(event) => updateIntent(index, { name: event.target.value })}
            className="admin-input"
            placeholder="Shown in Lead form dropdowns"
          />
          <span className="mt-1 block text-[10px] text-slate-500">
            This name appears on every button&apos;s Lead form selector in section settings.
          </span>
        </label>

        <label className="block">
          <span className="admin-label">Form tracking ID</span>
          <input
            value={intent.gtmId || ""}
            onChange={(event) =>
              updateIntent(index, { gtmId: event.target.value.trim() || undefined })
            }
            className="admin-input font-mono text-[12px]"
            placeholder={`enquiry_${intent.id || "variant"}`}
          />
          <span className="mt-1 block text-[10px] text-slate-500">
            Unique ID for Google Tag Manager (form + thank-you screen). Leave blank to use{" "}
            <code className="rounded bg-slate-100 px-1">
              {defaultEnquiryFormTrackingId(intent.id || "variant")}
            </code>
            . Each popup variant should have a different value.
          </span>
        </label>

        <label className="block">
          <span className="admin-label">Submit button text</span>
          <input
            value={intent.submitLabel}
            onChange={(event) => updateIntent(index, { submitLabel: event.target.value })}
            className="admin-input"
            placeholder="e.g. Request a Callback, Get Brochure"
          />
        </label>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
        <h4 className="text-[12px] font-semibold text-[#0b1f35]">Modal Heading & Text</h4>
        <CompactColorField
          label="Form background"
          value={intent.backgroundColor || "#061d33"}
          onChange={(backgroundColor) => updateIntent(index, { backgroundColor })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 flex items-center gap-1">
              <span className="admin-label">Form title</span>
              <StylePopup title="heading" parent={record} fieldKey="heading" parentPath={parentPath} onUpdate={onUpdate} />
            </span>
            <input
              value={intent.heading}
              onChange={(event) => updateIntent(index, { heading: event.target.value })}
              className="admin-input"
            />
          </label>

          <label className="block">
            <span className="mb-1 flex items-center gap-1">
              <span className="admin-label">Highlighted title line</span>
              <StylePopup title="headingAccent" parent={record} fieldKey="headingAccent" parentPath={parentPath} onUpdate={onUpdate} />
            </span>
            <input
              value={intent.headingAccent}
              onChange={(event) => updateIntent(index, { headingAccent: event.target.value })}
              className="admin-input"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 flex items-center gap-1">
            <span className="admin-label">Text under the title</span>
            <StylePopup title="description" parent={record} fieldKey="description" parentPath={parentPath} onUpdate={onUpdate} />
          </span>
          <textarea
            value={intent.description}
            onChange={(event) => updateIntent(index, { description: event.target.value })}
            rows={2}
            className="admin-input min-h-16 resize-y py-2.5"
            style={textStyle(intent, "description")}
          />
        </label>

        <label className="block">
          <span className="mb-1 flex items-center gap-1">
            <span className="admin-label">Footer privacy text</span>
            <StylePopup title="footerText" parent={record} fieldKey="footerText" parentPath={parentPath} onUpdate={onUpdate} />
          </span>
          <textarea
            value={intent.footerText}
            onChange={(event) => updateIntent(index, { footerText: event.target.value })}
            rows={2}
            className="admin-input min-h-16 resize-y py-2.5"
            style={textStyle(intent, "footerText")}
          />
        </label>
      </div>
    </div>
  );
}

function MediaTab({
  intent,
  index,
  updateIntent,
  uploadEnabled,
  uploadEndpoint,
}: {
  intent: ResolvedEnquiryIntent;
  index: number;
  updateIntent: (index: number, patch: Partial<ResolvedEnquiryIntent>) => void;
  uploadEnabled: boolean;
  uploadEndpoint: string;
}) {
  const setHighlight = (factIndex: number, patch: Partial<EnquiryHighlight>) => {
    updateIntent(index, {
      highlights: intent.highlights.map((item, itemIndex) => (itemIndex === factIndex ? { ...item, ...patch } : item)),
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Left Column: Visual assets */}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
        <h4 className="text-[12px] font-semibold text-[#0b1f35]">Images & Branding</h4>
        <ImageUploadField
          label="Background image"
          value={intent.backgroundImage}
          onChange={(backgroundImage) => updateIntent(index, { backgroundImage })}
          uploadEnabled={uploadEnabled}
          uploadEndpoint={uploadEndpoint}
        />
        <label className="block">
          <span className="admin-label">Background image alt text</span>
          <input
            value={intent.backgroundImageAlt}
            onChange={(event) => updateIntent(index, { backgroundImageAlt: event.target.value })}
            className="admin-input"
          />
        </label>
        <div className="border-t border-slate-200/80 pt-3">
          <ImageUploadField
            label="Logo on the image"
            value={intent.logo}
            onChange={(logo) => updateIntent(index, { logo })}
            uploadEnabled={uploadEnabled}
            uploadEndpoint={uploadEndpoint}
          />
          <div className="mt-2">
            <CompactToggle
              label="Show logo on the image"
              checked={intent.showLogo}
              onChange={(showLogo) => updateIntent(index, { showLogo })}
            />
          </div>
        </div>
      </div>

      {/* Right Column: Highlights stat strip */}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-[12px] font-semibold text-[#0b1f35]">Modal statistics strip</h4>
            <p className="text-[11px] text-slate-500">Up to 4 quick highlights displayed on the modal banner.</p>
          </div>
          <CompactToggle
            label="Show strip"
            checked={intent.highlightsEnabled}
            onChange={(highlightsEnabled) => updateIntent(index, { highlightsEnabled })}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {intent.highlights.map((fact, factIndex) => {
            const iconColor = fact.iconColor || DEFAULT_ICON_COLOR;
            return (
              <article key={factIndex} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">Stat {factIndex + 1}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateIntent(index, {
                        highlights: intent.highlights.filter((_, itemIndex) => itemIndex !== factIndex),
                      })
                    }
                    className="inline-flex size-6 items-center justify-center rounded text-red-500 hover:bg-red-50"
                    aria-label={`Remove ${fact.label}`}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  <IconPicker label="Icon" value={fact.icon} color={iconColor} onChange={(icon) => setHighlight(factIndex, { icon })} />
                  <div className="grid grid-cols-2 gap-2">
                    <label>
                      <span className="admin-label">Value</span>
                      <input value={fact.value} onChange={(event) => setHighlight(factIndex, { value: event.target.value })} className="admin-input" />
                    </label>
                    <label>
                      <span className="admin-label">Label</span>
                      <input value={fact.label} onChange={(event) => setHighlight(factIndex, { label: event.target.value })} className="admin-input" />
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <CompactColorField label="Icon color" value={iconColor} onChange={(next) => setHighlight(factIndex, { iconColor: next })} />
                    <CompactColorField
                      label="Value color"
                      value={fact.valueColor || fact.textColor || "#FFFFFF"}
                      onChange={(next) => setHighlight(factIndex, { valueColor: next })}
                    />
                    <CompactColorField
                      label="Label color"
                      value={fact.labelColor || fact.textColor || "#cbd5e1"}
                      onChange={(next) => setHighlight(factIndex, { labelColor: next })}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {intent.highlights.length < 4 ? (
          <button
            type="button"
            onClick={() =>
              updateIntent(index, {
                highlights: [
                  ...intent.highlights,
                  { icon: "building", iconColor: DEFAULT_ICON_COLOR, value: "New", label: "Stat" },
                ],
              })
            }
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-700 hover:border-[#b98945]"
          >
            <Plus className="size-3.5" /> Add stat box
          </button>
        ) : null}
      </div>
    </div>
  );
}

function OptionsManager({
  options,
  onChange,
}: {
  options: string[];
  onChange: (options: string[]) => void;
}) {
  const [quickInput, setQuickInput] = useState("");

  const updateOption = (idx: number, val: string) => {
    const next = [...options];
    next[idx] = val;
    onChange(next);
  };

  const removeOption = (idx: number) => {
    onChange(options.filter((_, i) => i !== idx));
  };

  const addOption = (val = "New Option") => {
    onChange([...options, val]);
  };

  const applyQuickList = () => {
    if (!quickInput.trim()) return;
    const items = quickInput
      .split(/[,|\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length > 0) {
      onChange(items);
      setQuickInput("");
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="admin-label">Dropdown / Choice Options ({options.length})</span>
          <p className="text-[10px] text-slate-500">Each option represents a selectable choice for visitors.</p>
        </div>
        <button
          type="button"
          onClick={() => addOption(`Option ${options.length + 1}`)}
          className="inline-flex min-h-7 items-center gap-1 rounded-md bg-[#b98945] px-2.5 text-[11px] font-semibold text-white hover:bg-[#a57738]"
        >
          <Plus className="size-3" /> Add choice
        </button>
      </div>

      {/* Preset Chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-medium text-slate-400">Quick presets:</span>
        {OPTION_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(preset.options)}
            className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600 transition hover:border-[#b98945] hover:text-[#b98945]"
            title={preset.options.join(", ")}
          >
            + {preset.label}
          </button>
        ))}
      </div>

      {/* Options List */}
      <div className="space-y-1.5">
        {options.map((opt, optIdx) => (
          <div key={optIdx} className="flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded bg-slate-200 text-[10px] font-bold text-slate-600">
              {optIdx + 1}
            </span>
            <input
              value={opt}
              onChange={(e) => updateOption(optIdx, e.target.value)}
              placeholder={`Option ${optIdx + 1}`}
              className="admin-input flex-1 py-1.5 text-[12px]"
            />
            <button
              type="button"
              onClick={() => removeOption(optIdx)}
              disabled={options.length <= 1}
              className="inline-flex size-7 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-20"
              aria-label="Remove option"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Bulk paste / Quick input */}
      <div className="border-t border-slate-200/80 pt-2.5">
        <div className="flex items-center gap-2">
          <input
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyQuickList();
              }
            }}
            placeholder="Paste comma-separated choices (e.g. 2 BHK, 3 BHK, 4 BHK)..."
            className="admin-input flex-1 py-1.5 text-[11px]"
          />
          <button
            type="button"
            onClick={applyQuickList}
            disabled={!quickInput.trim()}
            className="inline-flex min-h-8 shrink-0 items-center rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-700 hover:border-[#b98945] disabled:opacity-40"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldsTab({
  intent,
  updateIntent,
}: {
  intent: ResolvedEnquiryIntent;
  updateIntent: (patch: Partial<ResolvedEnquiryIntent>) => void;
}) {
  const patchCoreField = (key: (typeof FIELD_KEYS)[number], patch: Partial<EnquiryFormField>) => {
    const field = intent.fields[key];
    updateIntent({
      fields: {
        ...intent.fields,
        [key]: { ...field, ...patch },
      },
    });
  };

  const setCustom = (custom: EnquiryCustomField[]) => {
    updateIntent({
      fields: {
        ...intent.fields,
        custom,
      },
    });
  };

  const patchCustom = (index: number, patch: Partial<EnquiryCustomField>) => {
    setCustom(
      intent.fields.custom.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, ...patch } : field,
      ),
    );
  };

  const moveCustom = (from: number, to: number) => {
    if (to < 0 || to >= intent.fields.custom.length) return;
    const next = [...intent.fields.custom];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setCustom(next);
  };

  return (
    <div className="space-y-6">
      {/* Core Fields Grid */}
      <section className="space-y-3">
        <div>
          <h4 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-500">Standard Fields</h4>
          <p className="text-[11px] text-slate-400">Name, phone, and email are built-in lead identifiers.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {FIELD_KEYS.map((key) => {
            const field = intent.fields[key];
            return (
              <article key={key} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 shadow-sm">
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
                    <input
                      value={field.placeholder}
                      onChange={(event) => patchCoreField(key, { placeholder: event.target.value })}
                      className="admin-input"
                    />
                  </label>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Custom Fields Section */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-4">
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              Custom & Interactive Form Fields ({intent.fields.custom.length})
            </h4>
            <p className="text-[11px] text-slate-400">
              Add extra fields for dropdown selections, radio choices, checkboxes, budget ranges, preferred units, visit date, etc.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setCustom([
                ...intent.fields.custom,
                blankCustomField(`Field ${intent.fields.custom.length + 1}`),
              ])
            }
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#b98945] px-3.5 text-[12px] font-semibold text-white shadow-sm hover:bg-[#a57738]"
          >
            <Plus className="size-3.5" /> Add custom field
          </button>
        </div>

        {intent.fields.custom.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
            <p className="text-[13px] font-medium text-slate-600">No custom fields added yet</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Add custom dropdowns (e.g. BHK selection), radio buttons, or checkboxes to gather more detailed buyer information.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {intent.fields.custom.map((field, index) => {
              const isSelectOrRadio = field.type === "select" || field.type === "radio";
              const currentOptions = Array.isArray(field.options) && field.options.length > 0
                ? field.options
                : ["Option 1", "Option 2", "Option 3"];

              return (
                <article
                  key={field.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-md bg-[#0b1f35] text-[11px] font-bold text-white">
                        {index + 1}
                      </span>
                      <p className="text-[12px] font-semibold text-[#0b1f35]">
                        {field.label || `Field ${index + 1}`}
                      </p>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {CUSTOM_FIELD_TYPE_OPTIONS.find((t) => t.id === field.type)?.label || field.type}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <CompactToggle label="Show" checked={field.enabled} onChange={(enabled) => patchCustom(index, { enabled })} />
                      <CompactToggle
                        label="Required"
                        checked={field.required}
                        onChange={(required) => patchCustom(index, { required, enabled: required ? true : field.enabled })}
                      />
                      <button
                        type="button"
                        onClick={() => moveCustom(index, index - 1)}
                        disabled={index === 0}
                        className="inline-flex size-7 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCustom(index, index + 1)}
                        disabled={index === intent.fields.custom.length - 1}
                        className="inline-flex size-7 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCustom(intent.fields.custom.filter((_, fieldIndex) => fieldIndex !== index))
                        }
                        className="inline-flex size-7 items-center justify-center rounded text-red-500 hover:bg-red-50"
                        aria-label={`Delete ${field.label}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Field Configuration Grid */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label>
                      <span className="admin-label">Field label</span>
                      <input
                        value={field.label}
                        onChange={(event) => patchCustom(index, { label: event.target.value })}
                        className="admin-input"
                        placeholder="e.g. Preferred Configuration"
                      />
                    </label>

                    <label>
                      <span className="admin-label">Field type</span>
                      <select
                        value={field.type}
                        onChange={(event) => {
                          const newType = event.target.value as EnquiryCustomFieldType;
                          const patch: Partial<EnquiryCustomField> = { type: newType };
                          if (
                            (newType === "select" || newType === "radio") &&
                            (!field.options || field.options.length === 0)
                          ) {
                            patch.options = ["Option 1", "Option 2", "Option 3"];
                          }
                          patchCustom(index, patch);
                        }}
                        className="admin-input cursor-pointer"
                      >
                        {CUSTOM_FIELD_TYPE_OPTIONS.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="admin-label">
                        {field.type === "checkbox"
                          ? "Checkbox description"
                          : field.type === "select"
                          ? "Select placeholder"
                          : "Placeholder text"}
                      </span>
                      <input
                        value={field.placeholder}
                        onChange={(event) => patchCustom(index, { placeholder: event.target.value })}
                        className="admin-input"
                        placeholder={
                          field.type === "checkbox"
                            ? "I agree to receive communications"
                            : field.type === "select"
                            ? "Choose an option..."
                            : "Enter value..."
                        }
                      />
                    </label>
                  </div>

                  {/* If dropdown or radio, show the rich OptionsManager */}
                  {isSelectOrRadio ? (
                    <div className="mt-3">
                      <OptionsManager
                        options={currentOptions}
                        onChange={(options) => patchCustom(index, { options })}
                      />
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function SuccessTab({
  intent,
  updateIntent,
  siteData,
  uploadEnabled,
  uploadEndpoint,
}: {
  intent: ResolvedEnquiryIntent;
  updateIntent: (patch: Partial<ResolvedEnquiryIntent>) => void;
  siteData: SiteData;
  uploadEnabled: boolean;
  uploadEndpoint: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const isMasterPlan =
    intent.id === "masterplan" ||
    (intent.name && /master\s*plan/i.test(intent.name)) ||
    (intent.heading && /master\s*plan/i.test(intent.heading));

  const fallbackDocUrl = isMasterPlan
    ? siteData.site.masterPlanUrl || siteData.site.brochureUrl || ""
    : siteData.site.brochureUrl || siteData.site.masterPlanUrl || "";

  const effectiveHref = (intent.successHref || fallbackDocUrl || "").trim();
  const isDirectDownload = intent.successType === "download";

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const publicPath = await uploadFileAsset(file, uploadEndpoint);
      updateIntent({ successHref: publicPath });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDirectDownload = async () => {
    if (!effectiveHref) return;
    setDownloading(true);
    try {
      const downloadName = isMasterPlan ? "Master-Plan.pdf" : "Brochure.pdf";
      const downloadEndpoint = `/api/download?url=${encodeURIComponent(effectiveHref)}&name=${encodeURIComponent(downloadName)}`;
      const response = await fetch(downloadEndpoint);
      if (!response.ok) {
        window.open(effectiveHref, "_blank", "noopener,noreferrer");
        return;
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const tempLink = document.createElement("a");
      tempLink.href = blobUrl;
      tempLink.download = downloadName;
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(effectiveHref, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  const fileName = effectiveHref
    ? effectiveHref.split("/").pop()?.split("?")[0] || effectiveHref
    : "";

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
        <h4 className="text-[12px] font-semibold text-[#0b1f35]">Action after Submission</h4>
        <label className="block">
          <span className="admin-label">Success action</span>
          <select
            value={intent.successType}
            onChange={(event) => updateIntent({ successType: event.target.value as EnquirySuccessType })}
            className="admin-input cursor-pointer"
          >
            {successTypeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="admin-label">Success confirmation message</span>
          <textarea
            value={intent.successMessage}
            onChange={(event) => updateIntent({ successMessage: event.target.value })}
            rows={2}
            className="admin-input min-h-16 resize-y py-2.5"
          />
        </label>

        {intent.successType !== "message" ? (
          <label className="block">
            <span className="admin-label">Action button text</span>
            <input
              value={intent.successButtonLabel ?? ""}
              onChange={(event) => updateIntent({ successButtonLabel: event.target.value })}
              className="admin-input"
              placeholder={
                intent.successType === "download"
                  ? isMasterPlan
                    ? "Download Master Plan"
                    : "Download Brochure"
                  : intent.successType === "whatsapp"
                  ? "Chat on WhatsApp"
                  : "View Details"
              }
            />
          </label>
        ) : null}
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
        <h4 className="text-[12px] font-semibold text-[#0b1f35]">File or Link Destination</h4>
        {isDirectDownload ? (
          <div className="space-y-3">
            <div>
              <span className="admin-label">Document to Download</span>
              <p className="text-[11px] text-slate-500">
                Upload a PDF/Brochure or provide a document link for direct 1-click download.
              </p>
            </div>

            {effectiveHref ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#b98945]/10 text-[#b98945]">
                    <FileText className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-[#0b1f35]">{fileName}</p>
                    <p className="text-[10px] text-slate-400">Ready for instant download</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleDirectDownload}
                    disabled={downloading}
                    className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {downloading ? <LoaderCircle className="size-3 animate-spin" /> : <Download className="size-3" />} Download
                  </button>
                  <label
                    className={`inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-700 ${
                      uploadEnabled ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed opacity-50"
                    }`}
                  >
                    {uploading ? <LoaderCircle className="size-3 animate-spin" /> : <ImagePlus className="size-3" />} Replace
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                      disabled={!uploadEnabled || uploading}
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => updateIntent({ successHref: "" })}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                    aria-label="Remove document"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center">
                <FileText className="mx-auto size-7 text-slate-400" />
                <p className="mt-1.5 text-[12px] font-medium text-slate-700">No document uploaded yet</p>
                <div className="mt-3 flex justify-center gap-2">
                  <label
                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#b98945] px-3.5 text-[12px] font-semibold text-white ${
                      uploadEnabled ? "cursor-pointer hover:bg-[#a57738]" : "cursor-not-allowed opacity-50"
                    }`}
                  >
                    {uploading ? <LoaderCircle className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />} Upload file
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                      disabled={!uploadEnabled || uploading}
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>
            )}

            {uploadError ? <p className="text-[11px] text-red-600">{uploadError}</p> : null}
          </div>
        ) : intent.successType === "whatsapp" ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-emerald-900">
            <p className="text-[12px] font-semibold">WhatsApp Auto-Redirect</p>
            <p className="mt-1 text-[11px] text-emerald-700">
              Users will see a WhatsApp button redirecting to{" "}
              <span className="font-mono font-medium">{siteData.site.whatsapp}</span> upon form submission.
            </p>
          </div>
        ) : (
          <label className="block">
            <span className="admin-label">Destination URL / Link</span>
            <input
              value={intent.successHref || ""}
              onChange={(event) => updateIntent({ successHref: event.target.value })}
              className="admin-input"
              placeholder="https://... or #about"
            />
          </label>
        )}
      </div>
    </div>
  );
}

function ImageUploadField({
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
  const [error, setError] = useState("");

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
    <div className="space-y-2">
      <label className="block">
        <span className="admin-label">{label}</span>
        <input value={value} onChange={(event) => onChange(event.target.value)} className="admin-input" />
      </label>
      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <label
          className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-700 ${
            uploadEnabled ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed opacity-50"
          }`}
        >
          {uploading ? <LoaderCircle className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />} Upload
          <input type="file" accept="image/*" disabled={!uploadEnabled || uploading} className="hidden" onChange={upload} />
        </label>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex min-h-8 items-center rounded-lg border border-slate-200 px-2.5 text-[11px] font-medium text-slate-500 hover:bg-slate-50 hover:text-red-600"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
