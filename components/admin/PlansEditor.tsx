"use client";

import { ChangeEvent, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, LoaderCircle, LockKeyhole, Pencil, Plus, Trash2, X } from "lucide-react";
import type { PlanCard, PlansSection, SiteData } from "@/types/site";
import {
  CompactColorField,
  CompactToggle,
  CtaBox,
  StylePopup,
  type IntentOption,
  type PathPart,
} from "@/components/admin/editor-ui";
import { resolveButtonBackgroundStyle } from "@/lib/button-background";
import { useAdminCustomGradients } from "@/components/admin/AdminContentContext";
import { uploadFileAsset } from "@/lib/client/upload";

const DEFAULT_PLANS: PlansSection = {
  enabled: true,
  label: "Project Plan",
  heading: "Master plan",
  backgroundColor: "#071d31",
  textColor: "#ffffff",
  isLocked: false,
  blurAmount: 8,
  cards: [],
};

const DEFAULT_CARD: PlanCard = {
  enabled: true,
  image: "/images/floor-plan.webp",
  imageAlt: "Plan image",
  textEnabled: true,
  title: "New plan",
  buttonEnabled: true,
  button: { label: "Request Plan", action: "enquire" },
  overlayColor: "#071d31",
  buttonColor: "#b98945",
  buttonTextColor: "#ffffff",
  isLocked: false,
  blurAmount: 8,
};

type PlansEditorProps = {
  value: SiteData["plansSection"];
  onUpdate: (path: PathPart[], value: unknown) => void;
  intents: IntentOption[];
  uploadEnabled: boolean;
  uploadEndpoint: string;
};

export function PlansEditor({
  value,
  onUpdate,
  intents,
  uploadEnabled,
  uploadEndpoint,
}: PlansEditorProps) {
  const section = value ?? DEFAULT_PLANS;
  const record = section as unknown as Record<string, unknown>;
  const cards = section.cards || [];
  const [editing, setEditing] = useState<number | null>(null);
  const { customGradients } = useAdminCustomGradients();

  const ensureSection = (patch: Partial<PlansSection>) => {
    if (!value) onUpdate(["plansSection"], { ...DEFAULT_PLANS, ...patch });
  };

  const patch = (key: keyof PlansSection, next: unknown) => {
    if (!value) {
      onUpdate(["plansSection"], { ...DEFAULT_PLANS, [key]: next });
      return;
    }
    onUpdate(["plansSection", key], next);
  };

  const saveCard = (index: number, next: PlanCard) => {
    if (!value) {
      const nextCards = [...cards];
      nextCards[index] = next;
      onUpdate(["plansSection"], { ...DEFAULT_PLANS, cards: nextCards });
      return;
    }
    onUpdate(["plansSection", "cards", index], next);
  };

  const moveCard = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= cards.length) return;
    const next = [...cards];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    patch("cards", next);
  };

  const addCard = () => {
    const next = [...cards, { ...DEFAULT_CARD, title: `Plan ${cards.length + 1}` }];
    patch("cards", next);
    setEditing(next.length - 1);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <CompactToggle label="Show section" checked={Boolean(section.enabled)} onChange={(checked) => patch("enabled", checked)} />
        <CompactToggle label="Lock & blur cards" checked={Boolean(section.isLocked)} onChange={(checked) => patch("isLocked", checked)} />
        {section.isLocked ? (
          <label className="flex items-center gap-1.5 text-[12px] font-medium text-slate-700">
            <span className="admin-label text-[11px]">Blur strength</span>
            <input
              type="number"
              min={0}
              max={30}
              value={section.blurAmount ?? 8}
              onChange={(event) => patch("blurAmount", Number(event.target.value))}
              className="admin-input !h-8 !w-20 text-center"
            />
          </label>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="min-w-0">
          <span className="mb-1 flex items-center gap-1">
            <span className="admin-label">Section label</span>
            <StylePopup title="label" parent={record} fieldKey="label" parentPath={["plansSection"]} onUpdate={(path, next) => {
              ensureSection({});
              onUpdate(path, next);
            }} />
          </span>
          <input value={section.label} onChange={(event) => patch("label", event.target.value)} className="admin-input" />
        </label>
        <label className="min-w-0">
          <span className="mb-1 flex items-center gap-1">
            <span className="admin-label">Main heading</span>
            <StylePopup title="heading" parent={record} fieldKey="heading" parentPath={["plansSection"]} onUpdate={(path, next) => {
              ensureSection({});
              onUpdate(path, next);
            }} />
          </span>
          <input value={section.heading} onChange={(event) => patch("heading", event.target.value)} className="admin-input" />
        </label>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
        <CompactColorField label="Section background" value={section.backgroundColor || "#071d31"} onChange={(next) => patch("backgroundColor", next)} />
        <CompactColorField label="Section text color" value={section.textColor || "#ffffff"} onChange={(next) => patch("textColor", next)} />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-medium text-[#0b1f35]">Plan cards</h2>
            <p className="text-[11px] text-slate-500">{cards.length} card{cards.length === 1 ? "" : "s"} · Master Plan / Floor Plans style tiles.</p>
          </div>
          <button type="button" onClick={addCard} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#b98945] px-3 text-[11px] font-semibold text-white hover:bg-[#a57738]">
            <Plus className="size-3.5" /> Add card
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {cards.map((card, index) => (
            <article key={`${card.title}-${index}`} className={`overflow-hidden rounded-xl border bg-white ${card.enabled ? "border-slate-200" : "border-slate-200 opacity-60"}`}>
              <div className="relative aspect-[16/10] bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.image}
                  alt={card.imageAlt || ""}
                  className="size-full object-contain p-3"
                  style={card.isLocked || section.isLocked ? { filter: `blur(${card.blurAmount ?? section.blurAmount ?? 8}px)` } : undefined}
                />
                {card.isLocked || section.isLocked ? (
                  <div className="absolute inset-0 flex items-center justify-center pb-12">
                    <span className="flex size-10 items-center justify-center rounded-full border border-white/80 bg-[#071d31]/85 text-white shadow">
                      <LockKeyhole className="size-5" />
                    </span>
                  </div>
                ) : null}
                {(card.textEnabled || card.buttonEnabled) ? (
                  <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-white" style={{ backgroundColor: card.overlayColor || "#071d31" }}>
                    {card.textEnabled ? <p className="truncate text-[13px] font-semibold">{card.title || "Untitled"}</p> : <span />}
                    {card.buttonEnabled ? (
                      <span
                        className="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold"
                        style={{
                          ...resolveButtonBackgroundStyle(
                            {
                              backgroundType: card.button.backgroundType,
                              backgroundColor: card.button.backgroundColor || card.buttonColor,
                              backgroundGradient: card.button.backgroundGradient,
                            },
                            customGradients,
                          ),
                          color: card.button.textColor || card.buttonTextColor,
                        }}
                      >
                        {card.button.label || "Button"}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-[#0b1f35]">{card.title || "Untitled card"}</p>
                  <p className="text-[10px] text-slate-500">{card.enabled ? "Visible" : "Hidden"} · {card.buttonEnabled ? card.button.label : "No button"}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setEditing(index)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-700 hover:border-[#b98945]">
                    <Pencil className="size-3.5" /> Edit
                  </button>
                  <button type="button" onClick={() => moveCard(index, -1)} disabled={index === 0} className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-white disabled:opacity-25" aria-label="Move up">
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => moveCard(index, 1)} disabled={index === cards.length - 1} className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-white disabled:opacity-25" aria-label="Move down">
                    <ArrowDown className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      patch("cards", cards.filter((_, itemIndex) => itemIndex !== index));
                      if (editing === index) setEditing(null);
                    }}
                    className="inline-flex size-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                    aria-label="Delete card"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
          {!cards.length ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-[12px] text-slate-500 lg:col-span-2">
              No plan cards yet. Click Add card.
            </p>
          ) : null}
        </div>
      </section>

      {editing !== null && cards[editing] ? (
        <CardEditModal
          card={cards[editing]}
          index={editing}
          intents={intents}
          uploadEnabled={uploadEnabled}
          uploadEndpoint={uploadEndpoint}
          onClose={() => setEditing(null)}
          onChange={(next) => saveCard(editing, next)}
          onUpdate={onUpdate}
          onDelete={() => {
            patch("cards", cards.filter((_, itemIndex) => itemIndex !== editing));
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}

function CardEditModal({
  card,
  index,
  intents,
  uploadEnabled,
  uploadEndpoint,
  onClose,
  onChange,
  onUpdate,
  onDelete,
}: {
  card: PlanCard;
  index: number;
  intents: IntentOption[];
  uploadEnabled: boolean;
  uploadEndpoint: string;
  onClose: () => void;
  onChange: (next: PlanCard) => void;
  onUpdate: (path: PathPart[], value: unknown) => void;
  onDelete: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const record = card as unknown as Record<string, unknown>;

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const publicPath = await uploadFileAsset(file, uploadEndpoint);
      onChange({ ...card, image: publicPath });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-14" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="mb-10 w-full max-w-3xl rounded-2xl bg-white p-4 shadow-2xl sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-[#0b1f35]">Edit plan card</h3>
            <p className="text-[11px] text-slate-500">Left = content & button · Right = image & colors</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex size-8 items-center justify-center rounded-md hover:bg-slate-100" aria-label="Close"><X className="size-4" /></button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <CompactToggle label="Show card" checked={card.enabled} onChange={(checked) => onChange({ ...card, enabled: checked })} />
          <CompactToggle label="Show title" checked={card.textEnabled} onChange={(checked) => onChange({ ...card, textEnabled: checked })} />
          <CompactToggle label="Show button" checked={card.buttonEnabled} onChange={(checked) => onChange({ ...card, buttonEnabled: checked })} />
          <CompactToggle label="Lock & Blur" checked={Boolean(card.isLocked)} onChange={(checked) => onChange({ ...card, isLocked: checked })} />
          {card.isLocked ? (
            <label className="flex items-center gap-1 text-[12px] font-medium text-slate-700">
              <span className="admin-label text-[11px]">Blur</span>
              <input
                type="number"
                min={0}
                max={30}
                value={card.blurAmount ?? 8}
                onChange={(event) => onChange({ ...card, blurAmount: Number(event.target.value) })}
                className="admin-input !h-8 !w-16 text-center"
              />
            </label>
          ) : null}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <label>
              <span className="mb-1 flex items-center gap-1">
                <span className="admin-label">Title</span>
                <StylePopup title="title" parent={record} fieldKey="title" parentPath={["plansSection", "cards", index]} onUpdate={onUpdate} />
              </span>
              <input value={card.title} onChange={(event) => onChange({ ...card, title: event.target.value })} className="admin-input" />
            </label>
            <CtaBox
              title="Card button"
              cta={card.button}
              onChange={(button) =>
                onChange({
                  ...card,
                  button,
                  buttonColor: button.backgroundColor || card.buttonColor,
                  buttonTextColor: button.textColor || card.buttonTextColor,
                })
              }
              intents={intents}
              singleRow
            />
            <CompactColorField label="Overlay" value={card.overlayColor} onChange={(overlayColor) => onChange({ ...card, overlayColor })} />
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.image}
                alt=""
                className="h-44 w-full rounded-xl border border-slate-200 bg-white object-contain p-2"
                style={card.isLocked ? { filter: `blur(${card.blurAmount ?? 8}px)` } : undefined}
              />
              {card.isLocked ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex size-10 items-center justify-center rounded-full border border-white/80 bg-[#071d31]/85 text-white shadow">
                    <LockKeyhole className="size-5" />
                  </span>
                </div>
              ) : null}
            </div>
            <label>
              <span className="admin-label">Image path / URL</span>
              <input value={card.image} onChange={(event) => onChange({ ...card, image: event.target.value })} className="admin-input" />
            </label>
            {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <label className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold ${uploadEnabled ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed opacity-50"}`}>
                {uploading ? <LoaderCircle className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />} Upload
                <input type="file" accept="image/*" disabled={!uploadEnabled || uploading} className="hidden" onChange={upload} />
              </label>
            </div>
            <label>
              <span className="admin-label">Image description</span>
              <input value={card.imageAlt} onChange={(event) => onChange({ ...card, imageAlt: event.target.value })} className="admin-input" />
            </label>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button type="button" onClick={onDelete} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-red-600 hover:bg-red-50">
            <Trash2 className="size-3.5" /> Delete
          </button>
          <button type="button" onClick={onClose} className="inline-flex min-h-9 items-center rounded-lg bg-[#0b1f35] px-4 text-[12px] font-semibold text-white">Done</button>
        </div>
      </div>
    </div>
  );
}
