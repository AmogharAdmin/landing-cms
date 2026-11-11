import { getAuthenticatedAdmin } from "@/lib/server/auth";
import {
  deleteCtaClick,
  listCtaClicks,
  normalizeAnalyticsRange,
  type CtaClickType,
} from "@/lib/server/analytics";
import { hasValidMutationOrigin, jsonError } from "@/lib/server/security";

export const runtime = "nodejs";

const CTA_TYPES = new Set<CtaClickType | "all">([
  "all",
  "whatsapp",
  "header_call",
  "floating_call",
]);

export async function GET(request: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return jsonError("Authentication required.", 401);

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 50);
  const rawType = (searchParams.get("ctaType") || "all").trim();
  const ctaType = CTA_TYPES.has(rawType as CtaClickType | "all")
    ? (rawType as CtaClickType | "all")
    : "all";

  try {
    const result = await listCtaClicks({
      page,
      limit,
      ctaType,
      channel: searchParams.get("channel") || undefined,
      range: normalizeAnalyticsRange(searchParams.get("range")),
    });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("List CTA clicks failed", error);
    return jsonError(`Unable to load CTA click analytics. ${error instanceof Error ? error.message : ""}`.trim(), 500);
  }
}

export async function DELETE(request: Request) {
  if (!hasValidMutationOrigin(request)) return jsonError("Invalid request origin.", 403);
  const admin = await getAuthenticatedAdmin();
  if (!admin) return jsonError("Authentication required.", 401);

  try {
    const body = (await request.json()) as { id?: number };
    const id = Number(body.id);
    if (!Number.isFinite(id) || id <= 0) return jsonError("Invalid CTA click id.", 400);

    const deleted = await deleteCtaClick(id);
    if (!deleted) return jsonError("CTA click record not found.", 404);
    return Response.json({ ok: true, deleted: 1 });
  } catch (error) {
    console.error("Delete CTA click failed", error);
    return jsonError("Unable to delete CTA click record.", 500);
  }
}
