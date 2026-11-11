"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, LoaderCircle, Plug, Settings2, Trash2, Send } from "lucide-react";
import type { BuildeskCrm } from "@/types/site";
import { CompactToggle, type PathPart } from "@/components/admin/editor-ui";
import {
  DEFAULT_BUILDESK_LEAD_ENDPOINT,
  normalizeBuildeskCrm,
  resolveBuildeskCrmStatus,
} from "@/lib/buildesk-crm";

type TabKey = "settings" | "leads";

type CrmLeadItem = {
  id: number;
  status: "success" | "failed";
  form_source: string;
  form_label: string;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  project_name: string | null;
  source: string | null;
  sub_source: string | null;
  response_message: string | null;
  utm_term?: string | null;
  gclid?: string | null;
  created_at: string;
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function SettingsTab({
  config,
  status,
  patch,
}: {
  config: ReturnType<typeof normalizeBuildeskCrm>;
  status: ReturnType<typeof resolveBuildeskCrmStatus>;
  patch: (next: Partial<BuildeskCrm>) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[14px] font-medium text-[#0b1f35]">Buildesk CRM</h2>
        <p className="mt-1 text-[12px] leading-5 text-slate-500">
          Forwards every landing-page lead to Buildesk: all enquiry modal variants (general, brochure,
          master plan, and any forms you create), plus the contact section. Each submission is tagged
          with that form&apos;s name as SubSource. Save the dashboard after editing.
        </p>
      </div>

      {status === "connected" ? (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[12px] text-emerald-900">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">CRM forwarding is ready</p>
            <p className="mt-0.5 text-emerald-800/90">
              Leads will post to Buildesk with project{" "}
              <span className="font-medium">{config.projectName || "(unnamed)"}</span>
              {config.source ? (
                <>
                  {" "}
                  and source <span className="font-mono text-[11px]">{config.source}</span>
                </>
              ) : null}
              . SubSource is set automatically from each form name
              {config.subSource ? (
                <>
                  {" "}
                  (prefixed with <span className="font-mono text-[11px]">{config.subSource}</span>)
                </>
              ) : null}
              .
            </p>
          </div>
        </div>
      ) : status === "incomplete" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-950">
          Enable Buildesk and enter an ApiKey to start forwarding leads.
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] text-slate-600">
          <Plug className="mt-0.5 size-4 shrink-0 text-slate-400" />
          <p>Buildesk CRM is turned off. Form submissions still save and email as usual.</p>
        </div>
      )}

      <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <CompactToggle
          label="Enable Buildesk CRM"
          checked={config.enabled}
          onChange={(enabled) => patch({ enabled })}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="admin-label">ApiKey</span>
            <input
              type="password"
              autoComplete="off"
              value={config.apiKey}
              onChange={(event) => patch({ apiKey: event.target.value })}
              placeholder="Buildesk API key"
              className="admin-input font-mono"
            />
            <span className="mt-1 block text-[10px] text-slate-500">
              Stored in this page&apos;s content. Never shown on the public site. Treat exports as sensitive.
            </span>
          </label>

          <label>
            <span className="admin-label">Project name</span>
            <input
              value={config.projectName}
              onChange={(event) => patch({ projectName: event.target.value })}
              placeholder="District 25"
              className="admin-input"
            />
          </label>

          <label>
            <span className="admin-label">Project UID (optional)</span>
            <input
              value={config.projectUID || ""}
              onChange={(event) => patch({ projectUID: event.target.value })}
              placeholder="Buildesk project UID"
              className="admin-input font-mono"
            />
          </label>

          <label>
            <span className="admin-label">Source</span>
            <input
              value={config.source}
              onChange={(event) => patch({ source: event.target.value })}
              placeholder="Googleads_contactus"
              className="admin-input"
            />
          </label>

          <label>
            <span className="admin-label">Sub source prefix (optional)</span>
            <input
              value={config.subSource}
              onChange={(event) => patch({ subSource: event.target.value })}
              placeholder="Landing page"
              className="admin-input"
            />
            <span className="mt-1 block text-[10px] text-slate-500">
              Each lead&apos;s SubSource becomes &quot;prefix · form name&quot; (e.g. Landing page · Download brochure).
              Leave empty to send only the form name.
            </span>
          </label>

          <label>
            <span className="admin-label">City (optional)</span>
            <input
              value={config.city || ""}
              onChange={(event) => patch({ city: event.target.value })}
              placeholder="Bengaluru"
              className="admin-input"
            />
          </label>

          <label>
            <span className="admin-label">Dial code</span>
            <input
              type="number"
              min={1}
              max={9999}
              value={config.dialCode ?? 91}
              onChange={(event) => {
                const next = Number(event.target.value);
                patch({ dialCode: Number.isFinite(next) ? next : 91 });
              }}
              className="admin-input"
            />
          </label>

          <label className="sm:col-span-2">
            <span className="admin-label">Default remark (optional)</span>
            <input
              value={config.remark || ""}
              onChange={(event) => patch({ remark: event.target.value })}
              placeholder="Appended after form name / message / custom fields"
              className="admin-input"
            />
            <span className="mt-1 block text-[10px] text-slate-500">
              Remarks always include the form name. Buildesk may reject a second lead with the same
              mobile — check Sent leads for failed rows if a submit does not appear in CRM.
            </span>
          </label>

          <label className="sm:col-span-2">
            <span className="admin-label">Endpoint override (optional)</span>
            <input
              value={config.endpoint || ""}
              onChange={(event) => patch({ endpoint: event.target.value })}
              placeholder={DEFAULT_BUILDESK_LEAD_ENDPOINT}
              className="admin-input font-mono text-[11px]"
            />
            <span className="mt-1 block text-[10px] text-slate-500">
              Leave empty to use the standard Buildesk create-lead URL.
            </span>
          </label>
        </div>
      </section>
    </div>
  );
}

function LeadsTab() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failed">("all");
  const [items, setItems] = useState<CrmLeadItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [databaseAvailable, setDatabaseAvailable] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "50",
        status: statusFilter,
      });
      const response = await fetch(`/api/admin/integrations/crm-leads?${params}`, {
        credentials: "same-origin",
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        items?: CrmLeadItem[];
        total?: number;
        totalPages?: number;
        successCount?: number;
        failedCount?: number;
        databaseAvailable?: boolean;
      };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Unable to load CRM leads.");
      }
      setItems(result.items || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
      setSuccessCount(result.successCount || 0);
      setFailedCount(result.failedCount || 0);
      setDatabaseAvailable(result.databaseAvailable !== false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load CRM leads.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const deleteLead = async (id: number) => {
    if (!window.confirm("Delete this CRM send record from the database? This does not remove the lead from Buildesk.")) {
      return;
    }
    setDeletingId(id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/integrations/crm-leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to delete.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete CRM lead record.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[14px] font-medium text-[#0b1f35]">Sent leads</h2>
        <p className="mt-1 text-[12px] leading-5 text-slate-500">
          Log of Buildesk forward attempts stored in PostgreSQL. Deleting here removes the dashboard record only — not the lead inside Buildesk.
        </p>
      </div>

      {!databaseAvailable ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-950">
          CRM lead history needs PostgreSQL. Configure <span className="font-mono">DATABASE_URL</span> and run{" "}
          <span className="font-mono">database/postgresql-schema.sql</span>.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11px] font-medium text-slate-500">Sent successfully</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">{successCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11px] font-medium text-slate-500">Failed</p>
          <p className="mt-1 text-2xl font-semibold text-red-600">{failedCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11px] font-medium text-slate-500">Total logged</p>
          <p className="mt-1 text-2xl font-semibold text-[#0b1f35]">{successCount + failedCount}</p>
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-[11px] text-slate-600">
        Status
        <select
          value={statusFilter}
          onChange={(event) => {
            setPage(1);
            setStatusFilter(event.target.value as "all" | "success" | "failed");
          }}
          className="h-8 min-w-[140px] rounded-lg border border-slate-200 px-2 text-[11px]"
        >
          <option value="all">All</option>
          <option value="success">Success only</option>
          <option value="failed">Failed only</option>
        </select>
      </label>

      {message ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{message}</p>
      ) : null}

      {loading ? (
        <div className="flex min-h-40 items-center justify-center text-slate-500">
          <LoaderCircle className="size-5 animate-spin" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <article key={item.id} className="flex items-start justify-between gap-3 bg-white px-4 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-semibold text-[#0b1f35]">{item.name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        item.status === "success"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {item.form_label}
                    <span className="text-slate-400"> · {item.form_source}</span>
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    {item.phone}
                    {item.email ? ` · ${item.email}` : ""}
                  </p>
                  {item.project_name || item.source ? (
                    <p className="mt-1 text-[10px] text-slate-500">
                      {item.project_name || "—"}
                      {item.source ? ` · ${item.source}` : ""}
                      {item.sub_source ? ` / ${item.sub_source}` : ""}
                    </p>
                  ) : null}
                  {item.utm_term || item.gclid ? (
                    <p className="mt-1 break-all text-[10px] text-slate-500">
                      {item.utm_term ? `UTM term: ${item.utm_term}` : ""}
                      {item.utm_term && item.gclid ? " · " : ""}
                      {item.gclid ? `GCLID: ${item.gclid}` : ""}
                    </p>
                  ) : null}
                  {item.response_message ? (
                    <p className="mt-1 text-[10px] text-slate-400">{item.response_message}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <p className="text-[10px] text-slate-400">{formatDate(String(item.created_at))}</p>
                  <button
                    type="button"
                    onClick={() => void deleteLead(item.id)}
                    disabled={deletingId === item.id}
                    className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-red-200 px-2.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === item.id ? (
                      <LoaderCircle className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                    Delete
                  </button>
                </div>
              </article>
            ))}
            {!items.length ? (
              <p className="bg-slate-50 p-10 text-center text-[12px] text-slate-500">
                No CRM send records yet.
              </p>
            ) : null}
          </div>
          {total > 0 ? (
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-3 py-2.5">
              <p className="text-[11px] text-slate-500">
                Page {page} of {totalPages}
                <span className="text-slate-400"> · {total} records</span>
              </p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-[#b98945] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-[#b98945] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function IntegrationsPanel({
  buildeskCrm,
  onUpdate,
}: {
  buildeskCrm?: BuildeskCrm;
  onUpdate: (path: PathPart[], value: unknown) => void;
}) {
  const [tab, setTab] = useState<TabKey>("settings");
  const config = normalizeBuildeskCrm(buildeskCrm);
  const status = resolveBuildeskCrmStatus(config);

  const patch = (next: Partial<BuildeskCrm>) => {
    onUpdate(["buildeskCrm"], { ...config, ...next });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setTab("settings")}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold ${
            tab === "settings" ? "bg-[#0b1f35] text-white" : "border border-slate-200 text-slate-700 hover:border-[#b98945]"
          }`}
        >
          <Settings2 className="size-3.5" /> Settings
        </button>
        <button
          type="button"
          onClick={() => setTab("leads")}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold ${
            tab === "leads" ? "bg-[#0b1f35] text-white" : "border border-slate-200 text-slate-700 hover:border-[#b98945]"
          }`}
        >
          <Send className="size-3.5" /> Sent leads
        </button>
      </div>

      {tab === "settings" ? <SettingsTab config={config} status={status} patch={patch} /> : <LeadsTab />}
    </div>
  );
}
