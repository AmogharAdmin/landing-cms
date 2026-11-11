import { getAuthenticatedAdmin } from "@/lib/server/auth";
import { purgeVisitorSessionsManual } from "@/lib/server/analytics";
import { hasValidMutationOrigin, jsonError } from "@/lib/server/security";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  if (!hasValidMutationOrigin(request)) return jsonError("Invalid request origin.", 403);
  const admin = await getAuthenticatedAdmin();
  if (!admin) return jsonError("Authentication required.", 401);

  try {
    const deleted = await purgeVisitorSessionsManual();
    return Response.json({ ok: true, deleted });
  } catch (error) {
    console.error("Purge visitors failed", error);
    return jsonError("Unable to purge old visitor data.", 500);
  }
}
