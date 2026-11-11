"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type LightboxImage = {
  src: string;
  alt: string;
};

type ImageLightboxProps = {
  images: LightboxImage[];
  selectedIndex: number | null;
  onChange: (index: number) => void;
  onClose: () => void;
};

export function ImageLightbox({ images, selectedIndex, onChange, onClose }: ImageLightboxProps) {
  const selectedImage = selectedIndex === null ? null : images[selectedIndex];
  const hasNavigation = images.length > 1;

  useEffect(() => {
    if (!selectedImage || selectedIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && hasNavigation) {
        onChange((selectedIndex - 1 + images.length) % images.length);
      }
      if (event.key === "ArrowRight" && hasNavigation) {
        onChange((selectedIndex + 1) % images.length);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [hasNavigation, images.length, onChange, onClose, selectedImage, selectedIndex]);

  if (!selectedImage || selectedIndex === null) return null;

  const previous = () => onChange((selectedIndex - 1 + images.length) % images.length);
  const next = () => onChange((selectedIndex + 1) % images.length);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/88 p-3 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={selectedImage.alt}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[94svh] w-full max-w-6xl items-center justify-center overflow-hidden rounded-xl bg-black/35 p-2 sm:p-4">
        <img src={selectedImage.src} alt={selectedImage.alt} className="max-h-[88svh] max-w-full object-contain" />

        <button type="button" onClick={onClose} className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:[background:var(--fill-secondary)]" aria-label="Close image">
          <X className="size-5" aria-hidden="true" />
        </button>

        {hasNavigation ? (
          <>
            <button type="button" onClick={previous} className="absolute left-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:[background:var(--fill-secondary)] sm:left-4 sm:size-12" aria-label="Previous image">
              <ChevronLeft className="size-6" aria-hidden="true" />
            </button>
            <button type="button" onClick={next} className="absolute right-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:[background:var(--fill-secondary)] sm:right-4 sm:size-12" aria-label="Next image">
              <ChevronRight className="size-6" aria-hidden="true" />
            </button>
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-[11px] font-medium text-white">
              {selectedIndex + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
