import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: "div" | "section" | "header" | "footer" | "nav";
};

export function Container({
  children,
  className,
  style,
  as: Tag = "div",
}: ContainerProps) {
  return (
    <Tag className={cn("mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12", className)} style={style}>
      {children}
    </Tag>
  );
}
