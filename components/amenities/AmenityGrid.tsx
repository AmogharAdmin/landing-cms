import { Icon } from "@/components/ui/Icon";
import type { AmenityItem } from "@/types/site";

/** Uploaded SVG/PNG when set, otherwise the library icon tinted with iconColor. */
export function AmenityIcon({ item, className }: { item: Pick<AmenityItem, "icon" | "iconImage">; className: string }) {
  if (item.iconImage) {
    return <img src={item.iconImage} alt="" aria-hidden="true" loading="lazy" decoding="async" className={`${className} object-contain`} />;
  }
  return <Icon name={item.icon} className={className} />;
}

export function AmenityGrid({ items }: { items: AmenityItem[] }) {
  const pages = Array.from({ length: Math.ceil(items.length / 6) }, (_, index) =>
    items.slice(index * 6, index * 6 + 6),
  );

  return (
    <>
      <div className="-mx-5 flex snap-x snap-mandatory overflow-x-auto px-5 hide-scrollbar sm:hidden">
        {pages.map((page, pageIndex) => (
          <ul key={pageIndex} className="grid min-w-full snap-center grid-cols-2 gap-x-3 gap-y-7 py-1">
            {page.map((item) => (
              <li key={item.label} className="flex flex-col items-center gap-2 text-center">
                <span className="flex size-12 items-center justify-center text-[var(--color-secondary)]" style={item.iconColor ? { color: item.iconColor } : undefined}>
                  <AmenityIcon item={item} className="size-8" />
                </span>
                <span className="text-[12px] font-medium leading-tight text-[var(--color-text)]" style={item.textColor ? { color: item.textColor } : undefined}>{item.label}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
      <div className="mt-4 flex justify-center gap-1.5 sm:hidden" aria-hidden="true">
        {pages.map((_, index) => <span key={index} className="size-1.5 rounded-full bg-[var(--color-secondary)]/45" />)}
      </div>
      <ul className="hidden grid-cols-3 gap-x-3 gap-y-6 sm:grid md:grid-cols-5">
        {items.map((item) => (
          <li key={item.label} className="flex flex-col items-center gap-2 text-center md:last:col-span-1">
            <span className="flex size-11 shrink-0 items-center justify-center text-[var(--color-secondary)]" style={item.iconColor ? { color: item.iconColor } : undefined}>
              <AmenityIcon item={item} className="size-8" />
            </span>
            <span className="text-[11px] font-medium leading-tight text-[var(--color-text)]" style={item.textColor ? { color: item.textColor } : undefined}>{item.label}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
