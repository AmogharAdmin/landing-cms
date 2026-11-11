"use client";

import { ChangeEvent, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  BarChart3,
  Check,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  ImagePlus,
  LoaderCircle,
  FileText,
  GripVertical,
  History,
  Home,
  Images,
  Layers3,
  Menu,
  Megaphone,
  MapPinned,
  Monitor,
  Palette,
  PanelsTopLeft,
  Pencil,
  Play,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Settings2,
  SlidersHorizontal,
  Smartphone,
  Trash2,
  Upload,
  LogOut,
  Users,
  Plug,
  Tag,
  X,
} from "lucide-react";
import type { Cta, CtaAction, HeaderButton, LandingSectionKey, NavItem, SectionLayoutSetting, SiteData } from "@/types/site";
import { uploadFileAsset } from "@/lib/client/upload";
import { normalizeSectionOrder, normalizeSectionSettings, sanitizeSectionAnchor, SECTION_ANCHORS, SECTION_LABELS, sectionHash } from "@/lib/section-order";
import { blankEnquiryIntent, resolveEnquiryIntents, successTypeOptions } from "@/lib/enquiry";
import { resolveHeaderButtons } from "@/lib/header";
import { ButtonBackgroundPicker, CTA_ACTIONS, CtaFields, visibleCtaAction } from "@/components/admin/editor-ui";
import { HeroContentEditor, HeroFactsEditor, OfferCardEditor } from "@/components/admin/HeroPromotionEditors";
import { AboutEditor } from "@/components/admin/AboutEditor";
import { AmenitiesEditor } from "@/components/admin/AmenitiesEditor";
import { FaqEditor } from "@/components/admin/FaqEditor";
import { GalleryEditor } from "@/components/admin/GalleryEditor";
import { HighlightsEditor } from "@/components/admin/HighlightsEditor";
import { HomesEditor } from "@/components/admin/HomesEditor";
import { LocationEditor } from "@/components/admin/LocationEditor";
import { PlansEditor } from "@/components/admin/PlansEditor";
import { EnquiryEditor } from "@/components/admin/EnquiryEditor";
import { FooterEditor } from "@/components/admin/FooterEditor";
import { BrandIdentityEditor } from "@/components/admin/BrandIdentityEditor";
import { ThemeColorsEditor } from "@/components/admin/ThemeColorsEditor";
import { ThemeStyles } from "@/components/ui/ThemeStyles";
import { VirtualTourEditor } from "@/components/admin/VirtualTourEditor";
import { FloatingButtonEditor } from "@/components/admin/FloatingButtonEditor";
import { StickyCTAEditor } from "@/components/admin/StickyCTAEditor";
import { ContactSectionEditor } from "@/components/admin/ContactSectionEditor";
import { KeywordContentEditor } from "@/components/admin/KeywordContentEditor";
import { isFontMetaField, isTextStyleField, TEXT_STYLE_FIELDS } from "@/lib/typography";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { AnalyticsPanel } from "@/components/admin/AnalyticsPanel";
import { IntegrationsPanel } from "@/components/admin/IntegrationsPanel";
import { BackupPanel } from "@/components/admin/BackupPanel";
import { IconPicker } from "@/components/admin/IconPicker";
import { TextStyleControls } from "@/components/admin/TextStyleControls";
import {
  downloadSiteDataJson,
  formatExportSummary,
  readImportedSiteFile,
} from "@/lib/site-backup";
import { AdminContentProvider } from "@/components/admin/AdminContentContext";

const AdminSiteContext = createContext<SiteData | null>(null);

type EditorPage = {
  key: string;
  label: string;
  description: string;
  icon: typeof Layers3;
  sources?: string[];
};

type EditorGroup = { label: string; items: EditorPage[] };

const editorGroups: EditorGroup[] = [
  {
    label: "Workspace",
    items: [
      { key: "sectionOrder", label: "Page Structure", description: "Visibility, order and spacing", icon: Layers3 },
      { key: "adminUsers", label: "Users", description: "Add and manage dashboard logins", icon: Users },
      { key: "analytics", label: "Analytics", description: "Visitors, CTA clicks, submissions, GA4, and Google Tag Manager", icon: BarChart3 },
      { key: "integrations", label: "Integrations", description: "Buildesk CRM settings and sent leads", icon: Plug },
      { key: "backup", label: "Backup", description: "Manual snapshots of the live site", icon: Archive },
      { key: "siteSetup", label: "Brand & Contact", description: "Logo, project identity and phone", icon: Palette, sources: ["site", "theme"] },
      { key: "seo", label: "Search & Sharing", description: "SEO, keywords and social preview", icon: Search, sources: ["seo"] },
    ],
  },
  {
    label: "Header & Hero",
    items: [
      { key: "headerSetup", label: "Header & Navigation", description: "Announcement, menu and header buttons", icon: PanelsTopLeft, sources: ["offerBar", "header", "navigation"] },
      { key: "heroSetup", label: "Hero & Promotion", description: "Hero copy, offer card and fact strip", icon: Megaphone, sources: ["hero", "bookingCard", "heroFacts"] },
      { key: "keywordContent", label: "Keyword Content", description: "Hero, Hero card and About copy per Google Ads keyword (utm_term)", icon: Tag, sources: ["keywordContent"] },
    ],
  },
  {
    label: "Landing Sections",
    items: [
      { key: "about", label: "About the Project", description: "Introduction and trust cards", icon: FileText, sources: ["about"] },
      { key: "highlights", label: "Project Highlights", description: "Five-icon statistics strip", icon: SlidersHorizontal, sources: ["highlights"] },
      { key: "amenities", label: "Amenities & Lifestyle", description: "Amenities, image and lifestyle cards", icon: Home, sources: ["amenities"] },
      { key: "homes", label: "Homes & Floor Plans", description: "Tabs, properties and linked plans", icon: Layers3, sources: ["homes"] },
      { key: "gallery", label: "Gallery", description: "Property images and captions", icon: Images, sources: ["gallery"] },
      { key: "location", label: "Location & Connectivity", description: "Map, master plan and travel times", icon: MapPinned, sources: ["location"] },
      { key: "virtualTourSection", label: "Virtual Tour", description: "Background video and presentation", icon: Play, sources: ["virtualTourSection"] },
      { key: "plansSection", label: "Master & Floor Plan Cards", description: "Plan images and enquiry buttons", icon: PanelsTopLeft, sources: ["plansSection"] },
      { key: "faqSection", label: "Frequently Asked Questions", description: "FAQ image, questions and answers", icon: FileText, sources: ["faqSection"] },
      { key: "contactSection", label: "Contact Form", description: "Bottom contact form with image layout", icon: FileText, sources: ["contactSection"] },
    ],
  },
  {
    label: "Leads & Legal",
    items: [
      { key: "conversionSetup", label: "Lead Form & Contacts", description: "Form wording and floating actions", icon: Megaphone, sources: ["enquiry", "floatingButton", "stickyCTA"] },
      { key: "footer", label: "Footer & Legal", description: "RERA, disclaimer and copyright", icon: FileText, sources: ["footer"] },
    ],
  },
];

type PathPart = string | number;
type SaveState = "idle" | "saving" | "saved" | "error";

type BackupNotice = {
  type: "export" | "import";
  title: string;
  message: string;
  detail?: string;
};

type CmsSetupIssue = {
  id: string;
  title: string;
  detail: string;
  fix: string;
};

type CmsSetupWarning = {
  id: string;
  title: string;
  detail: string;
  fix?: string;
};

const sourceTabLabels: Record<string, string> = {
  site: "Project identity",
  theme: "Colors & theme",
  offerBar: "Announcement bar",
  header: "Header & colors",
  navigation: "Navigation menu",
  hero: "Hero content",
  bookingCard: "Offer card",
  heroFacts: "Four fact cards",
  enquiry: "Lead form",
  floatingButton: "Floating form button",
  stickyCTA: "Floating contacts",
};

/** Root keys that have dedicated editors even before they exist in saved content. */
const OPTIONAL_SITE_SOURCES = new Set(["floatingButton", "contactSection", "keywordContent"]);

const fieldLabels: Record<string, string> = {
  label: "Section label",
  heading: "Main heading",
  headingAccent: "Highlighted heading",
  description: "Description",
  enabled: "Show this item",
  factsEnabled: "Show four fact cards below hero",
  primaryCTAEnabled: "Show primary button",
  secondaryCTAEnabled: "Show secondary button",
  lifestyleCardsEnabled: "Show lifestyle icon panel on image",
  visitCtaEnabled: "Show site visit button",
  floorPlanLocked: "Lock floor-plan / list image preview",
  floorPlanPanelEnabled: "Show floor plan panel",
  floorPlanBlur: "Preview blur strength",
  hideCategoryTabs: "Hide category tabs on the page",
  titleAlign: "Section title alignment",
  containerWidth: "Container width (%)",
  sectionHeight: "Section height (px)",
  backgroundImage: "Background image",
  backgroundAlt: "Background image description",
  imageAlt: "Image description (accessibility)",
  src: "Image",
  alt: "Image description (accessibility)",
  target: "Link target",
  href: "Link URL",
  closeIconColor: "Close icon color",
  closeBackgroundEnabled: "Close button background",
  closeBackgroundColor: "Close button background color",
  brochureUrl: "Brochure file",
  masterPlanUrl: "Master plan file",
  action: "Button action",
  button: "Button settings",
  cta: "Button settings",
  primaryCTA: "Primary button",
  secondaryCTA: "Secondary button",
  visitCta: "Site visit button",
  downloadCta: "Floor-plan request button",
  intent: "Lead form variant",
  enquireIntent: "Lead form variant",
  successType: "After submit, show",
  successMessage: "Thank-you message",
  successButtonLabel: "Success button label",
  successHref: "Success button link",
};

const fieldHelp: Record<string, string> = {
  action: "Choose what happens when this button is clicked.",
  target: "Use a section anchor such as #gallery or #location.",
  href: "Paste a URL, or upload a PDF / image for this button.",
  imageAlt: "Briefly describe the image for screen readers and search engines.",
  floorPlanBlur: "0 shows the image clearly; higher values make it harder to read.",
  containerWidth: "Controls the desktop width. Mobile remains full width.",
  closeBackgroundEnabled: "Turn off to show only the X icon, with no button fill.",
  closeIconColor: "Color of the X icon.",
  closeBackgroundColor: "Fill behind the X. Leave matching the bar, or pick a different color.",
};

function fieldLabel(key: string) {
  return fieldLabels[key] ?? humanize(key);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function humanize(value: string): string {
  const actionLabels: Record<string, string> = {
    enquire: "Form",
    scroll: "Section",
    brochure: "Form",
    download: "Form",
    whatsapp: "WhatsApp",
    call: "Call",
    map: "Section",
    link: "Custom link",
  };
  if (actionLabels[value]) return actionLabels[value];
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase())
    .replace(/\bCta\b/g, "CTA")
    .replace(/\bFaq\b/g, "FAQ")
    .replace(/\bUrl\b/g, "URL");
}

function getByPath(root: unknown, path: PathPart[]): unknown {
  return path.reduce<unknown>((current, part) => {
    if (current == null || typeof current !== "object") return undefined;
    return (current as Record<string | number, unknown>)[part];
  }, root);
}

function setAtPath(root: SiteData, path: PathPart[], value: unknown): SiteData {
  const next = clone(root) as unknown as Record<string, unknown>;
  let cursor: unknown = next;
  path.slice(0, -1).forEach((part) => {
    cursor = (cursor as Record<string | number, unknown>)[part];
  });
  (cursor as Record<string | number, unknown>)[path[path.length - 1]] = value;
  return next as unknown as SiteData;
}

function removeAtPath(root: SiteData, path: PathPart[]): SiteData {
  const next = clone(root) as unknown as Record<string, unknown>;
  let cursor: unknown = next;
  path.slice(0, -1).forEach((part) => {
    cursor = (cursor as Record<string | number, unknown>)[part];
  });
  const final = path[path.length - 1];
  if (Array.isArray(cursor) && typeof final === "number") cursor.splice(final, 1);
  else delete (cursor as Record<string | number, unknown>)[final];
  return next as unknown as SiteData;
}

function blankCopy(value: unknown): unknown {
  if (typeof value === "string") return "";
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        if (key === "id") return [key, `item-${Date.now()}`];
        if (key === "icon") return [key, "building"];
        if (key === "action") return [key, "enquire"];
        if (key === "size") return [key, "medium"];
        if (key === "enabled") return [key, true];
        if (key === "successType") return [key, "message"];
        if (Array.isArray(item) && item.length) return [key, [blankCopy(item[0])]];
        if (typeof item === "string") {
          if (key === "question") return [key, "New question"];
          if (["label", "title", "name", "heading"].includes(key)) return [key, "New item"];
          if (key === "value") return [key, "New"];
        }
        return [key, blankCopy(item)];
      }),
    );
  }
  return "";
}

function isImageField(key: string): boolean {
  const normalized = key.toLowerCase();
  if (normalized.includes("alt")) return false;
  return normalized === "src" || normalized.includes("image") || normalized.includes("logo") || normalized.includes("favicon");
}

function isDocumentField(key: string): boolean {
  const normalized = key.toLowerCase();
  return normalized === "href" || normalized === "brochureurl" || normalized === "masterplanurl" || normalized === "successhref";
}

function isPdfPath(value: string) {
  return /\.pdf($|\?)/i.test(value);
}

function isColorField(key: string, value: string): boolean {
  return key.toLowerCase().includes("color") || /^#[0-9a-f]{6}$/i.test(value);
}

function isLongText(key: string, value: string): boolean {
  return /(description|disclaimer|message|paragraph|managedby)/i.test(key) || value.length > 100;
}

function fieldPriority(key: string) {
  const order = ["enabled", "label", "titleAlign", "eyebrow", "heading", "headingAccent", "title", "subtitle", "description", "image", "backgroundImage", "cta", "button"];
  const index = order.indexOf(key);
  return index < 0 ? 100 : index;
}

function isStyleMetaField(key: string) {
  if (isFontMetaField(key)) return true;
  return key.endsWith("Color") && TEXT_STYLE_FIELDS.has(key.slice(0, -5));
}

function isAdvancedField(key: string) {
  if (["time", "intent", "successType", "successMessage", "successButtonLabel", "successHref", "headingAccent", "submitLabel", "name", "brochureUrl", "masterPlanUrl", "href", "closeIconColor", "closeBackgroundColor", "closeBackgroundEnabled"].includes(key)) return false;
  if (isStyleMetaField(key)) return false;
  return /(color|opacity|blur|alt$|robots|canonical|url$|target$|position|height|width|source|stars|size$)/i.test(key);
}

function isInternalField(key: string) {
  return /^(id|tab|propertyId|floorPlanId|downloadUrl|slug)$/.test(key) || isStyleMetaField(key);
}

function defaultListTemplate(fieldKey: string, path: PathPart[]): unknown {
  const leaf = String(path[path.length - 1] ?? fieldKey);
  if (leaf === "nearbyPlaces") return { icon: "building", label: "New place" };
  if (leaf === "items" && path[0] === "navigation") return { label: "New link", target: "#overview" };
  if (leaf === "items" && path.includes("connectivity")) return { label: "New place", time: "" };
  if (leaf === "items" && (path.includes("faqSection") || fieldKey.includes("faq"))) return { question: "New question", answer: "" };
  if (leaf === "faqs") return { question: "New question", answer: "" };
  if (leaf === "heroFacts") return { icon: "building", value: "New", label: "New item" };
  if (leaf === "benefits" || leaf === "keywords" || leaf === "reraPhases" || leaf === "disclaimerParagraphs") return "New item";
  if (leaf === "intents") {
    return {
      id: `intent-${Date.now()}`,
      name: "New form variant",
      heading: "New heading",
      headingAccent: "",
      submitLabel: "Submit",
      successType: "message",
      successMessage: "Thank you. We will contact you shortly.",
      successButtonLabel: "",
      successHref: "",
    };
  }
  if (leaf === "connectivity") return { label: "New category", items: [{ label: "New place", time: "" }] };
  return "";
}

function createListItem(template: unknown, fieldKey: string, path: PathPart[]): unknown {
  if (template && typeof template === "object") return blankCopy(template);
  if (typeof template === "string") return template ? "New item" : defaultListTemplate(fieldKey, path) || "New item";
  return defaultListTemplate(fieldKey, path) || "New item";
}

function itemSummary(value: unknown, fallback: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const record = value as Record<string, unknown>;
  return String(record.title || record.label || record.question || record.value || record.email || record.name || fallback);
}

function groupSummary(value: unknown) {
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record.label || record.title || record.heading || "Edit details");
  }
  return "Edit details";
}

type AdminDashboardProps = {
  initialData: SiteData;
  contentEndpoint: string;
  uploadEndpoint: string;
  mode: "json" | "postgresql";
  userEmail?: string;
  initialWarning?: string;
};

export function AdminDashboard({
  initialData: initialDataProp,
  contentEndpoint,
  uploadEndpoint,
  mode,
  userEmail,
  initialWarning,
}: AdminDashboardProps) {
  const router = useRouter();
  const initialData = useMemo(() => ({
    ...clone(initialDataProp),
    sectionOrder: normalizeSectionOrder(initialDataProp.sectionOrder),
    sectionSettings: normalizeSectionSettings(initialDataProp.sectionSettings),
  }), [initialDataProp]);
  const [data, setData] = useState<SiteData>(initialData);
  const [lastSavedData, setLastSavedData] = useState<SiteData>(initialData);
  const [activeSection, setActiveSection] = useState<string>("sectionOrder");
  const [activeSource, setActiveSource] = useState<string>("sectionOrder");
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [statusMessage, setStatusMessage] = useState(initialWarning || "Loading project content…");
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [restoringMain, setRestoringMain] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [backupNotice, setBackupNotice] = useState<BackupNotice | null>(null);
  const [setupIssues, setSetupIssues] = useState<CmsSetupIssue[]>([]);
  const [setupWarnings, setSetupWarnings] = useState<CmsSetupWarning[]>([]);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (mode === "postgresql") {
        try {
          const statusResponse = await fetch("/api/admin/status", { cache: "no-store", credentials: "same-origin" });
          if (statusResponse.ok) {
            const status = (await statusResponse.json()) as {
              ready: boolean;
              summary: string;
              issues: CmsSetupIssue[];
              warnings: CmsSetupWarning[];
            };
            if (cancelled) return;
            setSetupIssues(status.issues || []);
            setSetupWarnings(status.warnings || []);
            if (!status.ready) {
              setServerAvailable(false);
              setStatusMessage(status.summary || initialWarning || "Setup is incomplete for this deployment.");
              return;
            }
          }
        } catch {
          if (!cancelled) {
            setSetupIssues([]);
            setSetupWarnings([]);
          }
        }
      }

      try {
        const response = await fetch(contentEndpoint, { cache: "no-store", credentials: "same-origin" });
        if (!response.ok) {
          let message = initialWarning || "Unable to load content from the server.";
          try {
            const body = (await response.json()) as { error?: string };
            if (body.error) message = body.error;
          } catch {
            // Keep fallback message.
          }
          throw new Error(message);
        }
        const content = (await response.json()) as SiteData;
        if (cancelled) return;
        const normalized: SiteData = {
          ...content,
          sectionOrder: normalizeSectionOrder(content.sectionOrder),
          sectionSettings: normalizeSectionSettings(content.sectionSettings),
        };
        setData(normalized);
        setLastSavedData(normalized);
        setServerAvailable(true);
        setStatusMessage(mode === "json" ? "Connected to data/site.json" : "Connected securely to PostgreSQL");
      } catch (error) {
        if (cancelled) return;
        setServerAvailable(false);
        setStatusMessage(
          error instanceof Error
            ? error.message
            : initialWarning || (mode === "json"
              ? "Preview mode: run npm run dev to enable direct saving and uploads."
              : "PostgreSQL is unavailable. Saving and uploads are disabled until the connection is restored."),
        );
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [contentEndpoint, initialWarning, mode]);

  const reloadContentFromServer = useCallback(async () => {
    const contentResponse = await fetch(contentEndpoint, { cache: "no-store", credentials: "same-origin" });
    if (!contentResponse.ok) throw new Error("Restored but unable to reload the editor.");
    const content = (await contentResponse.json()) as SiteData;
    const normalized: SiteData = {
      ...content,
      sectionOrder: normalizeSectionOrder(content.sectionOrder),
      sectionSettings: normalizeSectionSettings(content.sectionSettings),
    };
    setData(normalized);
    setLastSavedData(normalized);
    setSaveState("idle");
    router.refresh();
  }, [contentEndpoint, router]);

  const availablePages = useMemo(
    () => editorGroups.flatMap((group) => group.items),
    [],
  );
  const selectedPage = availablePages.find((page) => page.key === activeSection) ?? availablePages[0];
  const sourceKeys = selectedPage.sources ?? [];
  const selectedSource = sourceKeys.includes(activeSource) ? activeSource : sourceKeys[0];
  const selectedValue = selectedSource ? (data as unknown as Record<string, unknown>)[selectedSource] : undefined;
  const canRenderEditor = Boolean(
    selectedSource && (selectedValue !== undefined || OPTIONAL_SITE_SOURCES.has(selectedSource)),
  );

  const currentSectionLabel = useMemo(() => {
    if (activeSection === "sectionOrder") return "Page Structure";
    if (sourceKeys.length > 1 && selectedSource && sourceTabLabels[selectedSource]) {
      return `${selectedPage.label} — ${sourceTabLabels[selectedSource]}`;
    }
    return selectedPage.label;
  }, [activeSection, selectedPage.label, sourceKeys.length, selectedSource]);

  const resetCurrentSection = () => {
    if (!lastSavedData) return;

    if (activeSection === "sectionOrder") {
      setData((current) => ({
        ...current,
        sectionOrder: normalizeSectionOrder(clone(lastSavedData.sectionOrder)),
        sectionSettings: normalizeSectionSettings(clone(lastSavedData.sectionSettings)),
      }));
    } else if (selectedSource && (lastSavedData as unknown as Record<string, unknown>)[selectedSource] !== undefined) {
      setData((current) => ({
        ...current,
        [selectedSource]: clone((lastSavedData as unknown as Record<string, unknown>)[selectedSource]),
      }));
    }
    setSaveState("idle");
    setStatusMessage(`Restored "${currentSectionLabel}" to the previous saved version. Save Changes to apply it.`);
    setConfirmReset(false);
  };

  const openPage = (key: string) => {
    const page = availablePages.find((item) => item.key === key);
    setActiveSection(key);
    setActiveSource(page?.sources?.[0] ?? key);
  };

  const update = (path: PathPart[], value: unknown) => {
    setData((current) => setAtPath(current, path, value));
    setSaveState("idle");
  };

  const remove = (path: PathPart[]) => {
    setData((current) => removeAtPath(current, path));
    setSaveState("idle");
  };

  const save = async () => {
    if (!serverAvailable) {
      setSaveState("error");
      setStatusMessage("Direct saving needs the local content service. Start the project with npm run dev.");
      return;
    }
    setSaveState("saving");
    try {
      const response = await fetch(contentEndpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(data),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to save content.");
      setSaveState("saved");
      setLastSavedData(clone(data));
      setStatusMessage(
        process.env.NODE_ENV === "development" || mode === "json"
          ? "Saved to data/site.json. Refresh the landing page to see updates."
          : "Saved to PostgreSQL. The live landing-page cache was refreshed.",
      );
      router.refresh();
      window.setTimeout(() => setSaveState("idle"), 2500);
    } catch (error) {
      setSaveState("error");
      setStatusMessage(error instanceof Error ? error.message : "Unable to save content.");
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
    router.replace("/admin/login");
    router.refresh();
  };

  const exportJson = async () => {
    setExporting(true);
    try {
      let baseline: SiteData | undefined;
      let baselineNote = "";

      if (serverAvailable) {
        try {
          const response = await fetch(contentEndpoint, { cache: "no-store", credentials: "same-origin" });
          if (response.ok) {
            const saved = (await response.json()) as SiteData;
            baseline = {
              ...saved,
              sectionOrder: normalizeSectionOrder(saved.sectionOrder),
              sectionSettings: normalizeSectionSettings(saved.sectionSettings),
            };
          } else {
            baselineNote = " Exported editor state only — the CMS baseline could not be loaded.";
          }
        } catch {
          baselineNote = " Exported editor state only — the CMS baseline could not be loaded.";
        }
      }

      const hasUnsavedEdits = JSON.stringify(data) !== JSON.stringify(lastSavedData);
      const summary = downloadSiteDataJson(data, baseline);
      setSaveState("idle");
      const message = formatExportSummary(summary);
      const unsavedNote = hasUnsavedEdits
        ? " Includes unsaved changes not yet saved to the CMS."
        : "";
      setStatusMessage(`${message}${unsavedNote}${baselineNote}`);
      setBackupNotice({
        type: "export",
        title: "Export successful",
        message: "Your full site backup has been downloaded.",
        detail: `${message}${unsavedNote}${baselineNote}`,
      });
    } catch (error) {
      setSaveState("error");
      setStatusMessage(error instanceof Error ? error.message : "Unable to export site content.");
    } finally {
      setExporting(false);
    }
  };

  const restoreMainContent = async () => {
    if (!window.confirm("Reset local content to data/main-site.json? Any unsaved changes in site.json will be lost.")) return;
    setRestoringMain(true);
    try {
      const response = await fetch("/api/admin/content/restore-main", {
        method: "POST",
        credentials: "same-origin",
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to restore main content.");

      const contentResponse = await fetch(contentEndpoint, { cache: "no-store", credentials: "same-origin" });
      if (!contentResponse.ok) throw new Error("Restored file but unable to reload the editor.");
      const content = (await contentResponse.json()) as SiteData;
      const normalized: SiteData = {
        ...content,
        sectionOrder: normalizeSectionOrder(content.sectionOrder),
        sectionSettings: normalizeSectionSettings(content.sectionSettings),
      };
      setData(normalized);
      setLastSavedData(normalized);
      setSaveState("idle");
      setStatusMessage("Restored data/site.json from data/main-site.json.");
      setBackupNotice({
        type: "import",
        title: "Main content restored",
        message: "Local site content was reset to data/main-site.json.",
        detail: "Refresh the landing page if it is already open in another tab.",
      });
      router.refresh();
    } catch (error) {
      setSaveState("error");
      setStatusMessage(error instanceof Error ? error.message : "Unable to restore main content.");
    } finally {
      setRestoringMain(false);
    }
  };

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = await readImportedSiteFile(file, data);
      if (!result.ok) {
        setSaveState("error");
        setStatusMessage(result.error);
        return;
      }
      setData(result.data);
      setSaveState("idle");
      const warning = result.warnings.length ? ` ${result.warnings.join(" ")}` : "";
      const summary = formatExportSummary(result.summary).replace(/^Exported full site backup/, "Full backup loaded");
      const message = `Imported ${file.name} successfully.`;
      setStatusMessage(`${message} ${summary}.${warning} Review, then click Save Changes.`);
      setBackupNotice({
        type: "import",
        title: "Import successful",
        message,
        detail: `${summary}.${warning} Review your content, then click Save Changes to apply it to the live site.`,
      });
    } catch {
      setSaveState("error");
      setStatusMessage("The selected file could not be imported.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <AdminSiteContext.Provider value={data}>
    <AdminContentProvider data={data} update={update}>
    <ThemeStyles theme={data.theme} customGradients={data.customButtonGradients} />
    <main className="min-h-screen bg-[#f4f6f9] text-[#142033]">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => setMobileMenu(true)} className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 lg:hidden" aria-label="Open sections">
            <Menu className="size-5" />
          </button>
          <Link href="/" className="flex min-w-0 items-center" aria-label={data.site.name}>
            <img
              src={data.site.dashboardLogo || data.site.logo}
              alt={data.site.name}
              className="h-9 w-auto max-w-[160px] object-contain object-left sm:h-10"
              width={180}
              height={40}
            />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {userEmail ? <span className="hidden text-[11px] text-slate-500 xl:block">{userEmail}</span> : null}
            <a href="/" target="_blank" className="hidden min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 sm:inline-flex">
              Preview <ExternalLink className="size-3.5" />
            </a>
            {mode === "postgresql" ? (
              <button type="button" onClick={logout} className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label="Sign out">
                <LogOut className="size-4" />
              </button>
            ) : null}
            <button type="button" onClick={save} disabled={saveState === "saving"} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#0b1f35] px-4 text-[12px] font-semibold text-white hover:bg-[#173b60] disabled:opacity-60">
              {saveState === "saving" ? <LoaderCircle className="size-4 animate-spin" /> : saveState === "saved" ? <Check className="size-4" /> : <Save className="size-4" />}
              <span className="hidden sm:inline">{saveState === "saved" ? "Saved" : "Save Changes"}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[260px_minmax(0,1fr)]">
        <AdminSidebar groups={editorGroups} availablePages={availablePages} active={activeSection} setActive={openPage} search={search} setSearch={setSearch} className="hidden lg:block" />

        <section className="min-w-0 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className={`mb-4 rounded-xl border px-4 py-2.5 text-[11px] ${serverAvailable ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
            <span className={`mr-2 inline-block size-2 rounded-full ${serverAvailable ? "bg-emerald-500" : "bg-amber-500"}`} />
            {statusMessage}
            {!serverAvailable && setupIssues.length ? (
              <ul className="mt-3 space-y-2 border-t border-amber-200/80 pt-3">
                {setupIssues.map((issue) => (
                  <li key={issue.id}>
                    <p className="font-semibold text-amber-950">{issue.title}</p>
                    <p className="mt-0.5 text-amber-900">{issue.detail}</p>
                    <p className="mt-1 text-amber-800"><span className="font-semibold">Fix:</span> {issue.fix}</p>
                  </li>
                ))}
              </ul>
            ) : null}
            {setupWarnings.length ? (
              <ul className={`space-y-2 ${!serverAvailable && setupIssues.length ? "mt-3" : "mt-3 border-t border-amber-200/80 pt-3"}`}>
                {setupWarnings.map((warning) => (
                  <li key={warning.id}>
                    <p className="font-semibold text-amber-950">{warning.title}</p>
                    <p className="mt-0.5 text-amber-900">{warning.detail}</p>
                    {warning.fix ? <p className="mt-1 text-amber-800"><span className="font-semibold">Fix:</span> {warning.fix}</p> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b98945]">{editorGroups.find((group) => group.items.some((item) => item.key === selectedPage.key))?.label}</p>
              <h1 className="mt-1 text-2xl font-medium text-[#0b1f35]">{selectedPage.label}</h1>
              <p className="mt-1 text-xs text-slate-500">{selectedPage.description}</p>
            </div>
            {activeSection !== "adminUsers" && activeSection !== "analytics" && activeSection !== "integrations" && activeSection !== "backup" ? (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => importRef.current?.click()} className="admin-tool-button"><Upload className="size-4" /> Import</button>
                <button type="button" onClick={exportJson} disabled={exporting} className="admin-tool-button disabled:opacity-60">
                  {exporting ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />} Export
                </button>
                {mode === "json" ? (
                  <button
                    type="button"
                    onClick={() => void restoreMainContent()}
                    disabled={restoringMain}
                    className="admin-tool-button disabled:opacity-60"
                    title="Reset data/site.json from data/main-site.json"
                  >
                    {restoringMain ? <LoaderCircle className="size-4 animate-spin" /> : <History className="size-4" />} Restore main
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="admin-tool-button"
                  title={`Reset ${currentSectionLabel} to previous saved version`}
                >
                  <RefreshCcw className="size-4" /> Reset
                </button>
                <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={importJson} />
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            {activeSection === "adminUsers" ? (
              <AdminUsersPanel />
            ) : activeSection === "analytics" ? (
              <AnalyticsPanel
                googleAnalytics={data.googleAnalytics}
                googleTagManager={data.googleTagManager}
                onUpdate={update}
              />
            ) : activeSection === "integrations" ? (
              <IntegrationsPanel buildeskCrm={data.buildeskCrm} onUpdate={update} />
            ) : activeSection === "backup" ? (
              <BackupPanel mode={mode} onRestored={reloadContentFromServer} />
            ) : activeSection === "sectionOrder" ? (
              <SectionOrderEditor
                value={normalizeSectionOrder(data.sectionOrder)}
                onChange={(value) => update(["sectionOrder"], value)}
                settings={normalizeSectionSettings(data.sectionSettings)}
                onSettingsChange={(value) => update(["sectionSettings"], value)}
                data={data}
                onFeatureToggle={(path, value) => update(path, value)}
                onRetargetNavigation={(fromHash, toHash) => {
                  if (fromHash === toHash) return;
                  update(["navigation", "items"], data.navigation.items.map((item) => item.target === fromHash ? { ...item, target: toHash } : item));
                }}
              />
            ) : !canRenderEditor ? (
              <p className="text-sm text-slate-500">This section will appear after the schema upgrade is saved.</p>
            ) : (
              <div>
                {sourceKeys.length > 1 ? (
                  <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
                    {sourceKeys.map((source) => (
                      <button key={source} type="button" onClick={() => setActiveSource(source)} className={`min-h-10 shrink-0 rounded-lg px-4 text-xs font-medium transition-colors ${selectedSource === source ? "bg-white text-[#0b1f35] shadow-sm" : "text-slate-500 hover:text-[#0b1f35]"}`}>
                        {sourceTabLabels[source] ?? humanize(source)}
                      </button>
                    ))}
                  </div>
                ) : null}
                {selectedSource === "homes" ? (
                  <HomesEditor
                    value={data.homes}
                    onUpdate={update}
                    onRemove={remove}
                    uploadEnabled={Boolean(serverAvailable)}
                    uploadEndpoint={uploadEndpoint}
                    intents={resolveEnquiryIntents(data.enquiry)}
                  />
                ) : selectedSource === "enquiry" ? (
                  <EnquiryEditor value={data.enquiry} siteData={data} onUpdate={update} uploadEnabled={Boolean(serverAvailable)} uploadEndpoint={uploadEndpoint} />
                ) : selectedSource === "floatingButton" ? (
                  <FloatingButtonEditor
                    value={data.floatingButton}
                    onUpdate={update}
                    intents={resolveEnquiryIntents(data.enquiry)}
                  />
                ) : selectedSource === "stickyCTA" ? (
                  <StickyCTAEditor
                    value={data.stickyCTA}
                    onUpdate={update}
                    intents={resolveEnquiryIntents(data.enquiry)}
                  />
                ) : selectedSource === "header" ? (
                  <HeaderButtonsEditor value={data.header} site={data.site} onUpdate={update} intents={resolveEnquiryIntents(data.enquiry)} />
                ) : selectedSource === "navigation" ? (
                  <NavigationMenuEditor
                    items={data.navigation.items}
                    sections={normalizeSectionOrder(data.sectionOrder).map((key) => ({
                      key,
                      label: SECTION_LABELS[key],
                      hash: sectionHash(key, normalizeSectionSettings(data.sectionSettings)),
                      enabled: normalizeSectionSettings(data.sectionSettings)[key].enabled,
                    }))}
                    onUpdate={update}
                    onRemove={remove}
                  />
                ) : selectedSource === "hero" ? (
                  <HeroContentEditor value={data.hero} enquiry={data.enquiry} onUpdate={update} uploadEnabled={Boolean(serverAvailable)} uploadEndpoint={uploadEndpoint} intents={resolveEnquiryIntents(data.enquiry)} />
                ) : selectedSource === "bookingCard" ? (
                  <OfferCardEditor value={data.bookingCard} onUpdate={update} intents={resolveEnquiryIntents(data.enquiry)} />
                ) : selectedSource === "heroFacts" ? (
                  <HeroFactsEditor
                    items={data.heroFacts}
                    factsEnabled={data.hero.factsEnabled !== false}
                    hero={data.hero}
                    onUpdate={update}
                  />
                ) : selectedSource === "about" ? (
                  <AboutEditor value={data.about} onUpdate={update} intents={resolveEnquiryIntents(data.enquiry)} />
                ) : selectedSource === "highlights" ? (
                  <HighlightsEditor value={data.highlights} onUpdate={update} intents={resolveEnquiryIntents(data.enquiry)} />
                ) : selectedSource === "amenities" ? (
                  <AmenitiesEditor
                    value={data.amenities}
                    onUpdate={update}
                    intents={resolveEnquiryIntents(data.enquiry)}
                    uploadEnabled={Boolean(serverAvailable)}
                    uploadEndpoint={uploadEndpoint}
                  />
                ) : selectedSource === "gallery" ? (
                  <GalleryEditor
                    value={data.gallery}
                    onUpdate={update}
                    intents={resolveEnquiryIntents(data.enquiry)}
                    uploadEnabled={Boolean(serverAvailable)}
                    uploadEndpoint={uploadEndpoint}
                  />
                ) : selectedSource === "location" ? (
                  <LocationEditor
                    value={data.location}
                    onUpdate={update}
                    intents={resolveEnquiryIntents(data.enquiry)}
                    uploadEnabled={Boolean(serverAvailable)}
                    uploadEndpoint={uploadEndpoint}
                  />
                ) : selectedSource === "virtualTourSection" ? (
                  <VirtualTourEditor value={data.virtualTourSection} onUpdate={update} intents={resolveEnquiryIntents(data.enquiry)} />
                ) : selectedSource === "plansSection" ? (
                  <PlansEditor
                    value={data.plansSection}
                    onUpdate={update}
                    intents={resolveEnquiryIntents(data.enquiry)}
                    uploadEnabled={Boolean(serverAvailable)}
                    uploadEndpoint={uploadEndpoint}
                  />
                ) : selectedSource === "faqSection" ? (
                  <FaqEditor
                    value={data.faqSection}
                    site={data.site}
                    enquiry={data.enquiry}
                    onUpdate={update}
                    uploadEnabled={Boolean(serverAvailable)}
                    uploadEndpoint={uploadEndpoint}
                  />
                ) : selectedSource === "contactSection" ? (
                  <ContactSectionEditor
                    value={data.contactSection}
                    enquiry={data.enquiry}
                    onUpdate={update}
                    uploadEnabled={Boolean(serverAvailable)}
                    uploadEndpoint={uploadEndpoint}
                  />
                ) : selectedSource === "keywordContent" ? (
                  <KeywordContentEditor
                    value={data.keywordContent}
                    defaults={{ hero: data.hero, bookingCard: data.bookingCard, about: data.about }}
                    onChange={(value) => update(["keywordContent"], value)}
                  />
                ) : selectedSource === "site" ? (
                  <BrandIdentityEditor
                    value={data.site}
                    onUpdate={update}
                    uploadEnabled={Boolean(serverAvailable)}
                    uploadEndpoint={uploadEndpoint}
                  />
                ) : selectedSource === "theme" ? (
                  <ThemeColorsEditor value={data.theme} onUpdate={update} />
                ) : selectedSource === "footer" ? (
                  <FooterEditor
                    value={data.footer}
                    onUpdate={update}
                    uploadEnabled={Boolean(serverAvailable)}
                    uploadEndpoint={uploadEndpoint}
                  />
                ) : (
                  <FieldEditor fieldKey={selectedSource} value={selectedValue} path={[selectedSource]} onUpdate={update} onRemove={remove} uploadEnabled={Boolean(serverAvailable)} uploadEndpoint={uploadEndpoint} isRoot />
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {mobileMenu ? (
        <div className="fixed inset-0 z-50 bg-black/45 lg:hidden" onMouseDown={(event) => event.target === event.currentTarget && setMobileMenu(false)}>
          <div className="h-full w-[min(310px,88vw)] bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
              <p className="font-medium text-[#0b1f35]">Sections</p>
              <button type="button" onClick={() => setMobileMenu(false)} className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-slate-100" aria-label="Close sections"><X className="size-5" /></button>
            </div>
            <AdminSidebar groups={editorGroups} availablePages={availablePages} active={activeSection} setActive={(key) => { openPage(key); setMobileMenu(false); }} search={search} setSearch={setSearch} />
          </div>
        </div>
      ) : null}

      {confirmReset ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => event.target === event.currentTarget && setConfirmReset(false)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="reset-confirm-title">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 id="reset-confirm-title" className="text-base font-semibold text-[#0b1f35]">
                  Reset {currentSectionLabel}?
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Discard unsaved changes for this section
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-[12px] leading-5 text-amber-900">
              <p className="font-semibold text-amber-950">
                Only &ldquo;{currentSectionLabel}&rdquo; will be reset.
              </p>
              <p className="mt-1 text-[11px] text-amber-800">
                This will revert this section back to its last saved version. All other sections and changes across the website will remain unchanged.
              </p>
            </div>

            <p className="mt-3 text-[11px] leading-4 text-slate-500">
              Note: After resetting, click <span className="font-semibold text-slate-700">Save Changes</span> in the top header to apply this to the live website.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 px-4 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={resetCurrentSection}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#0b1f35] px-4 text-[12px] font-semibold text-white hover:bg-[#173b60]"
              >
                <RefreshCcw className="size-3.5" />
                Yes, reset {currentSectionLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {backupNotice ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => event.target === event.currentTarget && setBackupNotice(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="backup-notice-title"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 id="backup-notice-title" className="text-base font-semibold text-[#0b1f35]">
                  {backupNotice.title}
                </h3>
                <p className="mt-1 text-[12px] leading-5 text-slate-600">{backupNotice.message}</p>
              </div>
            </div>

            {backupNotice.detail ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-[12px] leading-5 text-emerald-900">
                {backupNotice.detail}
              </div>
            ) : null}

            {backupNotice.type === "import" ? (
              <p className="mt-3 text-[11px] leading-4 text-slate-500">
                Click <span className="font-semibold text-slate-700">Save Changes</span> in the top header to publish the imported content.
              </p>
            ) : null}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setBackupNotice(null)}
                className="inline-flex min-h-9 items-center rounded-lg bg-[#0b1f35] px-4 text-[12px] font-semibold text-white hover:bg-[#173b60]"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
    </AdminContentProvider>
    </AdminSiteContext.Provider>
  );
}

const reorderableSectionLabels = SECTION_LABELS;

function moveSectionAfter(
  order: LandingSectionKey[],
  section: LandingSectionKey,
  after: LandingSectionKey | "__first__",
): LandingSectionKey[] {
  const next = order.filter((item) => item !== section);
  if (after === "__first__") return [section, ...next];
  const targetIndex = next.indexOf(after);
  next.splice(targetIndex < 0 ? next.length : targetIndex + 1, 0, section);
  return next;
}

function SpacingInputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
}) {
  const [local, setLocal] = useState<string>(String(value ?? 0));

  useEffect(() => {
    setLocal(String(value ?? 0));
  }, [value]);

  return (
    <label className="block">
      <span className="admin-label">{label} (px)</span>
      <input
        type="number"
        min={-500}
        max={500}
        value={local}
        onChange={(event) => {
          const raw = event.target.value;
          setLocal(raw);
          const parsed = Number(raw);
          if (raw === "") {
            onChange(0);
          } else if (!isNaN(parsed) && raw !== "-") {
            onChange(Math.min(500, Math.max(-500, parsed)));
          }
        }}
        onBlur={() => {
          const parsed = Number(local);
          const finalVal = isNaN(parsed) ? 0 : Math.min(500, Math.max(-500, parsed));
          setLocal(String(finalVal));
          onChange(finalVal);
        }}
        className="admin-input"
      />
    </label>
  );
}

function SectionOrderEditor({
  value,
  onChange,
  settings,
  onSettingsChange,
  data,
  onFeatureToggle,
  onRetargetNavigation,
}: {
  value: LandingSectionKey[];
  onChange: (value: LandingSectionKey[]) => void;
  settings: Record<LandingSectionKey, SectionLayoutSetting>;
  onSettingsChange: (value: Record<LandingSectionKey, SectionLayoutSetting>) => void;
  data: SiteData;
  onFeatureToggle: (path: PathPart[], value: boolean) => void;
  onRetargetNavigation: (fromHash: string, toHash: string) => void;
}) {
  const updateSetting = <K extends keyof SectionLayoutSetting>(
    section: LandingSectionKey,
    key: K,
    nextValue: SectionLayoutSetting[K],
  ) => {
    onSettingsChange({
      ...settings,
      [section]: { ...settings[section], [key]: nextValue },
    });
  };
  const anchorOnFocus = useRef<Partial<Record<LandingSectionKey, string>>>({});

  return (
    <div>
      <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <h2 className="text-sm font-medium text-[#0b1f35]">Page visibility and order</h2>
        <p className="mt-1 text-xs leading-5 text-slate-600">Turn sections on or off, customize background colors, and adjust spacing (supports negative margins &amp; padding to reduce gaps).</p>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-[#0b1f35]">Frequently used visibility controls</h3>
        <p className="mt-1 text-xs text-slate-500">The most commonly requested show/hide controls are collected here.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <QuickToggle label="Hero offer card" description="Large promotional card on the hero's right side" checked={data.bookingCard.enabled} onChange={(value) => onFeatureToggle(["bookingCard", "enabled"], value)} />
          <QuickToggle
            label="Mobile hero lead form"
            description="Name + phone form under the offer card on phones only"
            checked={data.hero.mobileLeadForm?.enabled !== false}
            onChange={(value) => onFeatureToggle(["hero", "mobileLeadForm", "enabled"], value)}
          />
          <QuickToggle label="Four hero fact cards" description="White icon strip directly below the hero" checked={data.hero.factsEnabled !== false} onChange={(value) => onFeatureToggle(["hero", "factsEnabled"], value)} />
          <QuickToggle label="Five project highlights" description="Dark statistics strip near the About section" checked={settings.highlights.enabled} onChange={(value) => updateSetting("highlights", "enabled", value)} />
          <QuickToggle label="About feature cards" description="Four trust cards beside About content" checked={data.about.features.some((feature) => feature.enabled !== false)} onChange={(value) => data.about.features.forEach((_, index) => onFeatureToggle(["about", "features", index, "enabled"], value))} />
          <QuickToggle label="Amenities image icons" description="Live, Play and Relax panel over the image" checked={data.amenities.lifestyleCardsEnabled !== false} onChange={(value) => onFeatureToggle(["amenities", "lifestyleCardsEnabled"], value)} />
          <QuickToggle label="Amenities visit button" description="Site-visit button below the amenities image" checked={data.amenities.visitCtaEnabled !== false} onChange={(value) => onFeatureToggle(["amenities", "visitCtaEnabled"], value)} />
        </div>
      </div>

      <div className="space-y-2">
        {value.map((section, index) => (
          <SectionOrderRow key={section}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#0b1f35] text-xs font-medium text-white">
                {index + 1}
              </span>
              <div className="min-w-[140px] flex-1">
                <p className="text-sm font-medium text-[#0b1f35]">{reorderableSectionLabels[section]}</p>
              </div>
              <label className="w-[10.5rem] shrink-0">
                <span className="admin-label">Section ID</span>
                <span className="mt-1.5 flex h-10 items-center rounded-lg border border-slate-200 bg-white px-2 focus-within:border-[#b98945]">
                  <span className="pr-1 font-mono text-[12px] text-slate-400">#</span>
                  <input
                    value={settings[section].anchor}
                    onFocus={() => { anchorOnFocus.current[section] = settings[section].anchor; }}
                    onChange={(event) => updateSetting(section, "anchor", event.target.value.replace(/^#/, ""))}
                    onBlur={(event) => {
                      const previous = `#${anchorOnFocus.current[section] || SECTION_ANCHORS[section]}`;
                      const next = sanitizeSectionAnchor(event.target.value, SECTION_ANCHORS[section]);
                      updateSetting(section, "anchor", next);
                      onRetargetNavigation(previous, `#${next}`);
                    }}
                    className="min-w-0 flex-1 font-mono text-[12px] text-[#0b1f35] outline-none"
                    aria-label={`${reorderableSectionLabels[section]} section ID`}
                  />
                </span>
              </label>
              <label className="flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={settings[section].enabled}
                  onChange={(event) => updateSetting(section, "enabled", event.target.checked)}
                  className="size-4 accent-[#b98945]"
                />
                Visible
              </label>
              <label className="w-[11.5rem] shrink-0">
                <span className="admin-label">Place after</span>
                <select
                  value={index === 0 ? "__first__" : value[index - 1]}
                  onChange={(event) => onChange(moveSectionAfter(value, section, event.target.value as LandingSectionKey | "__first__"))}
                  className="admin-input"
                >
                  <option value="__first__">At the beginning</option>
                  {value.filter((item) => item !== section).map((item) => (
                    <option key={item} value={item}>{reorderableSectionLabels[item]}</option>
                  ))}
                </select>
              </label>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => {
                    const next = [...value];
                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                    onChange(next);
                  }}
                  className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-[#b98945] hover:text-[#b98945] disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label={`Move ${reorderableSectionLabels[section]} up`}
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={index === value.length - 1}
                  onClick={() => {
                    const next = [...value];
                    [next[index + 1], next[index]] = [next[index], next[index + 1]];
                    onChange(next);
                  }}
                  className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-[#b98945] hover:text-[#b98945] disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label={`Move ${reorderableSectionLabels[section]} down`}
                >
                  <ArrowDown className="size-4" />
                </button>
              </div>
            </div>

            <AdvancedPanel label="Advanced styling & spacing" className="mt-3 border-t border-slate-200 pt-3">
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <span className="admin-label">Section background color</span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 focus-within:border-[#b98945]">
                        <input
                          type="color"
                          value={
                            /^#[0-9a-f]{6}$/i.test(settings[section].backgroundColor || "")
                              ? settings[section].backgroundColor
                              : "#ffffff"
                          }
                          onChange={(event) => updateSetting(section, "backgroundColor", event.target.value)}
                          className="size-6 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                        />
                        <input
                          value={settings[section].backgroundColor || ""}
                          onChange={(event) => updateSetting(section, "backgroundColor", event.target.value)}
                          placeholder="Default (transparent / theme)"
                          className="min-w-0 flex-1 text-[12px] uppercase outline-none"
                        />
                      </span>
                      {settings[section].backgroundColor ? (
                        <button
                          type="button"
                          onClick={() => updateSetting(section, "backgroundColor", "")}
                          className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-2 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-red-600"
                          title="Reset to default background"
                        >
                          Default
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <span className="admin-label">Section text color</span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 focus-within:border-[#b98945]">
                        <input
                          type="color"
                          value={
                            /^#[0-9a-f]{6}$/i.test(settings[section].textColor || "")
                              ? settings[section].textColor
                              : "#0B1F35"
                          }
                          onChange={(event) => updateSetting(section, "textColor", event.target.value)}
                          className="size-6 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                        />
                        <input
                          value={settings[section].textColor || ""}
                          onChange={(event) => updateSetting(section, "textColor", event.target.value)}
                          placeholder="Default (theme text color)"
                          className="min-w-0 flex-1 text-[12px] uppercase outline-none"
                        />
                      </span>
                      {settings[section].textColor ? (
                        <button
                          type="button"
                          onClick={() => updateSetting(section, "textColor", "")}
                          className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-2 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-red-600"
                          title="Reset to default text color"
                        >
                          Default
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="admin-label mb-1.5 block">Spacing (supports negative values to reduce gaps)</span>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(["paddingTop", "paddingBottom", "marginTop", "marginBottom"] as const).map((key) => (
                      <SpacingInputField
                        key={key}
                        label={humanize(key)}
                        value={settings[section][key]}
                        onChange={(next) => updateSetting(section, key, next)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </AdvancedPanel>
          </SectionOrderRow>
        ))}
      </div>
    </div>
  );
}

type SidebarProps = {
  groups: EditorGroup[];
  availablePages: EditorPage[];
  active: string;
  setActive: (key: string) => void;
  search: string;
  setSearch: (value: string) => void;
  className?: string;
};

function AdminSidebar({ groups, availablePages, active, setActive, search, setSearch, className = "" }: SidebarProps) {
  const availableKeys = new Set(availablePages.map((page) => page.key));
  const normalizedSearch = search.trim().toLowerCase();
  return (
    <aside className={`border-r border-slate-200 bg-white p-4 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto ${className}`}>
      <label className="relative mb-4 block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a section" className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12px] outline-none focus:border-[#b98945]" />
      </label>
      <nav className="space-y-5">
        {groups.map((group) => {
          const items = group.items.filter((item) => availableKeys.has(item.key) && (!normalizedSearch || `${item.label} ${item.description}`.toLowerCase().includes(normalizedSearch)));
          if (!items.length) return null;
          return (
            <div key={group.label}>
              <p className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">{group.label}</p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.key} type="button" onClick={() => setActive(item.key)} className={`flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left transition-colors ${active === item.key ? "bg-[#0b1f35] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-[#0b1f35]"}`}>
                      <Icon className={`size-4 shrink-0 ${active === item.key ? "text-[#d3a45f]" : "text-slate-400"}`} />
                      <span className="truncate text-[13px] font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function QuickToggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 hover:border-[#d3a45f]">
      <button type="button" role="switch" aria-label={label} aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-slate-300"}`}>
        <span className={`absolute top-1 size-4 rounded-full bg-white shadow transition-transform ${checked ? "left-6" : "left-1"}`} />
      </button>
      <span className="min-w-0"><span className="block text-xs font-medium text-[#0b1f35]">{label}</span><span className="mt-0.5 block text-[10px] leading-4 text-slate-500">{description}</span></span>
    </div>
  );
}

function SectionOrderRow({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">{children}</div>;
}

function AdvancedPanel({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={className}>
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex min-h-9 items-center gap-2 text-[11px] font-medium text-slate-500 hover:text-[#0b1f35]">
        <Settings2 className="size-3.5" /> {label} <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? <div className="pt-2">{children}</div> : null}
    </div>
  );
}

type FieldEditorProps = {
  fieldKey: string;
  value: unknown;
  path: PathPart[];
  onUpdate: (path: PathPart[], value: unknown) => void;
  onRemove: (path: PathPart[]) => void;
  uploadEnabled: boolean;
  uploadEndpoint: string;
  isRoot?: boolean;
};

function FieldEditor({ fieldKey, value, path, onUpdate, onRemove, uploadEnabled, uploadEndpoint, isRoot = false }: FieldEditorProps) {
  const siteData = useContext(AdminSiteContext);
  const [freshIndex, setFreshIndex] = useState<number | null>(null);

  if (Array.isArray(value)) {
    const template = value.length ? value[value.length - 1] : defaultListTemplate(fieldKey, path);
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-medium text-[#0b1f35]">{fieldLabel(fieldKey)}</h2>
            <p className="text-[11px] text-slate-500">{value.length} item{value.length === 1 ? "" : "s"}</p>
          </div>
          <button type="button" onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const nextItem = createListItem(template, fieldKey, path);
            onUpdate(path, [...value, nextItem]);
            setFreshIndex(value.length);
          }} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#b98945] px-3 text-[11px] font-semibold text-white hover:bg-[#a57738]"><Plus className="size-3.5" /> Add Item</button>
        </div>
        {value.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-[12px] text-slate-500">No items yet. Add an item to begin.</p> : null}
        <div className="space-y-3">
          {value.map((item, index) => (
            <ArrayItem
              key={`${path.join("-")}-${index}-${typeof item === "object" && item && "id" in item ? String((item as { id?: string }).id) : ""}`}
              label={itemSummary(item, `${fieldLabel(fieldKey)} ${index + 1}`)}
              startOpen={index === freshIndex}
              onDelete={() => onRemove([...path, index])}
              onMoveUp={index > 0 ? () => {
                const next = [...value];
                [next[index - 1], next[index]] = [next[index], next[index - 1]];
                onUpdate(path, next);
              } : undefined}
              onMoveDown={index < value.length - 1 ? () => {
                const next = [...value];
                [next[index + 1], next[index]] = [next[index], next[index + 1]];
                onUpdate(path, next);
              } : undefined}
            >
              <FieldEditor fieldKey={`${fieldKey}-${index}`} value={item} path={[...path, index]} onUpdate={onUpdate} onRemove={onRemove} uploadEnabled={uploadEnabled} uploadEndpoint={uploadEndpoint} isRoot />
            </ArrayItem>
          ))}
        </div>
      </div>
    );
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const hiddenLegacyFields = path[0] === "virtualTourSection" && path.length === 1
        ? new Set(["textEnabled", "label", "description", "playLabel", "minHeight", "playButtonEnabled", "backgroundImage", "backgroundImageAlt", "backgroundPosition"])
        : path[0] === "plansSection" && (path.length === 1 || (path[1] === "cards" && typeof path[2] === "number"))
          ? new Set(["description"])
          : new Set<string>();
    const entries = Object.entries(value)
      .filter(([key]) => !hiddenLegacyFields.has(key) && !isInternalField(key));
    if (path[0] === "location" && path.length === 1) {
      if (!entries.some(([key]) => key === "label")) entries.unshift(["label", record.label || "LOCATION"]);
      if (!entries.some(([key]) => key === "titleAlign")) entries.splice(1, 0, ["titleAlign", record.titleAlign || "left"]);
    }
    if (path[0] === "offerBar" && path.length === 1) {
      if (!entries.some(([key]) => key === "closeBackgroundEnabled")) {
        entries.push(["closeBackgroundEnabled", record.closeBackgroundEnabled !== false]);
      }
      if (!entries.some(([key]) => key === "closeBackgroundColor")) {
        entries.push(["closeBackgroundColor", record.closeBackgroundColor || record.backgroundColor || "#B98945"]);
      }
      if (!entries.some(([key]) => key === "closeIconColor")) {
        entries.push(["closeIconColor", record.closeIconColor || "#FFFFFF"]);
      }
    }
    entries.sort(([leftKey, leftValue], [rightKey, rightValue]) => {
        if (typeof leftValue === "boolean" && typeof rightValue !== "boolean") return -1;
        if (typeof rightValue === "boolean" && typeof leftValue !== "boolean") return 1;
        return fieldPriority(leftKey) - fieldPriority(rightKey);
    });
    const action = String(record.action || "");
    if (["enquire", "brochure", "download"].includes(action) && !entries.some(([key]) => key === "intent")) {
      entries.push(["intent", record.intent || "default"]);
    }
    if (path[0] === "stickyCTA" && path.length === 1 && !entries.some(([key]) => key === "enquireIntent")) {
      entries.push(["enquireIntent", record.enquireIntent || "default"]);
    }
    if (path[0] === "virtualTourSection" && path.length === 1 && !entries.some(([key]) => key === "enquireIntent")) {
      entries.push(["enquireIntent", record.enquireIntent || "default"]);
    }
    const advancedEntries = isRoot ? entries.filter(([key]) => isAdvancedField(key)) : [];
    const primaryEntries = isRoot ? entries.filter(([key]) => !isAdvancedField(key)) : entries;
    const renderEntries = (items: Array<[string, unknown]>) => (
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map(([key, item]) => {
          const complex = Array.isArray(item) || (item !== null && typeof item === "object");
          return (
            <div key={key} className={complex ? "sm:col-span-2" : "min-w-0"}>
              {complex ? (
                <FieldGroup label={fieldLabel(key)} summary={groupSummary(item)}>
                  <FieldEditor fieldKey={key} value={item} path={[...path, key]} onUpdate={onUpdate} onRemove={onRemove} uploadEnabled={uploadEnabled} uploadEndpoint={uploadEndpoint} isRoot={Array.isArray(item)} />
                </FieldGroup>
              ) : (
                <FieldEditor fieldKey={key} value={item} path={[...path, key]} onUpdate={onUpdate} onRemove={onRemove} uploadEnabled={uploadEnabled} uploadEndpoint={uploadEndpoint} />
              )}
            </div>
          );
        })}
      </div>
    );
    return (
      <div className="space-y-5">
        {renderEntries(primaryEntries)}
        {advancedEntries.length ? <AdvancedPanel label="Advanced design and technical settings">{renderEntries(advancedEntries)}</AdvancedPanel> : null}
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <label className="flex min-h-12 items-center justify-between gap-4 rounded-lg border border-slate-200 px-3">
        <span><span className="block text-[12px] font-semibold text-slate-700">{fieldLabel(fieldKey)}</span>{fieldHelp[fieldKey] ? <span className="mt-0.5 block text-[10px] text-slate-500">{fieldHelp[fieldKey]}</span> : null}</span>
        <button type="button" role="switch" aria-checked={value} onClick={() => onUpdate(path, !value)} className={`relative h-6 w-11 rounded-full transition-colors ${value ? "bg-emerald-500" : "bg-slate-300"}`}>
          <span className={`absolute top-1 size-4 rounded-full bg-white shadow transition-transform ${value ? "left-6" : "left-1"}`} />
        </button>
      </label>
    );
  }

  const stringValue = value === null || value === undefined ? "" : String(value);
  const inputType = typeof value === "number" ? "number" : "text";
  const intentOptions = (fieldKey === "intent" || fieldKey === "enquireIntent") && siteData ? resolveEnquiryIntents(siteData.enquiry) : null;

  if (intentOptions) {
    return (
      <label className="block">
        <span className="admin-label">Which form</span>
        <span className="mt-1 block text-[10px] leading-4 text-slate-500">Shown when this button opens a contact / brochure / download form.</span>
        <select value={stringValue || "default"} onChange={(event) => onUpdate(path, event.target.value)} className="admin-input">
          {intentOptions.map((intent) => <option key={intent.id} value={intent.id}>{intent.name}</option>)}
        </select>
      </label>
    );
  }

  if (fieldKey === "successType") {
    return (
      <label className="block">
        <span className="admin-label">{fieldLabel(fieldKey)}</span>
        <select value={stringValue || "message"} onChange={(event) => onUpdate(path, event.target.value)} className="admin-input">
          {successTypeOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>
    );
  }

  if (fieldKey === "icon") {
    return <IconPicker label={fieldLabel(fieldKey)} value={stringValue} onChange={(next) => onUpdate(path, next)} />;
  }

  const selectOptions = fieldKey === "action"
    ? CTA_ACTIONS
    : fieldKey === "size"
      ? ["large", "medium", "portrait"]
      : fieldKey === "titleAlign"
        ? ["left", "center", "right"]
        : null;

  if (selectOptions) {
    const selectValue =
      fieldKey === "action" && stringValue
        ? visibleCtaAction(stringValue as CtaAction)
        : stringValue;
    return (
      <label className="block">
        <span className="admin-label">{fieldLabel(fieldKey)}</span>
        <select value={selectValue} onChange={(event) => onUpdate(path, event.target.value)} className="admin-input">
          {selectOptions.map((option) => <option key={option} value={option}>{humanize(option)}</option>)}
        </select>
      </label>
    );
  }

  if (isImageField(fieldKey)) {
    return <ImageField label={fieldLabel(fieldKey)} value={stringValue} path={path} onUpdate={onUpdate} uploadEnabled={uploadEnabled} uploadEndpoint={uploadEndpoint} />;
  }

  if (isDocumentField(fieldKey)) {
    return <ImageField label={fieldLabel(fieldKey)} value={stringValue} path={path} onUpdate={onUpdate} uploadEnabled={uploadEnabled} uploadEndpoint={uploadEndpoint} allowDocuments />;
  }

  if (isColorField(fieldKey, stringValue)) {
    return (
      <label className="block">
        <span className="admin-label">{fieldLabel(fieldKey)}</span>
        <span className="mt-1.5 flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 focus-within:border-[#b98945]">
          <input type="color" value={/^#[0-9a-f]{6}$/i.test(stringValue) ? stringValue : "#000000"} onChange={(event) => onUpdate(path, event.target.value)} className="size-7 cursor-pointer rounded border-0 bg-transparent p-0" />
          <input value={stringValue} onChange={(event) => onUpdate(path, event.target.value)} className="min-w-0 flex-1 text-[12px] outline-none" />
        </span>
      </label>
    );
  }

  const parent = (getByPath(siteData, path.slice(0, -1)) as Record<string, unknown> | undefined) ?? null;
  const parentHasAction = Boolean(parent && "action" in parent);

  return (
    <label className="block">
      <span className="admin-label">{fieldLabel(fieldKey)}</span>
      {fieldHelp[fieldKey] ? <span className="mt-1 block text-[10px] leading-4 text-slate-500">{fieldHelp[fieldKey]}</span> : null}
      {isLongText(fieldKey, stringValue) ? (
        <textarea value={stringValue} onChange={(event) => onUpdate(path, event.target.value)} rows={4} className="admin-input min-h-24 resize-y py-3" />
      ) : (
        <input type={inputType} value={stringValue} onChange={(event) => onUpdate(path, inputType === "number" ? Number(event.target.value) : event.target.value)} className="admin-input" />
      )}
      {isTextStyleField(fieldKey) && path[0] !== "seo" && path[0] !== "navigation" && !(parentHasAction && fieldKey === "label") ? (
        <TextStyleControls
          fieldKey={fieldKey}
          parentPath={path.slice(0, -1)}
          parent={parent}
          onUpdate={onUpdate}
        />
      ) : null}
    </label>
  );
}

function ArrayItem({ label, onDelete, onMoveUp, onMoveDown, startOpen = false, children }: { label: string; onDelete: () => void; onMoveUp?: () => void; onMoveDown?: () => void; startOpen?: boolean; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(startOpen);
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex min-h-12 items-center gap-2 border-b border-slate-100 bg-slate-50 px-3">
        <button type="button" onClick={() => setExpanded((current) => !current)} className="flex flex-1 items-center gap-2 text-left text-[12px] font-semibold text-slate-700">
          <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} /> {label}
        </button>
        <button type="button" onClick={onMoveUp} disabled={!onMoveUp} className="inline-flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-white disabled:opacity-25" aria-label={`Move ${label} up`}><ArrowUp className="size-3.5" /></button>
        <button type="button" onClick={onMoveDown} disabled={!onMoveDown} className="inline-flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-white disabled:opacity-25" aria-label={`Move ${label} down`}><ArrowDown className="size-3.5" /></button>
        <button type="button" onClick={onDelete} className="inline-flex size-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50" aria-label={`Delete ${label}`}><Trash2 className="size-4" /></button>
      </div>
      {expanded ? <div className="p-4">{children}</div> : null}
    </article>
  );
}

function FieldGroup({ label, summary, children }: { label: string; summary: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex min-h-14 w-full items-center gap-3 px-4 text-left hover:bg-slate-100/70">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#b98945] shadow-sm"><Settings2 className="size-4" /></span>
        <span className="min-w-0 flex-1"><span className="block text-xs font-medium text-[#0b1f35]">{label}</span><span className="block truncate text-[10px] text-slate-500">{summary}</span></span>
        <span className="text-[10px] font-medium text-slate-500">{open ? "Hide" : "Edit details"}</span>
        <ChevronDown className={`size-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? <div className="border-t border-slate-200 bg-white p-4">{children}</div> : null}
    </section>
  );
}


function CompactColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000";
  return (
    <label className="block min-w-0">
      <span className="admin-label">{label}</span>
      <span className="mt-1.5 flex h-10 max-w-[12.5rem] items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 focus-within:border-[#b98945]">
        <input type="color" value={hex} onChange={(event) => onChange(event.target.value)} className="size-6 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0" />
        <input value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 text-[12px] uppercase outline-none" />
      </span>
    </label>
  );
}

function HeaderButtonCard({
  title,
  description,
  button,
  onChange,
  intents,
}: {
  title: string;
  description: string;
  button: HeaderButton;
  onChange: (next: HeaderButton) => void;
  intents: Array<{ id: string; name: string }>;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-medium text-[#0b1f35]">{title}</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={button.enabled}
          aria-label={`Show ${title}`}
          onClick={() => onChange({ ...button, enabled: !button.enabled })}
          className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${button.enabled ? "bg-emerald-500" : "bg-slate-300"}`}
        >
          <span className={`absolute top-1 size-4 rounded-full bg-white shadow transition-transform ${button.enabled ? "left-6" : "left-1"}`} />
        </button>
      </div>
      <div className="space-y-3">
        <CtaFields
          cta={button}
          onChange={(next) => onChange({ ...button, ...next })}
          intents={intents}
          actions={CTA_ACTIONS}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        />
      </div>
    </article>
  );
}

type HeaderViewport = "desktop" | "mobile";

function HeaderButtonsEditor({
  value,
  site,
  onUpdate,
  intents,
}: {
  value: SiteData["header"];
  site: SiteData["site"];
  onUpdate: (path: PathPart[], value: unknown) => void;
  intents: Array<{ id: string; name: string }>;
}) {
  const [viewport, setViewport] = useState<HeaderViewport>("desktop");
  const { primary, secondary } = resolveHeaderButtons(value, site);
  const isDesktop = viewport === "desktop";

  const patchHeader = (partial: Partial<SiteData["header"]>) => {
    onUpdate(["header"], { ...value, ...partial });
  };

  const saveSecondary = (next: HeaderButton) => {
    const backgroundColor = (next.backgroundColor || "").trim() || value.phoneButtonColor;
    patchHeader({
      phoneButton: {
        ...next,
        backgroundColor,
        // Prefer plain fill when a solid color is set so desktop matches the picker
        backgroundType: next.backgroundType === "gradient" ? "gradient" : "plain",
      },
      phoneButtonColor: backgroundColor,
    });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Editing for</p>
            <p className="mt-1 text-[14px] font-medium text-[#0b1f35]">
              {isDesktop ? "Desktop & tablet header" : "Mobile header"}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {isDesktop
                ? "Colors and buttons shown on large screens. Mobile can override separately."
                : "Phone-only colors and button overrides. Desktop settings stay unchanged."}
            </p>
          </div>
          <label className="block w-full shrink-0 sm:w-56">
            <span className="admin-label">Device</span>
            <span className="relative mt-1.5 block">
              <select
                value={viewport}
                onChange={(event) => setViewport(event.target.value as HeaderViewport)}
                className="admin-input appearance-none pr-9 font-semibold"
                aria-label="Choose desktop or mobile header settings"
              >
                <option value="desktop">Desktop & tablet</option>
                <option value="mobile">Mobile phone</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            </span>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Header device">
          <button
            type="button"
            role="tab"
            aria-selected={isDesktop}
            onClick={() => setViewport("desktop")}
            className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-[12px] font-semibold transition-colors ${
              isDesktop
                ? "bg-[#0b1f35] text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-[#b98945]/50"
            }`}
          >
            <Monitor className="size-3.5" aria-hidden="true" />
            Desktop
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isDesktop}
            onClick={() => setViewport("mobile")}
            className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-[12px] font-semibold transition-colors ${
              !isDesktop
                ? "bg-[#0b1f35] text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-[#b98945]/50"
            }`}
          >
            <Smartphone className="size-3.5" aria-hidden="true" />
            Mobile
          </button>
        </div>
      </div>

      {isDesktop ? (
        <div className="space-y-5" role="tabpanel" aria-label="Desktop header settings">
          <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <div>
              <h2 className="text-[14px] font-medium text-[#0b1f35]">Header bar colors</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Choose whether the bar is clear at the top of the page, and the navigation link color on desktop and tablet.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="admin-label">Background behavior</span>
                <select
                  value={value.backgroundStyle || "scroll"}
                  onChange={(event) => patchHeader({ backgroundStyle: event.target.value as "scroll" | "solid" })}
                  className="admin-input"
                >
                  <option value="scroll">Transparent at the top, color after scroll</option>
                  <option value="solid">Same color at the top and after scroll</option>
                </select>
              </label>
              <CompactColorField
                label={value.backgroundStyle === "solid" ? "Header background" : "Background after scroll"}
                value={value.backgroundColor || "#0B1F35"}
                onChange={(backgroundColor) => onUpdate(["header", "backgroundColor"], backgroundColor)}
              />
              <CompactColorField
                label="Nav text color"
                value={value.navTextColor || "#FFFFFF"}
                onChange={(navTextColor) => patchHeader({ navTextColor })}
              />
              <label>
                <span className="admin-label">Header height adjustment (px)</span>
                <input
                  type="number"
                  min={-160}
                  max={200}
                  value={typeof value.heightOffset === "number" ? value.heightOffset : 0}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (!Number.isFinite(next)) return;
                    patchHeader({ heightOffset: Math.min(200, Math.max(-160, Math.round(next))) });
                  }}
                  className="admin-input"
                />
                <span className="mt-1 block text-[10px] text-slate-500">Positive adds height. Negative shrinks the bar.</span>
              </label>
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            <HeaderButtonCard
              title="Button 1 — Brochure"
              description="Desktop header button. Mobile reuses these colors unless you override them under Mobile."
              button={primary}
              onChange={(next) => onUpdate(["header", "brochureButton"], next)}
              intents={intents}
            />
            <HeaderButtonCard
              title="Button 2 — Call"
              description="Desktop / tablet phone button. Change the fill here for large screens."
              button={secondary}
              onChange={saveSecondary}
              intents={intents}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-5" role="tabpanel" aria-label="Mobile header settings">
          <section className="space-y-3 rounded-xl border border-[#b98945]/30 bg-[#fffaf3]/60 p-4">
            <div>
              <h2 className="text-[14px] font-medium text-[#0b1f35]">Header bar colors</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Phone header bar, open-menu panel, link text, and hamburger icon.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="sm:col-span-3">
                <span className="admin-label">Background behavior</span>
                <select
                  value={value.mobileBackgroundStyle || "solid"}
                  onChange={(event) => patchHeader({ mobileBackgroundStyle: event.target.value as "scroll" | "solid" })}
                  className="admin-input"
                >
                  <option value="scroll">Transparent at the top, color after scroll</option>
                  <option value="solid">Same color at the top and after scroll</option>
                </select>
              </label>
              <CompactColorField
                label={(value.mobileBackgroundStyle || "solid") === "solid" ? "Header background" : "Background after scroll"}
                value={value.mobileBackgroundColor || value.backgroundColor || "#0B1F35"}
                onChange={(mobileBackgroundColor) => patchHeader({ mobileBackgroundColor })}
              />
              <CompactColorField
                label="Menu text color"
                value={value.mobileNavTextColor || "#FFFFFF"}
                onChange={(mobileNavTextColor) => patchHeader({ mobileNavTextColor })}
              />
              <CompactColorField
                label="Menu icon color"
                value={value.mobileIconColor || "#FFFFFF"}
                onChange={(mobileIconColor) => patchHeader({ mobileIconColor })}
              />
              <label>
                <span className="admin-label">Header height adjustment (px)</span>
                <input
                  type="number"
                  min={-160}
                  max={200}
                  value={typeof value.mobileHeightOffset === "number" ? value.mobileHeightOffset : 0}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (!Number.isFinite(next)) return;
                    patchHeader({ mobileHeightOffset: Math.min(200, Math.max(-160, Math.round(next))) });
                  }}
                  className="admin-input"
                />
                <span className="mt-1 block text-[10px] text-slate-500">Positive adds height. Negative shrinks the bar.</span>
              </label>
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-[14px] font-medium text-[#0b1f35]">Button color overrides</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Optional. Leave as-is to keep the same look as Desktop buttons. These never change the desktop header.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-[13px] font-semibold text-[#0b1f35]">Button 1 — Brochure</h3>
                <p className="text-[10px] text-slate-500">Mobile-only fill. Defaults to Desktop Button 1.</p>
                <ButtonBackgroundPicker
                  value={{
                    backgroundType: value.mobileBrochureBackgroundType || primary.backgroundType,
                    backgroundColor: value.mobileBrochureBackgroundColor || primary.backgroundColor,
                    backgroundGradient: value.mobileBrochureBackgroundGradient || primary.backgroundGradient,
                  }}
                  onChange={(next) =>
                    patchHeader({
                      mobileBrochureBackgroundType: (next.backgroundType as "plain" | "gradient") || "plain",
                      mobileBrochureBackgroundColor: next.backgroundColor,
                      mobileBrochureBackgroundGradient: next.backgroundGradient,
                    })
                  }
                  textColor={value.mobileBrochureTextColor || primary.textColor || "#FFFFFF"}
                  onTextColorChange={(mobileBrochureTextColor) => patchHeader({ mobileBrochureTextColor })}
                  plainLabel="Mobile button fill"
                />
              </div>
              <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-[13px] font-semibold text-[#0b1f35]">Button 2 — Call</h3>
                <p className="text-[10px] text-slate-500">Mobile-only fill. Defaults to Desktop Button 2.</p>
                <ButtonBackgroundPicker
                  value={{
                    backgroundType: value.mobilePhoneBackgroundType || secondary.backgroundType,
                    backgroundColor: value.mobilePhoneBackgroundColor || secondary.backgroundColor,
                    backgroundGradient: value.mobilePhoneBackgroundGradient || secondary.backgroundGradient,
                  }}
                  onChange={(next) =>
                    patchHeader({
                      mobilePhoneBackgroundType: (next.backgroundType as "plain" | "gradient") || "plain",
                      mobilePhoneBackgroundColor: next.backgroundColor,
                      mobilePhoneBackgroundGradient: next.backgroundGradient,
                    })
                  }
                  textColor={value.mobilePhoneTextColor || secondary.textColor || "#FFFFFF"}
                  onTextColorChange={(mobilePhoneTextColor) => patchHeader({ mobilePhoneTextColor })}
                  plainLabel="Mobile call fill"
                />
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function NavigationMenuEditor({
  items,
  sections,
  onUpdate,
  onRemove,
}: {
  items: NavItem[];
  sections: Array<{ key: LandingSectionKey; label: string; hash: string; enabled: boolean }>;
  onUpdate: (path: PathPart[], value: unknown) => void;
  onRemove: (path: PathPart[]) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const knownHashes = new Set(sections.map((section) => section.hash));
  const defaultHash = sections.find((section) => section.enabled)?.hash ?? sections[0]?.hash ?? "#overview";
  const editing = editIndex !== null ? items[editIndex] : null;
  const editingUsesSection = editing ? knownHashes.has(editing.target) : false;

  const moveItem = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onUpdate(["navigation", "items"], next);
    if (editIndex === from) setEditIndex(to);
    else if (editIndex !== null) {
      if (from < editIndex && to >= editIndex) setEditIndex(editIndex - 1);
      else if (from > editIndex && to <= editIndex) setEditIndex(editIndex + 1);
    }
  };

  const clearDrag = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-medium text-[#0b1f35]">Menu items</h2>
          <p className="text-[11px] text-slate-500">
            Left → right is the header order. Drag a name to reorder · Edit opens details.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const nextIndex = items.length;
            onUpdate(["navigation", "items"], [...items, { label: "New link", target: defaultHash }]);
            setEditIndex(nextIndex);
          }}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#b98945] px-3 text-[11px] font-semibold text-white hover:bg-[#a57738]"
        >
          <Plus className="size-3.5" /> Add item
        </button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-[12px] text-slate-500">
          No menu items yet. Add an item to begin.
        </p>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-min items-stretch gap-2">
            {items.map((item, index) => {
              const isDragging = dragIndex === index;
              const isDropTarget = overIndex === index && dragIndex !== null && dragIndex !== index;
              return (
                <article
                  key={`${item.label}-${index}`}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", String(index));
                    // Slight delay so the browser captures the lifted card as the drag image.
                    requestAnimationFrame(() => setDragIndex(index));
                  }}
                  onDragEnd={clearDrag}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    if (overIndex !== index) setOverIndex(index);
                  }}
                  onDragLeave={() => {
                    if (overIndex === index) setOverIndex(null);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (dragIndex !== null) moveItem(dragIndex, index);
                    clearDrag();
                  }}
                  className={`group relative flex w-[168px] shrink-0 cursor-grab select-none items-center gap-2 rounded-xl border bg-white px-3 py-3 transition-all active:cursor-grabbing ${
                    isDragging
                      ? "z-10 -translate-y-1 scale-[1.04] border-[#b98945] bg-white shadow-2xl ring-2 ring-[#b98945]/40"
                      : isDropTarget
                        ? "border-[#b98945] bg-[#b98945]/5 shadow-md ring-2 ring-[#b98945]/20"
                        : "border-slate-200 shadow-sm hover:border-slate-300 hover:shadow"
                  }`}
                >
                  {isDragging ? (
                    <span className="pointer-events-none absolute inset-0 rounded-xl bg-[#b98945]/8" aria-hidden />
                  ) : null}
                  {isDropTarget && dragIndex !== null && dragIndex > index ? (
                    <span className="absolute -left-1 top-2 bottom-2 w-1 rounded-full bg-[#b98945]" aria-hidden />
                  ) : null}
                  {isDropTarget && dragIndex !== null && dragIndex < index ? (
                    <span className="absolute -right-1 top-2 bottom-2 w-1 rounded-full bg-[#b98945]" aria-hidden />
                  ) : null}
                  <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                    {index + 1}
                  </span>
                  <GripVertical className="size-4 shrink-0 text-slate-300 group-hover:text-slate-500" aria-hidden />
                  <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#0b1f35]" title={item.label || "Untitled"}>
                    {item.label || "Untitled"}
                  </p>
                  <button
                    type="button"
                    draggable={false}
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditIndex(index);
                    }}
                    onMouseDown={(event) => event.stopPropagation()}
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-[#0b1f35]"
                    aria-label={`Edit ${item.label || "menu item"}`}
                    title="Edit"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </article>
              );
            })}

            <button
              type="button"
              onClick={() => {
                const nextIndex = items.length;
                onUpdate(["navigation", "items"], [...items, { label: "New link", target: defaultHash }]);
                setEditIndex(nextIndex);
              }}
              className="flex w-[140px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-3 py-3 text-[12px] font-medium text-slate-500 transition-colors hover:border-[#b98945] hover:bg-[#b98945]/5 hover:text-[#0b1f35]"
            >
              <Plus className="size-4" />
              Add
            </button>
          </div>
        </div>
      )}

      {editing && editIndex !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20"
          onMouseDown={(event) => event.target === event.currentTarget && setEditIndex(null)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium text-[#0b1f35]">Edit menu item</h3>
                <p className="text-[11px] text-slate-500">Position {editIndex + 1} in the header</p>
              </div>
              <button
                type="button"
                onClick={() => setEditIndex(null)}
                className="inline-flex size-8 items-center justify-center rounded-md hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block min-w-0">
                <span className="admin-label">Label</span>
                <input
                  value={editing.label}
                  onChange={(event) => onUpdate(["navigation", "items", editIndex, "label"], event.target.value)}
                  className="admin-input"
                  autoFocus
                />
              </label>
              <label className="block min-w-0">
                <span className="admin-label">Goes to</span>
                <select
                  value={editingUsesSection ? editing.target : "__custom__"}
                  onChange={(event) => {
                    const next = event.target.value;
                    onUpdate(["navigation", "items", editIndex, "target"], next === "__custom__" ? "" : next);
                  }}
                  className="admin-input"
                >
                  {sections.map((section) => (
                    <option key={section.key} value={section.hash}>
                      {section.label} ({section.hash}){section.enabled ? "" : " — hidden"}
                    </option>
                  ))}
                  <option value="__custom__">Custom link</option>
                </select>
              </label>
              {!editingUsesSection ? (
                <label className="block min-w-0">
                  <span className="admin-label">Custom link</span>
                  <input
                    value={editing.target}
                    onChange={(event) => onUpdate(["navigation", "items", editIndex, "target"], event.target.value)}
                    placeholder="#enquire or https://…"
                    className="admin-input"
                  />
                </label>
              ) : null}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  onRemove(["navigation", "items", editIndex]);
                  setEditIndex(null);
                }}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-[12px] font-semibold text-red-600 hover:bg-red-50"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
              <button
                type="button"
                onClick={() => setEditIndex(null)}
                className="inline-flex min-h-9 items-center rounded-lg bg-[#0b1f35] px-4 text-[12px] font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ImageField({ label, value, path, onUpdate, uploadEnabled, uploadEndpoint, allowDocuments = false }: { label: string; value: string; path: PathPart[]; onUpdate: (path: PathPart[], value: unknown) => void; uploadEnabled: boolean; uploadEndpoint: string; allowDocuments?: boolean }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const isPdf = isPdfPath(value);

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const publicPath = await uploadFileAsset(file, uploadEndpoint);
      onUpdate(path, publicPath);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div>
      <span className="admin-label">{label}</span>
      {value && !isPdf ? <div className="mt-1.5 h-28 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"><img src={value} alt="" className="size-full object-contain" /></div> : null}
      {value && isPdf ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="mt-1.5 flex min-h-12 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[12px] font-medium text-[#0b1f35] hover:bg-slate-100">
          <FileText className="size-4 text-[#b98945]" /> View uploaded PDF
        </a>
      ) : null}
      <input value={value} onChange={(event) => onUpdate(path, event.target.value)} placeholder={allowDocuments ? "/uploads/brochure.pdf or https://…" : "/images/example.webp or https://…"} className="admin-input" />
      {error ? <p className="mt-1 text-[11px] text-red-600">{error}</p> : null}
      <div className="mt-2 flex gap-2">
        <label className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-semibold ${uploadEnabled ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed opacity-50"}`}>
          {uploading ? <LoaderCircle className="size-3.5 animate-spin" /> : allowDocuments ? <FileText className="size-3.5" /> : <ImagePlus className="size-3.5" />} Upload
          <input type="file" accept={allowDocuments ? "image/*,.pdf,application/pdf" : "image/*"} disabled={!uploadEnabled || uploading} className="hidden" onChange={upload} />
        </label>
        <button type="button" onClick={() => onUpdate(path, "")} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 text-[11px] font-semibold text-red-600 hover:bg-red-50"><Trash2 className="size-3.5" /> Remove</button>
        <button type="button" onClick={() => navigator.clipboard.writeText(value)} className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Copy file path"><Copy className="size-3.5" /></button>
      </div>
      {allowDocuments ? <p className="mt-1.5 text-[10px] leading-4 text-slate-500">JPG, PNG, WebP, GIF, AVIF, or PDF up to 20 MB.</p> : null}
    </div>
  );
}
