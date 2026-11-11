"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { PropertyTabs } from "@/components/homes/PropertyTabs";
import { PropertyCard } from "@/components/homes/PropertyCard";
import { HomesList } from "@/components/homes/HomesList";
import { FloorPlanViewer } from "@/components/homes/FloorPlanViewer";
import { findFloorPlan, propertiesForTab, resolveHomeCardAppearance, resolveHomeTabAppearance } from "@/lib/homes";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/cn";

export function Homes() {
  const siteData = useSiteData();
  const { homes } = siteData;
  const tabs = homes.tabs ?? [];
  const hideTabs = homes.hideCategoryTabs === true;
  const [tabId, setTabId] = useState(tabs[0]?.id ?? "");
  const showFloorPlanPanel = homes.floorPlanPanelEnabled !== false;
  const activeTabId = hideTabs ? (tabs[0]?.id ?? "") : tabId;

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === tabId)) {
      setTabId(tabs[0]?.id ?? "");
    }
  }, [tabs, tabId]);

  const visibleProperties = useMemo(
    () => propertiesForTab(homes.properties, activeTabId),
    [homes.properties, activeTabId],
  );

  const [selectedId, setSelectedId] = useState(visibleProperties[0]?.id ?? "");

  useEffect(() => {
    if (!visibleProperties.some((property) => property.id === selectedId)) {
      setSelectedId(visibleProperties[0]?.id ?? "");
    }
  }, [visibleProperties, selectedId]);

  const selectedProperty =
    visibleProperties.find((property) => property.id === selectedId) ??
    visibleProperties[0];

  const activePlan = selectedProperty
    ? findFloorPlan(selectedProperty, homes.floorPlans)
    : undefined;
  const imageSize = homes.floorPlanImageSize ?? "standard";
  const showPlan = showFloorPlanPanel && Boolean(activePlan);
  const tabAppearance = resolveHomeTabAppearance(homes);
  const cardAppearance = resolveHomeCardAppearance(homes);

  const handleTabChange = (id: string) => {
    setTabId(id);
    const next = propertiesForTab(homes.properties, id)[0];
    setSelectedId(next?.id ?? "");
  };

  return (
    <section
      id="homes"
      className="section bg-[#fbfaf8]"
      aria-labelledby="homes-heading"
    >
      <Container>
        <div>
          <SectionLabel style={textStyle(homes, "label")}>{homes.label}</SectionLabel>
        </div>
        {tabs.length > 0 && !hideTabs ? (
          <div className="sticky top-[var(--mobile-header-offset,100px)] z-20 -mx-5 mt-3 bg-[#fbfaf8]/95 px-5 py-2.5 backdrop-blur sm:static sm:mx-0 sm:mt-5 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
            <PropertyTabs tabs={tabs} activeId={tabId} onChange={handleTabChange} appearance={tabAppearance} />
          </div>
        ) : null}

        {homes.layout === "list" ? (
          visibleProperties.length === 0 ? (
            <>
              <h2 id="homes-heading" className="sr-only">{homes.heading || homes.label}</h2>
              <p className="mt-8 rounded-xl border border-[var(--color-primary)]/8 bg-white px-5 py-10 text-center text-sm text-[var(--color-muted)]">
                No homes are listed in this category yet.
              </p>
            </>
          ) : (
            <HomesList homes={homes} properties={visibleProperties} />
          )
        ) : (
          <>
        <h2 id="homes-heading" className="sr-only">{homes.heading}</h2>
        {visibleProperties.length === 0 ? (
          <p className="mt-8 rounded-xl border border-[var(--color-primary)]/8 bg-white px-5 py-10 text-center text-sm text-[var(--color-muted)]">
            No homes are listed in this category yet.
          </p>
        ) : !showPlan ? (
          <div
            className={cn(
              "mt-4 mx-auto grid w-full gap-3",
              visibleProperties.length === 1
                ? "max-w-[360px] grid-cols-1"
                : visibleProperties.length === 2
                  ? "max-w-3xl grid-cols-1 justify-items-center sm:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            )}
          >
            {visibleProperties.map((property) => (
              <div
                key={property.id}
                className={cn(
                  "w-full",
                  visibleProperties.length <= 2 && "max-w-[360px]",
                )}
              >
                <PropertyCard property={property} selected={property.id === selectedProperty?.id} onSelect={setSelectedId} appearance={cardAppearance} />
              </div>
            ))}
          </div>
        ) : visibleProperties.length === 1 ? (
          <div className="mt-4 flex flex-col items-center justify-center gap-6 lg:flex-row lg:items-start lg:justify-center">
            <div className="w-full max-w-[360px]">
              {visibleProperties.map((property) => {
                const propertyPlan = findFloorPlan(property, homes.floorPlans);
                const selected = property.id === selectedProperty?.id;

                return (
                  <Fragment key={property.id}>
                    <PropertyCard property={property} selected={selected} onSelect={setSelectedId} appearance={cardAppearance} />
                    {selected && propertyPlan ? (
                      <div className="mt-4 lg:hidden">
                        <FloorPlanViewer plan={propertyPlan} imageSize={imageSize} />
                      </div>
                    ) : null}
                  </Fragment>
                );
              })}
            </div>

            {activePlan ? (
              <div className="hidden w-full max-w-[560px] lg:block">
                <FloorPlanViewer plan={activePlan} imageSize={imageSize} />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 grid items-start gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {visibleProperties.map((property) => {
                const propertyPlan = findFloorPlan(property, homes.floorPlans);
                const selected = property.id === selectedProperty?.id;

                return (
                  <Fragment key={property.id}>
                    <PropertyCard property={property} selected={selected} onSelect={setSelectedId} appearance={cardAppearance} />
                    {selected && propertyPlan ? (
                      <div className="sm:col-span-2 lg:hidden">
                        <FloorPlanViewer plan={propertyPlan} imageSize={imageSize} />
                      </div>
                    ) : null}
                  </Fragment>
                );
              })}
            </div>

            {activePlan ? (
              <div className="hidden lg:block">
                <FloorPlanViewer plan={activePlan} imageSize={imageSize} />
              </div>
            ) : null}
          </div>
        )}
          </>
        )}
      </Container>
    </section>
  );
}
