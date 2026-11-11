import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { HomeCardAppearance } from "@/lib/homes";
import type { Property } from "@/types/site";
import { isHexColor, textStyle } from "@/lib/typography";

type PropertyCardProps = {
  property: Property;
  selected?: boolean;
  onSelect: (id: string) => void;
  appearance?: HomeCardAppearance;
};

export function PropertyCard({ property, selected, onSelect, appearance }: PropertyCardProps) {
  const linkColor = property.cta.textColor;
  const borderOn = appearance?.borderEnabled !== false;
  const customBorder = Boolean(appearance?.borderColor) || appearance?.borderWidth !== undefined || appearance?.borderEnabled === false;
  const cardStyle: CSSProperties = {};
  if (appearance?.backgroundColor) cardStyle.backgroundColor = appearance.backgroundColor;
  if (!borderOn) {
    cardStyle.border = "none";
    cardStyle.boxShadow = "none";
  } else if (customBorder) {
    cardStyle.borderStyle = "solid";
    if (appearance?.borderColor) cardStyle.borderColor = appearance.borderColor;
    if (appearance?.borderWidth !== undefined) cardStyle.borderWidth = `${appearance.borderWidth}px`;
    if (selected && appearance?.borderColor) cardStyle.boxShadow = `0 0 0 1px ${appearance.borderColor}`;
  }
  return (
    <button
      type="button"
      onClick={() => onSelect(property.id)}
      aria-pressed={selected}
      className={cn(
        "flex w-full min-w-0 cursor-pointer flex-col items-center justify-center rounded-lg border border-[var(--color-primary)]/8 bg-white px-5 py-8 text-center transition-colors hover:border-[var(--color-secondary)] hover:bg-[#fdfbf7] sm:px-6 sm:py-10",
        selected && !customBorder ? "border-[var(--color-secondary)] ring-1 ring-[var(--color-secondary)]" : "",
        !borderOn ? "hover:border-transparent" : "",
      )}
      style={cardStyle}
    >
      <p className="text-[20px] font-semibold leading-none text-[var(--color-primary)]" style={textStyle(property, "title")}>
        {property.title}
      </p>
      <p className="mt-1.5 text-[13px] text-[var(--color-muted)]" style={textStyle(property, "subtitle")}>{property.subtitle}</p>
      <p className="mt-5 text-[12px] font-medium text-[var(--color-text)]" style={textStyle(property, "area")}>{property.area}</p>
      <div className="mt-4">
        <p className="font-serif text-[23px] font-medium leading-none text-[var(--color-secondary)]" style={textStyle(property, "price")}>
          {property.price}
        </p>
        <p className="mt-1 text-[12px] text-[var(--color-muted)]" style={textStyle(property, "priceNote")}>{property.priceNote}</p>
      </div>
      <span
        className="mt-5 text-[11px] font-semibold tracking-wide text-[var(--color-secondary)] underline-offset-2 hover:underline"
        style={textStyle(
          property.cta,
          "label",
          isHexColor(linkColor) ? { color: linkColor.trim() } : undefined,
        )}
      >
        {property.cta.label || "View Details"}
      </span>
    </button>
  );
}
