import type { LeadClickSource } from "@/lib/lead-click-source";
import type { Cta, CtaAction, SiteData } from "@/types/site";
import { resolveHeaderButtons } from "@/lib/header";

export function clickSourceFromButton(button: Pick<LeadFormButton, "id" | "section" | "label">): LeadClickSource {
  return { id: button.id, section: button.section, label: button.label };
}

export const extraLeadClickSources = {
  floatingSideTab: {
    id: "floatingButton.form",
    section: "Floating contacts",
    label: "Floating · Side tab",
  },
  contactSectionForm: {
    id: "contactSection.form",
    section: "Contact form",
    label: "Contact form · Page section",
  },
  heroMobileLeadForm: {
    id: "hero.mobileLeadForm",
    section: "Hero",
    label: "Hero · Mobile lead form",
  },
} satisfies Record<string, LeadClickSource>;

export const leadClickSourceById = {
  headerBrochure: { id: "header.brochureButton", section: "Header", label: "Header · Button 1" },
  headerPhone: { id: "header.phoneButton", section: "Header", label: "Header · Button 2" },
  heroPrimary: { id: "hero.primaryCTA", section: "Hero", label: "Hero · Primary button" },
  heroSecondary: { id: "hero.secondaryCTA", section: "Hero", label: "Hero · Secondary button" },
  bookingCard: { id: "bookingCard.button", section: "Offer card", label: "Offer card · Button" },
  aboutMain: { id: "about.cta", section: "About", label: "About · Main button" },
  highlights: { id: "highlights.cta", section: "Highlights", label: "Highlights · Strip button" },
  amenitiesEnquire: { id: "amenities.cta", section: "Amenities", label: "Amenities · Enquire button" },
  amenitiesVisit: { id: "amenities.visitCta", section: "Amenities", label: "Amenities · Site visit button" },
  homesDownload: { id: "homes.downloadCta", section: "Homes", label: "Homes · Get floor plan" },
  homesVisit: { id: "homes.visitCta", section: "Homes", label: "Homes · Price / visit" },
  homesListDownload: { id: "homes.listCta", section: "Homes", label: "Homes · List image button" },
  stickyEnquire: { id: "stickyCTA.enquire", section: "Floating contacts", label: "Sticky bar · Enquire" },
  virtualTour: { id: "virtualTourSection.enquire", section: "Virtual tour", label: "Virtual tour · Play" },
} satisfies Record<string, LeadClickSource>;

export function aboutFeatureClickSource(index: number, title: string): LeadClickSource {
  return {
    id: `about.features.${index}.cta`,
    section: "About",
    label: `About · Feature “${title || `Card ${index + 1}`}”`,
  };
}

export function homeRowClickSource(index: number, title: string): LeadClickSource {
  return {
    id: `homes.properties.${index}.cta`,
    section: "Homes",
    label: `Homes · “${title || `Row ${index + 1}`}”`,
  };
}

export function plansCardClickSource(index: number, title: string): LeadClickSource {
  return {
    id: `plansSection.cards.${index}.button`,
    section: "Plans",
    label: `Plans · “${title || `Card ${index + 1}`}”`,
  };
}

export type LeadFormButtonKind = "cta" | "stickyEnquire" | "virtualTour";

export type LeadFormButtonPath = Array<string | number>;

export type LeadFormButton = {
  id: string;
  label: string;
  section: string;
  kind: LeadFormButtonKind;
  path: LeadFormButtonPath;
  /** Path to the full CTA object when kind === "cta" */
  ctaPath?: LeadFormButtonPath;
  action: CtaAction | "sticky" | "virtualTour";
  intent: string;
  canOpenForm: boolean;
  buttonLabel: string;
};

const FORM_ACTIONS: CtaAction[] = ["enquire", "brochure", "download"];

function isFormAction(action: string): action is CtaAction {
  return FORM_ACTIONS.includes(action as CtaAction);
}

/** Explicit intent only — inferred brochure/default fallbacks are not "connected" in the admin UI. */
function storedCtaIntent(cta: Cta): string {
  return cta.intent?.trim() || "";
}

function pushCta(
  list: LeadFormButton[],
  opts: {
    id: string;
    section: string;
    label: string;
    cta: Cta;
    path: LeadFormButtonPath;
  },
) {
  const formCapable = isFormAction(opts.cta.action);
  list.push({
    id: opts.id,
    label: opts.label,
    section: opts.section,
    kind: "cta",
    path: opts.path,
    ctaPath: opts.path,
    action: opts.cta.action,
    intent: formCapable ? storedCtaIntent(opts.cta) : "",
    canOpenForm: true,
    buttonLabel: opts.cta.label || opts.label,
  });
}

/** All site buttons that can open a lead form variant. */
export function listLeadFormButtons(data: SiteData): LeadFormButton[] {
  const list: LeadFormButton[] = [];
  const { primary, secondary } = resolveHeaderButtons(data.header, data.site);

  pushCta(list, {
    id: "header.brochureButton",
    section: "Header",
    label: "Header · Button 1",
    cta: primary,
    path: ["header", "brochureButton"],
  });

  pushCta(list, {
    id: "header.phoneButton",
    section: "Header",
    label: "Header · Button 2",
    cta: secondary,
    path: data.header.phoneButton ? ["header", "phoneButton"] : ["header", "phoneButton"],
  });

  pushCta(list, {
    id: "hero.primaryCTA",
    section: "Hero",
    label: "Hero · Primary button",
    cta: data.hero.primaryCTA,
    path: ["hero", "primaryCTA"],
  });

  pushCta(list, {
    id: "hero.secondaryCTA",
    section: "Hero",
    label: "Hero · Secondary button",
    cta: data.hero.secondaryCTA,
    path: ["hero", "secondaryCTA"],
  });

  pushCta(list, {
    id: "bookingCard.button",
    section: "Offer card",
    label: "Offer card · Button",
    cta: data.bookingCard.button,
    path: ["bookingCard", "button"],
  });

  pushCta(list, {
    id: "about.cta",
    section: "About",
    label: "About · Main button",
    cta: data.about.cta,
    path: ["about", "cta"],
  });

  (data.about.features || []).forEach((feature, index) => {
    pushCta(list, {
      id: `about.features.${index}.cta`,
      section: "About",
      label: `About · Feature “${feature.title || `Card ${index + 1}`}”`,
      cta: feature.cta,
      path: ["about", "features", index, "cta"],
    });
  });

  pushCta(list, {
    id: "highlights.cta",
    section: "Highlights",
    label: "Highlights · Strip button",
    cta: data.highlights.cta,
    path: ["highlights", "cta"],
  });

  pushCta(list, {
    id: "amenities.cta",
    section: "Amenities",
    label: "Amenities · Enquire button",
    cta: data.amenities.cta,
    path: ["amenities", "cta"],
  });

  pushCta(list, {
    id: "amenities.visitCta",
    section: "Amenities",
    label: "Amenities · Site visit button",
    cta: data.amenities.visitCta,
    path: ["amenities", "visitCta"],
  });

  pushCta(list, {
    id: "homes.downloadCta",
    section: "Homes",
    label: "Homes · Get floor plan",
    cta: data.homes.downloadCta,
    path: ["homes", "downloadCta"],
  });

  pushCta(list, {
    id: "homes.visitCta",
    section: "Homes",
    label: "Homes · Price / visit",
    cta: data.homes.visitCta,
    path: ["homes", "visitCta"],
  });

  if (data.homes.listCta) {
    pushCta(list, {
      id: "homes.listCta",
      section: "Homes",
      label: "Homes · List image button",
      cta: data.homes.listCta,
      path: ["homes", "listCta"],
    });
  }

  (data.homes.properties || []).forEach((property, index) => {
    pushCta(list, {
      id: `homes.properties.${index}.cta`,
      section: "Homes",
      label: `Homes · “${property.title || `Row ${index + 1}`}”`,
      cta: property.cta,
      path: ["homes", "properties", index, "cta"],
    });
  });

  (data.plansSection?.cards || []).forEach((card, index) => {
    pushCta(list, {
      id: `plansSection.cards.${index}.button`,
      section: "Plans",
      label: `Plans · “${card.title || `Card ${index + 1}`}”`,
      cta: card.button,
      path: ["plansSection", "cards", index, "button"],
    });
  });

  list.push({
    id: "stickyCTA.enquire",
    section: "Floating contacts",
    label: "Sticky bar · Enquire",
    kind: "stickyEnquire",
    path: ["stickyCTA", "enquireIntent"],
    action: "sticky",
    intent: data.stickyCTA.enquireIntent?.trim() || "",
    canOpenForm: true,
    buttonLabel: data.stickyCTA.enquireLabel || "Enquire",
  });

  list.push({
    id: "virtualTourSection.enquire",
    section: "Virtual tour",
    label: "Virtual tour · Play",
    kind: "virtualTour",
    path: ["virtualTourSection", "enquireIntent"],
    action: "virtualTour",
    intent: data.virtualTourSection?.enquireIntent?.trim() || "",
    canOpenForm: true,
    buttonLabel: data.virtualTourSection?.heading || "Play",
  });

  return list;
}

export function countButtonsForIntent(data: SiteData, intentId: string): number {
  return listLeadFormButtons(data).filter((button) => button.intent === intentId).length;
}

export function buttonsGroupedBySection(buttons: LeadFormButton[]): Array<{ section: string; buttons: LeadFormButton[] }> {
  const order: string[] = [];
  const map = new Map<string, LeadFormButton[]>();
  for (const button of buttons) {
    if (!map.has(button.section)) {
      map.set(button.section, []);
      order.push(button.section);
    }
    map.get(button.section)!.push(button);
  }
  return order.map((section) => ({ section, buttons: map.get(section)! }));
}

function getByPath(root: unknown, path: LeadFormButtonPath): unknown {
  let current: unknown = root;
  for (const part of path) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string | number, unknown>)[part as string];
  }
  return current;
}

/**
 * Connect a site button to a lead form variant (moves connection if already assigned elsewhere).
 * Writes via onUpdate; may issue multiple updates for header phoneButton creation.
 */
export function connectButtonToIntent(
  data: SiteData,
  button: LeadFormButton,
  intentId: string,
  onUpdate: (path: LeadFormButtonPath, value: unknown) => void,
) {
  if (button.kind === "stickyEnquire") {
    onUpdate(["stickyCTA", "enquireIntent"], intentId);
    return;
  }

  if (button.kind === "virtualTour") {
    if (!data.virtualTourSection) {
      onUpdate(["virtualTourSection"], {
        enabled: true,
        label: "VIRTUAL TOUR",
        heading: "Virtual Site Visit",
        videoUrl: "",
        overlayColor: "#06192c",
        overlayOpacity: 0.7,
        blurAmount: 8,
        sectionHeight: 420,
        containerWidth: 70,
        textColor: "#ffffff",
        playIconEnabled: true,
        enquireIntent: intentId,
      });
      return;
    }
    onUpdate(["virtualTourSection", "enquireIntent"], intentId);
    return;
  }

  const path = button.ctaPath || button.path;
  const existing = getByPath(data, path) as Cta | undefined;

  // Header button 2 may only exist as resolved default — persist phoneButton first
  if (button.id === "header.phoneButton" && !data.header.phoneButton) {
    const { secondary } = resolveHeaderButtons(data.header, data.site);
    const next: Cta = {
      ...secondary,
      action: isFormAction(secondary.action) ? secondary.action : "enquire",
      intent: intentId,
    };
    onUpdate(["header", "phoneButton"], next);
    return;
  }

  const base = existing || { label: button.buttonLabel, action: "enquire" as CtaAction };
  const action = isFormAction(base.action) ? base.action : "enquire";
  onUpdate(path, { ...base, action, intent: intentId });
}

/**
 * Disconnect a button from this intent. Clears the assignment so the checkbox can uncheck
 * (including when this form is the default variant — resetting to "default" would keep it checked).
 */
export function disconnectButtonFromIntent(
  data: SiteData,
  button: LeadFormButton,
  intentId: string,
  onUpdate: (path: LeadFormButtonPath, value: unknown) => void,
) {
  if (button.intent !== intentId) return;

  if (button.kind === "stickyEnquire") {
    onUpdate(["stickyCTA", "enquireIntent"], "");
    return;
  }

  if (button.kind === "virtualTour") {
    if (!data.virtualTourSection) return;
    onUpdate(["virtualTourSection", "enquireIntent"], "");
    return;
  }

  const path = button.ctaPath || button.path;
  if (button.id === "header.phoneButton" && !data.header.phoneButton) {
    const { secondary } = resolveHeaderButtons(data.header, data.site);
    onUpdate(["header", "phoneButton"], { ...secondary, intent: "" });
    return;
  }

  const existing = getByPath(data, path) as Cta | undefined;
  if (!existing) return;
  onUpdate(path, { ...existing, intent: "" });
}

export function toggleButtonForIntent(
  data: SiteData,
  button: LeadFormButton,
  intentId: string,
  checked: boolean,
  onUpdate: (path: LeadFormButtonPath, value: unknown) => void,
) {
  if (checked) connectButtonToIntent(data, button, intentId, onUpdate);
  else disconnectButtonFromIntent(data, button, intentId, onUpdate);
}
