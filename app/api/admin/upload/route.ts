import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getAuthenticatedAdmin } from "@/lib/server/auth";
import { hasValidMutationOrigin, jsonError } from "@/lib/server/security";
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BODY_BYTES,
  MAX_UPLOAD_BYTES,
  blobCredentialStatus,
  blobReadWriteToken,
  isBlobUploadConfigured,
  parseUploadDataUrl,
  resolveMimeType,
  saveUploadedFile,
} from "@/lib/server/uploads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasValidMutationOrigin(request)) return jsonError("Invalid request origin.", 403);
  if (!(await getAuthenticatedAdmin())) return jsonError("Authentication required.", 401);

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_UPLOAD_BODY_BYTES) return jsonError("File upload is too large (max 50MB).", 413);

  const contentType = request.headers.get("content-type") || "";

  // 1. Handle multipart/form-data upload
  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return jsonError("No file provided in form data.", 400);
      }
      const mime = resolveMimeType(file.type, file.name);
      if (!mime) {
        return jsonError("Unsupported file type. Upload JPG, PNG, WebP, GIF, SVG, ICO, PDF, MP4, or WebM.", 400);
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const publicPath = await saveUploadedFile(file.name, mime, buffer);
      return Response.json({ ok: true, path: publicPath });
    } catch (err) {
      if (err instanceof Error && err.message === "invalid-file") {
        return jsonError("Invalid file upload.", 400);
      }
      console.error("FormData file upload failed", err);
      return jsonError(err instanceof Error ? err.message : "Upload failed.", 500);
    }
  }

  // 2. Handle JSON request (Blob client token generation OR legacy base64 dataUrl)
  try {
    const body = (await request.json()) as Record<string, unknown>;

    // 2a. @vercel/blob client-side upload token request
    if (
      typeof body.type === "string" &&
      (body.type === "blob.generate-client-token" || body.type === "blob.upload-completed")
    ) {
      try {
        const jsonResponse = await handleUpload({
          body: body as unknown as HandleUploadBody,
          request,
          token: blobReadWriteToken() || undefined,
          onBeforeGenerateToken: async () => {
            return {
              allowedContentTypes: ALLOWED_MIME_TYPES,
              maximumSizeInBytes: MAX_UPLOAD_BYTES,
              addRandomSuffix: true,
            };
          },
          onUploadCompleted: async () => {},
        });
        return Response.json(jsonResponse);
      } catch (blobError) {
        console.error("Blob handleUpload failed:", blobError);
        return jsonError(
          blobError instanceof Error ? blobError.message : "Failed to generate Blob upload token.",
          400,
        );
      }
    }

    // 2b. Base64 payload fallback
    const parsed = typeof body.dataUrl === "string"
      ? parseUploadDataUrl(body.dataUrl, typeof body.name === "string" ? body.name : undefined)
      : null;
    if (!parsed) return jsonError("Unsupported file. Upload a JPG, PNG, WebP, GIF, AVIF, SVG, ICO, or PDF.", 400);

    const publicPath = await saveUploadedFile(
      typeof body.name === "string" ? body.name : "file",
      parsed.mime,
      parsed.buffer,
    );
    return Response.json({ ok: true, path: publicPath });
  } catch (error) {
    if (error instanceof Error && error.message === "invalid-file") {
      return jsonError("Invalid file upload.", 400);
    }
    console.error("Production file upload failed", error);
    const status = blobCredentialStatus();
    if (!isBlobUploadConfigured()) {
      return jsonError(
        "Blob storage is not configured in this environment. Copy Blog_STORE_ID and BLOB_READ_WRITE_TOKEN from Vercel Storage → amoghaa-blob → .env.local into .env (local) or ensure they exist on Production, then restart/redeploy.",
        500,
      );
    }
    return jsonError(
      `Unable to upload to Vercel Blob (using ${status.storeIdKey || "no store id"} + ${status.tokenKey || "no token"}). Check the token and redeploy.`,
      500,
    );
  }
}
