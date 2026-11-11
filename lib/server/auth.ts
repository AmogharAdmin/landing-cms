import "server-only";

import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import { getDatabasePool } from "@/lib/server/db";

export type AdminIdentity = {
  id: number;
  email: string;
};

export type AdminSession = {
  admin?: AdminIdentity;
  authenticatedAt?: number;
};

type AdminRow = {
  id: number | string;
  email: string;
  password_hash: string;
  is_active: boolean;
};

type AdminRecord = Omit<AdminRow, "id"> & { id: number };

function authSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

function sessionOptions(): SessionOptions {
  return {
    password: authSecret(),
    cookieName: "amoghaa_admin_session",
    ttl: 60 * 60 * 8,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    },
  };
}

export function isAuthConfigured() {
  return Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32);
}

export async function getAdminSession() {
  if (!isAuthConfigured()) return null;
  return getIronSession<AdminSession>(await cookies(), sessionOptions());
}

export async function getAuthenticatedAdmin(): Promise<AdminIdentity | null> {
  const session = await getAdminSession();
  if (!session?.admin) return null;

  const result = await getDatabasePool().query<Pick<AdminRow, "id" | "email" | "is_active">>(
    "SELECT id, email, is_active FROM admin_users WHERE id = $1 LIMIT 1",
    [session.admin.id],
  );
  const admin = result.rows[0];
  if (!admin?.is_active) {
    session.destroy();
    return null;
  }
  return { id: Number(admin.id), email: admin.email };
}

export async function createAdminSession(admin: AdminIdentity) {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions());
  session.admin = admin;
  session.authenticatedAt = Date.now();
  await session.save();
}

export async function destroyAdminSession() {
  const session = await getAdminSession();
  session?.destroy();
}

export async function findAdminByEmail(email: string): Promise<AdminRecord | null> {
  const result = await getDatabasePool().query<AdminRow>(
    "SELECT id, email, password_hash, is_active FROM admin_users WHERE email = $1 LIMIT 1",
    [email],
  );
  const admin = result.rows[0];
  return admin ? { ...admin, id: Number(admin.id) } : null;
}

export async function updateAdminLastLogin(id: number) {
  await getDatabasePool().query(
    "UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1",
    [id],
  );
}
