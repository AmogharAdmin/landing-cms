import { getAuthenticatedAdmin } from "@/lib/server/auth";
import {
  deleteVisitorSession,
  deleteVisitorSessions,
  getTrafficSourceBreakdown,
  listVisitorSessions,
  normalizeAnalyticsRange,
} from "@/lib/server/analytics";
import { hasValidMutationOrigin, jsonError } from "@/lib/server/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return jsonError("Authentication required.", 401);

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 50);
  const scrolled = searchParams.get("scrolled");
  const device = searchParams.get("device") || undefined;
  const range = normalizeAnalyticsRange(searchParams.get("range"));

  try {
    const [result, sources] = await Promise.all([
      listVisitorSessions({
        page,
        limit,
        scrolled: scrolled === "yes" || scrolled === "no" ? scrolled : undefined,
        device,
        channel: searchParams.get("channel") || undefined,
        campaign: searchParams.get("campaign") || undefined,
        term: searchParams.get("term") || undefined,
        q: searchParams.get("q") || undefined,
        range,
      }),
      getTrafficSourceBreakdown(range).catch((error) => {
        console.error("Traffic source breakdown failed", error);
        return null;
      }),
    ]);
    return Response.json({ ok: true, ...result, sources });
  } catch (error) {
    console.error("List visitors failed", error);
    return jsonError(`Unable to load visitor analytics. ${error instanceof Error ? error.message : ""}`.trim(), 500);
  }
}

export async function DELETE(request: Request) {
  if (!hasValidMutationOrigin(request)) return jsonError("Invalid request origin.", 403);
  const admin = await getAuthenticatedAdmin();
  if (!admin) return jsonError("Authentication required.", 401);

  try {
    const body = await request.json() as { id?: number; ids?: number[] };

    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const deleted = await deleteVisitorSessions(body.ids);
      if (!deleted) return jsonError("No visitor records were deleted.", 404);
      return Response.json({ ok: true, deleted });
    }

    const id = Number(body.id);
    if (!Number.isFinite(id) || id <= 0) return jsonError("Invalid visitor id.", 400);

    const deleted = await deleteVisitorSession(id);
    if (!deleted) return jsonError("Visitor record not found.", 404);
    return Response.json({ ok: true, deleted: 1 });
  } catch (error) {
    console.error("Delete visitor failed", error);
    return jsonError("Unable to delete visitor record.", 500);
  }
}
