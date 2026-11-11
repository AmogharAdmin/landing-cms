import type { FloorPlan, Property } from "@/types/site";

export function findFloorPlan(property: Property, floorPlans: FloorPlan[]): FloorPlan | undefined {
  return (
    floorPlans.find((plan) => plan.id === property.floorPlanId) ??
    floorPlans.find((plan) => plan.propertyId === property.id) ??
    floorPlans.find((plan) => plan.id === property.id)
  );
}

export function propertiesForTab(properties: Property[], tabId: string): Property[] {
  if (!tabId) return [];
  return properties.filter((property) => property.tab === tabId);
}

export type HomeTabAppearance = {
  borderColor?: string;
  borderWidth?: number;
  activeColor?: string;
  activeTextColor?: string;
};

export type HomeCardAppearance = {
  backgroundColor?: string;
  borderEnabled: boolean;
  borderColor?: string;
  borderWidth?: number;
};

function hexColor(value: unknown): string | undefined {
  return typeof value === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim()) ? value.trim() : undefined;
}

function strokeWidth(value: unknown): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  return Math.min(12, Math.max(0, value));
}

export function resolveHomeTabAppearance(homes: {
  tabBorderColor?: string;
  tabBorderWidth?: number;
  tabActiveColor?: string;
  tabActiveTextColor?: string;
}): HomeTabAppearance {
  return {
    borderColor: hexColor(homes.tabBorderColor),
    borderWidth: strokeWidth(homes.tabBorderWidth),
    activeColor: hexColor(homes.tabActiveColor),
    activeTextColor: hexColor(homes.tabActiveTextColor),
  };
}

export function resolveHomeCardAppearance(homes: {
  cardBackgroundColor?: string;
  cardBorderEnabled?: boolean;
  cardBorderColor?: string;
  cardBorderWidth?: number;
}): HomeCardAppearance {
  return {
    backgroundColor: hexColor(homes.cardBackgroundColor),
    borderEnabled: homes.cardBorderEnabled !== false,
    borderColor: hexColor(homes.cardBorderColor),
    borderWidth: strokeWidth(homes.cardBorderWidth),
  };
}
