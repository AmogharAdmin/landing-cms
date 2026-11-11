import Image from "next/image";
import type { GalleryImage } from "@/types/site";
import { cn } from "@/lib/cn";

type GalleryCardProps = {
  image: GalleryImage;
  onOpen: () => void;
  className?: string;
};

export function GalleryCard({ image, onOpen, className }: GalleryCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group relative h-[220px] w-full overflow-hidden rounded-lg [background:var(--fill-light)] sm:h-[260px] lg:h-[310px]",
        className,
      )}
      aria-label={`Open larger image: ${image.alt}`}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        quality={65}
        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
      <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" aria-hidden="true" />
    </button>
  );
}
