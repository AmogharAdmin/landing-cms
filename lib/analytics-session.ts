export const ANALYTICS_SESSION_COOKIE = "amoghaa_sid";

export function getAnalyticsSessionKey() {
  if (typeof document === "undefined") return "";
  const pattern = new RegExp(`(?:^|; )${ANALYTICS_SESSION_COOKIE}=([^;]*)`);
  const match = document.cookie.match(pattern);
  if (match?.[1]) return decodeURIComponent(match[1]);

  const key = crypto.randomUUID();
  const maxAge = 60 * 60 * 24 * 30;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ANALYTICS_SESSION_COOKIE}=${encodeURIComponent(key)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
  return key;
}
