/** Turn a normal Google Maps link into an iframe-friendly embed URL. */
export function toMapEmbedUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/output=embed/i.test(value) || /\/maps\/embed/i.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return value;
  }

  const host = url.hostname.replace(/^www\./, "");
  const isGoogle = host === "google.com" || host.endsWith(".google.com") || host === "maps.google.com" || host.endsWith("goo.gl");
  if (!isGoogle) return value;

  const at = url.href.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  const zoomMatch = url.href.match(/@-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?,(\d+(?:\.\d+)?)z/);
  const zoom = zoomMatch ? String(Math.min(20, Math.max(1, Math.round(Number(zoomMatch[1]))))) : "15";
  if (at) {
    return `https://maps.google.com/maps?q=${at[1]},${at[2]}&z=${zoom}&output=embed`;
  }

  const query = url.searchParams.get("q") || url.searchParams.get("query");
  if (query) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed`;
  }

  const place = decodeURIComponent(url.pathname.match(/\/maps\/place\/([^/]+)/)?.[1] || "").replace(/\+/g, " ").trim();
  if (place) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(place)}&z=${zoom}&output=embed`;
  }

  return value;
}
