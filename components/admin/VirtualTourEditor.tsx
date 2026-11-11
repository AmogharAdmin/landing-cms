"use client";

import { Play } from "lucide-react";
import type { SiteData, VirtualTourSection } from "@/types/site";
import {
  CompactColorField,
  CompactToggle,
  StylePopup,
  type IntentOption,
  type PathPart,
} from "@/components/admin/editor-ui";
import { textStyle } from "@/lib/typography";

const DEFAULT_TOUR: VirtualTourSection = {
  enabled: true,
  label: "VIRTUAL TOUR",
  heading: "Virtual Site Visit",
  videoUrl: "",
  overlayColor: "#06192c",
  overlayOpacity: 0.7,
  blurAmount: 8,
  sectionHeight: 420,
  containerWidth: 70,
  textColor: "#ffffff",
  playIconEnabled: true,
  enquireIntent: "default",
};

type VirtualTourEditorProps = {
  value: SiteData["virtualTourSection"];
  onUpdate: (path: PathPart[], value: unknown) => void;
  intents: IntentOption[];
};

export function VirtualTourEditor({ value, onUpdate, intents }: VirtualTourEditorProps) {
  const tour = value ?? DEFAULT_TOUR;
  const record = tour as unknown as Record<string, unknown>;

  const patch = (key: keyof VirtualTourSection, next: unknown) => {
    if (!value) {
      onUpdate(["virtualTourSection"], { ...DEFAULT_TOUR, [key]: next });
      return;
    }
    onUpdate(["virtualTourSection", key], next);
  };

  const height = Math.min(520, Math.max(300, tour.sectionHeight ?? tour.minHeight ?? 420));
  const width = Math.min(100, Math.max(40, tour.containerWidth ?? 70));
  const showPlay = tour.playIconEnabled ?? tour.playButtonEnabled ?? true;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <CompactToggle label="Show section" checked={Boolean(tour.enabled)} onChange={(checked) => patch("enabled", checked)} />
        <CompactToggle label="Show play icon" checked={showPlay} onChange={(checked) => patch("playIconEnabled", checked)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="min-w-0">
          <span className="mb-1 flex items-center gap-1">
            <span className="admin-label">Section label</span>
            <StylePopup title="label" parent={record} fieldKey="label" parentPath={["virtualTourSection"]} onUpdate={onUpdate} />
          </span>
          <input value={tour.label || ""} onChange={(event) => patch("label", event.target.value)} className="admin-input" placeholder="VIRTUAL TOUR" />
        </label>
        <label className="min-w-0">
          <span className="mb-1 flex items-center gap-1">
            <span className="admin-label">Main heading</span>
            <StylePopup title="heading" parent={record} fieldKey="heading" parentPath={["virtualTourSection"]} onUpdate={onUpdate} />
          </span>
          <input value={tour.heading} onChange={(event) => patch("heading", event.target.value)} className="admin-input" />
        </label>
      </div>

      <label className="block max-w-md">
        <span className="admin-label">Lead form variant</span>
        <span className="mt-1 block text-[10px] leading-4 text-slate-500">Opened when visitors tap the play button.</span>
        <select
          value={tour.enquireIntent || "default"}
          onChange={(event) => patch("enquireIntent", event.target.value)}
          className="admin-input"
        >
          {intents.map((intent) => (
            <option key={intent.id} value={intent.id}>{intent.name}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="admin-label">YouTube video URL</span>
        <input
          value={tour.videoUrl}
          onChange={(event) => patch("videoUrl", event.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
          className="admin-input"
        />
        <p className="mt-1 text-[10px] text-slate-500">Used as the muted looping background inside the tour card.</p>
      </label>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <article className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <h2 className="mb-3 text-[14px] font-medium text-[#0b1f35]">Appearance</h2>
          <div className="grid grid-cols-2 gap-3">
            <CompactColorField label="Overlay color" value={tour.overlayColor || "#06192c"} onChange={(next) => patch("overlayColor", next)} />
            <CompactColorField label="Text color (default)" value={tour.textColor || "#ffffff"} onChange={(next) => patch("textColor", next)} />
            <CompactColorField
              label="Heading color"
              value={(record.headingColor as string) || ""}
              placeholder="Uses text color"
              onChange={(next) => onUpdate(["virtualTourSection", "headingColor"], next)}
            />
            <CompactColorField
              label="Label color"
              value={(record.labelColor as string) || ""}
              placeholder="Theme label"
              onChange={(next) => onUpdate(["virtualTourSection", "labelColor"], next)}
            />
            <CompactColorField
              label="Play icon color"
              value={tour.playIconColor || ""}
              placeholder="Uses text color"
              onChange={(next) => patch("playIconColor", next)}
            />
            <CompactColorField
              label="Play button fill"
              value={tour.playButtonColor || ""}
              placeholder="Frosted glass"
              onChange={(next) => patch("playButtonColor", next)}
            />
            <CompactColorField
              label="Play button border"
              value={tour.playButtonBorderColor || ""}
              placeholder="Soft white"
              onChange={(next) => patch("playButtonBorderColor", next)}
            />
            <label>
              <span className="admin-label">Overlay opacity</span>
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={tour.overlayOpacity}
                onChange={(event) => patch("overlayOpacity", Math.min(1, Math.max(0, Number(event.target.value) || 0)))}
                className="admin-input"
              />
            </label>
            <label>
              <span className="admin-label">Video blur (px)</span>
              <input
                type="number"
                min={0}
                max={30}
                value={tour.blurAmount}
                onChange={(event) => patch("blurAmount", Math.min(30, Math.max(0, Number(event.target.value) || 0)))}
                className="admin-input"
              />
            </label>
            <label>
              <span className="admin-label">Card height (px)</span>
              <input
                type="number"
                min={300}
                max={520}
                value={height}
                onChange={(event) => patch("sectionHeight", Math.min(520, Math.max(300, Number(event.target.value) || 420)))}
                className="admin-input"
              />
            </label>
            <label>
              <span className="admin-label">Card width (%)</span>
              <input
                type="number"
                min={40}
                max={100}
                value={width}
                onChange={(event) => patch("containerWidth", Math.min(100, Math.max(40, Number(event.target.value) || 70)))}
                className="admin-input"
              />
            </label>
          </div>
        </article>

        <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-[11px] font-medium text-slate-500">Live preview</p>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#b98945]" style={textStyle(tour, "label")}>{tour.label || "VIRTUAL TOUR"}</p>
            <div
              className="relative mt-3 flex items-center justify-center overflow-hidden rounded-2xl"
              style={{ minHeight: Math.min(280, height * 0.55), color: tour.textColor || "#ffffff" }}
            >
              <div className="absolute inset-0" style={{ backgroundColor: tour.overlayColor || "#06192c", opacity: tour.overlayOpacity ?? 0.7 }} />
              <div className="relative z-10 max-w-sm px-4 py-8 text-center">
                {showPlay ? (
                  <span
                    className={`mx-auto flex size-12 items-center justify-center rounded-full border ${tour.playButtonColor ? "" : "bg-white/15"} ${tour.playButtonBorderColor ? "" : "border-white/40"}`}
                    style={{
                      backgroundColor: tour.playButtonColor || undefined,
                      borderColor: tour.playButtonBorderColor || undefined,
                      color: tour.playIconColor || undefined,
                    }}
                  >
                    <Play className="ml-0.5 size-5 fill-current" />
                  </span>
                ) : null}
                <p
                  className={`${showPlay ? "mt-3" : ""} text-[22px] font-semibold leading-tight`}
                  style={textStyle(tour, "heading", { color: tour.textColor })}
                >
                  {tour.heading || "Virtual Site Visit"}
                </p>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-slate-400">Width {width}% · Height {height}px · Blur {tour.blurAmount}px</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
