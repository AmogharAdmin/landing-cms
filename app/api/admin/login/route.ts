import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  createAdminSession,
  findAdminByEmail,
  updateAdminLastLogin,
} from "@/lib/server/auth";
import {
  clearLoginFailures,
  hasValidMutationOrigin,
  jsonError,
  loginRateLimit,
  recordLoginFailure,
} from "@/lib/server/security";

export const runtime = "nodejs";

const credentialsSchema = z.object({
  email: z.string().email().max(191).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1).max(200),
});

const dummyHash = "$2b$12$mH6eTgD1X80GU9Y6vS0r0.f2e8rLsZrTAr59dwnXuA2fEbUz2/CyK";

export async function POST(request: Request) {
  if (!hasValidMutationOrigin(request)) return jsonError("Invalid request origin.", 403);

  try {
    const parsed = credentialsSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid email or password.", 401);

    const { email, password } = parsed.data;
    const rate = loginRateLimit(request, email);
    if (!rate.allowed) return jsonError("Too many login attempts. Please try again later.", 429);

    const admin = await findAdminByEmail(email);
    const validPassword = await bcrypt.compare(password, admin?.password_hash || dummyHash);
    if (!admin || !admin.is_active || !validPassword) {
      recordLoginFailure(rate.key);
      return jsonError("Invalid email or password.", 401);
    }

    clearLoginFailures(rate.key);
    await createAdminSession({ id: admin.id, email: admin.email });
    await updateAdminLastLogin(admin.id);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Admin login failed", error);
    const message = error instanceof Error ? error.message : "";
    if (/AUTH_SECRET/i.test(message)) {
      return jsonError("AUTH_SECRET is missing or shorter than 32 characters. Add it to .env.local and restart the server.", 500);
    }
    if (/DATABASE_URL|timeout|ECONN|ENOTFOUND|ssl|terminated|connect/i.test(message)) {
      return jsonError("Cannot reach PostgreSQL. Use the Neon pooled DATABASE_URL (the host should contain -pooler) and restart npm run dev.", 500);
    }
    return jsonError("Unable to sign in. Check the server configuration and try again.", 500);
  }
}
