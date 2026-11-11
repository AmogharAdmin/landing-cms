"use client";

import type { ReactNode } from "react";
import { Megaphone, Search, Tag } from "lucide-react";
import { channelLabel, isKnownChannel, type TrafficChannel } from "@/lib/traffic-source";

export type TrafficChannelStat = {
  channel: string;
  visits: number;
  scrolledPct: number;
  avgDurationSeconds: number;
  conversions: number;
  conversionRate: number;
};

export type TrafficTopEntry = {
  value: string;
  channel: string;
  visits: number;
  conversions: number;
};

export type TrafficBreakdown = {
  range: string;
  totalVisits: number;
  channels: TrafficChannelStat[];
  campaigns: TrafficTopEntry[];
  terms: TrafficTopEntry[];
};

const CHANNEL_STYLES: Record<TrafficChannel, { badge: string; bar: string }> = {
  google_ads: { badge: "border-blue-200 bg-blue-50 text-blue-700", bar: "bg-blue-500" },
  paid_other: { badge: "border-violet-200 bg-violet-50 text-violet-700", bar: "bg-violet-500" },
  email: { badge: "border-amber-200 bg-amber-50 text-amber-800", bar: "bg-amber-500" },
  social: { badge: "border-pink-200 bg-pink-50 text-pink-700", bar: "bg-pink-500" },
  utm_other: { badge: "border-teal-200 bg-teal-50 text-teal-700", bar: "bg-teal-500" },
  organic_search: { badge: "border-emerald-200 bg-emerald-50 text-emerald-700", bar: "bg-emerald-500" },
  referral: { badge: "border-orange-200 bg-orange-50 text-orange-700", bar: "bg-orange-500" },
  direct: { badge: "border-slate-200 bg-slate-50 text-slate-600", bar: "bg-slate-400" },
};

function channelStyle(channel: string | null | undefined) {
  return CHANNEL_STYLES[isKnownChannel(channel) ? channel : "direct"];
}

function formatSeconds(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs ? `${mins}m ${secs}s` : `${mins}m`;
}

export function ChannelBadge({ channel }: { channel: string | null | undefined }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold ${channelStyle(channel).badge}`}>
      {channelLabel(channel)}
    </span>
  );
}

export type SourceCellValue = {
  channel: string | null | undefined;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  referrerHost?: string | null;
  gclid?: string | null;
};

/** Channel badge plus whatever detail exists; unset tags fall back to "Direct / not set". */
export function SourceCell({ value, compact = false }: { value: SourceCellValue; compact?: boolean }) {
  const hasTags = Boolean(value.utmSource || value.utmMedium);
  const origin = hasTags
    ? `${value.utmSource || "(not set)"} / ${value.utmMedium || "(not set)"}`
    : value.referrerHost || "";

  return (
    <div className="min-w-0 space-y-1">
      <div className="flex flex-wrap items-center gap-1">
        <ChannelBadge channel={value.channel} />
        {value.gclid ? (
          <span className="rounded border border-blue-200 px-1 text-[9px] font-semibold uppercase tracking-wide text-blue-600">GCLID</span>
        ) : null}
      </div>
      {origin ? <p className="truncate text-[11px] text-slate-600" title={origin}>{origin}</p> : null}
      {!compact && value.utmCampaign ? (
        <p className="flex items-center gap-1 truncate text-[11px] text-slate-500" title={value.utmCampaign}>
          <Megaphone className="size-3 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="truncate">{value.utmCampaign}</span>
        </p>
      ) : null}
      {value.utmTerm ? (
        <span
          className="inline-flex max-w-full items-center gap-1 rounded-md bg-[#f6efe4] px-1.5 py-0.5 text-[10px] font-medium text-[#8a6528]"
          title={value.utmTerm}
        >
          <Tag className="size-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{value.utmTerm}</span>
        </span>
      ) : null}
    </div>
  );
}

function TopList({
  title,
  icon,
  entries,
  active,
  emptyText,
  onSelect,
}: {
  title: string;
  icon: ReactNode;
  entries: TrafficTopEntry[];
  active: string;
  emptyText: string;
  onSelect: (value: string) => void;
}) {
  const max = Math.max(1, ...entries.map((entry) => entry.visits));
  return (
    <div className="min-w-0 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {icon}
        {title}
      </p>
      {entries.length ? (
        <ul className="space-y-1">
          {entries.map((entry) => (
            <li key={entry.value}>
              <button
                type="button"
                onClick={() => onSelect(active === entry.value ? "" : entry.value)}
                className={`relative w-full overflow-hidden rounded-md px-2 py-1.5 text-left transition-colors ${active === entry.value ? "ring-1 ring-[#b98945]" : "hover:bg-white"}`}
              >
                <span
                  className={`absolute inset-y-0 left-0 opacity-15 ${channelStyle(entry.channel).bar}`}
                  style={{ width: `${(entry.visits / max) * 100}%` }}
                  aria-hidden="true"
                />
                <span className="relative flex items-center justify-between gap-2 text-[11px]">
                  <span className="truncate font-medium text-[#0b1f35]" title={entry.value}>{entry.value}</span>
                  <span className="shrink-0 tabular-nums text-slate-500">
                    {entry.visits}
                    {entry.conversions ? <span className="ml-1 text-emerald-600">· {entry.conversions} conv</span> : null}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-4 text-center text-[11px] text-slate-400">{emptyText}</p>
      )}
    </div>
  );
}

export function TrafficSourcesCard({
  data,
  activeChannel,
  activeCampaign,
  activeTerm,
  onSelectChannel,
  onSelectCampaign,
  onSelectTerm,
}: {
  data: TrafficBreakdown | null;
  activeChannel: string;
  activeCampaign: string;
  activeTerm: string;
  onSelectChannel: (channel: string) => void;
  onSelectCampaign: (campaign: string) => void;
  onSelectTerm: (term: string) => void;
}) {
  const total = data?.totalVisits || 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[14px] font-semibold text-[#0b1f35]">Traffic sources</h2>
        <p className="text-[11px] text-slate-500">
          {total} visit{total === 1 ? "" : "s"} in range · click a row to filter the list
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[460px] text-left text-[11px]">
            <thead className="text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-2 font-semibold">Channel</th>
                <th className="pb-2 font-semibold">Visits</th>
                <th className="pb-2 text-right font-semibold">Scrolled</th>
                <th className="pb-2 text-right font-semibold">Avg time</th>
                <th className="pb-2 text-right font-semibold">Conv.</th>
              </tr>
            </thead>
            <tbody>
              {(data?.channels || []).map((row) => {
                const share = total ? Math.round((row.visits / total) * 100) : 0;
                const active = activeChannel === row.channel;
                return (
                  <tr
                    key={row.channel}
                    onClick={() => onSelectChannel(active ? "" : row.channel)}
                    className={`cursor-pointer border-t border-slate-100 transition-colors ${active ? "bg-[#fcfaf7]" : "hover:bg-slate-50"}`}
                  >
                    <td className="py-2 pr-2">
                      <ChannelBadge channel={row.channel} />
                    </td>
                    <td className="w-[38%] py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full ${channelStyle(row.channel).bar}`} style={{ width: `${share}%` }} />
                        </div>
                        <span className="w-16 shrink-0 text-right tabular-nums text-slate-700">
                          {row.visits} <span className="text-slate-400">({share}%)</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-2 text-right tabular-nums text-slate-600">{row.scrolledPct}%</td>
                    <td className="py-2 text-right tabular-nums text-slate-600">{formatSeconds(row.avgDurationSeconds)}</td>
                    <td className="py-2 text-right tabular-nums">
                      <span className={row.conversions ? "font-semibold text-emerald-700" : "text-slate-400"}>
                        {row.conversions}
                      </span>
                      <span className="block text-[10px] text-slate-400">{row.conversionRate}%</span>
                    </td>
                  </tr>
                );
              })}
              {!data?.channels.length ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">No visits in this range.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <TopList
          title="Top campaigns"
          icon={<Megaphone className="size-3.5" aria-hidden="true" />}
          entries={data?.campaigns || []}
          active={activeCampaign}
          emptyText="No utm_campaign tags yet."
          onSelect={onSelectCampaign}
        />
        <TopList
          title="Top keywords"
          icon={<Search className="size-3.5" aria-hidden="true" />}
          entries={data?.terms || []}
          active={activeTerm}
          emptyText="No utm_term tags yet."
          onSelect={onSelectTerm}
        />
      </div>
    </section>
  );
}
