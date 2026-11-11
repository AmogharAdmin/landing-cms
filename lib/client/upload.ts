import { upload } from "@vercel/blob/client";

/**
 * Uploads a file asset from the browser.
 * 1. For /api/admin/upload, it attempts client-side direct upload via @vercel/blob/client.
 *    This avoids Vercel's 4.5MB Serverless function request body limit, allowing large PDFs/images.
 * 2. If client-side token generation fails (e.g. local development or custom endpoint),
 *    it seamlessly falls back to multipart FormData upload.
 * 3. Handles non-JSON server responses gracefully without syntax errors.
 */
export async function uploadFileAsset(file: File, uploadEndpoint: string): Promise<string> {
  const isVercelUpload = uploadEndpoint === "/api/admin/upload" || uploadEndpoint.endsWith("/api/admin/upload");

  if (isVercelUpload) {
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: uploadEndpoint,
      });
      if (blob?.url) {
        return blob.url;
      }
    } catch (blobError) {
      // If client token generation fails (e.g. Blob not configured in local dev),
      // log warning and proceed to standard FormData fallback.
      console.warn("Direct blob upload fallback:", blobError);
    }
  }

  // Fallback: multipart FormData upload
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", file.name);

  const response = await fetch(uploadEndpoint, {
    method: "POST",
    credentials: "same-origin",
    body: formData,
  });

  let result: { ok?: boolean; path?: string; error?: string } = {};
  try {
    result = (await response.json()) as { ok?: boolean; path?: string; error?: string };
  } catch {
    if (response.status === 413) {
      throw new Error("File is too large for server upload (max 50MB). Please select a smaller file.");
    }
    throw new Error(`Upload failed (server error ${response.status}).`);
  }

  if (!response.ok || !result.ok || !result.path) {
    throw new Error(result.error || "Upload failed.");
  }

  return result.path;
}
