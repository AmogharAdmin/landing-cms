import type { SiteData } from "@/types/site";

export type HeroBackgroundMode = "image" | "video" | "carousel";

export type HeroCarouselImage = { src: string; alt?: string };

type HeroData = SiteData["hero"];

export function resolveHeroBackgroundMode(hero: HeroData): HeroBackgroundMode {
  const mode = hero.backgroundMode;
  if (mode === "video" || mode === "carousel" || mode === "image") return mode;
  return "image";
}

export function resolveHeroCarouselImages(hero: HeroData): HeroCarouselImage[] {
  const items = (hero.backgroundCarouselImages || [])
    .map((item) => ({ src: (item.src || "").trim(), alt: item.alt?.trim() || "" }))
    .filter((item) => item.src);
  if (items.length) return items;
  if (hero.backgroundImage?.trim()) {
    return [{ src: hero.backgroundImage.trim(), alt: hero.backgroundAlt || "" }];
  }
  return [];
}

export function resolveHeroCarouselIntervalMs(hero: HeroData) {
  const value = hero.backgroundCarouselIntervalMs;
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(60000, Math.max(1500, Math.round(value)));
  }
  return 5000;
}

export function isDirectVideoUrl(url: string) {
  const clean = url.trim().split("?")[0].toLowerCase();
  return /\.(mp4|webm|ogg)$/i.test(clean);
}

/** Build a muted looping YouTube embed URL suitable for hero backgrounds. */
export function toHeroVideoEmbedUrl(
  value: string,
  options: { autoplay?: boolean; muted?: boolean; loop?: boolean } = {},
): string | null {
  const autoplay = options.autoplay !== false;
  const muted = options.muted !== false;
  const loop = options.loop !== false;

  try {
    const url = new URL(value.trim());
    let videoId = "";

    if (url.hostname.includes("youtu.be")) {
      videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (url.hostname.includes("youtube.com") || url.hostname.includes("youtube-nocookie.com")) {
      if (url.pathname.startsWith("/embed/")) {
        videoId = url.pathname.split("/embed/")[1]?.split("/")[0] || "";
      } else if (url.pathname.startsWith("/shorts/")) {
        videoId = url.pathname.split("/shorts/")[1]?.split("/")[0] || "";
      } else {
        videoId = url.searchParams.get("v") || "";
      }
    }

    if (!videoId) return null;

    const params = new URLSearchParams({
      autoplay: autoplay ? "1" : "0",
      mute: muted ? "1" : "0",
      controls: "0",
      playsinline: "1",
      rel: "0",
      modestbranding: "1",
      disablekb: "1",
      iv_load_policy: "3",
      fs: "0",
    });
    if (loop) {
      params.set("loop", "1");
      params.set("playlist", videoId);
    }

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  } catch {
    return null;
  }
}

export function resolveHeroVideoSource(hero: HeroData): {
  kind: "youtube" | "file" | "none";
  src: string;
} {
  const raw = (hero.backgroundVideoUrl || "").trim();
  if (!raw) return { kind: "none", src: "" };

  if (isDirectVideoUrl(raw)) {
    return { kind: "file", src: raw };
  }

  const embed = toHeroVideoEmbedUrl(raw, {
    autoplay: hero.backgroundVideoAutoplay !== false,
    muted: hero.backgroundVideoMuted !== false,
    loop: hero.backgroundVideoLoop !== false,
  });
  if (embed) return { kind: "youtube", src: embed };

  // Unknown URL — try as file/source anyway
  return { kind: "file", src: raw };
}
