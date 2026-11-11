import "server-only";

import { createHash } from "node:crypto";
import { requestClientIp } from "@/lib/server/client-ip";

const attempts = new Map<string, { count: number; resetAt: number }>();
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function requestIp(request: Request) {
  return requestClientIp(request);
}

function rateKey(request: Request, identity: string) {
  return createHash("sha256")
    .update(`${requestIp(request)}:${identity.trim().toLowerCase()}`)
    .digest("hex");
}

export function loginRateLimit(request: Request, identity: string) {
  const key = rateKey(request, identity);
  const now = Date.now();
  if (attempts.size > 1000) {
    for (const [attemptKey, attempt] of attempts) {
      if (attempt.resetAt <= now) attempts.delete(attemptKey);
    }
  }
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 0, resetAt: now + ATTEMPT_WINDOW_MS });
    return { allowed: true, key };
  }
  return { allowed: current.count < MAX_ATTEMPTS, key };
}

export function recordLoginFailure(key: string) {
  const current = attempts.get(key);
  const now = Date.now();
  attempts.set(key, {
    count: (current?.resetAt && current.resetAt > now ? current.count : 0) + 1,
    resetAt: current?.resetAt && current.resetAt > now ? current.resetAt : now + ATTEMPT_WINDOW_MS,
  });
}

export function clearLoginFailures(key: string) {
  attempts.delete(key);
}

function forwardedOrigin(request: Request) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || new URL(request.url).protocol.replace(":", "");
  return host ? `${protocol}://${host}` : new URL(request.url).origin;
}

export function hasValidMutationOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  const candidates: string[] = [];
  if (origin) candidates.push(origin);
  // Some desktop beacon/fetch edge cases omit Origin but still send Referer.
  if (referer) {
    try {
      candidates.push(new URL(referer).origin);
    } catch {
      // ignore invalid referer
    }
  }

  if (!candidates.length) return false;

  try {
    const allowed = new Set<string>();
    allowed.add(forwardedOrigin(request));
    if (process.env.SITE_URL) {
      allowed.add(new URL(process.env.SITE_URL).origin);
    }
    if (process.env.NODE_ENV !== "production") {
      allowed.add("http://localhost:3000");
      allowed.add("http://127.0.0.1:3000");
    }
    return candidates.some((candidate) => allowed.has(new URL(candidate).origin));
  } catch {
    return false;
  }
}

export function jsonError(message: string, status: number) {
  return Response.json({ ok: false, error: message }, { status });
}
