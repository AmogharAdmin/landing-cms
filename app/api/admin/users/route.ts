import bcrypt from "bcryptjs";
import { getAuthenticatedAdmin } from "@/lib/server/auth";
import { getDatabasePool } from "@/lib/server/db";
import { hasValidMutationOrigin, jsonError } from "@/lib/server/security";

export const runtime = "nodejs";

type AdminUserRow = {
  id: number | string;
  email: string;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  last_login_at: Date | string | null;
};

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 191;
}

function validPassword(password: unknown): password is string {
  return typeof password === "string"
    && password.length >= 6
    && Buffer.byteLength(password, "utf8") <= 72;
}

async function requireAdmin(request?: Request) {
  if (request && !hasValidMutationOrigin(request)) return null;
  return getAuthenticatedAdmin();
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Authentication required.", 401);

  const result = await getDatabasePool().query<AdminUserRow>(
    `SELECT id, email, is_active, created_at, updated_at, last_login_at
     FROM admin_users
     ORDER BY created_at ASC`,
  );
  return Response.json({
    ok: true,
    currentAdminId: admin.id,
    users: result.rows.map((user) => ({ ...user, id: Number(user.id) })),
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return jsonError("Authentication required or invalid request origin.", 401);

  try {
    const body = (await request.json()) as { email?: unknown; password?: unknown };
    const email = normalizeEmail(body.email);
    if (!validEmail(email)) return jsonError("Enter a valid email address.", 400);
    if (!validPassword(body.password)) {
      return jsonError("Password must be at least 6 characters.", 400);
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const result = await getDatabasePool().query<AdminUserRow>(
      `INSERT INTO admin_users (email, password_hash, is_active)
       VALUES ($1, $2, TRUE)
       RETURNING id, email, is_active, created_at, updated_at, last_login_at`,
      [email, passwordHash],
    );
    return Response.json({ ok: true, user: { ...result.rows[0], id: Number(result.rows[0].id) } }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return jsonError("An administrator with this email already exists.", 409);
    console.error("Unable to create administrator", error);
    return jsonError("Unable to create the administrator.", 500);
  }
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return jsonError("Authentication required or invalid request origin.", 401);

  try {
    const body = (await request.json()) as { id?: unknown; email?: unknown; password?: unknown; isActive?: unknown };
    const id = Number(body.id);
    if (!Number.isSafeInteger(id) || id < 1) return jsonError("Invalid administrator.", 400);
    if (id === admin.id && body.isActive === false) return jsonError("You cannot deactivate your own account.", 400);

    const updates: string[] = [];
    const values: unknown[] = [];
    if (body.email !== undefined) {
      const email = normalizeEmail(body.email);
      if (!validEmail(email)) return jsonError("Enter a valid email address.", 400);
      values.push(email);
      updates.push(`email = $${values.length}`);
    }
    if (body.password !== undefined && body.password !== "") {
      if (!validPassword(body.password)) {
        return jsonError("Password must be at least 6 characters.", 400);
      }
      values.push(await bcrypt.hash(body.password, 12));
      updates.push(`password_hash = $${values.length}`);
    }
    if (typeof body.isActive === "boolean") {
      values.push(body.isActive);
      updates.push(`is_active = $${values.length}`);
    }
    if (!updates.length) return jsonError("No changes were provided.", 400);

    values.push(id);
    const result = await getDatabasePool().query<AdminUserRow>(
      `UPDATE admin_users SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length}
       RETURNING id, email, is_active, created_at, updated_at, last_login_at`,
      values,
    );
    if (!result.rows[0]) return jsonError("Administrator not found.", 404);
    return Response.json({ ok: true, user: { ...result.rows[0], id: Number(result.rows[0].id) } });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return jsonError("An administrator with this email already exists.", 409);
    console.error("Unable to update administrator", error);
    return jsonError("Unable to update the administrator.", 500);
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return jsonError("Authentication required or invalid request origin.", 401);

  const body = (await request.json()) as { id?: unknown };
  const id = Number(body.id);
  if (!Number.isSafeInteger(id) || id < 1) return jsonError("Invalid administrator.", 400);
  if (id === admin.id) return jsonError("You cannot delete your own account.", 400);

  const result = await getDatabasePool().query("DELETE FROM admin_users WHERE id = $1 RETURNING id", [id]);
  if (!result.rows[0]) return jsonError("Administrator not found.", 404);
  return Response.json({ ok: true });
}
