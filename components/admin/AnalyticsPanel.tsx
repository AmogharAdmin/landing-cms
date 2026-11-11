"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ChartColumn,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  MousePointerClick,
  Phone,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { GoogleAnalytics, GoogleTagManager } from "@/types/site";
import { CompactToggle, type PathPart } from "@/components/admin/editor-ui";
import {
  ChannelBadge,
  SourceCell,
  TrafficSourcesCard,
  type TrafficBreakdown,
} from "@/components/admin/TrafficSourcesCard";
import { CHANNEL_LABELS, TRAFFIC_CHANNELS } from "@/lib/traffic-source";
import {
  isValidGa4MeasurementId,
  normalizeGoogleAnalytics,
  resolveGoogleAnalyticsStatus,
} from "@/lib/google-analytics";
import {
  isValidGtmContainerId,
  normalizeGoogleTagManager,
  resolveGoogleTagManagerStatus,
} from "@/lib/google-tag-manager";

type VisitorItem = {
  id: number;
  ip_address: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  device_type: string;
  browser: string | null;
  os: string | null;
  referrer_host: string | null;
  scrolled: boolean;
  max_scroll_pct: number;
  duration_seconds: number;
  converted: boolean;
  first_seen_at: string;
  last_seen_at?: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  gclid?: string | null;
  landing_path?: string | null;
  source_channel?: string;
};

type JoinedSource = {
  source_channel?: string;
  source_utm_source?: string | null;
  source_utm_medium?: string | null;
  source_utm_campaign?: string | null;
  source_utm_term?: string | null;
  source_referrer_host?: string | null;
};

type RangeKey = "today" | "7d" | "30d" | "all";

const RANGE_OPTIONS: Array<{ value: RangeKey; label: string }> = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All" },
];

const PAGE_SIZES = [10, 25, 50];

function joinedSourceValue(item: JoinedSource, extra?: { utmTerm?: string | null; gclid?: string | null }) {
  return {
    channel: item.source_channel,
    utmSource: item.source_utm_source,
    utmMedium: item.source_utm_medium,
    utmCampaign: item.source_utm_campaign,
    utmTerm: item.source_utm_term || extra?.utmTerm,
    referrerHost: item.source_referrer_host,
    gclid: extra?.gclid,
  };
}

function visitorSourceValue(visitor: VisitorItem) {
  return {
    channel: visitor.source_channel,
    utmSource: visitor.utm_source,
    utmMedium: visitor.utm_medium,
    utmCampaign: visitor.utm_campaign,
    utmTerm: visitor.utm_term,
    referrerHost: visitor.referrer_host,
    gclid: visitor.gclid,
  };
}

type CtaClickItem = JoinedSource & {
  id: number;
  session_key: string | null;
  cta_type: string;
  source_label: string;
  ip_address: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  device_type: string;
  created_at: string;
};

type SubmissionItem = JoinedSource & {
  id: number;
  form_source: string;
  form_label: string;
  click_source: string | null;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  custom_fields: Record<string, string> | null;
  ip_address: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  utm_term?: string | null;
  gclid?: string | null;
  submitted_at: string;
};

type SourceSummary = {
  formSource: string;
  formLabel: string;
  count: number;
};

type TabKey = "visitors" | "cta" | "submissions" | "google";

function normalizeVisitorItem(item: VisitorItem): VisitorItem {
  return {
    ...item,
    id: Number(item.id),
    converted: Boolean(item.converted),
    scrolled: Boolean(item.scrolled),
  };
}

function normalizeCtaClickItem(item: CtaClickItem): CtaClickItem {
  return { ...item, id: Number(item.id) };
}

function ctaTypeLabel(type: string) {
  if (type === "whatsapp") return "WhatsApp";
  if (type === "header_call") return "Header call";
  if (type === "floating_call") return "Bottom call";
  return type;
}

function normalizeSubmissionItem(item: SubmissionItem): SubmissionItem {
  return { ...item, id: Number(item.id) };
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs ? `${mins}m ${secs}s` : `${mins}m`;
}

function decodeGeo(value: string | null) {
  if (!value || !value.includes("%")) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function locationLabel(city: string | null, region: string | null, country: string | null) {
  const parts = [decodeGeo(city), region, country].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-2.5 sm:grid-cols-[140px_1fr]">
      <dt className="text-[11px] font-medium text-slate-500">{label}</dt>
      <dd className="text-[12px] text-[#0b1f35] break-words">{value}</dd>
    </div>
  );
}

function TablePagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-3 py-2.5">
      <p className="text-[11px] text-slate-500">
        Page {page} of {totalPages}
        <span className="text-slate-400"> · {total} records</span>
      </p>
      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-[#b98945] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-[#b98945] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

function DetailSection({ title }: { title: string }) {
  return (
    <div className="pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[#8a6528]">{title}</div>
  );
}

function notSet(value: string | null | undefined) {
  return value ? value : <span className="text-slate-400">Not set</span>;
}

function SourceToolbar({
  range,
  onRangeChange,
  channel,
  onChannelChange,
  pageSize,
  onPageSizeChange,
  search,
  children,
}: {
  range: RangeKey;
  onRangeChange: (range: RangeKey) => void;
  channel: string;
  onChannelChange: (channel: string) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  search?: { value: string; onChange: (value: string) => void };
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5">
      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5" role="group" aria-label="Date range">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onRangeChange(option.value)}
            aria-pressed={range === option.value}
            className={`min-h-7 rounded-md px-2.5 text-[11px] font-semibold transition-colors ${range === option.value ? "bg-[#0b1f35] text-white shadow-sm" : "text-slate-600 hover:text-[#0b1f35]"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <label className="inline-flex items-center gap-2 text-[11px] text-slate-600">
        Channel
        <select
          value={channel}
          onChange={(event) => onChannelChange(event.target.value)}
          className="h-8 rounded-lg border border-slate-200 px-2 text-[11px]"
        >
          <option value="">All channels</option>
          {TRAFFIC_CHANNELS.map((key) => (
            <option key={key} value={key}>{CHANNEL_LABELS[key]}</option>
          ))}
        </select>
      </label>
      {children}
      {search ? (
        <label className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={search.value}
            onChange={(event) => search.onChange(event.target.value)}
            placeholder="Search source, campaign, keyword, city, IP…"
            className="h-8 w-full rounded-lg border border-slate-200 pl-8 pr-2 text-[11px]"
          />
        </label>
      ) : null}
      <label className="ml-auto inline-flex items-center gap-2 text-[11px] text-slate-600">
        Rows
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="h-8 rounded-lg border border-slate-200 px-2 text-[11px]"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

function ScrollMeter({ pct, scrolled }: { pct: number; scrolled: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${scrolled ? "bg-emerald-500" : "bg-slate-400"}`}
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </div>
      <span className="tabular-nums text-[11px] text-slate-600">{pct}%</span>
    </div>
  );
}

function DetailModal({
  title,
  onClose,
  onDelete,
  deleting,
  children,
}: {
  title: string;
  onClose: () => void;
  onDelete: () => void;
  deleting: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="mb-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-[#0b1f35]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <dl className="max-h-[60vh] overflow-y-auto px-4 py-2">{children}</dl>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-[12px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? <LoaderCircle className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            Delete
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-9 items-center rounded-lg bg-[#0b1f35] px-4 text-[12px] font-semibold text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsPanel({
  googleAnalytics,
  googleTagManager,
  onUpdate,
}: {
  googleAnalytics?: GoogleAnalytics;
  googleTagManager?: GoogleTagManager;
  onUpdate: (path: PathPart[], value: unknown) => void;
}) {
  const [tab, setTab] = useState<TabKey>("visitors");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(25);
  const [range, setRange] = useState<RangeKey>("all");
  const [channelFilter, setChannelFilter] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [termFilter, setTermFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [trafficSources, setTrafficSources] = useState<TrafficBreakdown | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const gaConfig = normalizeGoogleAnalytics(googleAnalytics);
  const gaStatus = resolveGoogleAnalyticsStatus(gaConfig);
  const gtmConfig = normalizeGoogleTagManager(googleTagManager, googleAnalytics);
  const gtmStatus = resolveGoogleTagManagerStatus(gtmConfig);

  const patchGoogleAnalytics = (patch: Partial<GoogleAnalytics>) => {
    onUpdate(["googleAnalytics"], { ...gaConfig, ...patch });
  };

  const patchGoogleTagManager = (patch: Partial<GoogleTagManager>) => {
    onUpdate(["googleTagManager"], { ...gtmConfig, ...patch });
  };

  const [visitors, setVisitors] = useState<VisitorItem[]>([]);
  const [visitorSummary, setVisitorSummary] = useState({
    todayVisits: 0,
    scrolledPct: 0,
    convertedCount: 0,
  });
  const [scrolledFilter, setScrolledFilter] = useState<"" | "yes" | "no">("");
  const [deviceFilter, setDeviceFilter] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorItem | null>(null);
  const [selectedVisitorIds, setSelectedVisitorIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [ctaClicks, setCtaClicks] = useState<CtaClickItem[]>([]);
  const [ctaSummary, setCtaSummary] = useState({
    whatsappToday: 0,
    headerCallToday: 0,
    floatingCallToday: 0,
    totalToday: 0,
  });
  const [ctaTypeFilter, setCtaTypeFilter] = useState<"" | "whatsapp" | "header_call" | "floating_call">("");
  const [selectedCtaClick, setSelectedCtaClick] = useState<CtaClickItem | null>(null);

  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [sourceFilter, setSourceFilter] = useState("");
  const [sources, setSources] = useState<SourceSummary[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadVisitors = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), range });
      if (scrolledFilter) params.set("scrolled", scrolledFilter);
      if (deviceFilter) params.set("device", deviceFilter);
      if (channelFilter) params.set("channel", channelFilter);
      if (campaignFilter) params.set("campaign", campaignFilter);
      if (termFilter) params.set("term", termFilter);
      if (searchQuery) params.set("q", searchQuery);
      const response = await fetch(`/api/admin/analytics/visitors?${params}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const result = await response.json() as {
        ok?: boolean;
        items?: VisitorItem[];
        total?: number;
        summary?: typeof visitorSummary;
        sources?: TrafficBreakdown;
        error?: string;
      };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Unable to load visitors.");
      }
      setVisitors((result.items || []).map(normalizeVisitorItem));
      setTotal(result.total || 0);
      if (result.summary) setVisitorSummary(result.summary);
      setTrafficSources(result.sources || null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load visitors.");
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, range, scrolledFilter, deviceFilter, channelFilter, campaignFilter, termFilter, searchQuery]);

  const loadCtaClicks = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), range });
      if (ctaTypeFilter) params.set("ctaType", ctaTypeFilter);
      if (channelFilter) params.set("channel", channelFilter);
      const response = await fetch(`/api/admin/analytics/cta-clicks?${params}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const result = await response.json() as {
        ok?: boolean;
        items?: CtaClickItem[];
        total?: number;
        summary?: typeof ctaSummary;
        error?: string;
      };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Unable to load CTA clicks.");
      }
      setCtaClicks((result.items || []).map(normalizeCtaClickItem));
      setTotal(result.total || 0);
      if (result.summary) setCtaSummary(result.summary);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load CTA clicks.");
      setCtaClicks([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, range, ctaTypeFilter, channelFilter]);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), range });
      if (sourceFilter) params.set("source", sourceFilter);
      if (channelFilter) params.set("channel", channelFilter);
      const response = await fetch(`/api/admin/analytics/submissions?${params}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const result = await response.json() as {
        ok?: boolean;
        items?: SubmissionItem[];
        total?: number;
        totalAll?: number;
        sources?: SourceSummary[];
        error?: string;
      };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Unable to load submissions.");
      }
      setSubmissions((result.items || []).map(normalizeSubmissionItem));
      setTotal(result.total || 0);
      setTotalSubmissions(result.totalAll || 0);
      setSources(result.sources || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load submissions.");
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, range, sourceFilter, channelFilter]);

  useEffect(() => {
    setPage(1);
    setSelectedVisitorIds(new Set());
  }, [
    tab,
    scrolledFilter,
    deviceFilter,
    sourceFilter,
    ctaTypeFilter,
    limit,
    range,
    channelFilter,
    campaignFilter,
    termFilter,
    searchQuery,
  ]);

  const toolbarProps = {
    range,
    onRangeChange: setRange,
    channel: channelFilter,
    onChannelChange: setChannelFilter,
    pageSize: limit,
    onPageSizeChange: setLimit,
  };

  useEffect(() => {
    setSelectedVisitorIds(new Set());
  }, [page]);

  useEffect(() => {
    if (tab === "visitors") void loadVisitors();
    else if (tab === "cta") void loadCtaClicks();
    else if (tab === "submissions") void loadSubmissions();
  }, [tab, loadVisitors, loadCtaClicks, loadSubmissions]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const selectedCount = selectedVisitorIds.size;
  const allOnPageSelected = visitors.length > 0 && visitors.every((visitor) => selectedVisitorIds.has(visitor.id));

  function toggleVisitorSelection(id: number) {
    const normalizedId = Number(id);
    setSelectedVisitorIds((current) => {
      const next = new Set(current);
      if (next.has(normalizedId)) next.delete(normalizedId);
      else next.add(normalizedId);
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    setSelectedVisitorIds((current) => {
      const next = new Set(current);
      if (allOnPageSelected) {
        visitors.forEach((visitor) => next.delete(visitor.id));
      } else {
        visitors.forEach((visitor) => next.add(visitor.id));
      }
      return next;
    });
  }

  async function bulkDeleteVisitors() {
    const ids = Array.from(selectedVisitorIds).map((id) => Number(id)).filter((id) => id > 0);
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} visitor record(s) permanently? This cannot be undone.`)) return;

    setBulkDeleting(true);
    try {
      const response = await fetch("/api/admin/analytics/visitors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ids }),
      });
      const result = await response.json() as { ok?: boolean; deleted?: number; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to delete visitor records.");
      setSelectedVisitorIds(new Set());
      setSelectedVisitor(null);
      await loadVisitors();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete visitor records.");
    } finally {
      setBulkDeleting(false);
    }
  }

  async function deleteCtaClick(id: number) {
    if (!window.confirm("Delete this CTA click permanently? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const response = await fetch("/api/admin/analytics/cta-clicks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id }),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to delete.");
      setSelectedCtaClick(null);
      await loadCtaClicks();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete CTA click.");
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteSubmission(id: number) {
    if (!window.confirm("Delete this submission permanently? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const response = await fetch("/api/admin/analytics/submissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id }),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to delete.");
      setSelectedSubmission(null);
      await loadSubmissions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete submission.");
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteVisitor(id: number) {
    const normalizedId = Number(id);
    if (!window.confirm("Delete this visitor record permanently? This cannot be undone.")) return;
    setDeletingId(normalizedId);
    try {
      const response = await fetch("/api/admin/analytics/visitors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id: normalizedId }),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to delete.");
      setSelectedVisitor(null);
      setSelectedVisitorIds((current) => {
        const next = new Set(current);
        next.delete(normalizedId);
        return next;
      });
      await loadVisitors();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete visitor record.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setTab("visitors")}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold ${tab === "visitors" ? "bg-[#0b1f35] text-white" : "border border-slate-200 text-slate-700 hover:border-[#b98945]"}`}
        >
          <Users className="size-3.5" /> Visitors
        </button>
        <button
          type="button"
          onClick={() => setTab("cta")}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold ${tab === "cta" ? "bg-[#0b1f35] text-white" : "border border-slate-200 text-slate-700 hover:border-[#b98945]"}`}
        >
          <Phone className="size-3.5" /> CTA clicks
        </button>
        <button
          type="button"
          onClick={() => setTab("submissions")}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold ${tab === "submissions" ? "bg-[#0b1f35] text-white" : "border border-slate-200 text-slate-700 hover:border-[#b98945]"}`}
        >
          <MousePointerClick className="size-3.5" /> Submissions
        </button>
        <button
          type="button"
          onClick={() => setTab("google")}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold ${tab === "google" ? "bg-[#0b1f35] text-white" : "border border-slate-200 text-slate-700 hover:border-[#b98945]"}`}
        >
          <ChartColumn className="size-3.5" /> Google tags
        </button>
      </div>

      {message && tab !== "google" ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{message}</p>
      ) : null}

      {tab === "google" ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-semibold text-[#0b1f35]">Google Tag Manager</h2>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  Loads the GTM web container on the public landing page. This ID is stored with this project in Neon, not in the code.
                </p>
              </div>
              <CompactToggle
                label="Enable GTM"
                checked={gtmConfig.enabled}
                onChange={(enabled) => patchGoogleTagManager({ enabled })}
              />
            </div>

            {gtmStatus === "connected" ? (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[12px] text-emerald-900">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <p>
                  Ready with container <span className="font-mono font-medium">{gtmConfig.containerId}</span>. The container loader and no-JavaScript fallback will load after you Save.
                </p>
              </div>
            ) : gtmStatus === "incomplete" ? (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-950">
                GTM is enabled, but it needs a valid container ID beginning with <span className="font-mono">GTM-</span>.
              </p>
            ) : (
              <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] text-slate-600">
                Disabled. No Google Tag Manager code is injected on the public site.
              </p>
            )}

            {gtmConfig.enabled ? (
              <label className="mt-4 block max-w-md">
                <span className="admin-label">GTM container ID</span>
                <input
                  value={gtmConfig.containerId}
                  onChange={(event) => patchGoogleTagManager({ containerId: event.target.value.trim().toUpperCase() })}
                  className="admin-input font-mono uppercase"
                  placeholder="GTM-XXXXXXX"
                  autoComplete="off"
                  spellCheck={false}
                />
                {gtmConfig.containerId && !isValidGtmContainerId(gtmConfig.containerId) ? (
                  <span className="mt-1 block text-[11px] text-red-600">Use a web container ID like GTM-ABC1234.</span>
                ) : null}
              </label>
            ) : null}

            <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] leading-4 text-slate-500">
              Automatic events include every public button/link click, phone and WhatsApp clicks, downloads, form opens, submission attempts, successful leads, and submission errors. No lead-entered personal data is sent to GTM.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-semibold text-[#0b1f35]">Google Analytics 4 (direct)</h2>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  Optional direct GA4 installation using gtag.js. Leave this off if GA4 is already configured inside GTM.
                </p>
              </div>
              <CompactToggle
                label="Enable GA4"
                checked={gaConfig.enabled}
                onChange={(enabled) => patchGoogleAnalytics({ enabled })}
              />
            </div>

            {gaStatus === "connected" ? (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[12px] text-emerald-900">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <p>Ready with Measurement ID <span className="font-mono font-medium">{gaConfig.measurementId}</span>.</p>
              </div>
            ) : gaStatus === "incomplete" ? (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-950">
                GA4 is enabled, but it needs a valid Measurement ID beginning with <span className="font-mono">G-</span>.
              </p>
            ) : (
              <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] text-slate-600">
                Disabled. No direct GA4 tag is injected on the public site.
              </p>
            )}

            {gaConfig.enabled ? (
              <label className="mt-4 block max-w-md">
                <span className="admin-label">GA4 Measurement ID</span>
                <input
                  value={gaConfig.measurementId}
                  onChange={(event) => patchGoogleAnalytics({ measurementId: event.target.value.trim().toUpperCase() })}
                  className="admin-input font-mono uppercase"
                  placeholder="G-XXXXXXXX"
                  autoComplete="off"
                  spellCheck={false}
                />
                {gaConfig.measurementId && !isValidGa4MeasurementId(gaConfig.measurementId) ? (
                  <span className="mt-1 block text-[11px] text-red-600">Use a GA4 ID like G-ABC123XYZ.</span>
                ) : null}
              </label>
            ) : null}
          </div>

          {gtmStatus === "connected" && gaStatus === "connected" ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-4 text-amber-950">
              Both are enabled. This is valid only when GTM does not also publish the same GA4 tag; otherwise page views can be counted twice.
            </p>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-[11px] leading-5 text-slate-600">
            <p className="font-semibold text-[#0b1f35]">Per-project behavior</p>
            <p className="mt-1">
              Each deployment reads these values from its own <span className="font-mono">site_pages.content</span> JSONB record in Neon. Use a different Neon database or page record for each landing-page project, then configure its own IDs here.
            </p>
          </div>

          <p className="text-[11px] text-slate-500">
            Click <span className="font-medium text-[#0b1f35]">Save Changes</span> in the header to publish these settings. Then publish your GTM container and verify the live URL with Tag Assistant.
          </p>
        </div>
      ) : tab === "visitors" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Today&apos;s visits</p>
              <p className="mt-1 text-2xl font-semibold text-[#0b1f35]">{visitorSummary.todayVisits}</p>
              <p className="mt-1 text-[10px] text-slate-500">Calendar day in IST (Asia/Kolkata)</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Scrolled today (50%+)</p>
              <p className="mt-1 text-2xl font-semibold text-[#0b1f35]">{visitorSummary.scrolledPct}%</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Converted today</p>
              <p className="mt-1 text-2xl font-semibold text-[#0b1f35]">{visitorSummary.convertedCount}</p>
            </div>
          </div>

          <SourceToolbar
            {...toolbarProps}
            search={{ value: searchInput, onChange: setSearchInput }}
          >
            <label className="inline-flex items-center gap-2 text-[11px] text-slate-600">
              Scrolled
              <select
                value={scrolledFilter}
                onChange={(event) => setScrolledFilter(event.target.value as "" | "yes" | "no")}
                className="h-8 rounded-lg border border-slate-200 px-2 text-[11px]"
              >
                <option value="">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-2 text-[11px] text-slate-600">
              Device
              <select
                value={deviceFilter}
                onChange={(event) => setDeviceFilter(event.target.value)}
                className="h-8 rounded-lg border border-slate-200 px-2 text-[11px]"
              >
                <option value="">All</option>
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablet</option>
                <option value="desktop">Desktop</option>
              </select>
            </label>
          </SourceToolbar>

          <TrafficSourcesCard
            data={trafficSources}
            activeChannel={channelFilter}
            activeCampaign={campaignFilter}
            activeTerm={termFilter}
            onSelectChannel={setChannelFilter}
            onSelectCampaign={setCampaignFilter}
            onSelectTerm={setTermFilter}
          />

          {campaignFilter || termFilter || selectedCount > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {campaignFilter ? (
                <button
                  type="button"
                  onClick={() => setCampaignFilter("")}
                  className="inline-flex max-w-xs items-center gap-1.5 rounded-full border border-[#e4d3b5] bg-[#fcfaf7] px-2.5 py-1 text-[11px] text-[#8a6528]"
                >
                  <span className="truncate">Campaign: {campaignFilter}</span>
                  <X className="size-3 shrink-0" aria-label="Clear campaign filter" />
                </button>
              ) : null}
              {termFilter ? (
                <button
                  type="button"
                  onClick={() => setTermFilter("")}
                  className="inline-flex max-w-xs items-center gap-1.5 rounded-full border border-[#e4d3b5] bg-[#fcfaf7] px-2.5 py-1 text-[11px] text-[#8a6528]"
                >
                  <span className="truncate">Keyword: {termFilter}</span>
                  <X className="size-3 shrink-0" aria-label="Clear keyword filter" />
                </button>
              ) : null}
              {selectedCount > 0 ? (
                <button
                  type="button"
                  onClick={() => void bulkDeleteVisitors()}
                  disabled={bulkDeleting}
                  className="ml-auto inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-[11px] font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                >
                  {bulkDeleting ? <LoaderCircle className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                  Delete selected ({selectedCount})
                </button>
              ) : null}
            </div>
          ) : null}

          {loading && !visitors.length ? (
            <div className="flex min-h-40 items-center justify-center text-slate-500">
              <LoaderCircle className="size-5 animate-spin" />
            </div>
          ) : (
            <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white transition-opacity ${loading ? "opacity-60" : ""}`}>
              <div className="max-h-[70vh] overflow-auto">
                <table className="min-w-[980px] w-full text-left text-[12px]">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 shadow-[0_1px_0_0_rgb(226,232,240)]">
                    <tr>
                      <th className="w-10 px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={allOnPageSelected}
                          onChange={toggleSelectAllOnPage}
                          disabled={!visitors.length}
                          className="size-3.5 rounded border-slate-300"
                          aria-label="Select all visitors on this page"
                        />
                      </th>
                      <th className="px-3 py-2.5 font-semibold">Visitor</th>
                      <th className="px-3 py-2.5 font-semibold">Device</th>
                      <th className="px-3 py-2.5 font-semibold">Traffic source</th>
                      <th className="px-3 py-2.5 font-semibold">Engagement</th>
                      <th className="px-3 py-2.5 font-semibold">Converted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.map((visitor) => (
                      <tr
                        key={visitor.id}
                        onClick={() => setSelectedVisitor(visitor)}
                        className={`cursor-pointer border-t border-slate-100 align-top transition-colors hover:bg-[#fcfaf7] ${selectedVisitorIds.has(visitor.id) ? "bg-red-50/40" : ""}`}
                      >
                        <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedVisitorIds.has(visitor.id)}
                            onClick={(event) => event.stopPropagation()}
                            onChange={() => toggleVisitorSelection(visitor.id)}
                            className="size-3.5 rounded border-slate-300"
                            aria-label={`Select visitor ${visitor.ip_address || visitor.id}`}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <p className="whitespace-nowrap font-semibold text-[#0b1f35]">{formatDate(visitor.first_seen_at)}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">{locationLabel(visitor.city, visitor.region, visitor.country)}</p>
                          <p className="mt-0.5 font-mono text-[10px] text-slate-400">{visitor.ip_address || "—"}</p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="capitalize text-[#0b1f35]">{visitor.device_type}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {[visitor.browser, visitor.os].filter(Boolean).join(" · ") || "—"}
                          </p>
                        </td>
                        <td className="w-[34%] max-w-[320px] px-3 py-3">
                          <SourceCell value={visitorSourceValue(visitor)} />
                        </td>
                        <td className="px-3 py-3">
                          <ScrollMeter pct={visitor.max_scroll_pct} scrolled={visitor.scrolled} />
                          <p className="mt-1 text-[11px] text-slate-500">{formatDuration(visitor.duration_seconds)} on site</p>
                        </td>
                        <td className="px-3 py-3">
                          {visitor.converted ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              <CheckCircle2 className="size-3" aria-hidden="true" /> Lead
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!visitors.length ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-10 text-center text-slate-500">
                          No visitors match these filters.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              {total > 0 ? (
                <TablePagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  onPageChange={setPage}
                />
              ) : null}
            </div>
          )}

          <p className="text-[10px] text-slate-500">
            Click a row for details. The source is the first touch of each visit; visits without UTM tags, GCLID or an external referrer show as Direct / not set. Visitor data auto-deletes after 30 days.
          </p>
        </>
      ) : tab === "cta" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">CTA clicks today</p>
              <p className="mt-1 text-2xl font-semibold text-[#0b1f35]">{ctaSummary.totalToday}</p>
              <p className="mt-1 text-[10px] text-slate-500">Calendar day in IST (Asia/Kolkata)</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">WhatsApp today</p>
              <p className="mt-1 text-2xl font-semibold text-[#0b1f35]">{ctaSummary.whatsappToday}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Header call today</p>
              <p className="mt-1 text-2xl font-semibold text-[#0b1f35]">{ctaSummary.headerCallToday}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Bottom call today</p>
              <p className="mt-1 text-2xl font-semibold text-[#0b1f35]">{ctaSummary.floatingCallToday}</p>
            </div>
          </div>

          <SourceToolbar {...toolbarProps}>
            <label className="inline-flex items-center gap-2 text-[11px] text-slate-600">
              CTA type
              <select
                value={ctaTypeFilter}
                onChange={(event) =>
                  setCtaTypeFilter(
                    event.target.value as "" | "whatsapp" | "header_call" | "floating_call",
                  )
                }
                className="h-8 rounded-lg border border-slate-200 px-2 text-[11px]"
              >
                <option value="">All</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="header_call">Header call</option>
                <option value="floating_call">Bottom call</option>
              </select>
            </label>
          </SourceToolbar>

          {loading && !ctaClicks.length ? (
            <div className="flex min-h-40 items-center justify-center text-slate-500">
              <LoaderCircle className="size-5 animate-spin" />
            </div>
          ) : (
            <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white transition-opacity ${loading ? "opacity-60" : ""}`}>
              <div className="max-h-[70vh] overflow-auto">
                <table className="min-w-[860px] w-full text-left text-[12px]">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 shadow-[0_1px_0_0_rgb(226,232,240)]">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">Date/Time</th>
                      <th className="px-3 py-2.5 font-semibold">CTA</th>
                      <th className="px-3 py-2.5 font-semibold">Visit source</th>
                      <th className="px-3 py-2.5 font-semibold">Visitor</th>
                      <th className="px-3 py-2.5 font-semibold">Device</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ctaClicks.map((click) => (
                      <tr
                        key={click.id}
                        onClick={() => setSelectedCtaClick(click)}
                        className="cursor-pointer border-t border-slate-100 align-top transition-colors hover:bg-[#fcfaf7]"
                      >
                        <td className="whitespace-nowrap px-3 py-3 font-semibold text-[#0b1f35]">{formatDate(click.created_at)}</td>
                        <td className="px-3 py-3">
                          <p className="text-[#0b1f35]">{ctaTypeLabel(click.cta_type)}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">{click.source_label}</p>
                        </td>
                        <td className="w-[34%] max-w-[320px] px-3 py-3">
                          <SourceCell value={joinedSourceValue(click)} />
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-[11px] text-slate-600">{locationLabel(click.city, click.region, click.country)}</p>
                          <p className="mt-0.5 font-mono text-[10px] text-slate-400">{click.ip_address || "—"}</p>
                        </td>
                        <td className="px-3 py-3 capitalize">{click.device_type}</td>
                      </tr>
                    ))}
                    {!ctaClicks.length ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-10 text-center text-slate-500">
                          No CTA clicks yet. Tracked after live visitors use WhatsApp or call buttons.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              {total > 0 ? (
                <TablePagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  onPageChange={setPage}
                />
              ) : null}
            </div>
          )}

          <p className="text-[10px] text-slate-500">
            Tracks WhatsApp, header phone button, and mobile bottom call button clicks.
          </p>
        </>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2 lg:col-span-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Total submissions</p>
              <p className="mt-1 text-2xl font-semibold text-[#0b1f35]">{totalSubmissions}</p>
            </div>
            {sources.slice(0, 3).map((source) => (
              <div key={source.formSource} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-medium text-slate-500">{source.formLabel}</p>
                <p className="mt-1 text-xl font-semibold text-[#0b1f35]">{source.count}</p>
                <p className="text-[10px] text-slate-400">{source.formSource}</p>
              </div>
            ))}
          </div>

          <SourceToolbar {...toolbarProps}>
            <label className="inline-flex items-center gap-2 text-[11px] text-slate-600">
              Form
              <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
                className="h-8 min-w-[160px] rounded-lg border border-slate-200 px-2 text-[11px]"
              >
                <option value="">All forms</option>
                {sources.map((source) => (
                  <option key={source.formSource} value={source.formSource}>
                    {source.formLabel} ({source.count})
                  </option>
                ))}
              </select>
            </label>
          </SourceToolbar>

          {loading && !submissions.length ? (
            <div className="flex min-h-40 items-center justify-center text-slate-500">
              <LoaderCircle className="size-5 animate-spin" />
            </div>
          ) : (
            <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white transition-opacity ${loading ? "opacity-60" : ""}`}>
              <div className="max-h-[70vh] divide-y divide-slate-100 overflow-y-auto">
                {submissions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedSubmission(item)}
                    className="grid w-full gap-3 bg-white px-4 py-3.5 text-left transition-colors hover:bg-[#fcfaf7] md:grid-cols-[minmax(0,1fr)_minmax(0,280px)_auto]"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#0b1f35]">{item.name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {item.form_label}
                        <span className="text-slate-400"> · {item.form_source}</span>
                      </p>
                      {item.click_source ? (
                        <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-[#8a6528]">
                          <MousePointerClick className="size-3" aria-hidden="true" />
                          {item.click_source}
                        </p>
                      ) : null}
                      <p className="mt-1 text-[11px] text-slate-600">{item.phone}{item.email ? ` · ${item.email}` : ""}</p>
                    </div>
                    <SourceCell value={joinedSourceValue(item, { utmTerm: item.utm_term, gclid: item.gclid })} />
                    <div className="shrink-0 text-[10px] text-slate-400 md:text-right">
                      {formatDate(item.submitted_at)}
                    </div>
                  </button>
                ))}
                {!submissions.length ? (
                  <p className="bg-slate-50 p-10 text-center text-[12px] text-slate-500">
                    No form submissions yet.
                  </p>
                ) : null}
              </div>
              {total > 0 ? (
                <TablePagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  onPageChange={setPage}
                />
              ) : null}
            </div>
          )}

          <p className="text-[10px] text-slate-500">Click a submission for full details.</p>
        </>
      )}

      {selectedVisitor ? (
        <DetailModal
          title="Visitor details"
          onClose={() => setSelectedVisitor(null)}
          onDelete={() => void deleteVisitor(selectedVisitor.id)}
          deleting={deletingId === selectedVisitor.id}
        >
          <DetailRow label="Date/Time" value={formatDate(selectedVisitor.first_seen_at)} />
          <DetailRow label="IP address" value={selectedVisitor.ip_address || "—"} />
          <DetailRow label="Location" value={locationLabel(selectedVisitor.city, selectedVisitor.region, selectedVisitor.country)} />
          <DetailRow label="Device" value={<span className="capitalize">{selectedVisitor.device_type}</span>} />
          <DetailRow label="Browser" value={selectedVisitor.browser || "—"} />
          <DetailRow label="Operating system" value={selectedVisitor.os || "—"} />
          <DetailRow label="Scrolled (50%+)" value={selectedVisitor.scrolled ? "Yes" : "No"} />
          <DetailRow label="Max scroll" value={`${selectedVisitor.max_scroll_pct}%`} />
          <DetailRow label="Time on site" value={formatDuration(selectedVisitor.duration_seconds)} />
          <DetailRow label="Submitted a form" value={selectedVisitor.converted ? "Yes" : "No"} />
          <DetailSection title="Traffic source" />
          <DetailRow label="Channel" value={<ChannelBadge channel={selectedVisitor.source_channel} />} />
          <DetailRow label="UTM source" value={notSet(selectedVisitor.utm_source)} />
          <DetailRow label="UTM medium" value={notSet(selectedVisitor.utm_medium)} />
          <DetailRow label="UTM campaign" value={notSet(selectedVisitor.utm_campaign)} />
          <DetailRow label="UTM term" value={notSet(selectedVisitor.utm_term)} />
          <DetailRow label="UTM content" value={notSet(selectedVisitor.utm_content)} />
          <DetailRow label="GCLID" value={<span className="break-all">{notSet(selectedVisitor.gclid)}</span>} />
          <DetailRow label="Referrer" value={notSet(selectedVisitor.referrer_host)} />
          <DetailRow label="Landing page" value={notSet(selectedVisitor.landing_path)} />
        </DetailModal>
      ) : null}

      {selectedCtaClick ? (
        <DetailModal
          title="CTA click details"
          onClose={() => setSelectedCtaClick(null)}
          onDelete={() => void deleteCtaClick(selectedCtaClick.id)}
          deleting={deletingId === selectedCtaClick.id}
        >
          <DetailRow label="Date/Time" value={formatDate(selectedCtaClick.created_at)} />
          <DetailRow label="CTA" value={ctaTypeLabel(selectedCtaClick.cta_type)} />
          <DetailRow label="Source" value={selectedCtaClick.source_label} />
          <DetailRow label="IP address" value={selectedCtaClick.ip_address || "—"} />
          <DetailRow label="Location" value={locationLabel(selectedCtaClick.city, selectedCtaClick.region, selectedCtaClick.country)} />
          <DetailRow label="Device" value={<span className="capitalize">{selectedCtaClick.device_type}</span>} />
          <DetailRow label="Session" value={selectedCtaClick.session_key || "—"} />
          <DetailSection title="Visit source" />
          <DetailRow label="Channel" value={<ChannelBadge channel={selectedCtaClick.source_channel} />} />
          <DetailRow label="UTM source" value={notSet(selectedCtaClick.source_utm_source)} />
          <DetailRow label="UTM medium" value={notSet(selectedCtaClick.source_utm_medium)} />
          <DetailRow label="UTM campaign" value={notSet(selectedCtaClick.source_utm_campaign)} />
          <DetailRow label="UTM term" value={notSet(selectedCtaClick.source_utm_term)} />
          <DetailRow label="Referrer" value={notSet(selectedCtaClick.source_referrer_host)} />
        </DetailModal>
      ) : null}

      {selectedSubmission ? (
        <DetailModal
          title="Submission details"
          onClose={() => setSelectedSubmission(null)}
          onDelete={() => void deleteSubmission(selectedSubmission.id)}
          deleting={deletingId === selectedSubmission.id}
        >
          <DetailRow label="Submitted" value={formatDate(selectedSubmission.submitted_at)} />
          <DetailRow label="Form" value={selectedSubmission.form_label} />
          <DetailRow label="Form source" value={selectedSubmission.form_source} />
          <DetailRow label="Clicked from" value={selectedSubmission.click_source || "—"} />
          <DetailRow label="Channel" value={<ChannelBadge channel={selectedSubmission.source_channel} />} />
          <DetailRow label="UTM source" value={notSet(selectedSubmission.source_utm_source)} />
          <DetailRow label="UTM medium" value={notSet(selectedSubmission.source_utm_medium)} />
          <DetailRow label="UTM campaign" value={notSet(selectedSubmission.source_utm_campaign)} />
          <DetailRow label="UTM term" value={notSet(selectedSubmission.utm_term || selectedSubmission.source_utm_term)} />
          <DetailRow label="GCLID" value={<span className="break-all">{notSet(selectedSubmission.gclid)}</span>} />
          <DetailRow label="Referrer" value={notSet(selectedSubmission.source_referrer_host)} />
          <DetailRow label="Name" value={selectedSubmission.name} />
          <DetailRow label="Phone" value={selectedSubmission.phone} />
          <DetailRow label="Email" value={selectedSubmission.email || "—"} />
          {selectedSubmission.message ? (
            <DetailRow label="Message" value={selectedSubmission.message} />
          ) : null}
          {selectedSubmission.custom_fields
            ? Object.entries(selectedSubmission.custom_fields).map(([label, value]) => (
              <DetailRow key={label} label={label} value={value} />
            ))
            : null}
          <DetailRow label="IP address" value={selectedSubmission.ip_address || "—"} />
          <DetailRow label="Location" value={locationLabel(selectedSubmission.city, selectedSubmission.region, selectedSubmission.country)} />
        </DetailModal>
      ) : null}
    </div>
  );
}
