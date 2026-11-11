import "server-only";

const PRIVATE_IP_PATTERN =
  /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.|::1$|fc00:|fd00:|fe80:)/i;

function normalizeIp(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  // Strip IPv6-mapped IPv4 prefix.
  if (trimmed.startsWith("::ffff:")) return trimmed.slice(7);
  return trimmed;
}

export function isPrivateOrLocalIp(ip: string) {
  return ip === "unknown" || PRIVATE_IP_PATTERN.test(ip);
}

export function isPublicIp(ip: string) {
  return Boolean(ip) && ip !== "unknown" && !isPrivateOrLocalIp(ip);
}

/**
 * Resolve the visitor's public IP from proxy headers.
 * On Vercel, x-vercel-forwarded-for is the most reliable client address.
 */
export function requestClientIp(request: Request) {
  const vercelForwarded = normalizeIp(request.headers.get("x-vercel-forwarded-for")?.split(",")[0]);
  if (vercelForwarded && isPublicIp(vercelForwarded)) return vercelForwarded;

  const realIp = normalizeIp(request.headers.get("x-real-ip"));
  if (realIp && isPublicIp(realIp)) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    for (const part of forwarded.split(",")) {
      const ip = normalizeIp(part);
      if (ip && isPublicIp(ip)) return ip;
    }
    const first = normalizeIp(forwarded.split(",")[0]);
    if (first) return first;
  }

  if (vercelForwarded) return vercelForwarded;
  if (realIp) return realIp;
  return "unknown";
}
