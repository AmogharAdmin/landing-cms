import Image from "next/image";
import { cn } from "@/lib/cn";

type MediaImageProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
};

function shouldSkipOptimization(src: string) {
  const lower = src.toLowerCase();
  return lower.endsWith(".svg") || lower.includes("data:");
}

export function MediaImage({
  src,
  alt,
  className,
  imageClassName,
  priority = false,
  sizes = "100vw",
  quality = 75,
}: MediaImageProps) {
  const skipOpt = shouldSkipOptimization(src);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        quality={quality}
        unoptimized={skipOpt}
        className={cn("object-cover", imageClassName)}
      />
    </div>
  );
}
