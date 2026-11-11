"use client";

import { LockKeyhole } from "lucide-react";
import { CtaLink } from "@/components/ui/CtaLink";
import { homeRowClickSource, leadClickSourceById } from "@/lib/lead-form-buttons";
import { textStyle } from "@/lib/typography";
import type { Property, SiteData } from "@/types/site";

type HomesListProps = {
  homes: SiteData["homes"];
  properties: Property[];
};

function rowPrice(property: Property) {
  return [property.price, property.priceNote].filter((part) => part?.trim()).join(" ");
}

export function HomesList({ homes, properties }: HomesListProps) {
  const typeLabel = homes.listTypeLabel?.trim() || "Type";
  const areaLabel = homes.listAreaLabel?.trim() || "Saleable Area";
  const priceLabel = homes.listPriceLabel?.trim() || "Price";
  const image = homes.listImage?.trim() || "";
  const downloadCta = homes.listCta;
  const showDownload = Boolean(downloadCta?.label?.trim());
  const headingStyle = textStyle(homes, "heading");
  const isLocked = homes.floorPlanLocked !== false;
  const blurAmount = Math.min(20, Math.max(0, homes.floorPlanBlur ?? 3));

  return (
    <div className="mt-6 grid items-start gap-5 pb-24 sm:pb-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.72fr)] lg:gap-6">
      <div className="min-w-0">
        {homes.heading ? (
          <h2
            id="homes-heading"
            className="text-[22px] font-semibold leading-tight text-[var(--color-secondary)] sm:text-[26px]"
            style={headingStyle}
          >
            {homes.heading}
          </h2>
        ) : (
          <h2 id="homes-heading" className="sr-only">{homes.label || "Homes"}</h2>
        )}

        {/* Mobile: stacked cards so type / area / price / CTA all fit */}
        <ul className="mt-4 space-y-3 md:hidden">
          {properties.map((property, rowIndex) => {
            const sourceIndex = homes.properties.findIndex((item) => item.id === property.id);
            const price = rowPrice(property);
            return (
              <li
                key={property.id}
                className="rounded-lg border border-[var(--color-primary)]/10 bg-white px-4 py-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
                      {typeLabel}
                    </p>
                    <p
                      className="mt-0.5 text-[16px] font-semibold leading-snug text-[var(--color-text)]"
                      style={textStyle(property, "title")}
                    >
                      {property.title}
                    </p>
                  </div>
                  {price ? (
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
                        {priceLabel}
                      </p>
                      <p
                        className="mt-0.5 text-[15px] font-semibold leading-snug text-[var(--color-primary)]"
                        style={textStyle(property, "price")}
                      >
                        {price}
                      </p>
                    </div>
                  ) : null}
                </div>
                {property.area?.trim() ? (
                  <p className="mt-2 text-[13px] text-[var(--color-muted)]">
                    <span className="font-medium text-[var(--color-text)]">{areaLabel}: </span>
                    <span style={textStyle(property, "area")}>{property.area}</span>
                  </p>
                ) : null}
                {property.cta?.label?.trim() ? (
                  <div className="mt-3">
                    <CtaLink
                      cta={property.cta}
                      variant="primary"
                      showArrow={false}
                      fullWidth
                      className="min-h-10 rounded-md px-4 py-2.5 text-[13px] font-semibold"
                      leadClickSource={homeRowClickSource(sourceIndex >= 0 ? sourceIndex : rowIndex, property.title)}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        {/* Desktop / tablet: full pricing table */}
        <div className="mt-4 hidden overflow-x-auto rounded-md border border-[var(--color-primary)]/10 bg-white md:block">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--color-primary)]/10 text-[13px] font-medium text-[var(--color-muted)]">
                <th scope="col" className="px-4 py-3 font-medium">{typeLabel}</th>
                <th scope="col" className="px-4 py-3 font-medium">{areaLabel}</th>
                <th scope="col" className="px-4 py-3 font-medium">{priceLabel}</th>
                <th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property, rowIndex) => {
                const sourceIndex = homes.properties.findIndex((item) => item.id === property.id);
                const price = rowPrice(property);
                return (
                  <tr key={property.id} className={rowIndex % 2 === 1 ? "bg-[#f6f7f8]" : "bg-white"}>
                    <td className="px-4 py-3.5 text-[14px] font-medium text-[var(--color-text)]" style={textStyle(property, "title")}>
                      {property.title}
                    </td>
                    <td className="px-4 py-3.5 text-[14px] text-[var(--color-text)]" style={textStyle(property, "area")}>
                      {property.area}
                    </td>
                    <td className="px-4 py-3.5 text-[14px] text-[var(--color-text)]" style={textStyle(property, "price")}>
                      {price}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {property.cta?.label?.trim() ? (
                        <CtaLink
                          cta={property.cta}
                          variant="primary"
                          showArrow={false}
                          className="min-h-9 rounded-md px-4 py-2 text-[13px] font-semibold"
                          leadClickSource={homeRowClickSource(sourceIndex >= 0 ? sourceIndex : rowIndex, property.title)}
                        />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="rounded-md border border-[var(--color-primary)]/10 bg-white p-3 sm:p-4">
        {image ? (
          <div className="relative overflow-hidden rounded-md bg-[#f7f7f8]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={homes.listImageAlt?.trim() || homes.heading || "Pricing details"}
              className="aspect-[4/3] w-full object-contain"
              style={isLocked && blurAmount > 0 ? { filter: `blur(${blurAmount}px)`, WebkitFilter: `blur(${blurAmount}px)` } : undefined}
            />
            {isLocked ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/12" aria-label="Preview locked">
                <span className="flex size-14 items-center justify-center rounded-full border border-white/80 bg-[var(--color-primary)]/88 text-white shadow-xl">
                  <LockKeyhole className="size-6" aria-hidden="true" />
                </span>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center rounded-md border border-dashed border-[var(--color-primary)]/15 bg-[#f7f7f8] px-6 text-center text-[13px] text-[var(--color-muted)]">
            Add an image from Homes & Floor Plans.
          </div>
        )}
        {showDownload && downloadCta ? (
          <div className="mt-3">
            <CtaLink
              cta={downloadCta}
              variant="primary"
              showArrow={false}
              fullWidth
              className="min-h-11 rounded-md text-[14px] font-semibold"
              leadClickSource={leadClickSourceById.homesListDownload}
            />
          </div>
        ) : null}
      </aside>
    </div>
  );
}
