import { revalidatePath } from "next/cache";
import { getAuthenticatedAdmin } from "@/lib/server/auth";
import { canWriteCmsToDatabase, shouldUseBundledSiteData } from "@/lib/server/cms-environment";
import { getPageContent, updatePageContent } from "@/lib/server/site-content";
import { readSiteJsonFile, writeSiteJsonFile } from "@/lib/server/site-json-file";
import { bundledSiteData } from "@/lib/site";
import { safeParseSiteData } from "@/lib/content-schema";
import { hasValidMutationOrigin, jsonError } from "@/lib/server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validSlug(slug: string) {
  return /^[a-z0-9-]{1,80}$/.test(slug);
}

export async function GET(_request: Request, context: RouteContext<"/api/admin/content/[slug]">) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return jsonError("Authentication required.", 401);
  const { slug } = await context.params;
  if (!validSlug(slug)) return jsonError("Invalid page slug.", 400);

  if (shouldUseBundledSiteData()) {
    try {
      const content = await readSiteJsonFile();
      return Response.json(content, { headers: { "Cache-Control": "no-store" } });
    } catch {
      return Response.json(bundledSiteData, { headers: { "Cache-Control": "no-store" } });
    }
  }

  try {
    const content = await getPageContent(slug);
    if (!content) return jsonError("Page content was not found. Run the migration first.", 404);
    return Response.json(content, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to load admin content", error);
    return jsonError("Unable to load content from PostgreSQL.", 500);
  }
}

export async function PUT(request: Request, context: RouteContext<"/api/admin/content/[slug]">) {
  if (!hasValidMutationOrigin(request)) return jsonError("Invalid request origin.", 403);
  const admin = await getAuthenticatedAdmin();
  if (!admin) return jsonError("Authentication required.", 401);
  const { slug } = await context.params;
  if (!validSlug(slug)) return jsonError("Invalid page slug.", 400);

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 2 * 1024 * 1024) return jsonError("Content payload is too large.", 413);

  try {
    const parsed = safeParseSiteData(await request.json());
    if (!parsed.success) {
      return jsonError(`Content validation failed: ${parsed.error.issues[0]?.message || "invalid content"}`, 400);
    }

    if (shouldUseBundledSiteData()) {
      await writeSiteJsonFile(parsed.data);
      revalidatePath("/");
      revalidatePath("/admin");
      revalidatePath("/dashboard");
      revalidatePath("/sitemap.xml");
      revalidatePath("/robots.txt");
      return Response.json({ ok: true, savedAt: new Date().toISOString(), storage: "site.json" });
    }

    if (!canWriteCmsToDatabase()) {
      return jsonError(
        "CMS saves to PostgreSQL are only allowed on the live production site. Local edits save to data/site.json; preview deployments are read-only.",
        403,
      );
    }

    await updatePageContent(slug, parsed.data, admin.id);
    revalidatePath("/");
    revalidatePath("/sitemap.xml");
    revalidatePath("/robots.txt");
    return Response.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Unable to update admin content", error);
    return jsonError("PostgreSQL did not save the content. No changes were applied.", 500);
  }
}
