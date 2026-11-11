import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getAuthenticatedAdmin } from "@/lib/server/auth";

export const metadata = {
  title: "Admin Login | Content Studio",
  robots: "noindex, nofollow",
};
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getAuthenticatedAdmin()) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f9] px-4 py-10">
      <AdminLoginForm />
    </main>
  );
}
