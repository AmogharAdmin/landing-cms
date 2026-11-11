import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { put } from "@vercel/blob";

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const MAX_UPLOAD_BODY_BYTES = 60 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "video/ogg",
];

const mimeExtensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "image/svg+xml": ".svg",
  "image/x-icon": ".ico",
  "image/vnd.microsoft.icon": ".ico",
  "application/pdf": ".pdf",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/ogg": ".ogg",
};

export function resolveMimeType(inputMime?: string, fileName?: string): string | null {
  const cleanMime = (inputMime || "").split(";")[0].trim().toLowerCase();
  if (mimeExtensions[cleanMime]) return cleanMime;
  const ext = path.extname(fileName || "").toLowerCase();
  for (const [mime, extension] of Object.entries(mimeExtensions)) {
    if (extension === ext) return mime;
  }
  return null;
}

function hasExpectedSignature(mime: string, buffer: Buffer) {
  if (mime === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === "image/gif") return ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"));
  if (mime === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (mime === "image/avif") return buffer.subarray(4, 12).toString("ascii").includes("ftypavif");
  if (mime === "image/svg+xml") {
    const head = buffer.subarray(0, 2048).toString("utf8").trimStart().toLowerCase();
    return head.startsWith("<?xml") || head.startsWith("<svg") || head.includes("<svg");
  }
  if (mime === "image/x-icon" || mime === "image/vnd.microsoft.icon") {
    // ICO: 00 00 01 00 — or PNG-in-ICO starting with PNG signature
    return (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00)
      || buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  if (mime === "application/pdf") {
    const head = buffer.subarray(0, 1024).toString("latin1");
    return head.includes("%PDF");
  }
  if (mime === "video/mp4") {
    // ISO BMFF: ....ftyp....
    return buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp";
  }
  if (mime === "video/webm" || mime === "video/ogg") {
    // EBML / Matroska for WebM, OggS for Ogg
    if (mime === "video/ogg") return buffer.subarray(0, 4).toString("ascii") === "OggS";
    return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
  }
  return false;
}

function mimeFromDataUrl(header: string, fileName?: string): string | null {
  const raw = header.split(";")[0]?.toLowerCase() || "";
  if (mimeExtensions[raw]) return raw;
  const extension = path.extname(fileName || "").toLowerCase();
  if (extension === ".pdf") return "application/pdf";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  if (extension === ".gif") return "image/gif";
  if (extension === ".avif") return "image/avif";
  if (extension === ".svg") return "image/svg+xml";
  if (extension === ".ico") return "image/x-icon";
  if (extension === ".mp4") return "video/mp4";
  if (extension === ".webm") return "video/webm";
  if (extension === ".ogg") return "video/ogg";
  return null;
}

export function parseUploadDataUrl(dataUrl: string, fileName?: string) {
  const match = dataUrl.match(/^data:([^,]*),([a-z0-9+/=\s]+)$/i);
  if (!match) return null;
  const meta = match[1].toLowerCase();
  if (!meta.includes("base64")) return null;
  const mime = mimeFromDataUrl(meta, fileName);
  if (!mime) return null;
  return { mime, buffer: Buffer.from(match[2].replace(/\s/g, ""), "base64") };
}

export function uploadDirectory() {
  const configured = process.env.UPLOAD_DIR?.trim();
  return configured
    ? path.resolve(configured)
    : path.join(process.cwd(), "public", "uploads");
}

/**
 * This project's Blob store was created with prefix "Blog_", so Vercel injects
 * Blog_STORE_ID (see Storage → amoghaa-blob → Quickstart). Token stays BLOB_*.
 */
function envTrim(name: string) {
  // Bracket access avoids any build-time empty inlining of missing env keys.
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export function blobStoreId() {
  return envTrim("Blog_STORE_ID") || envTrim("BLOB_STORE_ID");
}

export function blobReadWriteToken() {
  return envTrim("BLOB_READ_WRITE_TOKEN") || envTrim("Blog_READ_WRITE_TOKEN");
}

/** True when Vercel Blob credentials are available (token and/or store id). */
export function isBlobUploadConfigured() {
  return Boolean(blobReadWriteToken() || blobStoreId());
}

export function blobCredentialStatus() {
  return {
    hasStoreId: Boolean(blobStoreId()),
    hasToken: Boolean(blobReadWriteToken()),
    storeIdKey: envTrim("Blog_STORE_ID") ? "Blog_STORE_ID" : envTrim("BLOB_STORE_ID") ? "BLOB_STORE_ID" : null,
    tokenKey: envTrim("BLOB_READ_WRITE_TOKEN") ? "BLOB_READ_WRITE_TOKEN" : envTrim("Blog_READ_WRITE_TOKEN") ? "Blog_READ_WRITE_TOKEN" : null,
  };
}

function buildStoredName(fileName: string, mime: string) {
  const originalStem = path.parse(fileName || "file").name
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "file";
  return `${originalStem}-${Date.now()}-${randomBytes(5).toString("hex")}${mimeExtensions[mime]}`;
}

export async function saveUploadedFile(fileName: string, mime: string, buffer: Buffer) {
  if (!buffer.length || buffer.length > MAX_UPLOAD_BYTES || !hasExpectedSignature(mime, buffer)) {
    throw new Error("invalid-file");
  }

  const storedName = buildStoredName(fileName, mime);
  const storeId = blobStoreId();
  const token = blobReadWriteToken();

  if (storeId || token) {
    // Match Vercel quickstart for this store: pass storeId from Blog_STORE_ID.
    const blob = await put(`uploads/${storedName}`, buffer, {
      access: "public",
      contentType: mime,
      addRandomSuffix: false,
      ...(storeId ? { storeId } : {}),
      ...(token ? { token } : {}),
    });
    return blob.url;
  }

  const directory = uploadDirectory();
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, storedName), buffer, { flag: "wx" });

  const base = (process.env.UPLOAD_PUBLIC_PATH || "/uploads").replace(/\/$/, "");
  return `${base}/${storedName}`;
}
