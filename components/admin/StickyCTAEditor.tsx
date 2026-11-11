"use client";

import type { SiteData } from "@/types/site";
import {
  ButtonBackgroundPicker,
  CompactToggle,
  StylePopup,
  type IntentOption,
  type PathPart,
} from "@/components/admin/editor-ui";
import { textStyle } from "@/lib/typography";

type StickyCTAEditorProps = {
  value: SiteData["stickyCTA"];
  onUpdate: (path: PathPart[], value: unknown) => void;
  intents: IntentOption[];
};

export function StickyCTAEditor({ value, onUpdate, intents }: StickyCTAEditorProps) {
  const patch = (partial: Partial<SiteData["stickyCTA"]>) => {
    onUpdate(["stickyCTA"], { ...value, ...partial });
  };

  const record = value as unknown as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-medium text-[#0b1f35]">Sticky bottom bar</h2>
          <p className="text-[11px] text-slate-500">
            Fixed enquire + WhatsApp buttons shown at the bottom of the landing page.
          </p>
        </div>
        <CompactToggle
          label="Show sticky bar"
          checked={Boolean(value.enabled)}
          onChange={(checked) => patch({ enabled: checked })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="min-w-0 sm:col-span-2">
          <span className="mb-1 flex items-center gap-1">
            <span className="admin-label">Message</span>
            <StylePopup title="message" parent={record} fieldKey="message" parentPath={["stickyCTA"]} onUpdate={onUpdate} />
          </span>
          <input
            value={value.message}
            onChange={(event) => patch({ message: event.target.value })}
            className="admin-input"
            style={textStyle(value, "message")}
          />
        </label>

        <label className="min-w-0">
          <span className="admin-label">Enquire button label</span>
          <input
            value={value.enquireLabel}
            onChange={(event) => patch({ enquireLabel: event.target.value })}
            className="admin-input"
          />
        </label>

        <label className="min-w-0">
          <span className="admin-label">Which form</span>
          <select
            value={value.enquireIntent || "default"}
            onChange={(event) => patch({ enquireIntent: event.target.value })}
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

        <label className="min-w-0 sm:col-span-2">
          <span className="admin-label">WhatsApp button label</span>
          <input
            value={value.whatsappLabel}
            onChange={(event) => patch({ whatsappLabel: event.target.value })}
            className="admin-input"
          />
          <span className="mt-1 block text-[10px] text-slate-500">
            Prefill chat text is set under Brand & Contact → WhatsApp message text.
          </span>
        </label>
      </div>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <h3 className="text-[13px] font-semibold text-[#0b1f35]">Enquire button colors</h3>
        <ButtonBackgroundPicker
          value={{
            backgroundType: value.enquireButtonBackgroundType,
            backgroundColor: value.enquireButtonColor,
            backgroundGradient: value.enquireButtonGradient,
          }}
          onChange={(next) =>
            patch({
              enquireButtonBackgroundType: (next.backgroundType as "plain" | "gradient") || "plain",
              enquireButtonColor: next.backgroundColor,
              enquireButtonGradient: next.backgroundGradient,
            })
          }
          textColor={value.enquireButtonTextColor || ""}
          onTextColorChange={(enquireButtonTextColor) => patch({ enquireButtonTextColor })}
          plainLabel="Enquire button bg"
        />
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <h3 className="text-[13px] font-semibold text-[#0b1f35]">WhatsApp button colors</h3>
        <ButtonBackgroundPicker
          value={{
            backgroundType: value.whatsappButtonBackgroundType,
            backgroundColor: value.whatsappButtonColor,
            backgroundGradient: value.whatsappButtonGradient,
          }}
          onChange={(next) =>
            patch({
              whatsappButtonBackgroundType: (next.backgroundType as "plain" | "gradient") || "plain",
              whatsappButtonColor: next.backgroundColor,
              whatsappButtonGradient: next.backgroundGradient,
            })
          }
          textColor={value.whatsappButtonTextColor || ""}
          onTextColorChange={(whatsappButtonTextColor) => patch({ whatsappButtonTextColor })}
          plainLabel="WhatsApp button bg"
        />
      </section>
    </div>
  );
}
