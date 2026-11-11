"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  History,
  LoaderCircle,
  Trash2,
  X,
} from "lucide-react";
import type { SiteData } from "@/types/site";
import { buildSiteExportFilename, siteDataToExportJson } from "@/lib/site-backup";

type VersionItem = {
  id: number;
  site_page_id: number;
  created_at: string;
  changed_by: number | null;
  changed_by_email: string | null;
  site_name: string;
  seo_title: string;
  bytes: number;
  is_current: boolean;
};

function normalizeVersionItem(item: VersionItem): VersionItem {
  return {
    ...item,
    id: Number(item.id),
    site_page_id: Number(item.site_page_id),
    is_current: Boolean(item.is_current),
  };
}

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

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
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

type BackupPanelProps = {
  mode: "json" | "postgresql";
  onRestored?: () => void | Promise<void>;
};

export function BackupPanel({ mode, onRestored }: BackupPanelProps) {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedVersion, setSelectedVersion] = useState<VersionItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const loadVersions = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      const response = await fetch(`/api/admin/content/versions?${params}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const result = await response.json() as {
        ok?: boolean;
        items?: VersionItem[];
        total?: number;
        error?: string;
      };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Unable to load backups.");
      }
      setVersions((result.items || []).map(normalizeVersionItem));
      setTotal(result.total || 0);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load backups.");
      setVersions([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page]);

  useEffect(() => {
    if (mode === "postgresql") void loadVersions();
    else setLoading(false);
  }, [mode, loadVersions]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const selectedCount = selectedIds.size;
  const allOnPageSelected = versions.length > 0 && versions.every((item) => selectedIds.has(item.id));

  function toggleSelection(id: number) {
    const normalizedId = Number(id);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(normalizedId)) next.delete(normalizedId);
      else next.add(normalizedId);
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allOnPageSelected) {
        versions.forEach((item) => next.delete(item.id));
      } else {
        versions.forEach((item) => next.add(item.id));
      }
      return next;
    });
  }

  async function createBackup() {
    setCreating(true);
    setMessage("");
    setSuccessMessage("");
    try {
      const response = await fetch("/api/admin/content/versions", {
        method: "POST",
        credentials: "same-origin",
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to create a backup.");
      if (page !== 1) setPage(1);
      else await loadVersions();
      setSuccessMessage("Backup saved. The newest snapshot is the current live site.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create a backup.");
    } finally {
      setCreating(false);
    }
  }

  async function deleteVersions(ids: number[]) {
    const response = await fetch("/api/admin/content/versions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(ids.length === 1 ? { id: ids[0] } : { ids }),
    });
    const result = await response.json() as { ok?: boolean; error?: string };
    if (!response.ok || !result.ok) throw new Error(result.error || "Unable to delete.");
  }

  async function bulkDelete() {
    const ids = Array.from(selectedIds).map((id) => Number(id)).filter((id) => id > 0);
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} backup version(s) permanently from the database? This cannot be undone.`)) return;

    setBulkDeleting(true);
    try {
      await deleteVersions(ids);
      setSelectedIds(new Set());
      setSelectedVersion(null);
      await loadVersions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete backup versions.");
    } finally {
      setBulkDeleting(false);
    }
  }

  async function deleteOne(id: number) {
    if (!window.confirm("Delete this backup version permanently from the database? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteVersions([id]);
      setSelectedVersion(null);
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      await loadVersions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete backup version.");
    } finally {
      setDeletingId(null);
    }
  }

  async function restoreVersion(item: VersionItem) {
    if (item.is_current) return;
    if (!window.confirm(
      `Restore the site to the backup from ${formatDate(item.created_at)}?\n\nThis replaces the live site. Take a Backup now first if you want to keep the current version.`,
    )) return;

    setRestoringId(item.id);
    setMessage("");
    setSuccessMessage("");
    try {
      const response = await fetch(`/api/admin/content/versions/${item.id}/restore`, {
        method: "POST",
        credentials: "same-origin",
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to restore backup.");
      setSelectedVersion(null);
      setSelectedIds(new Set());
      await loadVersions();
      await onRestored?.();
      setSuccessMessage(`Site content restored to the backup from ${formatDate(item.created_at)}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to restore backup version.");
    } finally {
      setRestoringId(null);
    }
  }

  async function downloadVersion(item: VersionItem) {
    setDownloadingId(item.id);
    try {
      const response = await fetch(`/api/admin/content/versions/${item.id}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const result = await response.json() as {
        ok?: boolean;
        version?: { content: SiteData };
        error?: string;
      };
      if (!response.ok || !result.ok || !result.version?.content) {
        throw new Error(result.error || "Unable to download backup.");
      }
      const content = result.version.content;
      const json = siteDataToExportJson(content);
      const blob = new Blob([json], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = buildSiteExportFilename(content, new Date(item.created_at));
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to download backup.");
    } finally {
      setDownloadingId(null);
    }
  }

  if (mode === "json") {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-[12px] text-slate-600">
        <p className="font-medium text-[#0b1f35]">Backup history is stored in PostgreSQL</p>
        <p className="mt-2">
          Local development saves to <code className="rounded bg-white px-1 py-0.5 text-[11px]">data/site.json</code> only.
          Snapshots are stored only when you click Backup now on the production admin (connected to Neon). Saving the site does not create a backup.
        </p>
        <p className="mt-2">
          To reset local content, use <strong>Restore main</strong> (copies <code className="rounded bg-white px-1 py-0.5 text-[11px]">data/main-site.json</code>).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-3xl text-[12px] text-slate-600">
          Backups are saved only when you click <strong>Backup now</strong>. Saving other sections does not add a row.
          Use <strong>Restore</strong> to roll the live site back to a snapshot. The row with the gold border matches the current live site.
        </p>
        <button
          type="button"
          onClick={() => void createBackup()}
          disabled={creating}
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#0b1f35] px-3.5 text-[12px] font-semibold text-white hover:bg-[#153457] disabled:opacity-60"
        >
          {creating ? <LoaderCircle className="size-3.5 animate-spin" /> : <History className="size-3.5" />}
          Backup now
        </button>
      </div>

      {successMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800">{successMessage}</p>
      ) : null}

      {message ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{message}</p>
      ) : null}

      {selectedCount > 0 ? (
        <button
          type="button"
          onClick={() => void bulkDelete()}
          disabled={bulkDeleting}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-[11px] font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
        >
          {bulkDeleting ? <LoaderCircle className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          Delete selected ({selectedCount})
        </button>
      ) : null}

      {loading ? (
        <div className="flex min-h-40 items-center justify-center text-slate-500">
          <LoaderCircle className="size-5 animate-spin" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-[11px]">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleSelectAllOnPage}
                      disabled={!versions.length}
                      className="size-3.5 rounded border-slate-300"
                      aria-label="Select all backups on this page"
                    />
                  </th>
                  <th className="px-3 py-2 font-semibold">Date/Time</th>
                  <th className="px-3 py-2 font-semibold">Project</th>
                  <th className="px-3 py-2 font-semibold">SEO title</th>
                  <th className="px-3 py-2 font-semibold">Saved by</th>
                  <th className="px-3 py-2 font-semibold">Size</th>
                  <th className="px-3 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-t border-slate-100 ${
                      item.is_current
                        ? "border-l-4 border-l-[#b98945] bg-amber-50/50"
                        : selectedIds.has(item.id)
                          ? "bg-red-50/40"
                          : ""
                    }`}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelection(item.id)}
                        className="size-3.5 rounded border-slate-300"
                        aria-label={`Select backup ${item.id}`}
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{formatDate(item.created_at)}</span>
                        {item.is_current ? (
                          <span className="rounded-full border border-[#b98945] bg-amber-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#8a6528]">
                            Current
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2">{item.site_name}</td>
                    <td className="px-3 py-2 max-w-[200px] truncate" title={item.seo_title}>{item.seo_title || "—"}</td>
                    <td className="px-3 py-2">{item.changed_by_email || "—"}</td>
                    <td className="px-3 py-2">{formatBytes(item.bytes)}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedVersion(item)}
                          className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-700 hover:border-[#b98945]"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => void downloadVersion(item)}
                          disabled={downloadingId === item.id}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-700 hover:border-[#b98945] disabled:opacity-50"
                        >
                          {downloadingId === item.id ? <LoaderCircle className="size-3 animate-spin" /> : <Download className="size-3" />}
                          JSON
                        </button>
                        <button
                          type="button"
                          onClick={() => void restoreVersion(item)}
                          disabled={item.is_current || restoringId === item.id}
                          className="inline-flex items-center gap-1 rounded-md border border-[#b98945]/40 bg-amber-50 px-2 py-1 text-[10px] font-medium text-[#8a6528] hover:border-[#b98945] disabled:cursor-not-allowed disabled:opacity-50"
                          title={item.is_current ? "This version is already live" : "Restore live site to this backup"}
                        >
                          {restoringId === item.id ? <LoaderCircle className="size-3 animate-spin" /> : <History className="size-3" />}
                          Restore
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!versions.length ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                      No backup versions yet. They are created automatically each time you save on production.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {total > 0 ? (
            <TablePagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          ) : null}
        </div>
      )}

      <p className="text-[10px] text-slate-500">
        Deleting a version only removes the history snapshot — it does not change the live site.
        Restoring applies the backup to the live site and saves the previous live content as a new backup.
      </p>

      {selectedVersion ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16"
          onMouseDown={(event) => event.target === event.currentTarget && setSelectedVersion(null)}
        >
          <div className={`mb-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl ${selectedVersion.is_current ? "ring-2 ring-[#b98945]" : ""}`}>
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#0b1f35]">Backup version #{selectedVersion.id}</h3>
                {selectedVersion.is_current ? (
                  <span className="rounded-full border border-[#b98945] bg-amber-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#8a6528]">
                    Current
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setSelectedVersion(null)}
                className="inline-flex size-8 items-center justify-center rounded-md hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <dl className="max-h-[60vh] overflow-y-auto px-4 py-2">
              <DetailRow label="Date/Time" value={formatDate(selectedVersion.created_at)} />
              <DetailRow label="Project" value={selectedVersion.site_name} />
              <DetailRow label="SEO title" value={selectedVersion.seo_title || "—"} />
              <DetailRow label="Saved by" value={selectedVersion.changed_by_email || "—"} />
              <DetailRow label="Size" value={formatBytes(selectedVersion.bytes)} />
              <DetailRow label="Version ID" value={selectedVersion.id} />
              <DetailRow label="Page ID" value={selectedVersion.site_page_id} />
            </dl>
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <button
                type="button"
                onClick={() => void deleteOne(selectedVersion.id)}
                disabled={deletingId === selectedVersion.id}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-[12px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {deletingId === selectedVersion.id ? <LoaderCircle className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                Delete
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void restoreVersion(selectedVersion)}
                  disabled={selectedVersion.is_current || restoringId === selectedVersion.id}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#b98945]/40 bg-amber-50 px-3 text-[12px] font-medium text-[#8a6528] hover:border-[#b98945] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {restoringId === selectedVersion.id ? <LoaderCircle className="size-3.5 animate-spin" /> : <History className="size-3.5" />}
                  Restore
                </button>
                <button
                  type="button"
                  onClick={() => void downloadVersion(selectedVersion)}
                  disabled={downloadingId === selectedVersion.id}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[12px] font-medium text-slate-700 hover:border-[#b98945] disabled:opacity-50"
                >
                  {downloadingId === selectedVersion.id ? <LoaderCircle className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                  Download JSON
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVersion(null)}
                  className="inline-flex min-h-9 items-center rounded-lg bg-[#0b1f35] px-4 text-[12px] font-semibold text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
