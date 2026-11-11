"use client";

import { createContext, useContext } from "react";
import type { CustomButtonGradient, SiteData } from "@/types/site";

const SiteDataContext = createContext<SiteData | null>(null);

export function SiteDataProvider({ data, children }: { data: SiteData; children: React.ReactNode }) {
  return <SiteDataContext.Provider value={data}>{children}</SiteDataContext.Provider>;
}

export function useSiteData() {
  const value = useContext(SiteDataContext);
  if (!value) throw new Error("useSiteData must be used inside SiteDataProvider.");
  return value;
}

export function useOptionalSiteData() {
  return useContext(SiteDataContext);
}

export function useCustomButtonGradients(): CustomButtonGradient[] {
  return useContext(SiteDataContext)?.customButtonGradients || [];
}
