import { notFound } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { bundledSiteData } from "@/lib/site";

export const metadata = {
  title: "Local Content Studio | Development",
  robots: "noindex, nofollow",
};

export default function DevelopmentDashboardPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <AdminDashboard
      initialData={bundledSiteData}
      contentEndpoint="http://127.0.0.1:3100/content"
      uploadEndpoint="http://127.0.0.1:3100/upload"
      mode="json"
    />
  );
}
