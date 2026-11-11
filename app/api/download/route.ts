import { readFile } from "node:fs/promises";
import path from "node:path";
import { uploadDirectory } from "@/lib/server/uploads";

export const runtime = "nodejs";

function sanitizeFilename(name: string, fallback = "download.pdf"): string {
  const clean = name
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return clean || fallback;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url")?.trim();
  const requestedName = searchParams.get("name")?.trim();

  if (!targetUrl || targetUrl === "#" || targetUrl.startsWith("#enquire")) {
    return new Response("Invalid file URL", { status: 400 });
  }

  // Case 1: Remote HTTP/HTTPS URL (e.g. Vercel Blob)
  if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
    try {
      const upstream = await fetch(targetUrl);
      if (!upstream.ok) {
        return new Response("Failed to fetch remote file", { status: upstream.status });
      }

      const contentType = upstream.headers.get("content-type") || "application/octet-stream";
      const urlPathName = new URL(targetUrl).pathname.split("/").pop() || "download.pdf";
      const filename = sanitizeFilename(requestedName || urlPathName, "document.pdf");

      return new Response(upstream.body, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch (err) {
      console.error("Download proxy failed:", err);
      return new Response("Error fetching file", { status: 500 });
    }
  }

  // Case 2: Local relative file path (e.g. /uploads/file.pdf or /images/...)
  try {
    const cleanPath = targetUrl.replace(/^\/+/, "");
    const rootDir = process.cwd();
    let filePath = path.join(rootDir, "public", cleanPath);

    if (cleanPath.startsWith("uploads/")) {
      filePath = path.join(uploadDirectory(), cleanPath.replace(/^uploads\//, ""));
    }

    const buffer = await readFile(/* turbopackIgnore: true */ filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      ext === ".pdf"
        ? "application/pdf"
        : ext === ".webp"
          ? "image/webp"
          : ext === ".png"
            ? "image/png"
            : ext === ".jpg" || ext === ".jpeg"
              ? "image/jpeg"
              : "application/octet-stream";

    const defaultFilename = path.basename(filePath) || "download.pdf";
    const filename = sanitizeFilename(requestedName || defaultFilename, defaultFilename);

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Local file download failed:", err);
    return new Response("File not found", { status: 404 });
  }
}
