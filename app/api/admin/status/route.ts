import { getAuthenticatedAdmin } from "@/lib/server/auth";
import { getCmsStatus } from "@/lib/server/cms-status";
import { jsonError } from "@/lib/server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return jsonError("Authentication required.", 401);

  const status = await getCmsStatus();
  return Response.json(status, { headers: { "Cache-Control": "no-store" } });
}
