import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/server/auth";
import { getCmsStatus } from "@/lib/server/cms-status";
import { shouldUseBundledSiteData } from "@/lib/server/cms-environment";
import { getPageContent } from "@/lib/server/site-content";
import { readSiteJsonFile } from "@/lib/server/site-json-file";
import { bundledSiteData } from "@/lib/site";

export const metadata = {
  title: "Content Studio | Landing Page Admin",
  robots: "noindex, nofollow",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) redirect("/admin/login");

  let initialData = bundledSiteData;
  let databaseWarning: string | undefined;
  const cmsStatus = await getCmsStatus();
  if (shouldUseBundledSiteData()) {
    try {
      initialData = await readSiteJsonFile();
    } catch {
      initialData = bundledSiteData;
    }
    databaseWarning = "Local mode: saves go to data/site.json only. Use Restore main to reset from data/main-site.json.";
  } else if (!cmsStatus.ready) {
    databaseWarning = cmsStatus.summary;
    if (cmsStatus.issues[0]?.fix) {
      databaseWarning = `${cmsStatus.summary} ${cmsStatus.issues[0].fix}`;
    }
  } else {
    try {
      const databaseContent = await getPageContent("home");
      if (databaseContent) initialData = databaseContent;
      else databaseWarning = "The home record is missing. Run npm run migrate-content before saving.";
    } catch (error) {
      console.error("Unable to initialize production admin", error);
      databaseWarning = "PostgreSQL is unavailable. The editor is read-only until the connection is restored.";
    }
  }

  return (
    <AdminDashboard
      initialData={initialData}
      contentEndpoint="/api/admin/content/home"
      uploadEndpoint="/api/admin/upload"
      mode={shouldUseBundledSiteData() ? "json" : "postgresql"}
      userEmail={admin.email}
      initialWarning={databaseWarning}
    />
  );
}
