import { revalidatePath } from "next/cache";
import { getAuthenticatedAdmin } from "@/lib/server/auth";
import { canWriteCmsToDatabase } from "@/lib/server/cms-environment";
import { restoreContentVersion } from "@/lib/server/content-versions";
import { hasValidMutationOrigin, jsonError } from "@/lib/server/security";

export const runtime = "nodejs";

export async function POST(_request: Request, context: RouteContext<"/api/admin/content/versions/[id]/restore">) {
  if (!hasValidMutationOrigin(_request)) return jsonError("Invalid request origin.", 403);
  const admin = await getAuthenticatedAdmin();
  if (!admin) return jsonError("Authentication required.", 401);

  if (!canWriteCmsToDatabase()) {
    return jsonError(
      "Restoring backups to PostgreSQL is only allowed on the live production site.",
      403,
    );
  }

  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) return jsonError("Invalid version id.", 400);

  try {
    const result = await restoreContentVersion(id, admin.id);
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/sitemap.xml");
    revalidatePath("/robots.txt");
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("Restore content version failed", error);
    const message = error instanceof Error ? error.message : "Unable to restore backup version.";
    if (message === "Backup version not found.") return jsonError(message, 404);
    return jsonError(message, 500);
  }
}
