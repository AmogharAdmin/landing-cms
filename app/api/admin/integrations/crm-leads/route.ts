import { getAuthenticatedAdmin } from "@/lib/server/auth";
import { deleteCrmLeadForward, listCrmLeadForwards, type CrmLeadForwardStatus } from "@/lib/server/crm-leads";
import { hasValidMutationOrigin, jsonError } from "@/lib/server/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return jsonError("Authentication required.", 401);

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 50);
  const statusParam = searchParams.get("status") || "all";
  const status =
    statusParam === "success" || statusParam === "failed" || statusParam === "all"
      ? (statusParam as CrmLeadForwardStatus | "all")
      : "all";

  try {
    const result = await listCrmLeadForwards({ page, limit, status });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("List CRM lead forwards failed", error);
    return jsonError("Unable to load CRM lead history.", 500);
  }
}

export async function DELETE(request: Request) {
  if (!hasValidMutationOrigin(request)) return jsonError("Invalid request origin.", 403);
  const admin = await getAuthenticatedAdmin();
  if (!admin) return jsonError("Authentication required.", 401);

  try {
    const body = (await request.json()) as { id?: number };
    const id = Number(body.id);
    if (!Number.isFinite(id) || id <= 0) return jsonError("Invalid lead id.", 400);

    const deleted = await deleteCrmLeadForward(id);
    if (!deleted) return jsonError("Lead record not found.", 404);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Delete CRM lead forward failed", error);
    return jsonError("Unable to delete CRM lead record.", 500);
  }
}
