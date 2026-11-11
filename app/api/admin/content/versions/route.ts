import { getAuthenticatedAdmin } from "@/lib/server/auth";
import { createManualContentBackup, deleteContentVersion, deleteContentVersions, listContentVersions } from "@/lib/server/content-versions";
import { canWriteCmsToDatabase } from "@/lib/server/cms-environment";
import { hasValidMutationOrigin, jsonError } from "@/lib/server/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return jsonError("Authentication required.", 401);

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 20);

  try {
    const result = await listContentVersions(page, limit);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("List content versions failed", error);
    return jsonError("Unable to load content backups.", 500);
  }
}

export async function POST(request: Request) {
  if (!hasValidMutationOrigin(request)) return jsonError("Invalid request origin.", 403);
  const admin = await getAuthenticatedAdmin();
  if (!admin) return jsonError("Authentication required.", 401);
  if (!canWriteCmsToDatabase()) {
    return jsonError("Backups can only be saved on the live production site.", 403);
  }

  try {
    const backup = await createManualContentBackup(admin.id);
    return Response.json({ ok: true, ...backup });
  } catch (error) {
    console.error("Create content backup failed", error);
    return jsonError("Unable to create a backup.", 500);
  }
}

export async function DELETE(request: Request) {
  if (!hasValidMutationOrigin(request)) return jsonError("Invalid request origin.", 403);
  const admin = await getAuthenticatedAdmin();
  if (!admin) return jsonError("Authentication required.", 401);

  try {
    const body = await request.json() as { id?: number; ids?: number[] };

    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const deleted = await deleteContentVersions(body.ids);
      if (!deleted) return jsonError("No backup versions were deleted.", 404);
      return Response.json({ ok: true, deleted });
    }

    const id = Number(body.id);
    if (!Number.isFinite(id) || id <= 0) return jsonError("Invalid version id.", 400);

    const deleted = await deleteContentVersion(id);
    if (!deleted) return jsonError("Backup version not found.", 404);
    return Response.json({ ok: true, deleted: 1 });
  } catch (error) {
    console.error("Delete content version failed", error);
    return jsonError("Unable to delete backup version.", 500);
  }
}
