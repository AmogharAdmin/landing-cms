"use client";

import { useState } from "react";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { ChevronDown } from "lucide-react";
import { isHexColor, textStyle } from "@/lib/typography";

export function ConnectivityCard() {
  const siteData = useSiteData();
  const { location } = siteData;
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const background = isHexColor(location.connectivityBackgroundColor) ? location.connectivityBackgroundColor : undefined;
  const iconColor = isHexColor(location.connectivityIconColor) ? location.connectivityIconColor : undefined;

  return (
    <article
      className={`flex h-full flex-col justify-between rounded-lg p-5 text-white sm:p-8 ${background ? "" : "[background:var(--fill-dark)]"}`}
      style={background ? { backgroundColor: background } : undefined}
    >
      <div>
        <h2 className="text-[18px] font-semibold leading-[1.3]" style={textStyle(location, "heading")}>
          {location.heading}
          <span className="mt-1 block text-[var(--color-accent)]" style={textStyle(location, "headingAccent")}>
            {location.headingAccent}
          </span>
        </h2>
        <div className="mt-6 space-y-2 sm:mt-8">
          {location.connectivity.map((group, index) => {
            const expanded = openIndex === index;

            return (
            <div key={group.label} className="rounded-md border border-white/10 bg-white/[0.03]">
              <button
                type="button"
                onClick={() => setOpenIndex(expanded ? null : index)}
                className="flex min-h-11 w-full items-center justify-between gap-3 px-4 text-left text-[13px] font-semibold text-white/90"
                style={textStyle(location, "connectivityGroup")}
                aria-expanded={expanded}
                aria-controls={`connectivity-panel-${index}`}
              >
                {group.label}
                <ChevronDown
                  className={`size-4 shrink-0 transition-transform duration-300 ${iconColor ? "" : "text-[var(--color-accent)]"} ${expanded ? "rotate-180" : ""}`}
                  style={iconColor ? { color: iconColor } : undefined}
                />
              </button>
              <div id={`connectivity-panel-${index}`} className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                  <ul className="border-t border-white/10 px-4 py-2">
                    {group.items.map((item) => (
                      <li key={item.label} className="flex items-start justify-between gap-3 border-b border-white/8 py-2.5 text-[12px] last:border-0">
                        <span className="text-white/70" style={textStyle(location, "connectivityItem")}>{item.label}</span>
                        <span className="shrink-0 font-semibold text-[var(--color-accent)]" style={textStyle(location, "connectivityTime")}>{item.time}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
