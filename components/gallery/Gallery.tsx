"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { GalleryCard } from "@/components/gallery/GalleryCard";
import { textStyle } from "@/lib/typography";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { ChevronLeft, ChevronRight } from "lucide-react";

const GRID_CLASS: Record<number, string> = {
  2: "grid grid-cols-2 gap-4",
  3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
  4: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4",
  5: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4",
  6: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4",
};

const CAROUSEL_ITEM_CLASS: Record<number, string> = {
  2: "w-[85vw] max-w-[340px] shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] sm:max-w-none",
  3: "w-[85vw] max-w-[340px] shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)] sm:max-w-none",
  4: "w-[85vw] max-w-[340px] shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)] sm:max-w-none",
  5: "w-[85vw] max-w-[340px] shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-4rem)/5)] sm:max-w-none",
  6: "w-[85vw] max-w-[340px] shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-5rem)/6)] sm:max-w-none",
};

export function Gallery() {
  const siteData = useSiteData();
  const { gallery } = siteData;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const columns = Math.min(6, Math.max(2, gallery.columnsPerRow ?? 3));
  const carouselEnabled = gallery.carouselEnabled !== false;
  const scrollTiming = Math.max(1, gallery.scrollTiming ?? 3);

  const gridClass = useMemo(() => GRID_CLASS[columns] || GRID_CLASS[3], [columns]);
  const itemClass = useMemo(() => CAROUSEL_ITEM_CLASS[columns] || CAROUSEL_ITEM_CLASS[3], [columns]);

  const updateScrollButtons = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  }, []);

  useEffect(() => {
    if (!carouselEnabled) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [carouselEnabled, updateScrollButtons, gallery.images]);

  // Auto-scroll loop with configurable timing
  useEffect(() => {
    if (!carouselEnabled || gallery.images.length <= columns || isHovered || selectedIndex !== null) {
      return;
    }

    const interval = setInterval(() => {
      const el = scrollContainerRef.current;
      if (!el) return;
      const maxScrollLeft = el.scrollWidth - el.clientWidth - 5;
      if (el.scrollLeft >= maxScrollLeft) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        const firstChild = el.firstElementChild as HTMLElement | null;
        const cardWidth = firstChild ? firstChild.offsetWidth : 320;
        el.scrollBy({ left: cardWidth + 16, behavior: "smooth" });
      }
    }, scrollTiming * 1000);

    return () => clearInterval(interval);
  }, [carouselEnabled, columns, gallery.images.length, scrollTiming, isHovered, selectedIndex]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const firstChild = el.firstElementChild as HTMLElement | null;
    const cardWidth = firstChild ? firstChild.offsetWidth : 320;
    const scrollAmount = cardWidth + 16;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="section bg-white" aria-labelledby="gallery-heading">
      <Container>
        <div className="flex items-center justify-between gap-4">
          <div>
            <SectionLabel style={textStyle(gallery, "label")}>{gallery.label}</SectionLabel>
            <h2 id="gallery-heading" className="sr-only" style={textStyle(gallery, "heading")}>{gallery.heading}</h2>
          </div>
          {carouselEnabled && gallery.images.length > columns ? (
            <div className="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                aria-label="Previous gallery images"
                className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--color-primary)]/15 bg-white text-[var(--color-primary)] shadow-sm transition hover:[background:var(--fill-secondary)] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                aria-label="Next gallery images"
                className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--color-primary)]/15 bg-white text-[var(--color-primary)] shadow-sm transition hover:[background:var(--fill-secondary)] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          ) : null}
        </div>

        <div
          className="mt-5"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {carouselEnabled ? (
            <div className="overflow-hidden">
              <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto scroll-smooth hide-scrollbar snap-x snap-mandatory"
              >
                {gallery.images.map((image, index) => (
                  <GalleryCard
                    key={`${image.src}-${index}`}
                    image={image}
                    onOpen={() => setSelectedIndex(index)}
                    className={itemClass}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className={gridClass}>
              {gallery.images.map((image, index) => (
                <GalleryCard
                  key={`${image.src}-${index}`}
                  image={image}
                  onOpen={() => setSelectedIndex(index)}
                />
              ))}
            </div>
          )}

          {carouselEnabled && gallery.images.length > 1 ? (
            <p className="mt-3 text-center text-[11px] font-medium text-[var(--color-muted)] sm:hidden">
              Swipe to explore gallery
            </p>
          ) : null}
        </div>
      </Container>

      <ImageLightbox
        images={gallery.images}
        selectedIndex={selectedIndex}
        onChange={setSelectedIndex}
        onClose={() => setSelectedIndex(null)}
      />
    </section>
  );
}
