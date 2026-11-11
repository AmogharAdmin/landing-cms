"use client";

import { ChangeEvent, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import type { GalleryImage, SiteData } from "@/types/site";
import {
  CompactToggle,
  CtaFields,
  StylePopup,
  type IntentOption,
  type PathPart,
} from "@/components/admin/editor-ui";
import { uploadFileAsset } from "@/lib/client/upload";

type GalleryEditorProps = {
  value: SiteData["gallery"];
  onUpdate: (path: PathPart[], value: unknown) => void;
  intents: IntentOption[];
  uploadEnabled: boolean;
  uploadEndpoint: string;
};

export function GalleryEditor({
  value,
  onUpdate,
  intents,
  uploadEnabled,
  uploadEndpoint,
}: GalleryEditorProps) {
  const record = value as unknown as Record<string, unknown>;
  const images = value.images || [];
  const [editing, setEditing] = useState<number | null>(null);
  const columns = value.columnsPerRow ?? 5;
  const carouselEnabled = value.carouselEnabled !== false;
  const cta = value.cta;

  const saveImage = (index: number, next: GalleryImage) => {
    onUpdate(["gallery", "images", index], next);
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= images.length) return;
    const next = [...images];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onUpdate(["gallery", "images"], next);
  };

  const addImage = () => {
    const next: GalleryImage = {
      src: "/images/image-1.webp",
      alt: "New gallery image",
      size: "medium",
    };
    onUpdate(["gallery", "images"], [...images, next]);
    setEditing(images.length);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="min-w-0">
          <span className="mb-1 flex items-center gap-1">
            <span className="admin-label">Section label</span>
            <StylePopup title="label" parent={record} fieldKey="label" parentPath={["gallery"]} onUpdate={onUpdate} />
          </span>
          <input value={value.label} onChange={(event) => onUpdate(["gallery", "label"], event.target.value)} className="admin-input" />
        </label>
        <label className="min-w-0">
          <span className="mb-1 flex items-center gap-1">
            <span className="admin-label">Main heading</span>
            <StylePopup title="heading" parent={record} fieldKey="heading" parentPath={["gallery"]} onUpdate={onUpdate} />
          </span>
          <input value={value.heading} onChange={(event) => onUpdate(["gallery", "heading"], event.target.value)} className="admin-input" />
        </label>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
        <label className="min-w-[9rem]">
          <span className="admin-label">Images per view</span>
          <select
            value={columns}
            onChange={(event) => onUpdate(["gallery", "columnsPerRow"], Number(event.target.value))}
            className="admin-input"
          >
            {[2, 3, 4, 5, 6].map((count) => (
              <option key={count} value={count}>{count} images</option>
            ))}
          </select>
        </label>
        <CompactToggle
          label="Enable carousel"
          checked={carouselEnabled}
          onChange={(checked) => onUpdate(["gallery", "carouselEnabled"], checked)}
        />
        {carouselEnabled ? (
          <label className="min-w-[8.5rem]">
            <span className="admin-label">Scroll timing</span>
            <div className="relative mt-1.5 flex items-center">
              <input
                type="number"
                min={1}
                max={30}
                step={0.5}
                value={value.scrollTiming ?? 3}
                onChange={(event) =>
                  onUpdate(
                    ["gallery", "scrollTiming"],
                    Math.max(1, Number(event.target.value) || 3)
                  )
                }
                className="admin-input !mt-0 pr-10"
              />
              <span className="pointer-events-none absolute right-3 text-[12px] font-medium text-slate-400">
                sec
              </span>
            </div>
          </label>
        ) : null}
        <p className="max-w-sm text-[11px] leading-4 text-slate-500">
          {carouselEnabled
            ? `Carousel displays exactly ${columns} images centered with auto-scrolling every ${value.scrollTiming ?? 3}s.`
            : `Images wrap into a ${columns}-column grid without scrolling.`}
        </p>
      </div>

      <article className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <h2 className="mb-3 text-[14px] font-medium text-[#0b1f35]">Gallery button</h2>
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="min-w-0">
            <span className="admin-label">Line 1</span>
            <input value={cta.line1} onChange={(event) => onUpdate(["gallery", "cta", "line1"], event.target.value)} className="admin-input" />
          </label>
          <label className="min-w-0">
            <span className="admin-label">Line 2</span>
            <input value={cta.line2} onChange={(event) => onUpdate(["gallery", "cta", "line2"], event.target.value)} className="admin-input" />
          </label>
          <label className="min-w-0">
            <span className="admin-label">Line 3</span>
            <input value={cta.line3} onChange={(event) => onUpdate(["gallery", "cta", "line3"], event.target.value)} className="admin-input" />
          </label>
        </div>
        <CtaFields
          cta={cta}
          onChange={(next) => onUpdate(["gallery", "cta"], { ...cta, ...next })}
          intents={intents}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
        />
      </article>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-medium text-[#0b1f35]">Gallery images</h2>
            <p className="text-[11px] text-slate-500">{images.length} image{images.length === 1 ? "" : "s"} · {carouselEnabled ? `shown in a ${columns}-item carousel with scrolling` : `shown in a ${columns}-column grid`}.</p>
          </div>
          <button type="button" onClick={addImage} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#b98945] px-3 text-[11px] font-semibold text-white hover:bg-[#a57738]">
            <Plus className="size-3.5" /> Add image
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {images.map((image, index) => (
            <article key={`${image.src}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="relative aspect-[4/3] bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.src} alt={image.alt || ""} className="size-full object-cover" />
              </div>
              <div className="space-y-2 p-3">
                <p className="truncate text-[12px] font-medium text-[#0b1f35]">{image.alt || "Untitled image"}</p>
                <p className="truncate text-[10px] text-slate-400">{image.size} · {image.src}</p>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setEditing(index)} className="inline-flex min-h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2 text-[11px] font-medium text-slate-700 hover:border-[#b98945]">
                    <Pencil className="size-3.5" /> Edit
                  </button>
                  <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 disabled:opacity-25" aria-label="Move left">
                    <ArrowUp className="size-3.5 rotate-[-90deg]" />
                  </button>
                  <button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 disabled:opacity-25" aria-label="Move right">
                    <ArrowDown className="size-3.5 rotate-[-90deg]" />
                  </button>
                  <button type="button" onClick={() => onUpdate(["gallery", "images"], images.filter((_, itemIndex) => itemIndex !== index))} className="inline-flex size-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50" aria-label="Delete image">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
          {!images.length ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-[12px] text-slate-500 sm:col-span-2 md:col-span-3 xl:col-span-4">
              No gallery images yet. Click Add image.
            </p>
          ) : null}
        </div>
      </section>

      {editing !== null && images[editing] ? (
        <ImageEditModal
          image={images[editing]}
          uploadEnabled={uploadEnabled}
          uploadEndpoint={uploadEndpoint}
          onClose={() => setEditing(null)}
          onChange={(next) => saveImage(editing, next)}
          onDelete={() => {
            onUpdate(["gallery", "images"], images.filter((_, itemIndex) => itemIndex !== editing));
            setEditing(null);
          }}
          onUploadPath={(path) => saveImage(editing, { ...images[editing], src: path })}
        />
      ) : null}
    </div>
  );
}

function ImageEditModal({
  image,
  uploadEnabled,
  uploadEndpoint,
  onClose,
  onChange,
  onDelete,
  onUploadPath,
}: {
  image: GalleryImage;
  uploadEnabled: boolean;
  uploadEndpoint: string;
  onClose: () => void;
  onChange: (next: GalleryImage) => void;
  onDelete: () => void;
  onUploadPath: (path: string) => void;
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
      onUploadPath(publicPath);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-[#0b1f35]">Edit image</h3>
          <button type="button" onClick={onClose} className="inline-flex size-8 items-center justify-center rounded-md hover:bg-slate-100" aria-label="Close"><X className="size-4" /></button>
        </div>
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.src} alt="" className="h-44 w-full rounded-xl border border-slate-200 object-cover bg-slate-50" />
          <label>
            <span className="admin-label">Image path / URL</span>
            <input value={image.src} onChange={(event) => onChange({ ...image, src: event.target.value })} className="admin-input" />
          </label>
          {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <label className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold ${uploadEnabled ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed opacity-50"}`}>
              {uploading ? <LoaderCircle className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />} Upload
              <input type="file" accept="image/*" disabled={!uploadEnabled || uploading} className="hidden" onChange={upload} />
            </label>
          </div>
          <label>
            <span className="admin-label">Caption / alt text</span>
            <input value={image.alt} onChange={(event) => onChange({ ...image, alt: event.target.value })} className="admin-input" />
          </label>
          <label>
            <span className="admin-label">Display size</span>
            <select value={image.size} onChange={(event) => onChange({ ...image, size: event.target.value as GalleryImage["size"] })} className="admin-input">
              <option value="large">Large</option>
              <option value="medium">Medium</option>
              <option value="portrait">Portrait</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button type="button" onClick={onDelete} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-red-600 hover:bg-red-50">
            <Trash2 className="size-3.5" /> Delete
          </button>
          <button type="button" onClick={onClose} className="inline-flex min-h-9 items-center rounded-lg bg-[#0b1f35] px-4 text-[12px] font-semibold text-white">Done</button>
        </div>
      </div>
    </div>
  );
}
