import "server-only";

import { getDatabasePool, isDatabaseConfigured } from "@/lib/server/db";
import { ensureAttributionColumns } from "@/lib/server/attribution-schema";

export type CrmLeadForwardStatus = "success" | "failed";

export type CrmLeadForwardRow = {
  id: number;
  provider: string;
  status: CrmLeadForwardStatus;
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
  form_submission_id: number | null;
  utm_term: string | null;
  gclid: string | null;
  created_at: Date | string;
};

export type InsertCrmLeadForwardInput = {
  provider?: string;
  status: CrmLeadForwardStatus;
  formSource: string;
  formLabel: string;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  projectName?: string;
  source?: string;
  subSource?: string;
  responseMessage?: string;
  formSubmissionId?: number | null;
  utmTerm?: string;
  gclid?: string;
};

function canUseCrmLeadStore() {
  return isDatabaseConfigured();
}

function normalizeRow(row: CrmLeadForwardRow): CrmLeadForwardRow {
  return {
    ...row,
    id: Number(row.id),
    form_submission_id: row.form_submission_id == null ? null : Number(row.form_submission_id),
  };
}

export async function insertCrmLeadForward(input: InsertCrmLeadForwardInput) {
  if (!canUseCrmLeadStore()) return null;

  try {
    await ensureAttributionColumns();
    const result = await getDatabasePool().query<{ id: number }>(
      `INSERT INTO crm_lead_forwards (
        provider, status, form_source, form_label, name, phone, email, message,
        project_name, source, sub_source, response_message, form_submission_id, utm_term, gclid
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id`,
      [
        (input.provider || "buildesk").slice(0, 40),
        input.status,
        input.formSource.slice(0, 80),
        input.formLabel.slice(0, 120),
        input.name.trim().slice(0, 200),
        input.phone.trim().slice(0, 40),
        input.email?.trim().slice(0, 200) || null,
        input.message?.trim().slice(0, 4000) || null,
        input.projectName?.trim().slice(0, 200) || null,
        input.source?.trim().slice(0, 120) || null,
        input.subSource?.trim().slice(0, 120) || null,
        input.responseMessage?.trim().slice(0, 1000) || null,
        input.formSubmissionId ?? null,
        input.utmTerm?.trim().slice(0, 200) || null,
        input.gclid?.trim().slice(0, 255) || null,
      ],
    );
    return result.rows[0]?.id ?? null;
  } catch (error) {
    console.error("Insert CRM lead forward failed", error);
    return null;
  }
}

export type CrmLeadListFilters = {
  page?: number;
  limit?: number;
  status?: CrmLeadForwardStatus | "all";
};

export async function listCrmLeadForwards(filters: CrmLeadListFilters = {}) {
  if (!canUseCrmLeadStore()) {
    return {
      items: [] as CrmLeadForwardRow[],
      total: 0,
      successCount: 0,
      failedCount: 0,
      page: 1,
      limit: 50,
      totalPages: 1,
      databaseAvailable: false,
    };
  }

  const page = Math.max(1, filters.page || 1);
  const limit = Math.max(1, Math.min(100, filters.limit || 50));
  const offset = (page - 1) * limit;
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (filters.status === "success" || filters.status === "failed") {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  await ensureAttributionColumns();
  const pool = getDatabasePool();

  const [rows, countResult, summary] = await Promise.all([
    pool.query<CrmLeadForwardRow>(
      `SELECT id, provider, status, form_source, form_label, name, phone, email, message,
              project_name, source, sub_source, response_message, form_submission_id,
              utm_term, gclid, created_at
       FROM crm_lead_forwards
       ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    ),
    pool.query<{ total: string }>(`SELECT COUNT(*)::text AS total FROM crm_lead_forwards ${where}`, params),
    pool.query<{ success_count: string; failed_count: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'success')::text AS success_count,
         COUNT(*) FILTER (WHERE status = 'failed')::text AS failed_count
       FROM crm_lead_forwards`,
    ),
  ]);

  const total = Number(countResult.rows[0]?.total || 0);
  const successCount = Number(summary.rows[0]?.success_count || 0);
  const failedCount = Number(summary.rows[0]?.failed_count || 0);

  return {
    items: rows.rows.map(normalizeRow),
    total,
    successCount,
    failedCount,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    databaseAvailable: true,
  };
}

export async function deleteCrmLeadForward(id: number) {
  if (!canUseCrmLeadStore()) return false;
  const result = await getDatabasePool().query<{ id: number }>(
    `DELETE FROM crm_lead_forwards WHERE id = $1 RETURNING id`,
    [id],
  );
  return Boolean(result.rows[0]?.id);
}
