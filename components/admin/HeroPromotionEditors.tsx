"use client";

import { ChangeEvent, useState } from "react";
import {
  Image as ImageIcon,
  ImagePlus,
  Images,
  LoaderCircle,
  Palette,
  Pencil,
  Plus,
  Trash2,
  Video,
  X,
} from "lucide-react";
import type { HeroFact, SiteData } from "@/types/site";
import { MAX_BOOKING_SPECS, resolveBenefitsBackgroundStyle, resolveBookingCardBackgroundStyle, resolveBookingHeaderBackgroundStyle, resolveBookingSpecs, resolveOfferTitleBackgroundStyle, resolveSpecsBackgroundColor, withBookingSpecs } from "@/lib/booking-card";
import {
  resolveHeroBackgroundMode,
  resolveHeroCarouselIntervalMs,
  type HeroBackgroundMode,
} from "@/lib/hero-background";
import {
  DEFAULT_HERO_MOBILE_LEAD_FORM,
  resolveHeroMobileFieldLabelColor,
  resolveHeroMobileLayout,
  resolveHeroMobileLeadForm,
} from "@/lib/hero-mobile";
import { textStyle } from "@/lib/typography";
import { resolveButtonBackgroundStyle } from "@/lib/button-background";
import { useAdminCustomGradients } from "@/components/admin/AdminContentContext";
import { IconPicker } from "@/components/admin/IconPicker";
import { Icon } from "@/components/ui/Icon";
import {
  ButtonBackgroundPicker,
  CompactColorField,
  CompactToggle,
  CtaBox,
  StylePopup,
  type IntentOption,
  type PathPart,
} from "@/components/admin/editor-ui";
import { uploadFileAsset } from "@/lib/client/upload";

function CompactImageField({
  label,
  value,
  path,
  onUpdate,
  uploadEnabled,
  uploadEndpoint,
}: {
  label: string;
  value: string;
  path: PathPart[];
  onUpdate: (path: PathPart[], value: unknown) => void;
  uploadEnabled: boolean;
  uploadEndpoint: string;
}) {
  const [uploading, setUploading] = useState(false);
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const publicPath = await uploadFileAsset(file, uploadEndpoint);
      onUpdate(path, publicPath);
    } catch {
      // keep previous value
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <span className="admin-label">{label}</span>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-28 w-full max-w-md rounded-lg border border-slate-200 object-cover" />
      ) : null}
      <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 hover:border-[#b98945]">
        {uploading ? <LoaderCircle className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />} Upload
        <input type="file" accept="image/*" disabled={!uploadEnabled || uploading} className="hidden" onChange={upload} />
      </label>
    </div>
  );
}

const BACKGROUND_MODES: Array<{ id: HeroBackgroundMode; label: string; description: string; icon: typeof ImageIcon }> = [
  { id: "image", label: "Plain image", description: "Single static photo", icon: ImageIcon },
  { id: "video", label: "Video", description: "YouTube or uploaded clip", icon: Video },
  { id: "carousel", label: "Image carousel", description: "Slideshow of photos", icon: Images },
];

function HeroBackgroundEditor({
  value,
  onUpdate,
  uploadEnabled,
  uploadEndpoint,
}: {
  value: SiteData["hero"];
  onUpdate: (path: PathPart[], value: unknown) => void;
  uploadEnabled: boolean;
  uploadEndpoint: string;
}) {
  const mode = resolveHeroBackgroundMode(value);
  const carouselImages = value.backgroundCarouselImages || [];
  const intervalSeconds = Math.round(resolveHeroCarouselIntervalMs(value) / 1000);
  const [uploadingCarousel, setUploadingCarousel] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const setMode = (next: HeroBackgroundMode) => onUpdate(["hero", "backgroundMode"], next);

  const uploadCarouselImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploadingCarousel(true);
    try {
      const uploaded: Array<{ src: string; alt: string }> = [];
      for (const file of files) {
        const publicPath = await uploadFileAsset(file, uploadEndpoint);
        uploaded.push({ src: publicPath, alt: "" });
      }
      onUpdate(["hero", "backgroundCarouselImages"], [...carouselImages, ...uploaded]);
    } catch {
      // keep previous list
    } finally {
      setUploadingCarousel(false);
      event.target.value = "";
    }
  };

  const uploadVideoFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const publicPath = await uploadFileAsset(file, uploadEndpoint);
      onUpdate(["hero", "backgroundVideoUrl"], publicPath);
    } catch {
      // keep previous value
    } finally {
      setUploadingVideo(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div>
        <span className="admin-label">Hero background</span>
        <p className="mt-1 text-[11px] text-slate-500">Choose how the full-bleed hero media plays behind your copy and offer card.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {BACKGROUND_MODES.map((option) => {
          const IconComponent = option.icon;
          const active = mode === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setMode(option.id)}
              className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                active
                  ? "border-[#b98945] bg-white shadow-sm ring-1 ring-[#b98945]/30"
                  : "border-slate-200 bg-white hover:border-[#b98945]/50"
              }`}
            >
              <IconComponent className={`size-4 ${active ? "text-[#b98945]" : "text-slate-500"}`} />
              <p className="mt-2 text-[12px] font-semibold text-[#0b1f35]">{option.label}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">{option.description}</p>
            </button>
          );
        })}
      </div>

      <div className="space-y-3 rounded-xl border border-dashed border-[#b98945]/35 bg-[#fffaf3]/70 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0b1f35]">Media overlay</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Same overlay for photo, video, and carousel on desktop and mobile.
            </p>
          </div>
          <CompactToggle
            label="Show overlay"
            checked={value.overlayEnabled !== false}
            onChange={(checked) => onUpdate(["hero", "overlayEnabled"], checked)}
          />
        </div>
        {value.overlayEnabled !== false ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <label>
              <span className="admin-label">Overlay style</span>
              <select
                value={value.overlayStyle || "both"}
                onChange={(event) => onUpdate(["hero", "overlayStyle"], event.target.value)}
                className="admin-input"
              >
                <option value="both">Fade from left and top</option>
                <option value="left">Fade from the left</option>
                <option value="vertical">Fade from top and bottom</option>
                <option value="solid">Solid tint</option>
              </select>
            </label>
            <CompactColorField
              label="Overlay color"
              value={value.overlayColor || "#05111F"}
              onChange={(next) => onUpdate(["hero", "overlayColor"], next)}
            />
            <label>
              <span className="admin-label">Strength ({Math.round((value.overlayOpacity ?? 1) * 100)}%)</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={value.overlayOpacity ?? 1}
                onChange={(event) => onUpdate(["hero", "overlayOpacity"], Math.min(1, Math.max(0, Number(event.target.value) || 0)))}
                className="mt-3 w-full"
              />
            </label>
          </div>
        ) : null}
      </div>

      {mode === "image" ? (
        <div className="space-y-3">
          <CompactImageField
            label="Background image"
            value={value.backgroundImage}
            path={["hero", "backgroundImage"]}
            onUpdate={onUpdate}
            uploadEnabled={uploadEnabled}
            uploadEndpoint={uploadEndpoint}
          />
          <label className="block max-w-md">
            <span className="admin-label">Image description</span>
            <input
              value={value.backgroundAlt}
              onChange={(event) => onUpdate(["hero", "backgroundAlt"], event.target.value)}
              className="admin-input"
            />
          </label>
        </div>
      ) : null}

      {mode === "video" ? (
        <div className="space-y-3">
          <label className="block">
            <span className="admin-label">Video URL</span>
            <input
              value={value.backgroundVideoUrl || ""}
              onChange={(event) => onUpdate(["hero", "backgroundVideoUrl"], event.target.value)}
              placeholder="https://www.youtube.com/watch?v=… or /uploads/hero.mp4"
              className="admin-input"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              Paste a YouTube link, or upload an MP4/WebM file below. Browsers require muted autoplay.
            </p>
          </label>
          <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 hover:border-[#b98945]">
            {uploadingVideo ? <LoaderCircle className="size-3.5 animate-spin" /> : <Video className="size-3.5" />}
            Upload video file
            <input
              type="file"
              accept="video/mp4,video/webm,video/ogg,.mp4,.webm,.ogg"
              disabled={!uploadEnabled || uploadingVideo}
              className="hidden"
              onChange={uploadVideoFile}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <CompactImageField
              label="Poster image (fallback)"
              value={value.backgroundVideoPoster || value.backgroundImage}
              path={["hero", "backgroundVideoPoster"]}
              onUpdate={onUpdate}
              uploadEnabled={uploadEnabled}
              uploadEndpoint={uploadEndpoint}
            />
            <p className="text-[11px] leading-5 text-slate-500">
              Darkening for this video uses Media overlay above, the same control as photos and carousels.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <CompactToggle
              label="Autoplay"
              checked={value.backgroundVideoAutoplay !== false}
              onChange={(checked) => onUpdate(["hero", "backgroundVideoAutoplay"], checked)}
            />
            <CompactToggle
              label="Muted"
              checked={value.backgroundVideoMuted !== false}
              onChange={(checked) => onUpdate(["hero", "backgroundVideoMuted"], checked)}
            />
            <CompactToggle
              label="Loop"
              checked={value.backgroundVideoLoop !== false}
              onChange={(checked) => onUpdate(["hero", "backgroundVideoLoop"], checked)}
            />
          </div>
        </div>
      ) : null}

      {mode === "carousel" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 hover:border-[#b98945]">
              {uploadingCarousel ? <LoaderCircle className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
              Add images
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={!uploadEnabled || uploadingCarousel}
                className="hidden"
                onChange={uploadCarouselImages}
              />
            </label>
            <p className="text-[11px] text-slate-500">
              {carouselImages.length} slide{carouselImages.length === 1 ? "" : "s"}
              {!carouselImages.length ? " · falls back to the plain background image until you add slides" : ""}
            </p>
          </div>

          {carouselImages.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {carouselImages.map((item, index) => (
                <article key={`${item.src}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.src} alt="" className="h-28 w-full object-cover" />
                  <div className="space-y-2 p-2.5">
                    <input
                      value={item.alt || ""}
                      onChange={(event) => {
                        const next = carouselImages.map((image, imageIndex) =>
                          imageIndex === index ? { ...image, alt: event.target.value } : image,
                        );
                        onUpdate(["hero", "backgroundCarouselImages"], next);
                      }}
                      placeholder="Alt text"
                      className="admin-input text-[11px]"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400">Slide {index + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdate(
                            ["hero", "backgroundCarouselImages"],
                            carouselImages.filter((_, imageIndex) => imageIndex !== index),
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="size-3" /> Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <CompactImageField
              label="Fallback background image"
              value={value.backgroundImage}
              path={["hero", "backgroundImage"]}
              onUpdate={onUpdate}
              uploadEnabled={uploadEnabled}
              uploadEndpoint={uploadEndpoint}
            />
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label>
              <span className="admin-label">Slide every (seconds)</span>
              <input
                type="number"
                min={2}
                max={60}
                value={intervalSeconds}
                onChange={(event) =>
                  onUpdate(
                    ["hero", "backgroundCarouselIntervalMs"],
                    Math.min(60, Math.max(2, Number(event.target.value) || 5)) * 1000,
                  )
                }
                className="admin-input"
              />
            </label>
            <label>
              <span className="admin-label">Transition</span>
              <select
                value={value.backgroundCarouselTransition === "slide" ? "slide" : "fade"}
                onChange={(event) => onUpdate(["hero", "backgroundCarouselTransition"], event.target.value)}
                className="admin-input"
              >
                <option value="fade">Fade</option>
                <option value="slide">Slide</option>
              </select>
            </label>
            <div className="flex items-end">
              <CompactToggle
                label="Show dots"
                checked={value.backgroundCarouselShowDots === true}
                onChange={(checked) => onUpdate(["hero", "backgroundCarouselShowDots"], checked)}
              />
            </div>
            <div className="flex items-end">
              <CompactToggle
                label="Pause on hover"
                checked={value.backgroundCarouselPauseOnHover !== false}
                onChange={(checked) => onUpdate(["hero", "backgroundCarouselPauseOnHover"], checked)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HeroMobileBackgroundEditor({
  value,
  onUpdate,
  uploadEnabled,
  uploadEndpoint,
}: {
  value: SiteData["hero"];
  onUpdate: (path: PathPart[], value: unknown) => void;
  uploadEnabled: boolean;
  uploadEndpoint: string;
}) {
  const layout = resolveHeroMobileLayout(value);
  const raw = value.mobileLayout || {};
  const patch = (key: string, next: unknown) => onUpdate(["hero", "mobileLayout", key], next);
  const mode = layout.backgroundMode;
  const carouselImages = raw.backgroundCarouselImages || [];
  const intervalMs =
    typeof raw.backgroundCarouselIntervalMs === "number"
      ? raw.backgroundCarouselIntervalMs
      : resolveHeroCarouselIntervalMs(value);
  const intervalSeconds = Math.round(intervalMs / 1000);
  const [uploadingCarousel, setUploadingCarousel] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const setMode = (next: HeroBackgroundMode) => patch("backgroundMode", next);

  const uploadCarouselImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploadingCarousel(true);
    try {
      const uploaded: Array<{ src: string; alt: string }> = [];
      for (const file of files) {
        const publicPath = await uploadFileAsset(file, uploadEndpoint);
        uploaded.push({ src: publicPath, alt: "" });
      }
      patch("backgroundCarouselImages", [...carouselImages, ...uploaded]);
    } catch {
      // keep previous list
    } finally {
      setUploadingCarousel(false);
      event.target.value = "";
    }
  };

  const uploadVideoFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const publicPath = await uploadFileAsset(file, uploadEndpoint);
      patch("backgroundVideoUrl", publicPath);
    } catch {
      // keep previous value
    } finally {
      setUploadingVideo(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-slate-500">
        Media for the top band on phones. Leave fields empty to reuse the desktop hero settings where noted.
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {BACKGROUND_MODES.map((option) => {
          const IconComponent = option.icon;
          const active = mode === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setMode(option.id)}
              className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                active
                  ? "border-[#b98945] bg-white shadow-sm ring-1 ring-[#b98945]/30"
                  : "border-slate-200 bg-white hover:border-[#b98945]/50"
              }`}
            >
              <IconComponent className={`size-4 ${active ? "text-[#b98945]" : "text-slate-500"}`} />
              <p className="mt-2 text-[12px] font-semibold text-[#0b1f35]">{option.label}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">{option.description}</p>
            </button>
          );
        })}
      </div>

      {mode === "image" ? (
        <div className="space-y-3">
          <CompactImageField
            label="Landscape image (mobile)"
            value={raw.image || ""}
            path={["hero", "mobileLayout", "image"]}
            onUpdate={onUpdate}
            uploadEnabled={uploadEnabled}
            uploadEndpoint={uploadEndpoint}
          />
          <label className="block max-w-xl">
            <span className="admin-label">Image alt text</span>
            <input
              value={raw.imageAlt || ""}
              onChange={(event) => patch("imageAlt", event.target.value)}
              placeholder={value.backgroundAlt || "Project preview"}
              className="admin-input"
            />
          </label>
          <label>
            <span className="admin-label">Image focus</span>
            <select
              value={raw.imageObjectPosition || "center center"}
              onChange={(event) => patch("imageObjectPosition", event.target.value)}
              className="admin-input max-w-xs"
            >
              <option value="center center">Center</option>
              <option value="center top">Top</option>
              <option value="center 30%">Upper third</option>
              <option value="center 70%">Lower third</option>
              <option value="left center">Left</option>
              <option value="right center">Right</option>
            </select>
          </label>
        </div>
      ) : null}

      {mode === "video" ? (
        <div className="space-y-3">
          <label className="block">
            <span className="admin-label">Video URL (mobile)</span>
            <input
              value={raw.backgroundVideoUrl ?? value.backgroundVideoUrl ?? ""}
              onChange={(event) => patch("backgroundVideoUrl", event.target.value)}
              placeholder="YouTube link or /uploads/hero.mp4"
              className="admin-input"
            />
          </label>
          <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 hover:border-[#b98945]">
            {uploadingVideo ? <LoaderCircle className="size-3.5 animate-spin" /> : <Video className="size-3.5" />}
            Upload video file
            <input
              type="file"
              accept="video/mp4,video/webm,video/ogg,.mp4,.webm,.ogg"
              disabled={!uploadEnabled || uploadingVideo}
              className="hidden"
              onChange={uploadVideoFile}
            />
          </label>
          <CompactImageField
            label="Poster image"
            value={raw.backgroundVideoPoster ?? value.backgroundVideoPoster ?? value.backgroundImage}
            path={["hero", "mobileLayout", "backgroundVideoPoster"]}
            onUpdate={onUpdate}
            uploadEnabled={uploadEnabled}
            uploadEndpoint={uploadEndpoint}
          />
          <div className="flex flex-wrap gap-3">
            <CompactToggle
              label="Autoplay"
              checked={(raw.backgroundVideoAutoplay ?? value.backgroundVideoAutoplay) !== false}
              onChange={(checked) => patch("backgroundVideoAutoplay", checked)}
            />
            <CompactToggle
              label="Muted"
              checked={(raw.backgroundVideoMuted ?? value.backgroundVideoMuted) !== false}
              onChange={(checked) => patch("backgroundVideoMuted", checked)}
            />
            <CompactToggle
              label="Loop"
              checked={(raw.backgroundVideoLoop ?? value.backgroundVideoLoop) !== false}
              onChange={(checked) => patch("backgroundVideoLoop", checked)}
            />
          </div>
        </div>
      ) : null}

      {mode === "carousel" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 hover:border-[#b98945]">
              {uploadingCarousel ? <LoaderCircle className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
              Add slides
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={!uploadEnabled || uploadingCarousel}
                className="hidden"
                onChange={uploadCarouselImages}
              />
            </label>
            <p className="text-[11px] text-slate-500">{carouselImages.length} mobile slide{carouselImages.length === 1 ? "" : "s"}</p>
          </div>
          {carouselImages.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {carouselImages.map((item, index) => (
                <article key={`${item.src}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.src} alt="" className="h-28 w-full object-cover" />
                  <div className="space-y-2 p-2.5">
                    <input
                      value={item.alt || ""}
                      onChange={(event) => {
                        const next = carouselImages.map((image, imageIndex) =>
                          imageIndex === index ? { ...image, alt: event.target.value } : image,
                        );
                        patch("backgroundCarouselImages", next);
                      }}
                      placeholder="Alt text"
                      className="admin-input text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => patch("backgroundCarouselImages", carouselImages.filter((_, i) => i !== index))}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="size-3" /> Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">No mobile slides yet — uses desktop carousel or fallback image until you add slides.</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label>
              <span className="admin-label">Slide every (seconds)</span>
              <input
                type="number"
                min={2}
                max={60}
                value={intervalSeconds}
                onChange={(event) =>
                  patch(
                    "backgroundCarouselIntervalMs",
                    Math.min(60, Math.max(2, Number(event.target.value) || 5)) * 1000,
                  )
                }
                className="admin-input"
              />
            </label>
            <label>
              <span className="admin-label">Transition</span>
              <select
                value={(raw.backgroundCarouselTransition ?? value.backgroundCarouselTransition) === "slide" ? "slide" : "fade"}
                onChange={(event) => patch("backgroundCarouselTransition", event.target.value)}
                className="admin-input"
              >
                <option value="fade">Fade</option>
                <option value="slide">Slide</option>
              </select>
            </label>
            <div className="flex items-end">
              <CompactToggle
                label="Show dots"
                checked={(raw.backgroundCarouselShowDots ?? value.backgroundCarouselShowDots) === true}
                onChange={(checked) => patch("backgroundCarouselShowDots", checked)}
              />
            </div>
          </div>
        </div>
      ) : null}

      <label>
        <span className="admin-label">Band overlay opacity</span>
        <input
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={layout.overlayOpacity}
          onChange={(event) => patch("overlayOpacity", Math.min(1, Math.max(0, Number(event.target.value) || 0)))}
          className="admin-input max-w-[8rem]"
        />
      </label>
    </div>
  );
}

function HeroMobileLayoutEditor({
  value,
  onUpdate,
}: {
  value: SiteData["hero"];
  onUpdate: (path: PathPart[], value: unknown) => void;
}) {
  const layout = resolveHeroMobileLayout(value);
  const raw = value.mobileLayout || {};
  const patch = (key: string, next: unknown) => onUpdate(["hero", "mobileLayout", key], next);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="admin-label !mt-0">Top media band</span>
          <p className="mt-1 text-[11px] text-slate-500">
            Show a landscape band under the header, then the offer card. Uses the site header height automatically when
            the logo or bar grows.
          </p>
        </div>
        <CompactToggle
          label="Band on top (mobile)"
          checked={layout.imageFirstEnabled}
          onChange={(checked) => patch("imageFirstEnabled", checked)}
        />
      </div>

      {layout.imageFirstEnabled ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label>
            <span className="admin-label">Band height (px)</span>
            <input
              type="number"
              min={120}
              max={480}
              value={layout.imageHeight}
              onChange={(event) =>
                patch("imageHeight", Math.min(480, Math.max(120, Number(event.target.value) || 240)))
              }
              className="admin-input"
            />
          </label>
          <label>
            <span className="admin-label">Extra below header (px)</span>
            <input
              type="number"
              min={0}
              max={120}
              value={layout.headerGap}
              onChange={(event) =>
                patch("headerGap", Math.min(120, Math.max(0, Number(event.target.value) || 0)))
              }
              className="admin-input"
            />
            <span className="mt-1 block text-[10px] text-slate-500">Added to sticky header height.</span>
          </label>
          <label>
            <span className="admin-label">Below band → card (px)</span>
            <input
              type="number"
              min={0}
              max={160}
              value={layout.cardOffset}
              onChange={(event) =>
                patch("cardOffset", Math.min(160, Math.max(0, Number(event.target.value) || 0)))
              }
              className="admin-input"
            />
          </label>
          <label>
            <span className="admin-label">Card → form gap (px)</span>
            <input
              type="number"
              min={0}
              max={80}
              value={layout.formGap}
              onChange={(event) =>
                patch("formGap", Math.min(80, Math.max(0, Number(event.target.value) || 0)))
              }
              className="admin-input"
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-1">
            <CompactColorField
              label="Area below band"
              value={layout.contentBackgroundColor}
              onChange={(next) => patch("contentBackgroundColor", next)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

type HeroMobileSettingsTab = "layout" | "media" | "form";

function HeroMobileSettingsEditor({
  value,
  onUpdate,
  uploadEnabled,
  uploadEndpoint,
  enquiry,
}: {
  value: SiteData["hero"];
  onUpdate: (path: PathPart[], value: unknown) => void;
  uploadEnabled: boolean;
  uploadEndpoint: string;
  enquiry?: SiteData["enquiry"];
}) {
  const [tab, setTab] = useState<HeroMobileSettingsTab>("layout");
  const tabs: Array<{ id: HeroMobileSettingsTab; label: string }> = [
    { id: "layout", label: "Layout & spacing" },
    { id: "media", label: "Top band media" },
    { id: "form", label: "Lead form" },
  ];

  return (
    <div className="space-y-4 rounded-2xl border-2 border-[#b98945]/25 bg-gradient-to-b from-[#fffaf3] to-white p-4 shadow-sm">
      <div>
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#0b1f35]">Mobile only</h3>
        <p className="mt-1 text-[11px] text-slate-600">
          Phones and small screens. Desktop hero, copy, and offer card layout are unchanged.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
              tab === item.id
                ? "bg-[#0b1f35] text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-[#b98945]/50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === "layout" ? <HeroMobileLayoutEditor value={value} onUpdate={onUpdate} /> : null}
      {tab === "media" ? (
        <HeroMobileBackgroundEditor
          value={value}
          onUpdate={onUpdate}
          uploadEnabled={uploadEnabled}
          uploadEndpoint={uploadEndpoint}
        />
      ) : null}
      {tab === "form" ? <HeroMobileLeadFormEditor value={value} enquiry={enquiry} onUpdate={onUpdate} /> : null}
    </div>
  );
}

function HeroMobileLeadFormEditor({
  value,
  enquiry,
  onUpdate,
}: {
  value: SiteData["hero"];
  enquiry?: SiteData["enquiry"];
  onUpdate: (path: PathPart[], value: unknown) => void;
}) {
  const form = resolveHeroMobileLeadForm(value, enquiry || ({} as SiteData["enquiry"]));
  const raw = value.mobileLeadForm || {};
  const patch = (key: string, next: unknown) => {
    if (!value.mobileLeadForm) {
      onUpdate(["hero", "mobileLeadForm"], { ...DEFAULT_HERO_MOBILE_LEAD_FORM, [key]: next });
      return;
    }
    onUpdate(["hero", "mobileLeadForm", key], next);
  };
  const patchField = (key: "name" | "phone", fieldPatch: Record<string, unknown>) => {
    const current = form.fields[key];
    patch("fields", {
      ...(raw.fields || {}),
      [key]: { ...current, ...fieldPatch },
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="admin-label !mt-0">Mobile lead form</span>
          <p className="mt-1 text-[11px] text-slate-500">
            Compact Name + Phone form shown only on mobile, directly under the offer card.
          </p>
        </div>
        <CompactToggle
          label="Show form"
          checked={form.enabled}
          onChange={(checked) => patch("enabled", checked)}
        />
      </div>

      {form.enabled ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="admin-label">Form title</span>
              <input
                value={raw.title ?? form.title}
                onChange={(event) => patch("title", event.target.value)}
                className="admin-input"
              />
            </label>
            <label>
              <span className="admin-label">Submit button text</span>
              <input
                value={raw.submitLabel ?? form.submitLabel}
                onChange={(event) => patch("submitLabel", event.target.value)}
                className="admin-input"
              />
            </label>
            <label>
              <span className="admin-label">Success message</span>
              <input
                value={raw.successMessage ?? form.successMessage}
                onChange={(event) => patch("successMessage", event.target.value)}
                className="admin-input"
              />
            </label>
            <label>
              <span className="admin-label">Footer note</span>
              <input
                value={raw.footerText ?? form.footerText}
                onChange={(event) => patch("footerText", event.target.value)}
                className="admin-input"
              />
            </label>
            <label>
              <span className="admin-label">Form tracking ID</span>
              <input
                value={raw.gtmId || ""}
                onChange={(event) => patch("gtmId", event.target.value.trim() || undefined)}
                className="admin-input font-mono text-[12px]"
                placeholder="hero_mobile_lead"
              />
              <span className="mt-1 block text-[10px] text-slate-500">
                Unique GTM id for this mobile form + thank-you. Default:{" "}
                <code className="rounded bg-white px-1">hero_mobile_lead</code>
              </span>
            </label>
            <label>
              <span className="admin-label">Form min height (px)</span>
              <input
                type="number"
                min={0}
                max={2000}
                step={10}
                placeholder="Auto"
                value={typeof form.formMinHeight === "number" && form.formMinHeight > 0 ? form.formMinHeight : ""}
                onChange={(event) => {
                  const rawValue = event.target.value.trim();
                  if (!rawValue) {
                    patch("formMinHeight", undefined);
                    return;
                  }
                  const next = Number(rawValue);
                  if (!Number.isFinite(next)) return;
                  patch("formMinHeight", Math.min(2000, Math.max(0, Math.round(next))));
                }}
                className="admin-input"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(["name", "phone"] as const).map((key) => {
              const field = form.fields[key];
              return (
                <article key={key} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">{key}</p>
                    <div className="flex items-center gap-1.5">
                      <CompactToggle
                        label="Show"
                        checked={field.enabled}
                        onChange={(enabled) => patchField(key, { enabled })}
                      />
                      <CompactToggle
                        label="Req"
                        checked={field.required}
                        onChange={(required) => patchField(key, { required, enabled: required ? true : field.enabled })}
                      />
                    </div>
                  </div>
                  <label className="block">
                    <span className="admin-label">Label</span>
                    <input
                      value={field.label}
                      onChange={(event) => patchField(key, { label: event.target.value })}
                      className="admin-input"
                    />
                  </label>
                  <label className="mt-2 block">
                    <span className="admin-label">Placeholder</span>
                    <input
                      value={field.placeholder}
                      onChange={(event) => patchField(key, { placeholder: event.target.value })}
                      className="admin-input"
                    />
                  </label>
                </article>
              );
            })}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <CompactColorField
              label="Form background"
              value={form.formBackgroundColor}
              onChange={(next) => patch("formBackgroundColor", next)}
            />
            <CompactColorField
              label="Form text"
              value={form.formTextColor}
              onChange={(next) => patch("formTextColor", next)}
            />
            <CompactColorField
              label="Field label color"
              value={resolveHeroMobileFieldLabelColor(raw.fieldLabelColor, form.formTextColor)}
              onChange={(next) => patch("fieldLabelColor", next)}
            />
            <CompactColorField
              label="Input background"
              value={form.inputBackgroundColor}
              onChange={(next) => patch("inputBackgroundColor", next)}
            />
            <CompactColorField
              label="Input border"
              value={form.inputBorderColor}
              onChange={(next) => patch("inputBorderColor", next)}
            />
            <CompactColorField
              label="Input text"
              value={form.inputTextColor}
              onChange={(next) => patch("inputTextColor", next)}
            />
          </div>

          <div className="rounded-xl border border-dashed border-[#b98945]/35 bg-[#fffaf3]/70 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0b1f35]">Card border &amp; margin</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Shadow is removed on mobile. Adjust border and side margin for the Get a callback card.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <CompactColorField
                label="Border color"
                value={form.chrome.borderColor}
                onChange={(next) => patch("borderColor", next)}
              />
              <label>
                <span className="admin-label">Border width (px)</span>
                <input
                  type="number"
                  min={0}
                  max={8}
                  value={form.chrome.borderWidth}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (!Number.isFinite(next)) return;
                    patch("borderWidth", Math.min(8, Math.max(0, Math.round(next))));
                  }}
                  className="admin-input"
                />
              </label>
              <label>
                <span className="admin-label">Side margin (px)</span>
                <input
                  type="number"
                  min={0}
                  max={48}
                  value={form.chrome.marginX}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (!Number.isFinite(next)) return;
                    patch("marginX", Math.min(48, Math.max(0, Math.round(next))));
                  }}
                  className="admin-input"
                />
              </label>
            </div>
          </div>

          <ButtonBackgroundPicker
            value={{
              backgroundType: form.buttonBackgroundType,
              backgroundColor: form.buttonBackgroundColor,
              backgroundGradient: form.buttonBackgroundGradient,
            }}
            onChange={(next) => {
              patch("buttonBackgroundType", next.backgroundType || "plain");
              patch("buttonBackgroundColor", next.backgroundColor || "#b98945");
              patch("buttonBackgroundGradient", next.backgroundGradient || "golden");
            }}
            textColor={form.buttonTextColor}
            onTextColorChange={(next) => patch("buttonTextColor", next)}
            plainLabel="Submit button bg"
          />
        </>
      ) : null}
    </div>
  );
}

export function HeroContentEditor({
  value,
  onUpdate,
  uploadEnabled,
  uploadEndpoint,
  intents,
  enquiry,
}: {
  value: SiteData["hero"];
  onUpdate: (path: PathPart[], value: unknown) => void;
  uploadEnabled: boolean;
  uploadEndpoint: string;
  intents: IntentOption[];
  enquiry?: SiteData["enquiry"];
}) {
  const record = value as unknown as Record<string, unknown>;
  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="min-w-0">
            <span className="mb-1 flex items-center gap-1">
              <span className="admin-label">Eyebrow</span>
              <StylePopup title="eyebrow" parent={record} fieldKey="eyebrow" colorKey="eyebrowColor" parentPath={["hero"]} onUpdate={onUpdate} />
            </span>
            <input value={value.eyebrow} onChange={(event) => onUpdate(["hero", "eyebrow"], event.target.value)} className="admin-input" />
          </label>
          <label className="min-w-0">
            <span className="mb-1 flex items-center gap-1">
              <span className="admin-label">Main heading</span>
              <StylePopup title="heading" parent={record} fieldKey="heading" colorKey="headingColor" parentPath={["hero"]} onUpdate={onUpdate} />
            </span>
            <input value={value.heading} onChange={(event) => onUpdate(["hero", "heading"], event.target.value)} className="admin-input" />
          </label>
          <label className="min-w-0">
            <span className="mb-1 flex items-center gap-1">
              <span className="admin-label">Highlighted heading</span>
              <StylePopup title="highlight" parent={record} fieldKey="headingAccent" colorKey="headingAccentColor" parentPath={["hero"]} onUpdate={onUpdate} />
            </span>
            <input value={value.headingAccent} onChange={(event) => onUpdate(["hero", "headingAccent"], event.target.value)} className="admin-input" />
          </label>
        </div>
        <label className="block max-w-3xl">
          <span className="mb-1 flex items-center gap-1">
            <span className="admin-label !mt-0">Description</span>
            <StylePopup title="description" parent={record} fieldKey="description" colorKey="descriptionColor" parentPath={["hero"]} onUpdate={onUpdate} />
          </span>
          <textarea value={value.description} onChange={(event) => onUpdate(["hero", "description"], event.target.value)} rows={3} className="admin-input min-h-[4.5rem] resize-y py-2" style={textStyle(value, "description", { color: value.descriptionColor })} />
        </label>

        <HeroBackgroundEditor
          value={value}
          onUpdate={onUpdate}
          uploadEnabled={uploadEnabled}
          uploadEndpoint={uploadEndpoint}
        />

        <HeroMobileSettingsEditor
          value={value}
          onUpdate={onUpdate}
          uploadEnabled={uploadEnabled}
          uploadEndpoint={uploadEndpoint}
          enquiry={enquiry}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CtaBox title="Button 1" enabled={value.primaryCTAEnabled} onEnabled={(checked) => onUpdate(["hero", "primaryCTAEnabled"], checked)} cta={value.primaryCTA} onChange={(next) => onUpdate(["hero", "primaryCTA"], next)} intents={intents} />
        <CtaBox title="Button 2" enabled={value.secondaryCTAEnabled} onEnabled={(checked) => onUpdate(["hero", "secondaryCTAEnabled"], checked)} cta={value.secondaryCTA} onChange={(next) => onUpdate(["hero", "secondaryCTA"], next)} intents={intents} />
      </div>
    </div>
  );
}

export function OfferCardEditor({
  value,
  onUpdate,
  intents,
}: {
  value: SiteData["bookingCard"];
  onUpdate: (path: PathPart[], value: unknown) => void;
  intents: IntentOption[];
}) {
  const { customGradients } = useAdminCustomGradients();
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const record = value as unknown as Record<string, unknown>;
  const patch = (key: string, next: unknown) => onUpdate(["bookingCard", key], next);
  const specs = resolveBookingSpecs(value, { keepEmpty: true });
  const saveSpecs = (next: typeof specs) => onUpdate(["bookingCard"], withBookingSpecs(value, next));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <CompactToggle label="Show offer card" checked={value.enabled} onChange={(checked) => patch("enabled", checked)} />
        <button type="button" onClick={() => setAppearanceOpen(true)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 hover:border-[#b98945]">
          <Palette className="size-3.5" /> Customize appearance
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <aside
        className="w-full max-w-[430px] shrink-0 overflow-hidden rounded-[15px] border border-slate-200 shadow-[0_16px_40px_rgba(11,31,53,0.12)]"
        style={{
          color: value.textColor,
          ...resolveBookingCardBackgroundStyle(value, customGradients),
        }}
      >
        <div
          className="flex min-h-12 items-center justify-center px-4 py-2"
          style={resolveBookingHeaderBackgroundStyle(value, customGradients)}
        >
          <div className="flex w-full items-center justify-center gap-1">
            <input
              value={value.offerTitle}
              onChange={(event) => patch("offerTitle", event.target.value)}
              className="w-full rounded-[5px] px-3 py-1 text-center text-[11px] font-bold tracking-[0.02em] text-[#293342] outline-none"
              style={{
                ...resolveOfferTitleBackgroundStyle(value, customGradients),
                ...textStyle(value, "offerTitle"),
              }}
            />
            <StylePopup
              title="offer title"
              parent={record}
              fieldKey="offerTitle"
              parentPath={["bookingCard"]}
              onUpdate={onUpdate}
              allowBackground
              defaultBackgroundColor="#e4bd68"
            />
          </div>
        </div>
        <div className="px-5 pb-4 pt-4">
          <div className="flex items-start justify-center gap-1">
            <input value={value.title} onChange={(event) => patch("title", event.target.value)} className="w-full bg-transparent text-center text-[27px] font-extrabold leading-tight outline-none" style={textStyle(value, "title")} />
            <StylePopup title="title" parent={record} fieldKey="title" parentPath={["bookingCard"]} onUpdate={onUpdate} />
          </div>
          <div className="mt-1.5 flex items-start justify-center gap-1">
            <input value={value.description} onChange={(event) => patch("description", event.target.value)} className="w-full bg-transparent text-center text-[12px] leading-5 outline-none" style={textStyle(value, "description")} />
            <StylePopup title="description" parent={record} fieldKey="description" parentPath={["bookingCard"]} onUpdate={onUpdate} />
          </div>
          <dl
            className="mt-3.5 rounded-[10px] px-4 py-2 text-[11px] uppercase text-[#4e5b6b]"
            style={{ backgroundColor: resolveSpecsBackgroundColor(value) }}
          >
            {specs.map((item, index) => (
              <div key={index} className={`grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 py-1.5 ${index ? "border-t border-[#e4e1da]" : ""}`}>
                <input value={item.label} onChange={(event) => saveSpecs(specs.map((spec, specIndex) => specIndex === index ? { ...spec, label: event.target.value } : spec))} className="bg-transparent font-medium outline-none" />
                <input value={item.value} onChange={(event) => saveSpecs(specs.map((spec, specIndex) => specIndex === index ? { ...spec, value: event.target.value } : spec))} className="bg-transparent text-right font-bold normal-case text-[#172238] outline-none" />
                <button type="button" onClick={() => saveSpecs(specs.filter((_, specIndex) => specIndex !== index))} className="text-slate-400 hover:text-red-500" aria-label={`Remove ${item.label}`}><Trash2 className="size-3.5" /></button>
              </div>
            ))}
            {specs.length < MAX_BOOKING_SPECS ? (
              <button type="button" onClick={() => saveSpecs([...specs, { label: "New label", value: "New value" }])} className="mt-2 w-full text-center text-[10px] font-semibold uppercase tracking-wide text-[#9b6d30] hover:text-[#0b1f35]">+ Add row</button>
            ) : null}
          </dl>
          <div
            className="mt-3.5 rounded-[8px] p-2.5 text-white"
            style={resolveBenefitsBackgroundStyle(value, customGradients)}
          >
            <div className="border border-dashed border-white/65 px-3 py-2.5">
              <input value={value.benefitsTitle || ""} onChange={(event) => patch("benefitsTitle", event.target.value)} className="w-full bg-transparent text-center text-[12px] font-bold tracking-[0.04em] text-[#f2cd75] outline-none" />
              <div className="mt-1 space-y-1">
                {value.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <input
                      value={benefit}
                      onChange={(event) => patch("benefits", value.benefits.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                      className="w-full bg-transparent text-center text-[11px] outline-none"
                    />
                    <button type="button" onClick={() => patch("benefits", value.benefits.filter((_, itemIndex) => itemIndex !== index))} className="text-white/80 hover:text-white" aria-label="Remove benefit"><Trash2 className="size-3.5" /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => patch("benefits", [...value.benefits, "New benefit"])} className="mt-2 w-full text-center text-[10px] font-semibold text-white/80 hover:text-white">+ Add benefit</button>
            </div>
          </div>
          <input value={value.propertyText} onChange={(event) => patch("propertyText", event.target.value)} className="mt-3 w-full bg-transparent text-center text-[10px] outline-none" />
          <input value={value.pricePrefix} onChange={(event) => patch("pricePrefix", event.target.value)} className="w-full bg-transparent text-center text-[11px] outline-none" />
          <div className="mt-0.5 flex items-baseline justify-center gap-2">
            <input value={value.price} onChange={(event) => patch("price", event.target.value)} className="w-32 bg-transparent text-center text-[31px] font-extrabold outline-none" />
            <input value={value.priceSuffix} onChange={(event) => patch("priceSuffix", event.target.value)} className="w-20 bg-transparent text-[11px] outline-none" />
          </div>
          <div
            className="mt-3 flex min-h-10 w-full items-center justify-center rounded-[6px] [background:var(--fill-secondary)] px-5 text-center text-[12px] font-bold text-white"
            style={{
              ...resolveButtonBackgroundStyle(value.button, customGradients),
              color: value.button.textColor || "#ffffff",
            }}
          >
            {value.button.label}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 border-t border-[#ece9e3] pt-3">
            <input value={value.ratingSource} onChange={(event) => patch("ratingSource", event.target.value)} className="w-8 rounded bg-white px-1 text-center text-[12px] font-bold text-[#4285f4] shadow outline-none" />
            <input type="number" min={0} max={5} value={value.ratingStars} onChange={(event) => patch("ratingStars", Number(event.target.value))} className="w-12 bg-transparent text-center text-[11px] outline-none" />
            <input value={value.ratingLabel} onChange={(event) => patch("ratingLabel", event.target.value)} className="min-w-0 flex-1 bg-transparent text-[10px] outline-none" />
          </div>
        </div>
      </aside>

      <div className="min-w-0 max-w-md flex-1">
        <CtaBox title="Offer card button" cta={value.button} onChange={(next) => patch("button", next)} intents={intents} />
      </div>
      </div>

      {appearanceOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(event) => event.target === event.currentTarget && setAppearanceOpen(false)}>
          <div className="max-h-[min(85vh,560px)] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#0b1f35]">Card appearance</h3>
              <button type="button" onClick={() => setAppearanceOpen(false)} className="inline-flex size-8 items-center justify-center rounded-md hover:bg-slate-100" aria-label="Close"><X className="size-4" /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="mb-2 text-[12px] font-medium text-[#0b1f35]">Header bar</p>
                <ButtonBackgroundPicker
                  value={{
                    backgroundType: value.headerBackgroundType,
                    backgroundColor: value.headerColor,
                    backgroundGradient: value.headerBackgroundGradient,
                  }}
                  onChange={(next) => {
                    patch("headerBackgroundType", next.backgroundType || "plain");
                    patch("headerColor", next.backgroundColor || value.headerColor);
                    patch("headerBackgroundGradient", next.backgroundGradient || "golden");
                  }}
                  showTextColor={false}
                  plainLabel="Header fill"
                />
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="mb-2 text-[12px] font-medium text-[#0b1f35]">Card background</p>
                <ButtonBackgroundPicker
                  value={{
                    backgroundType: value.backgroundType,
                    backgroundColor: value.backgroundColor,
                    backgroundGradient: value.backgroundGradient,
                  }}
                  onChange={(next) => {
                    patch("backgroundType", next.backgroundType || "plain");
                    patch("backgroundColor", next.backgroundColor || value.backgroundColor);
                    patch("backgroundGradient", next.backgroundGradient || "golden");
                  }}
                  showTextColor={false}
                  plainLabel="Card fill"
                />
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="mb-2 text-[12px] font-medium text-[#0b1f35]">Benefits box</p>
                <ButtonBackgroundPicker
                  value={{
                    backgroundType: value.benefitsBackgroundType || "plain",
                    backgroundColor: value.benefitsBackgroundColor || value.benefitsStartColor,
                    backgroundGradient: value.benefitsBackgroundGradient,
                  }}
                  onChange={(next) => {
                    patch("benefitsBackgroundType", next.backgroundType || "plain");
                    patch("benefitsBackgroundColor", next.backgroundColor || value.benefitsStartColor);
                    patch("benefitsBackgroundGradient", next.backgroundGradient || "golden");
                    if (next.backgroundType === "plain" && next.backgroundColor) {
                      patch("benefitsStartColor", next.backgroundColor);
                      patch("benefitsEndColor", next.backgroundColor);
                    }
                  }}
                  showTextColor={false}
                  plainLabel="Benefits fill"
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 md:max-w-md">
              <CompactColorField label="Body text color" value={value.textColor} onChange={(next) => patch("textColor", next)} />
              <CompactColorField
                label="Specs panel"
                value={value.specsBackgroundColor || "#f7f5f1"}
                onChange={(next) => patch("specsBackgroundColor", next)}
              />
            </div>
            <div className="mt-4 rounded-xl border border-dashed border-[#b98945]/35 bg-[#fffaf3]/70 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0b1f35]">Mobile border &amp; margin</p>
              <p className="mt-1 text-[11px] text-slate-500">
                On phones the offer card has no drop shadow. Set border and side margin here.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <CompactColorField
                  label="Border color"
                  value={value.borderColorMobile || "#E5E7EB"}
                  onChange={(next) => patch("borderColorMobile", next)}
                />
                <label>
                  <span className="admin-label">Border width (px)</span>
                  <input
                    type="number"
                    min={0}
                    max={8}
                    value={typeof value.borderWidthMobile === "number" ? value.borderWidthMobile : 1}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      if (!Number.isFinite(next)) return;
                      patch("borderWidthMobile", Math.min(8, Math.max(0, Math.round(next))));
                    }}
                    className="admin-input"
                  />
                </label>
                <label>
                  <span className="admin-label">Side margin (px)</span>
                  <input
                    type="number"
                    min={0}
                    max={48}
                    value={typeof value.marginXMobile === "number" ? value.marginXMobile : 0}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      if (!Number.isFinite(next)) return;
                      patch("marginXMobile", Math.min(48, Math.max(0, Math.round(next))));
                    }}
                    className="admin-input"
                  />
                </label>
              </div>
            </div>
            <button type="button" onClick={() => setAppearanceOpen(false)} className="mt-4 inline-flex min-h-9 items-center rounded-lg bg-[#0b1f35] px-4 text-[12px] font-semibold text-white">Done</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function HeroFactsEditor({
  items,
  factsEnabled,
  hero,
  onUpdate,
}: {
  items: HeroFact[];
  factsEnabled: boolean;
  hero: SiteData["hero"];
  onUpdate: (path: PathPart[], value: unknown) => void;
}) {
  const [editing, setEditing] = useState<number | null>(null);

  const saveItem = (index: number, next: HeroFact) => {
    onUpdate(["heroFacts", index], next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h2 className="text-[14px] font-medium text-[#0b1f35]">Fact cards</h2>
            <p className="text-[11px] text-slate-500">{items.length} card{items.length === 1 ? "" : "s"} below the hero.</p>
          </div>
          <CompactToggle label="Show fact cards" checked={factsEnabled} onChange={(checked) => onUpdate(["hero", "factsEnabled"], checked)} />
        </div>
        <button
          type="button"
          onClick={() => {
            onUpdate(["heroFacts"], [...items, { icon: "building", value: "New", label: "New fact" }]);
            setEditing(items.length);
          }}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#b98945] px-3 text-[11px] font-semibold text-white hover:bg-[#a57738]"
        >
          <Plus className="size-3.5" /> Add card
        </button>
      </div>

      <div className="rounded-xl border border-dashed border-[#b98945]/40 bg-[#fffaf3]/80 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0b1f35]">Mobile appearance</p>
        <p className="mt-1 text-[11px] text-slate-500">
          Fact strip on phones: no drop shadow. Section background fills behind the strip; card background colors the icon box. Border width and side margin are adjustable.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <CompactColorField
            label="Section background (mobile)"
            value={hero.factsSectionBackgroundColorMobile || ""}
            onChange={(next) => onUpdate(["hero", "factsSectionBackgroundColorMobile"], next || undefined)}
          />
          <CompactColorField
            label="Card / strip background (mobile)"
            value={hero.factsBackgroundColorMobile || "#ffffff"}
            onChange={(next) => onUpdate(["hero", "factsBackgroundColorMobile"], next)}
          />
          <CompactColorField
            label="Border color (mobile)"
            value={hero.factsBorderColorMobile || "#E5E7EB"}
            onChange={(next) => onUpdate(["hero", "factsBorderColorMobile"], next)}
          />
          <label>
            <span className="admin-label">Border width (mobile, px)</span>
            <input
              type="number"
              min={0}
              max={8}
              value={typeof hero.factsBorderWidthMobile === "number" ? hero.factsBorderWidthMobile : 1}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (!Number.isFinite(next)) return;
                onUpdate(["hero", "factsBorderWidthMobile"], Math.min(8, Math.max(0, Math.round(next))));
              }}
              className="admin-input"
            />
          </label>
          <label>
            <span className="admin-label">Side margin (mobile, px)</span>
            <input
              type="number"
              min={0}
              max={48}
              value={typeof hero.factsMarginXMobile === "number" ? hero.factsMarginXMobile : 0}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (!Number.isFinite(next)) return;
                onUpdate(["hero", "factsMarginXMobile"], Math.min(48, Math.max(0, Math.round(next))));
              }}
              className="admin-input"
            />
          </label>
          <label>
            <span className="admin-label">Top margin (mobile, px)</span>
            <input
              type="number"
              min={0}
              max={120}
              placeholder="Default (24px)"
              value={typeof hero.factsMarginTopMobile === "number" ? hero.factsMarginTopMobile : ""}
              onChange={(event) => {
                const raw = event.target.value.trim();
                if (!raw) {
                  onUpdate(["hero", "factsMarginTopMobile"], undefined);
                  return;
                }
                const next = Number(raw);
                if (!Number.isFinite(next)) return;
                onUpdate(["hero", "factsMarginTopMobile"], Math.min(120, Math.max(0, Math.round(next))));
              }}
              className="admin-input"
            />
          </label>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item, index) => {
          const valueColor = item.valueColor || item.textColor || "#0b1f35";
          const labelColor = item.labelColor || item.textColor || "#64748b";
          return (
            <article key={`${item.label}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <div className="mx-auto flex size-12 items-center justify-center" style={{ color: item.iconColor || "#B98945" }}>
                <Icon name={item.icon} className="size-8" />
              </div>
              <p className="mt-2 text-[14px] font-semibold" style={{ color: valueColor }}>{item.value}</p>
              <p className="mt-1 text-[12px]" style={{ color: labelColor }}>{item.label}</p>
              <button type="button" onClick={() => setEditing(index)} className="mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-medium text-slate-700 hover:border-[#b98945]">
                <Pencil className="size-3.5" /> Edit
              </button>
            </article>
          );
        })}
      </div>

      {editing !== null && items[editing] ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24" onMouseDown={(event) => event.target === event.currentTarget && setEditing(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#0b1f35]">Edit fact card</h3>
              <button type="button" onClick={() => setEditing(null)} className="inline-flex size-8 items-center justify-center rounded-md hover:bg-slate-100" aria-label="Close"><X className="size-4" /></button>
            </div>
            <div className="space-y-3">
              <IconPicker
                label="Icon"
                value={items[editing].icon}
                color={items[editing].iconColor || "#B98945"}
                onChange={(icon) => saveItem(editing, { ...items[editing], icon })}
              />
              <CompactColorField
                label="Icon color"
                value={items[editing].iconColor || "#B98945"}
                onChange={(iconColor) => saveItem(editing, { ...items[editing], iconColor })}
              />
              <div className="grid grid-cols-2 gap-2">
                <CompactColorField
                  label="Value color"
                  value={items[editing].valueColor || items[editing].textColor || "#0b1f35"}
                  onChange={(valueColor) => saveItem(editing, { ...items[editing], valueColor })}
                />
                <CompactColorField
                  label="Label color"
                  value={items[editing].labelColor || items[editing].textColor || "#64748b"}
                  onChange={(labelColor) => saveItem(editing, { ...items[editing], labelColor })}
                />
              </div>
              <label>
                <span className="admin-label">Name</span>
                <input value={items[editing].label} onChange={(event) => saveItem(editing, { ...items[editing], label: event.target.value })} className="admin-input" />
              </label>
              <label>
                <span className="admin-label">Value</span>
                <input value={items[editing].value} onChange={(event) => saveItem(editing, { ...items[editing], value: event.target.value })} className="admin-input" />
              </label>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onUpdate(["heroFacts"], items.filter((_, index) => index !== editing));
                  setEditing(null);
                }}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
              <button type="button" onClick={() => setEditing(null)} className="inline-flex min-h-9 items-center rounded-lg bg-[#0b1f35] px-4 text-[12px] font-semibold text-white">Done</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
