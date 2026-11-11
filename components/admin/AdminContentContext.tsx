"use client";

import { createContext, useContext } from "react";
import type { CustomButtonGradient, SiteData } from "@/types/site";
import type { PathPart } from "@/components/admin/editor-ui";

type AdminContentContextValue = {
  data: SiteData;
  update: (path: PathPart[], value: unknown) => void;
};

const AdminContentContext = createContext<AdminContentContextValue | null>(null);

export function AdminContentProvider({
  data,
  update,
  children,
}: {
  data: SiteData;
  update: (path: PathPart[], value: unknown) => void;
  children: React.ReactNode;
}) {
  return (
    <AdminContentContext.Provider value={{ data, update }}>
      {children}
    </AdminContentContext.Provider>
  );
}

export function useAdminContent() {
  return useContext(AdminContentContext);
}

export function useAdminCustomGradients() {
  const ctx = useAdminContent();
  const customGradients = ctx?.data.customButtonGradients || [];

  const setCustomGradients = (next: CustomButtonGradient[]) => {
    ctx?.update(["customButtonGradients"], next);
  };

  return {
    customGradients,
    setCustomGradients,
    canEdit: Boolean(ctx),
  };
}
