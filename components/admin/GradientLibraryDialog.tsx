"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
import {
  BUTTON_GRADIENT_PRESETS,
  buildLinearGradientCss,
  customGradientKey,
  findButtonGradientPreset,
  listGradientCategories,
  type CustomButtonGradient,
} from "@/lib/button-background";

type GradientLibraryDialogProps = {
  open: boolean;
  selectedId?: string;
  customGradients: CustomButtonGradient[];
  onClose: () => void;
  onSelect: (gradientId: string) => void;
  onSaveCustom: (gradients: CustomButtonGradient[]) => void;
};

function ColorField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : "#B98945";
  return (
    <label className="min-w-0">
      <span className="admin-label">{label}</span>
      <div className="mt-1 flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2">
        <input
          type="color"
          value={hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex}
          onChange={(event) => onChange(event.target.value)}
          className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 border-0 bg-transparent text-[12px] outline-none"
          placeholder={placeholder || "#000000"}
        />
      </div>
    </label>
  );
}

function slugifyLabel(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "custom";
}

export function GradientLibraryDialog({
  open,
  selectedId,
  customGradients,
  onClose,
  onSelect,
  onSaveCustom,
}: GradientLibraryDialogProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [label, setLabel] = useState("My gradient");
  const [angle, setAngle] = useState(135);
  const [color1, setColor1] = useState("#B98945");
  const [color2, setColor2] = useState("#0B1F35");
  const [color3, setColor3] = useState("");
  const [error, setError] = useState("");

  const categories = useMemo(() => ["All", "Custom", ...listGradientCategories()], []);
  const previewCss = buildLinearGradientCss(angle, color1, color2, color3 || undefined);

  const filteredBuiltins = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BUTTON_GRADIENT_PRESETS.filter((preset) => {
      if (category !== "All" && category !== "Custom" && preset.category !== category) return false;
      if (category === "Custom") return false;
      if (!q) return true;
      return (
        preset.label.toLowerCase().includes(q) ||
        preset.description.toLowerCase().includes(q) ||
        (preset.category || "").toLowerCase().includes(q)
      );
    });
  }, [category, query]);

  const filteredCustoms = useMemo(() => {
    if (category !== "All" && category !== "Custom") return [];
    const q = query.trim().toLowerCase();
    return customGradients.filter((preset) => {
      if (!q) return true;
      return (
        preset.label.toLowerCase().includes(q) ||
        (preset.description || "").toLowerCase().includes(q)
      );
    });
  }, [category, customGradients, query]);

  if (!open) return null;

  const select = (id: string) => {
    onSelect(id);
    onClose();
  };

  const saveCustom = () => {
    const trimmed = label.trim();
    if (!trimmed) {
      setError("Give your gradient a name.");
      return;
    }
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color1) || !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color2)) {
      setError("Use valid hex colors for the gradient stops.");
      return;
    }
    if (color3 && !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color3)) {
      setError("Optional third color must be a valid hex code.");
      return;
    }

    const baseId = slugifyLabel(trimmed);
    let id = baseId;
    let n = 2;
    const existingIds = new Set(customGradients.map((item) => item.id));
    while (existingIds.has(id) || BUTTON_GRADIENT_PRESETS.some((preset) => preset.id === id)) {
      id = `${baseId}-${n}`;
      n += 1;
    }

    const next: CustomButtonGradient = {
      id,
      label: trimmed,
      description: "Saved custom gradient",
      css: previewCss,
      angle,
      color1,
      color2,
      color3: color3 || undefined,
    };
    const list = [...customGradients, next];
    onSaveCustom(list);
    setError("");
    select(customGradientKey(id));
  };

  const removeCustom = (id: string) => {
    onSaveCustom(customGradients.filter((item) => item.id !== id));
    if (selectedId === customGradientKey(id) || selectedId === id) {
      onSelect("golden");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/45 p-4 pt-10 sm:pt-16"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="mb-10 w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div>
            <h3 className="text-[15px] font-semibold text-[#0b1f35]">Gradient library</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {BUTTON_GRADIENT_PRESETS.length}+ built-in gradients plus your saved customs. Works for every button.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md hover:bg-slate-100"
            aria-label="Close gradient library"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
          <div className="space-y-3 border-b border-slate-200 p-4 sm:p-5 lg:border-b-0 lg:border-r">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="admin-input !mt-0 pl-8"
                  placeholder="Search gradients…"
                />
              </label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="admin-input !mt-0 sm:max-w-[160px]"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {filteredCustoms.length ? (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Custom saved</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {filteredCustoms.map((preset) => {
                    const id = customGradientKey(preset.id);
                    const active = selectedId === id || selectedId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        className={`overflow-hidden rounded-xl border ${
                          active ? "border-[#b98945] ring-2 ring-[#b98945]/35" : "border-slate-200"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => select(id)}
                          className="block w-full text-left"
                          title={preset.description || preset.label}
                        >
                          <span className="block h-10 w-full" style={{ backgroundImage: preset.css }} />
                          <span className="block px-2 py-1.5">
                            <span className="block truncate text-[11px] font-semibold text-[#0b1f35]">{preset.label}</span>
                            <span className="block text-[9px] text-slate-500">Custom</span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCustom(preset.id)}
                          className="flex w-full items-center justify-center gap-1 border-t border-slate-100 py-1.5 text-[10px] font-semibold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="size-3" /> Delete
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Built-in ({filteredBuiltins.length})
              </p>
              <div className="grid max-h-[min(52vh,420px)] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                {filteredBuiltins.map((preset) => {
                  const active = selectedId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => select(preset.id)}
                      className={`overflow-hidden rounded-xl border text-left transition-shadow ${
                        active ? "border-[#b98945] ring-2 ring-[#b98945]/35" : "border-slate-200 hover:border-[#b98945]/50"
                      }`}
                      title={preset.description}
                    >
                      <span className="block h-10 w-full" style={{ backgroundImage: preset.css }} />
                      <span className="block px-2 py-1.5">
                        <span className="block truncate text-[11px] font-semibold text-[#0b1f35]">{preset.label}</span>
                        <span className="block truncate text-[9px] text-slate-500">{preset.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {!filteredBuiltins.length && !filteredCustoms.length ? (
                <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-[12px] text-slate-500">
                  No gradients match your search.
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-3 p-4 sm:p-5">
            <div>
              <h4 className="text-[13px] font-semibold text-[#0b1f35]">Create custom gradient</h4>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Save it once and reuse it on any button across the site.
              </p>
            </div>

            <div
              className="h-16 rounded-xl border border-slate-200 shadow-inner"
              style={{ backgroundImage: previewCss }}
              aria-hidden
            />

            <label className="min-w-0">
              <span className="admin-label">Name</span>
              <input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                className="admin-input"
                placeholder="My gradient"
              />
            </label>

            <label className="min-w-0">
              <span className="admin-label">Angle ({angle}°)</span>
              <input
                type="range"
                min={0}
                max={360}
                value={angle}
                onChange={(event) => setAngle(Number(event.target.value))}
                className="mt-2 w-full"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <ColorField label="Color 1" value={color1} onChange={setColor1} />
              <ColorField label="Color 2" value={color2} onChange={setColor2} />
            </div>
            <ColorField
              label="Color 3 (optional)"
              value={color3}
              onChange={setColor3}
              placeholder="None"
            />

            {error ? <p className="text-[11px] text-red-600">{error}</p> : null}

            <button
              type="button"
              onClick={saveCustom}
              className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#0b1f35] px-4 text-[12px] font-semibold text-white hover:bg-[#173b60]"
            >
              <Plus className="size-3.5" />
              Save & use gradient
            </button>

            {selectedId ? (
              <p className="text-[10px] text-slate-500">
                Current selection:{" "}
                <span className="font-semibold text-[#0b1f35]">
                  {findButtonGradientPreset(selectedId, customGradients)?.label || selectedId}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
