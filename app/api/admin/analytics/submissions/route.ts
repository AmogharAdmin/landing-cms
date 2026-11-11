import { getAuthenticatedAdmin } from "@/lib/server/auth";
import { deleteFormSubmission, listFormSubmissions, normalizeAnalyticsRange } from "@/lib/server/analytics";
import { hasValidMutationOrigin, jsonError } from "@/lib/server/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return jsonError("Authentication required.", 401);

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 50);
  const source = searchParams.get("source") || undefined;

  try {
    const result = await listFormSubmissions({
      page,
      limit,
      source,
      channel: searchParams.get("channel") || undefined,
      range: normalizeAnalyticsRange(searchParams.get("range")),
    });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("List submissions failed", error);
    return jsonError(`Unable to load form submissions. ${error instanceof Error ? error.message : ""}`.trim(), 500);
  }
}

export async function DELETE(request: Request) {
  if (!hasValidMutationOrigin(request)) return jsonError("Invalid request origin.", 403);
  const admin = await getAuthenticatedAdmin();
  if (!admin) return jsonError("Authentication required.", 401);

  try {
    const body = await request.json() as { id?: number };
    const id = Number(body.id);
    if (!Number.isFinite(id) || id <= 0) return jsonError("Invalid submission id.", 400);

    const deleted = await deleteFormSubmission(id);
    if (!deleted) return jsonError("Submission not found.", 404);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Delete submission failed", error);
    return jsonError("Unable to delete submission.", 500);
  }
}
