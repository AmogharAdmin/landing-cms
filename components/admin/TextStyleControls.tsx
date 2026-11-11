"use client";

import { useEffect, useState } from "react";
import { FONT_FAMILIES, FONT_WEIGHTS } from "@/lib/typography";

type PathPart = string | number;

type TextStyleControlsProps = {
  fieldKey: string;
  parent: Record<string, unknown> | null;
  parentPath: PathPart[];
  onUpdate: (path: PathPart[], value: unknown) => void;
};

function FontSizeField({
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

export function TextStyleControls({ fieldKey, parent, parentPath, onUpdate }: TextStyleControlsProps) {
  if (!parent) return null;
  const sizeKey = `${fieldKey}FontSize`;
  const weightKey = `${fieldKey}FontWeight`;
  const familyKey = `${fieldKey}FontFamily`;
  const letterSpacingKey = `${fieldKey}LetterSpacing`;
  const wordSpacingKey = `${fieldKey}WordSpacing`;
  const colorKey = `${fieldKey}Color`;
  const size = parent[sizeKey];
  const weight = parent[weightKey];
  const family = typeof parent[familyKey] === "string" ? String(parent[familyKey]) : "";
  const rawLetter = parent[letterSpacingKey];
  const letterSpacing =
    typeof rawLetter === "number" && Number.isFinite(rawLetter) ? rawLetter : Number(rawLetter);
  const hasLetterSpacing = Number.isFinite(letterSpacing) && letterSpacing >= -0.1;
  const rawWord = parent[wordSpacingKey];
  const wordSpacing =
    typeof rawWord === "number" && Number.isFinite(rawWord) ? rawWord : Number(rawWord);
  const hasWordSpacing = Number.isFinite(wordSpacing) && wordSpacing >= -0.2;
  const color = typeof parent[colorKey] === "string" ? String(parent[colorKey]) : "";
  const hex = /^#[0-9a-f]{6}$/i.test(color) ? color : "#0B1F35";

  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      <label className="col-span-2">
        <span className="admin-label">Font family</span>
        <select
          value={family}
          onChange={(event) => onUpdate([...parentPath, familyKey], event.target.value || undefined)}
          className="admin-input"
        >
          {FONT_FAMILIES.map((option) => (
            <option key={option.label} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <FontSizeField
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
          {FONT_WEIGHTS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="admin-label">Letter spacing (em)</span>
        <input
          type="number"
          min={-0.1}
          max={0.5}
          step={0.01}
          placeholder="Default"
          value={hasLetterSpacing ? String(letterSpacing) : ""}
          onChange={(event) => {
            const raw = event.target.value;
            if (raw.trim() === "") {
              onUpdate([...parentPath, letterSpacingKey], undefined);
              return;
            }
            const parsed = Number(raw);
            if (Number.isFinite(parsed)) {
              onUpdate([...parentPath, letterSpacingKey], Math.round(parsed * 100) / 100);
            }
          }}
          className="admin-input"
        />
      </label>
      <label>
        <span className="admin-label">Word spacing (em)</span>
        <input
          type="number"
          min={-0.2}
          max={1}
          step={0.01}
          placeholder="Default"
          value={hasWordSpacing ? String(wordSpacing) : ""}
          onChange={(event) => {
            const raw = event.target.value;
            if (raw.trim() === "") {
              onUpdate([...parentPath, wordSpacingKey], undefined);
              return;
            }
            const parsed = Number(raw);
            if (Number.isFinite(parsed)) {
              onUpdate([...parentPath, wordSpacingKey], Math.round(parsed * 100) / 100);
            }
          }}
          className="admin-input"
        />
      </label>
      <label className="col-span-2">
        <span className="admin-label">Text color</span>
        <span className="mt-1.5 flex h-10 w-full max-w-[14rem] items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 focus-within:border-[#b98945]">
          <input type="color" value={hex} onChange={(event) => onUpdate([...parentPath, colorKey], event.target.value)} className="size-6 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0" />
          <input value={color} onChange={(event) => onUpdate([...parentPath, colorKey], event.target.value)} placeholder="#0B1F35" className="min-w-0 flex-1 text-[12px] uppercase outline-none" />
        </span>
      </label>
    </div>
  );
}
