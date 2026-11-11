import { getAuthenticatedAdmin } from "@/lib/server/auth";
import { getContentVersion } from "@/lib/server/content-versions";
import { jsonError } from "@/lib/server/security";

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext<"/api/admin/content/versions/[id]">) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return jsonError("Authentication required.", 401);

  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) return jsonError("Invalid version id.", 400);

  try {
    const version = await getContentVersion(id);
    if (!version) return jsonError("Backup version not found.", 404);
    return Response.json({ ok: true, version });
  } catch (error) {
    console.error("Get content version failed", error);
    return jsonError("Unable to load backup version.", 500);
  }
}
