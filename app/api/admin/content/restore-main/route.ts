import { revalidatePath } from "next/cache";
import { getAuthenticatedAdmin } from "@/lib/server/auth";
import { shouldUseBundledSiteData } from "@/lib/server/cms-environment";
import { readMainSiteJsonFile, restoreSiteJsonFromMain } from "@/lib/server/site-json-file";
import { hasValidMutationOrigin, jsonError } from "@/lib/server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasValidMutationOrigin(request)) return jsonError("Invalid request origin.", 403);
  const admin = await getAuthenticatedAdmin();
  if (!admin) return jsonError("Authentication required.", 401);

  if (!shouldUseBundledSiteData()) {
    return jsonError("Restore main is only available in local development (data/site.json mode).", 403);
  }

  try {
    await readMainSiteJsonFile();
    await restoreSiteJsonFromMain();
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/sitemap.xml");
    revalidatePath("/robots.txt");
    return Response.json({ ok: true, restoredAt: new Date().toISOString() });
  } catch (error) {
    console.error("Restore main-site.json failed", error);
    return jsonError("Unable to restore from data/main-site.json. Make sure the file exists.", 500);
  }
}
