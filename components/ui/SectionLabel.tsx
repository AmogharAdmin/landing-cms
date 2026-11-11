import { cn } from "@/lib/cn";
import type { CSSProperties } from "react";

type SectionLabelProps = {
  children: React.ReactNode;
  className?: string;
  light?: boolean;
  style?: CSSProperties;
  id?: string;
};

export function SectionLabel({ children, className, light, style, id }: SectionLabelProps) {
  return (
    <p
      id={id}
      className={cn(
        "eyebrow",
        light && "text-white/70",
        className,
      )}
      style={style}
    >
      {children}
    </p>
  );
}
