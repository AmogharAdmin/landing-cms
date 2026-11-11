"use client";

import type { FloatingButton } from "@/types/site";
import {
  ButtonBackgroundPicker,
  CompactColorField,
  CompactToggle,
  type IntentOption,
  type PathPart,
} from "@/components/admin/editor-ui";
import { IconPicker } from "@/components/admin/IconPicker";
import { Icon } from "@/components/ui/Icon";
import { resolveButtonBackgroundStyle } from "@/lib/button-background";
import { useAdminCustomGradients } from "@/components/admin/AdminContentContext";
import { FONT_FAMILIES, FONT_WEIGHTS, floatingButtonLabelStyle } from "@/lib/typography";

const DEFAULT_FLOATING_BUTTON: FloatingButton = {
  enabled: true,
  label: "Enquire Now",
  icon: "file-text",
  intent: "default",
  backgroundColor: "#b98945",
  textColor: "#ffffff",
};

type FloatingButtonEditorProps = {
  value?: FloatingButton;
  onUpdate: (path: PathPart[], value: unknown) => void;
  intents: IntentOption[];
};

export function FloatingButtonEditor({
  value,
  onUpdate,
  intents,
}: FloatingButtonEditorProps) {
  const button = value ?? DEFAULT_FLOATING_BUTTON;
  const { customGradients } = useAdminCustomGradients();

  const patch = (partial: Partial<FloatingButton>) => {
    onUpdate(["floatingButton"], { ...DEFAULT_FLOATING_BUTTON, ...button, ...partial });
  };

  const fg = button.textColor || "#ffffff";
  const icon = button.icon || "file-text";
  const label = button.label || "Enquire Now";
  const labelStyle = floatingButtonLabelStyle(button);
  const bgStyle = resolveButtonBackgroundStyle(
    {
      backgroundType: button.backgroundType,
      backgroundColor: button.backgroundColor || "#b98945",
      backgroundGradient: button.backgroundGradient,
    },
    customGradients,
  );
  const iconColor =
    button.backgroundType === "gradient" ? "#b98945" : button.backgroundColor || "#b98945";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-medium text-[#0b1f35]">Floating Form Button</h2>
          <p className="text-[11px] text-slate-500">
            Floating action button displayed on the right side of the screen for instant lead enquiries.
          </p>
        </div>
        <CompactToggle
          label="Show button"
          checked={Boolean(button.enabled)}
          onChange={(checked) => patch({ enabled: checked })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="min-w-0">
          <span className="admin-label">Button text</span>
          <input
            value={button.label}
            onChange={(event) => patch({ label: event.target.value })}
            className="admin-input"
            placeholder="Enquire Now"
          />
        </label>

        <label className="min-w-0">
          <span className="admin-label">Which form to open</span>
          <select
            value={button.intent || "default"}
            onChange={(event) => patch({ intent: event.target.value })}
            className="admin-input"
          >
            {intents.length ? (
              intents.map((intent) => (
                <option key={intent.id} value={intent.id}>
                  {intent.name}
                </option>
              ))
            ) : (
              <option value="default">General enquiry</option>
            )}
          </select>
        </label>

        <div className="min-w-0">
          <IconPicker
            label="Form Icon"
            value={icon}
            onChange={(next) => patch({ icon: next })}
            color={iconColor}
          />
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <h3 className="text-[12px] font-semibold text-[#0b1f35]">Button background</h3>
        <div className="mt-3">
          <ButtonBackgroundPicker
            value={{
              backgroundType: button.backgroundType,
              backgroundColor: button.backgroundColor,
              backgroundGradient: button.backgroundGradient,
            }}
            onChange={(next) =>
              patch({
                backgroundType: next.backgroundType as FloatingButton["backgroundType"],
                backgroundColor: next.backgroundColor,
                backgroundGradient: next.backgroundGradient,
              })
            }
            showTextColor={false}
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <h3 className="text-[12px] font-semibold text-[#0b1f35]">Text styling</h3>
        <p className="mt-0.5 text-[11px] text-slate-500">Customize the vertical label color and font.</p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <CompactColorField
            label="Text color"
            value={button.textColor || "#ffffff"}
            onChange={(next) => patch({ textColor: next })}
          />

          <label className="min-w-0">
            <span className="admin-label">Font family</span>
            <select
              value={button.fontFamily || ""}
              onChange={(event) => patch({ fontFamily: event.target.value })}
              className="admin-input"
            >
              {FONT_FAMILIES.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="min-w-0">
            <span className="admin-label">Font size (px)</span>
            <input
              type="number"
              min={8}
              max={24}
              placeholder="Default (11)"
              value={button.fontSize ?? ""}
              onChange={(event) => {
                const raw = event.target.value;
                patch({ fontSize: raw.trim() === "" ? undefined : Number(raw) });
              }}
              className="admin-input"
            />
          </label>

          <label className="min-w-0">
            <span className="admin-label">Font weight</span>
            <select
              value={button.fontWeight ?? ""}
              onChange={(event) => {
                const raw = event.target.value;
                patch({ fontWeight: raw === "" ? undefined : Number(raw) });
              }}
              className="admin-input"
            >
              <option value="">Default (Extra bold)</option>
              {FONT_WEIGHTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <article className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <h3 className="text-[12px] font-semibold text-[#0b1f35]">Preview</h3>
        <p className="mt-0.5 text-[11px] text-slate-500">
          How this floating button appears attached on the right side of the screen:
        </p>

        <div className="mt-4 flex min-h-48 items-center justify-end rounded-xl border border-dashed border-slate-200 bg-slate-100/60 pr-0">
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-l-xl rounded-r-none border-y-2 border-l-2 border-white/90 px-2.5 py-4 font-bold shadow-[-4px_6px_25px_rgba(0,0,0,0.25)]"
            style={{ ...bgStyle, color: fg }}
          >
            <Icon name={icon} className="size-4 shrink-0" />
            <span
              className={`flex flex-col items-center font-extrabold uppercase leading-none select-none${labelStyle.fontSize ? "" : " text-[11px]"}`}
              style={labelStyle}
            >
              {label.split("").map((char, index) =>
                char === " " ? (
                  <span key={index} className="h-1.5" />
                ) : (
                  <span key={index} className="my-[1px]">
                    {char}
                  </span>
                ),
              )}
            </span>
          </div>
        </div>
      </article>
    </div>
  );
}
