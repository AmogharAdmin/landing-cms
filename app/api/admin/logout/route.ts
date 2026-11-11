import { destroyAdminSession } from "@/lib/server/auth";
import { hasValidMutationOrigin, jsonError } from "@/lib/server/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasValidMutationOrigin(request)) return jsonError("Invalid request origin.", 403);
  await destroyAdminSession();
  return Response.json({ ok: true });
}
