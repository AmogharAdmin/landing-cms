"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, ICON_KEYWORDS, ICON_NAMES } from "@/components/ui/Icon";

type IconPickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Shown on the selected icon preview (and kept visible while browsing). */
  color?: string;
};

export function IconPicker({ label, value, onChange, color }: IconPickerProps) {
  const previewColor = color && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color.trim()) ? color.trim() : undefined;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return ICON_NAMES;
    return ICON_NAMES.filter(
      (name) => name.replace(/-/g, " ").includes(term) || name.includes(term) || (ICON_KEYWORDS[name] || "").includes(term),
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus());
    return () => {
      document.removeEventListener("mousedown", close);
      window.cancelAnimationFrame(frame);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <div ref={rootRef} className="block">
      <span className="admin-label">{label}</span>
      <button
        type="button"
        aria-label="Choose icon"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="admin-input mt-1.5 flex items-center justify-center text-[#0b1f35]"
        style={previewColor ? { color: previewColor } : undefined}
      >
        <Icon name={value} className="size-6" />
      </button>
      {open ? (
        <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${ICON_NAMES.length} icons (e.g. pool, gym, pet)`}
            className="admin-input mb-2"
            aria-label="Search icons"
          />
          <div className="grid max-h-56 grid-cols-6 gap-1.5 overflow-y-auto sm:grid-cols-8" role="listbox" aria-label="Icons">
            {matches.map((name) => {
              const selected = name === value;
              return (
                <button
                  key={name}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  title={name.replace(/-/g, " ")}
                  onClick={() => {
                    onChange(name);
                    setOpen(false);
                  }}
                  className={`flex size-10 items-center justify-center rounded-lg transition-colors ${selected ? "bg-[#0b1f35] text-white" : "text-[#0b1f35] hover:bg-slate-100"}`}
                >
                  <Icon name={name} className="size-5" />
                </button>
              );
            })}
          </div>
          {matches.length === 0 ? <p className="px-1 py-3 text-center text-[11px] text-slate-500">No icons match that search.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
