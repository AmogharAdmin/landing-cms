import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { HomeTabAppearance } from "@/lib/homes";
import type { PropertyTab } from "@/types/site";

type PropertyTabsProps = {
  tabs: PropertyTab[];
  activeId: string;
  onChange: (id: string) => void;
  appearance?: HomeTabAppearance;
};

export function PropertyTabs({ tabs, activeId, onChange, appearance }: PropertyTabsProps) {
  const frameStyle: CSSProperties = {};
  if (appearance?.borderColor) frameStyle.borderColor = appearance.borderColor;
  if (appearance?.borderWidth !== undefined) {
    frameStyle.borderWidth = `${appearance.borderWidth}px`;
    if (appearance.borderWidth === 0) frameStyle.borderStyle = "none";
  }
  const manyTabs = tabs.length > 4;

  return (
    <div
      className="flex w-full overflow-x-auto self-start rounded-md border border-[var(--color-primary)]/10 bg-white p-1 hide-scrollbar sm:inline-flex sm:w-auto"
      style={frameStyle}
      role="tablist"
      aria-label="Home types"
    >
      {tabs.map((tab) => {
        const selected = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            id={`tab-${tab.id}`}
            className={cn(
              "min-w-0 cursor-pointer rounded px-1 py-3 text-[11px] font-medium transition-colors duration-300 sm:px-7 sm:py-2.5 sm:text-[12px]",
              manyTabs ? "min-w-[7rem] shrink-0" : "flex-1 sm:min-w-32",
              selected
                ? "[background:var(--fill-primary)] text-white shadow-sm"
                : "text-[var(--color-muted)] hover:[background:var(--fill-light)] hover:text-[var(--color-primary)]",
            )}
            style={selected ? {
              background: appearance?.activeColor,
              color: appearance?.activeTextColor || (appearance?.activeColor ? "#ffffff" : undefined),
            } : undefined}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
