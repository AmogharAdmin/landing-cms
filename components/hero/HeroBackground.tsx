"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { SiteData } from "@/types/site";
import {
  resolveHeroBackgroundMode,
  resolveHeroCarouselImages,
  resolveHeroCarouselIntervalMs,
  resolveHeroVideoSource,
} from "@/lib/hero-background";
import { hasCustomHeroOverlay } from "@/lib/hero-overlay";

type HeroBackgroundProps = {
  hero: SiteData["hero"];
};

function isSvgSrc(src: string) {
  return src.toLowerCase().split("?")[0]?.endsWith(".svg") ?? false;
}

function HeroImageBackground({
  src,
  alt,
  priority = true,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      fetchPriority={priority ? "high" : "auto"}
      sizes="100vw"
      quality={70}
      unoptimized={isSvgSrc(src)}
      className="object-cover object-[center_42%]"
    />
  );
}

function HeroVideoBackground({ hero }: { hero: SiteData["hero"] }) {
  const source = resolveHeroVideoSource(hero);
  const poster = (hero.backgroundVideoPoster || hero.backgroundImage || "").trim();
  const autoplay = hero.backgroundVideoAutoplay !== false;
  const muted = hero.backgroundVideoMuted !== false;
  const loop = hero.backgroundVideoLoop !== false;
  const overlayOpacity = hasCustomHeroOverlay(hero)
    ? 0
    : Math.min(1, Math.max(0, hero.backgroundVideoOverlayOpacity ?? 0));
  const [loadEmbed, setLoadEmbed] = useState(false);

  useEffect(() => {
    // Defer third-party YouTube until idle so it does not block LCP on mobile.
    if (source.kind !== "youtube") return;
    const start = () => setLoadEmbed(true);
    const ric = (window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    }).requestIdleCallback;
    const cic = (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
    if (typeof ric === "function") {
      const id = ric(start, { timeout: 2500 });
      return () => {
        if (typeof cic === "function") cic(id);
      };
    }
    const timer = window.setTimeout(start, 1800);
    return () => window.clearTimeout(timer);
  }, [source.kind]);

  if (source.kind === "none") {
    return <HeroImageBackground src={hero.backgroundImage} alt={hero.backgroundAlt} />;
  }

  return (
    <>
      {poster ? <HeroImageBackground src={poster} alt={hero.backgroundAlt} priority /> : null}
      {source.kind === "youtube" ? (
        loadEmbed ? (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <iframe
              src={source.src}
              title="Hero background video"
              className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-[125%] w-[177.78vh] min-w-[125%] -translate-x-1/2 -translate-y-1/2 border-0"
              allow="autoplay; encrypted-media; picture-in-picture"
              loading="lazy"
              tabIndex={-1}
            />
          </div>
        ) : null
      ) : (
        <video
          className="absolute inset-0 size-full object-cover object-[center_42%]"
          src={source.src}
          poster={poster || undefined}
          autoPlay={autoplay}
          muted={muted}
          loop={loop}
          playsInline
          preload="none"
          aria-label={hero.backgroundAlt || "Hero background video"}
        />
      )}
      {overlayOpacity > 0 ? (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
          aria-hidden="true"
        />
      ) : null}
    </>
  );
}

function HeroCarouselBackground({ hero }: { hero: SiteData["hero"] }) {
  const images = resolveHeroCarouselImages(hero);
  const intervalMs = resolveHeroCarouselIntervalMs(hero);
  const transition = hero.backgroundCarouselTransition === "slide" ? "slide" : "fade";
  const showDots = hero.backgroundCarouselShowDots === true;
  const pauseOnHover = hero.backgroundCarouselPauseOnHover !== false;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setIndex(0);
  }, [images.map((item) => item.src).join("|")]);

  useEffect(() => {
    if (images.length <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [images.length, intervalMs, paused]);

  if (!images.length) {
    return <HeroImageBackground src={hero.backgroundImage} alt={hero.backgroundAlt} />;
  }

  if (images.length === 1) {
    return <HeroImageBackground src={images[0].src} alt={images[0].alt || hero.backgroundAlt} />;
  }

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => pauseOnHover && setPaused(true)}
      onMouseLeave={() => pauseOnHover && setPaused(false)}
    >
      {transition === "fade" ? (
        images.map((image, imageIndex) => (
          <Image
            key={`${image.src}-${imageIndex}`}
            src={image.src}
            alt=""
            aria-hidden="true"
            fill
            sizes="100vw"
            quality={65}
            priority={imageIndex === 0}
            fetchPriority={imageIndex === 0 ? "high" : "low"}
            loading={imageIndex === 0 ? "eager" : "lazy"}
            unoptimized={isSvgSrc(image.src)}
            className="object-cover object-[center_42%] transition-opacity duration-1000 ease-out"
            style={{ opacity: imageIndex === index ? 1 : 0 }}
          />
        ))
      ) : (
        <div
          className="flex size-full transition-transform duration-700 ease-out"
          style={{ width: `${images.length * 100}%`, transform: `translateX(-${(index * 100) / images.length}%)` }}
        >
          {images.map((image, imageIndex) => (
            <div
              key={`${image.src}-${imageIndex}`}
              className="relative h-full shrink-0"
              style={{ width: `${100 / images.length}%` }}
            >
              <Image
                src={image.src}
                alt=""
                aria-hidden="true"
                fill
                sizes="100vw"
                quality={65}
                priority={imageIndex === 0}
                fetchPriority={imageIndex === 0 ? "high" : "low"}
                loading={imageIndex === 0 ? "eager" : "lazy"}
                unoptimized={isSvgSrc(image.src)}
                className="object-cover object-[center_42%]"
              />
            </div>
          ))}
        </div>
      )}
      <span className="sr-only">{images[index]?.alt || hero.backgroundAlt}</span>
      {showDots ? (
        <div className="absolute inset-x-0 bottom-4 z-[5] flex justify-center gap-1.5" aria-hidden="true">
          {images.map((_, dotIndex) => (
            <span
              key={dotIndex}
              className={`h-1.5 rounded-full transition-all ${dotIndex === index ? "w-5 bg-white" : "w-1.5 bg-white/45"}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function HeroBackground({ hero }: HeroBackgroundProps) {
  const mode = resolveHeroBackgroundMode(hero);

  if (mode === "video") return <HeroVideoBackground hero={hero} />;
  if (mode === "carousel") return <HeroCarouselBackground hero={hero} />;
  return <HeroImageBackground src={hero.backgroundImage} alt={hero.backgroundAlt} />;
}
