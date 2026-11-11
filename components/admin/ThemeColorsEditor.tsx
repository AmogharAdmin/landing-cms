"use client";

import { useState } from "react";
import type { Theme } from "@/types/site";
import {
  findButtonGradientPreset,
  type ButtonBackgroundType,
} from "@/lib/button-background";
import { isThemeFillKey, type ThemeFillKey } from "@/lib/theme";
import { humanize, type PathPart } from "@/components/admin/editor-ui";
import { GradientLibraryDialog } from "@/components/admin/GradientLibraryDialog";
import { useAdminCustomGradients } from "@/components/admin/AdminContentContext";

const THEME_FIELD_ORDER: Array<keyof Theme> = [
  "primary",
  "secondary",
  "accent",
  "button",
  "buttonText",
  "primaryButton",
  "primaryButtonText",
  "secondaryButton",
  "secondaryButtonText",
  "background",
  "lightBackground",
  "darkSection",
  "cardBackground",
  "text",
  "mutedText",
  "titleColor",
  "descriptionColor",
  "whatsapp",
  "borderColor",
];

const THEME_FIELD_LABELS: Partial<Record<keyof Theme, string>> = {
  button: "Button settings",
  buttonText: "Button text",
  primaryButton: "Primary button",
  primaryButtonText: "Primary button text",
  secondaryButton: "Secondary button",
  secondaryButtonText: "Secondary button text",
  lightBackground: "Light background",
  darkSection: "Dark section",
  cardBackground: "Card background",
  mutedText: "Muted text",
  titleColor: "Title color",
  descriptionColor: "Description color",
  borderColor: "Border color",
};

type ThemeColorsEditorProps = {
  value: Theme;
  onUpdate: (path: PathPart[], value: unknown) => void;
};

export function ThemeColorsEditor({ value, onUpdate }: ThemeColorsEditorProps) {
  const patch = <K extends keyof Theme>(key: K, next: Theme[K]) => {
    onUpdate(["theme", key], next);
  };

  const setGradient = (key: ThemeFillKey, gradientId: string | undefined) => {
    const next = { ...(value.gradients || {}) };
    if (gradientId) next[key] = gradientId;
    else delete next[key];
    onUpdate(["theme", "gradients"], next);
  };

  return (
    <div className="space-y-4">
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-[12px] leading-5 text-slate-600">
        These are the site-wide default colors. Fill colors (buttons, accents, backgrounds) can use a{" "}
        <span className="font-medium text-[#0b1f35]">plain</span> hex or a{" "}
        <span className="font-medium text-[#0b1f35]">gradient</span> from the shared library.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {THEME_FIELD_ORDER.map((key) => {
          if (key === "gradients") return null;
          const label = THEME_FIELD_LABELS[key] || humanize(String(key));
          if (isThemeFillKey(key)) {
            return (
              <ThemeFillField
                key={key}
                label={label}
                color={String(value[key] || "")}
                gradientId={value.gradients?.[key]}
                onColorChange={(next) => patch(key, next as Theme[typeof key])}
                onGradientChange={(next) => setGradient(key, next)}
              />
            );
          }
          return (
            <SolidColorField
              key={key}
              label={label}
              value={String(value[key] || "")}
              onChange={(next) => patch(key, next as Theme[typeof key])}
            />
          );
        })}
      </div>
    </div>
  );
}

function SolidColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000";
  return (
    <label className="block min-w-0">
      <span className="admin-label">{label}</span>
      <span className="mt-1.5 flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 focus-within:border-[#b98945]">
        <input
          type="color"
          value={hex}
          onChange={(event) => onChange(event.target.value)}
          className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 text-[12px] uppercase outline-none"
        />
      </span>
    </label>
  );
}

function ThemeFillField({
  label,
  color,
  gradientId,
  onColorChange,
  onGradientChange,
}: {
  label: string;
  color: string;
  gradientId?: string;
  onColorChange: (next: string) => void;
  onGradientChange: (next: string | undefined) => void;
}) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const { customGradients, setCustomGradients } = useAdminCustomGradients();
  const type: ButtonBackgroundType = gradientId ? "gradient" : "plain";
  const selected = gradientId ? findButtonGradientPreset(gradientId, customGradients) : undefined;
  const hex = /^#[0-9a-f]{6}$/i.test(color) ? color : "#000000";

  return (
    <div className="min-w-0 space-y-2 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="admin-label !mb-0">{label}</span>
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {([
            { id: "plain" as const, label: "Plain" },
            { id: "gradient" as const, label: "Gradient" },
          ]).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                if (option.id === "plain") {
                  onGradientChange(undefined);
                  return;
                }
                if (!gradientId) onGradientChange("golden");
                setLibraryOpen(true);
              }}
              className={`min-h-7 rounded-md px-2.5 text-[11px] font-semibold transition-colors ${
                type === option.id ? "bg-[#0b1f35] text-white" : "text-slate-600 hover:bg-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {type === "plain" ? (
        <span className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 focus-within:border-[#b98945]">
          <input
            type="color"
            value={hex}
            onChange={(event) => onColorChange(event.target.value)}
            className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
          />
          <input
            value={color}
            onChange={(event) => onColorChange(event.target.value)}
            className="min-w-0 flex-1 text-[12px] uppercase outline-none"
          />
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setLibraryOpen(true)}
          className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2 text-left transition hover:border-[#b98945]/60"
        >
          <span
            className="size-9 shrink-0 rounded-md border border-slate-200 shadow-sm"
            style={{ backgroundImage: selected?.css || "linear-gradient(135deg, #E8C47A, #B98945)" }}
            aria-hidden
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-semibold text-[#0b1f35]">
              {selected?.label || "Choose gradient"}
            </span>
            <span className="block truncate text-[10px] text-slate-500">
              {selected?.description || "Open library to pick or create"}
            </span>
          </span>
          <span className="text-[10px] font-semibold text-[#9b6d30]">Change</span>
        </button>
      )}

      <GradientLibraryDialog
        open={libraryOpen}
        selectedId={gradientId}
        customGradients={customGradients}
        onClose={() => setLibraryOpen(false)}
        onSelect={(id) => onGradientChange(id)}
        onSaveCustom={setCustomGradients}
      />
    </div>
  );
}
