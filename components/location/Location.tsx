"use client";

import { Container } from "@/components/ui/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ConnectivityCard } from "@/components/location/ConnectivityCard";
import { Map } from "@/components/location/Map";
import { NearbyPlaces } from "@/components/location/NearbyPlaces";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { textStyle } from "@/lib/typography";

const titleAlignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

export type LocationColumn = "connectivity" | "map" | "masterPlan";

export const DEFAULT_LOCATION_COLUMNS: LocationColumn[] = ["connectivity", "map", "masterPlan"];

export function resolveLocationColumns(order?: LocationColumn[] | null): LocationColumn[] {
  const fallback = [...DEFAULT_LOCATION_COLUMNS];
  if (!order || order.length !== 3) return fallback;
  const unique = Array.from(new Set(order));
  if (unique.length !== 3) return fallback;
  if (!fallback.every((key) => unique.includes(key))) return fallback;
  return order;
}

export function resolveVisibleLocationColumns(
  order?: LocationColumn[] | null,
  enabled?: Partial<Record<LocationColumn, boolean>> | null,
): LocationColumn[] {
  return resolveLocationColumns(order).filter((key) => enabled?.[key] !== false);
}

export function Location() {
  const { location } = useSiteData();
  const align = titleAlignClass[location.titleAlign ?? "left"];
  const title = location.label?.trim() || "LOCATION";
  const columns = resolveVisibleLocationColumns(location.columnOrder, location.columnsEnabled);
  const columnGrid =
    columns.length <= 1
      ? "grid-cols-1"
      : columns.length === 2
        ? "lg:grid-cols-2"
        : "lg:grid-cols-[0.9fr_1.2fr_0.9fr]";

  const renderColumn = (key: LocationColumn) => {
    if (key === "connectivity") return <ConnectivityCard key="connectivity" />;
    if (key === "map") return <Map key="map" />;
    return <NearbyPlaces key="masterPlan" />;
  };

  return (
    <section
      className="section bg-white pb-10 sm:pb-12"
      aria-labelledby="location-heading"
    >
      <Container>
        <div className={`mb-5 sm:mb-6 ${align}`}>
          <SectionLabel id="location-heading" style={textStyle(location, "label")}>{title}</SectionLabel>
        </div>
        {columns.length ? (
          <div className={`grid gap-3 rounded-xl border border-[var(--color-primary)]/8 p-2 sm:gap-4 sm:p-3 lg:items-stretch ${columnGrid}`}>
            {columns.map((key) => renderColumn(key))}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
