"use client";

import { useEffect, useState } from "react";
import { Palette, X } from "lucide-react";
import type { Cta, CtaAction } from "@/types/site";
import { FONT_FAMILIES, FONT_WEIGHTS } from "@/lib/typography";
import {
  BUTTON_GRADIENT_PRESETS,
  FEATURED_GRADIENT_PRESETS,
  findButtonGradientPreset,
  resolveButtonBackgroundStyle,
  resolveButtonBackgroundType,
  type ButtonBackgroundSource,
  type ButtonBackgroundType,
} from "@/lib/button-background";
import { GradientLibraryDialog } from "@/components/admin/GradientLibraryDialog";
import { useAdminCustomGradients } from "@/components/admin/AdminContentContext";
import { DEFAULT_SECTION_ORDER, SECTION_LABELS, sectionHash } from "@/lib/section-order";

export type PathPart = string | number;
export type IntentOption = { id: string; name: string };
export type SectionOption = { hash: string; label: string };

/** Actions shown in admin button pickers. Legacy brochure/download/map still work at runtime. */
export const CTA_ACTIONS: CtaAction[] = ["enquire", "whatsapp", "call", "link", "scroll"];

export const CTA_ACTION_LABELS: Record<CtaAction, string> = {
  enquire: "Form",
  scroll: "Section",
  brochure: "Form",
  download: "Form",
  whatsapp: "WhatsApp",
  call: "Call",
  map: "Section",
  link: "Custom link",
};

/** Map legacy form/map actions onto the simplified picker values. */
export function visibleCtaAction(action: CtaAction): CtaAction {
  if (isFormCtaAction(action)) return "enquire";
  if (isSectionCtaAction(action)) return "scroll";
  return action;
}

export function humanize(value: string) {
  if (value in CTA_ACTION_LABELS) return CTA_ACTION_LABELS[value as CtaAction];
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase());
}

export function ctaLink(cta: Pick<Cta, "href" | "target">) {
  return cta.href || cta.target || "";
}

export function defaultSectionOptions(): SectionOption[] {
  return DEFAULT_SECTION_ORDER.map((key) => ({
    hash: sectionHash(key),
    label: SECTION_LABELS[key],
  }));
}

export function isFormCtaAction(action: CtaAction) {
  return action === "enquire" || action === "brochure" || action === "download";
}

export function isSectionCtaAction(action: CtaAction) {
  return action === "scroll" || action === "map";
}

export function patchCtaAction(cta: Cta, action: CtaAction, sections: SectionOption[] = defaultSectionOptions()): Cta {
  // Prefer the simplified action ids; keep intent / section target when migrating from legacy values.
  const normalized = visibleCtaAction(action);
  const next: Cta = { ...cta, action: normalized };

  if (isFormCtaAction(normalized)) {
    if (!next.intent?.trim()) {
      next.intent = cta.action === "brochure" || cta.action === "download" ? "brochure" : "default";
    }
    return next;
  }

  if (isSectionCtaAction(normalized)) {
    const fallback = sections[0]?.hash || "#about";
    const current = ctaLink(cta);
    const looksLikeSection = current.startsWith("#") && !current.startsWith("#enquire");
    if (!looksLikeSection) {
      next.target = fallback;
      next.href = fallback;
    }
    return next;
  }

  return next;
}

export function CompactToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
      <span className="text-[12px] font-medium text-slate-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-slate-300"}`}
      >
        <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${checked ? "left-[18px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

export function CompactColorField({
  label,
  value,
  onChange,
  placeholder = "#0B1F35",
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const current = value || "";
  const hex = /^#[0-9a-f]{6}$/i.test(current) ? current : "#000000";
  return (
    <label className="block min-w-0">
      <span className="admin-label">{label}</span>
      <span className="mt-1.5 flex h-10 w-full max-w-[14rem] items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 focus-within:border-[#b98945]">
        <input
          type="color"
          value={hex}
          onChange={(event) => onChange(event.target.value)}
          className="size-6 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <input
          value={current}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 text-[12px] uppercase outline-none"
        />
        {current ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onChange("");
            }}
            className="text-slate-400 hover:text-slate-600"
            title="Reset"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </span>
    </label>
  );
}

function PopupFontSizeField({
  size,
  onChange,
}: {
  size: unknown;
  onChange: (value: number | undefined) => void;
}) {
  const [local, setLocal] = useState<string>(
    typeof size === "number" && size > 0 ? String(size) : ""
  );

  useEffect(() => {
    setLocal(typeof size === "number" && size > 0 ? String(size) : "");
  }, [size]);

  return (
    <label>
      <span className="admin-label">Font size (px)</span>
      <input
        type="number"
        min={8}
        max={160}
        placeholder="Default"
        value={local}
        onChange={(event) => {
          const raw = event.target.value;
          setLocal(raw);
          const parsed = Number(raw);
          if (raw.trim() === "") {
            onChange(undefined);
          } else if (!isNaN(parsed) && parsed > 0) {
            onChange(parsed);
          }
        }}
        onBlur={() => {
          const parsed = Number(local);
          if (!isNaN(parsed) && parsed >= 8 && parsed <= 160) {
            setLocal(String(parsed));
            onChange(parsed);
          } else if (local.trim() === "") {
            setLocal("");
            onChange(undefined);
          } else if (!isNaN(parsed) && parsed > 0 && parsed < 8) {
            setLocal("8");
            onChange(8);
          }
        }}
        className="admin-input"
      />
    </label>
  );
}

export function StylePopup({
  title,
  parent,
  fieldKey,
  colorKey,
  parentPath,
  onUpdate,
  allowBackground = false,
  defaultBackgroundColor = "#e4bd68",
}: {
  title: string;
  parent: Record<string, unknown>;
  fieldKey: string;
  colorKey?: string;
  parentPath: PathPart[];
  onUpdate: (path: PathPart[], value: unknown) => void;
  /** When true, show plain/gradient fill controls for the box behind the text. */
  allowBackground?: boolean;
  defaultBackgroundColor?: string;
}) {
  const [open, setOpen] = useState(false);
  const { customGradients } = useAdminCustomGradients();
  const sizeKey = `${fieldKey}FontSize`;
  const weightKey = `${fieldKey}FontWeight`;
  const familyKey = `${fieldKey}FontFamily`;
  const lineHeightKey = `${fieldKey}LineHeight`;
  const letterSpacingKey = `${fieldKey}LetterSpacing`;
  const wordSpacingKey = `${fieldKey}WordSpacing`;
  const resolvedColorKey = colorKey || `${fieldKey}Color`;
  const bgTypeKey = `${fieldKey}BackgroundType`;
  const bgColorKey = `${fieldKey}BackgroundColor`;
  const bgGradientKey = `${fieldKey}BackgroundGradient`;
  const size = parent[sizeKey];
  const weight = parent[weightKey];
  const family = typeof parent[familyKey] === "string" ? String(parent[familyKey]) : "";
  const rawLineHeight = parent[lineHeightKey];
  const lineHeight =
    typeof rawLineHeight === "number" && Number.isFinite(rawLineHeight)
      ? rawLineHeight
      : Number(rawLineHeight);
  const hasLineHeight = Number.isFinite(lineHeight) && lineHeight >= 0.8;
  const previewLineHeight = hasLineHeight
    ? lineHeight
    : typeof size === "number" && size >= 8
      ? 1.25
      : 1.5;
  const rawLetterSpacing = parent[letterSpacingKey];
  const letterSpacing =
    typeof rawLetterSpacing === "number" && Number.isFinite(rawLetterSpacing)
      ? rawLetterSpacing
      : Number(rawLetterSpacing);
  const hasLetterSpacing = Number.isFinite(letterSpacing) && letterSpacing >= -0.1;
  const previewLetterSpacing = hasLetterSpacing ? letterSpacing : 0;
  const rawWordSpacing = parent[wordSpacingKey];
  const wordSpacing =
    typeof rawWordSpacing === "number" && Number.isFinite(rawWordSpacing)
      ? rawWordSpacing
      : Number(rawWordSpacing);
  const hasWordSpacing = Number.isFinite(wordSpacing) && wordSpacing >= -0.2;
  const previewWordSpacing = hasWordSpacing ? wordSpacing : 0;
  const color = String(parent[resolvedColorKey] || "");
  const previewColor = /^#[0-9a-f]{6}$/i.test(color) ? color : "#0B1F35";
  const multiLinePreview = /description|answer|footer|message|disclaimer/i.test(fieldKey) || /description|answer|footer/i.test(title);
  const backgroundSource: ButtonBackgroundSource = {
    backgroundType: parent[bgTypeKey] === "gradient" ? "gradient" : "plain",
    backgroundColor: String(parent[bgColorKey] || defaultBackgroundColor),
    backgroundGradient: typeof parent[bgGradientKey] === "string" ? String(parent[bgGradientKey]) : undefined,
  };
  const previewBackground = allowBackground
    ? resolveButtonBackgroundStyle(backgroundSource, customGradients)
    : undefined;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-[#0b1f35]" aria-label={`Style ${title}`}>
        <Palette className="size-3.5" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <div className="max-h-[min(85vh,560px)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#0b1f35]">Style {title}</h3>
              <button type="button" onClick={() => setOpen(false)} className="inline-flex size-8 items-center justify-center rounded-md hover:bg-slate-100" aria-label="Close"><X className="size-4" /></button>
            </div>

            <div className="grid gap-5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-start">
              <div
                className={`rounded-xl border border-slate-200 px-3 py-4 ${multiLinePreview ? "text-left" : "flex min-h-[7rem] items-center justify-center text-center"} ${allowBackground ? "" : "bg-slate-50"}`}
                style={{
                  color: previewColor,
                  fontSize: typeof size === "number" && size >= 8 ? `${size}px` : multiLinePreview ? "13px" : undefined,
                  fontWeight: typeof weight === "number" ? weight : undefined,
                  fontFamily: family || undefined,
                  lineHeight: previewLineHeight,
                  letterSpacing: `${previewLetterSpacing}em`,
                  wordSpacing: `${previewWordSpacing}em`,
                  ...previewBackground,
                }}
              >
                {multiLinePreview ? (
                  <>
                    <p>
                      Preview how spacing looks between lines of body copy. Adjust the line height slider and watch this sample update live.
                    </p>
                    <p className="mt-2">
                      A thoughtfully planned township with spacious residences, green spaces, and lifestyle amenities for comfortable modern living.
                    </p>
                  </>
                ) : (
                  "Preview text"
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="col-span-2">
                  <span className="admin-label">Font family</span>
                  <select
                    value={family}
                    onChange={(event) => onUpdate([...parentPath, familyKey], event.target.value || undefined)}
                    className="admin-input"
                  >
                    {FONT_FAMILIES.map((option) => <option key={option.label} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <PopupFontSizeField
                  size={size}
                  onChange={(next) => onUpdate([...parentPath, sizeKey], next)}
                />
                <label>
                  <span className="admin-label">Font weight</span>
                  <select
                    value={typeof weight === "number" ? String(weight) : ""}
                    onChange={(event) => onUpdate([...parentPath, weightKey], event.target.value ? Number(event.target.value) : undefined)}
                    className="admin-input"
                  >
                    <option value="">Default</option>
                    {FONT_WEIGHTS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <div className="col-span-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="admin-label !mt-0">Line height</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium tabular-nums text-[#0b1f35]">
                        {hasLineHeight ? previewLineHeight.toFixed(2) : `Default (${previewLineHeight.toFixed(2)})`}
                      </span>
                      {hasLineHeight ? (
                        <button
                          type="button"
                          onClick={() => onUpdate([...parentPath, lineHeightKey], undefined)}
                          className="text-[10px] font-semibold text-slate-500 hover:text-[#0b1f35]"
                        >
                          Reset
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={2.5}
                    step={0.05}
                    value={previewLineHeight}
                    onChange={(event) =>
                      onUpdate([...parentPath, lineHeightKey], Math.round(Number(event.target.value) * 100) / 100)
                    }
                    className="w-full accent-[#b98945]"
                    aria-label={`Line height for ${title}`}
                  />
                  <div className="flex justify-between text-[9px] uppercase tracking-wide text-slate-400">
                    <span>Tight</span>
                    <span>Normal</span>
                    <span>Loose</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="admin-label !mt-0">Letter spacing</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium tabular-nums text-[#0b1f35]">
                        {hasLetterSpacing ? `${previewLetterSpacing.toFixed(2)}em` : "Default"}
                      </span>
                      {hasLetterSpacing ? (
                        <button
                          type="button"
                          onClick={() => onUpdate([...parentPath, letterSpacingKey], undefined)}
                          className="text-[10px] font-semibold text-slate-500 hover:text-[#0b1f35]"
                        >
                          Reset
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={-0.05}
                    max={0.2}
                    step={0.01}
                    value={previewLetterSpacing}
                    onChange={(event) =>
                      onUpdate([...parentPath, letterSpacingKey], Math.round(Number(event.target.value) * 100) / 100)
                    }
                    className="w-full accent-[#b98945]"
                    aria-label={`Letter spacing for ${title}`}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="admin-label !mt-0">Word spacing</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium tabular-nums text-[#0b1f35]">
                        {hasWordSpacing ? `${previewWordSpacing.toFixed(2)}em` : "Default"}
                      </span>
                      {hasWordSpacing ? (
                        <button
                          type="button"
                          onClick={() => onUpdate([...parentPath, wordSpacingKey], undefined)}
                          className="text-[10px] font-semibold text-slate-500 hover:text-[#0b1f35]"
                        >
                          Reset
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={-0.05}
                    max={0.4}
                    step={0.01}
                    value={previewWordSpacing}
                    onChange={(event) =>
                      onUpdate([...parentPath, wordSpacingKey], Math.round(Number(event.target.value) * 100) / 100)
                    }
                    className="w-full accent-[#b98945]"
                    aria-label={`Word spacing for ${title}`}
                  />
                </div>
                <div className="col-span-2">
                  <CompactColorField label="Text color" value={color || "#0B1F35"} onChange={(next) => onUpdate([...parentPath, resolvedColorKey], next)} />
                </div>
                {allowBackground ? (
                  <div className="col-span-2 border-t border-slate-100 pt-3">
                    <p className="mb-2 text-[11px] font-medium text-slate-500">Box background</p>
                    <ButtonBackgroundPicker
                      value={backgroundSource}
                      onChange={(next) => {
                        onUpdate([...parentPath, bgTypeKey], next.backgroundType || "plain");
                        onUpdate([...parentPath, bgColorKey], next.backgroundColor || defaultBackgroundColor);
                        onUpdate([...parentPath, bgGradientKey], next.backgroundGradient || "golden");
                      }}
                      showTextColor={false}
                      plainLabel="Background"
                    />
                  </div>
                ) : null}
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="mt-4 inline-flex min-h-9 items-center rounded-lg bg-[#0b1f35] px-4 text-[12px] font-semibold text-white">Done</button>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Action-dependent fields: which form / which section / which link / help for call & WhatsApp. */
export function CtaActionExtras({
  cta,
  onChange,
  intents,
  sections = defaultSectionOptions(),
}: {
  cta: Cta;
  onChange: (next: Cta) => void;
  intents: IntentOption[];
  sections?: SectionOption[];
}) {
  if (isFormCtaAction(cta.action)) {
    return (
      <label className="min-w-0">
        <span className="admin-label">Which form</span>
        <select
          value={cta.intent || "default"}
          onChange={(event) => onChange({ ...cta, intent: event.target.value })}
          className="admin-input"
        >
          {intents.length
            ? intents.map((intent) => <option key={intent.id} value={intent.id}>{intent.name}</option>)
            : <option value="default">General enquiry</option>}
        </select>
      </label>
    );
  }

  if (isSectionCtaAction(cta.action)) {
    const current = ctaLink(cta);
    const known = sections.some((section) => section.hash === current);
    const mapFallback = sections.find((section) => section.hash.includes("location"))?.hash || "#location";
    const selectValue = known ? current : cta.action === "map" ? mapFallback : current || sections[0]?.hash || "#about";
    return (
      <label className="min-w-0">
        <span className="admin-label">Which section</span>
        <select
          value={selectValue}
          onChange={(event) => onChange({ ...cta, target: event.target.value, href: event.target.value })}
          className="admin-input"
        >
          {!known && current ? <option value={current}>{current}</option> : null}
          {sections.map((section) => (
            <option key={section.hash} value={section.hash}>{section.label}</option>
          ))}
        </select>
      </label>
    );
  }

  if (cta.action === "link") {
    return (
      <label className="min-w-0">
        <span className="admin-label">Which link</span>
        <input
          value={ctaLink(cta)}
          onChange={(event) => onChange({ ...cta, href: event.target.value, target: event.target.value })}
          placeholder="https://… or /page"
          className="admin-input"
        />
      </label>
    );
  }

  if (cta.action === "whatsapp") {
    return (
      <p className="flex min-h-10 items-center rounded-lg border border-dashed border-slate-200 bg-white px-3 text-[11px] text-slate-500">
        Opens the site WhatsApp number from Brand & Contact.
      </p>
    );
  }

  if (cta.action === "call") {
    return (
      <p className="flex min-h-10 items-center rounded-lg border border-dashed border-slate-200 bg-white px-3 text-[11px] text-slate-500">
        Calls the site phone number from Brand & Contact.
      </p>
    );
  }

  return null;
}

/** Shared plain / gradient background picker for site buttons. */
export function ButtonBackgroundPicker({
  value,
  onChange,
  textColor,
  onTextColorChange,
  showTextColor = true,
  plainLabel = "Button bg",
}: {
  value: ButtonBackgroundSource;
  onChange: (next: ButtonBackgroundSource) => void;
  textColor?: string;
  onTextColorChange?: (next: string) => void;
  showTextColor?: boolean;
  plainLabel?: string;
}) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const { customGradients, setCustomGradients } = useAdminCustomGradients();
  const type = resolveButtonBackgroundType(value);
  const selectedGradient = value.backgroundGradient || "golden";
  const selectedPreset = findButtonGradientPreset(selectedGradient, customGradients);
  const selectedIsFeatured = FEATURED_GRADIENT_PRESETS.some((preset) => preset.id === selectedGradient);

  const setType = (next: ButtonBackgroundType) => {
    onChange({
      ...value,
      backgroundType: next,
      backgroundGradient: next === "gradient" ? (value.backgroundGradient || "golden") : value.backgroundGradient,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-slate-500">Background type</span>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          {([
            { id: "plain" as const, label: "Plain" },
            { id: "gradient" as const, label: "Gradient" },
          ]).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setType(option.id)}
              className={`min-h-7 rounded-md px-2.5 text-[11px] font-semibold transition-colors ${
                type === option.id ? "bg-[#0b1f35] text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {type === "plain" ? (
        <div className="flex flex-wrap items-center gap-3">
          <CompactColorField
            label={plainLabel}
            value={value.backgroundColor || ""}
            onChange={(backgroundColor) => onChange({ ...value, backgroundType: "plain", backgroundColor })}
            placeholder="Default"
          />
          {showTextColor && onTextColorChange ? (
            <CompactColorField
              label="Button text"
              value={textColor || ""}
              onChange={onTextColorChange}
              placeholder="Default"
            />
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          <span className="admin-label">Gradient presets</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FEATURED_GRADIENT_PRESETS.map((preset) => {
              const active = selectedGradient === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onChange({ ...value, backgroundType: "gradient", backgroundGradient: preset.id })}
                  className={`overflow-hidden rounded-xl border text-left transition-shadow ${
                    active ? "border-[#b98945] ring-2 ring-[#b98945]/35" : "border-slate-200 hover:border-[#b98945]/50"
                  }`}
                  title={preset.description}
                >
                  <span className="block h-9 w-full" style={{ backgroundImage: preset.css }} />
                  <span className="block px-2 py-1.5">
                    <span className="block text-[11px] font-semibold text-[#0b1f35]">{preset.label}</span>
                    <span className="block text-[9px] text-slate-500">{preset.description}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {!selectedIsFeatured && selectedPreset ? (
            <div className="overflow-hidden rounded-xl border border-[#b98945] ring-2 ring-[#b98945]/25">
              <span className="block h-8 w-full" style={{ backgroundImage: selectedPreset.css }} />
              <span className="block px-2 py-1.5 text-[11px] text-[#0b1f35]">
                Selected: <span className="font-semibold">{selectedPreset.label}</span>
                <span className="text-slate-500"> · {selectedPreset.description}</span>
              </span>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#b98945]/70 bg-[#b98945]/5 px-3 text-[11px] font-semibold text-[#9b6d30] hover:bg-[#b98945]/10"
          >
            More gradients & custom…
            <span className="font-medium text-slate-500">({BUTTON_GRADIENT_PRESETS.length}+)</span>
          </button>

          {showTextColor && onTextColorChange ? (
            <div className="pt-1">
              <CompactColorField
                label="Button text"
                value={textColor || ""}
                onChange={onTextColorChange}
                placeholder="Default"
              />
            </div>
          ) : null}

          <GradientLibraryDialog
            open={libraryOpen}
            selectedId={selectedGradient}
            customGradients={customGradients}
            onClose={() => setLibraryOpen(false)}
            onSelect={(backgroundGradient) =>
              onChange({ ...value, backgroundType: "gradient", backgroundGradient })
            }
            onSaveCustom={setCustomGradients}
          />
        </div>
      )}
    </div>
  );
}

/** Shared button text + action + action-dependent field. */
export function CtaFields({
  cta,
  onChange,
  intents,
  sections = defaultSectionOptions(),
  actions = CTA_ACTIONS,
  className = "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3",
  showColors = true,
}: {
  cta: Cta;
  onChange: (next: Cta) => void;
  intents: IntentOption[];
  sections?: SectionOption[];
  actions?: CtaAction[];
  className?: string;
  showColors?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className={className}>
        <label className="min-w-0">
          <span className="admin-label">Button text</span>
          <input value={cta.label} onChange={(event) => onChange({ ...cta, label: event.target.value })} className="admin-input" />
        </label>
        <label className="min-w-0">
          <span className="admin-label">Button action</span>
          <select
            value={visibleCtaAction(cta.action)}
            onChange={(event) => onChange(patchCtaAction(cta, event.target.value as CtaAction, sections))}
            className="admin-input"
          >
            {actions.map((action) => <option key={action} value={action}>{humanize(action)}</option>)}
          </select>
        </label>
        <CtaActionExtras cta={cta} onChange={onChange} intents={intents} sections={sections} />
      </div>
      {showColors ? (
        <ButtonBackgroundPicker
          value={{
            backgroundType: cta.backgroundType,
            backgroundColor: cta.backgroundColor,
            backgroundGradient: cta.backgroundGradient,
          }}
          onChange={(next) =>
            onChange({
              ...cta,
              backgroundType: next.backgroundType as Cta["backgroundType"],
              backgroundColor: next.backgroundColor,
              backgroundGradient: next.backgroundGradient,
            })
          }
          textColor={cta.textColor}
          onTextColorChange={(textColor) => onChange({ ...cta, textColor })}
        />
      ) : null}
    </div>
  );
}

export function CtaBox({
  title,
  enabled,
  onEnabled,
  cta,
  onChange,
  intents,
  sections,
  singleRow = false,
}: {
  title: string;
  enabled?: boolean;
  onEnabled?: (value: boolean) => void;
  cta: Cta;
  onChange: (next: Cta) => void;
  intents: IntentOption[];
  sections?: SectionOption[];
  singleRow?: boolean;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[14px] font-medium text-[#0b1f35]">{title}</h2>
        {onEnabled ? <CompactToggle label="Show" checked={Boolean(enabled)} onChange={onEnabled} /> : null}
      </div>
      <CtaFields
        cta={cta}
        onChange={onChange}
        intents={intents}
        sections={sections}
        className={singleRow ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"}
      />
    </article>
  );
}
