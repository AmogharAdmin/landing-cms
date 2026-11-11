import { createServer } from "node:http";
import { readFile, rename, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const contentPath = path.join(projectRoot, "data", "site.json");
const imageDirectory = path.join(projectRoot, "public", "images");
const uploadDirectory = path.join(projectRoot, "public", "uploads");
const port = Number(process.env.CONTENT_API_PORT || 3100);
const maxBodyBytes = 26 * 1024 * 1024;
const maxFileBytes = 20 * 1024 * 1024;

const mimeExtensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "application/pdf": ".pdf",
};

function headers(contentType = "application/json; charset=utf-8") {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
    "Content-Type": contentType,
  };
}

function respond(response, status, payload) {
  response.writeHead(status, headers());
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) throw new Error("Request is too large.");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function validateContent(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return ["site", "theme", "navigation", "hero", "about", "highlights", "amenities", "homes", "gallery", "location", "footer"].every((key) => key in value);
}

function mimeFromHeader(header, fileName) {
  const raw = String(header || "").split(";")[0].trim().toLowerCase();
  if (mimeExtensions[raw]) return raw;
  const extension = path.extname(fileName || "").toLowerCase();
  if (extension === ".pdf") return "application/pdf";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  if (extension === ".gif") return "image/gif";
  if (extension === ".avif") return "image/avif";
  return null;
}

function hasExpectedSignature(mime, buffer) {
  if (mime === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === "image/gif") return ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"));
  if (mime === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (mime === "image/avif") return buffer.subarray(4, 12).toString("ascii").includes("ftypavif");
  if (mime === "application/pdf") return buffer.subarray(0, 1024).toString("latin1").includes("%PDF");
  return false;
}

function safeFileName(input, extension) {
  const parsed = path.parse(input || "file");
  const stem = parsed.name.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-|-$/g, "") || "file";
  return `${stem}-${Date.now()}${extension}`;
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, headers());
    response.end();
    return;
  }

  try {
    if (request.url === "/content" && request.method === "GET") {
      const raw = await readFile(contentPath, "utf8");
      response.writeHead(200, headers());
      response.end(raw);
      return;
    }

    if (request.url === "/content" && request.method === "PUT") {
      const body = await readBody(request);
      const content = JSON.parse(body);
      if (!validateContent(content)) {
        respond(response, 400, { ok: false, error: "The JSON content is missing required site sections." });
        return;
      }
      const temporaryPath = `${contentPath}.tmp`;
      await writeFile(temporaryPath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
      await rename(temporaryPath, contentPath);
      respond(response, 200, { ok: true, savedAt: new Date().toISOString() });
      return;
    }

    if (request.url === "/upload" && request.method === "POST") {
      const body = JSON.parse(await readBody(request));
      const dataUrl = typeof body.dataUrl === "string" ? body.dataUrl : "";
      const match = dataUrl.match(/^data:([^,]*),([a-zA-Z0-9+/=\s]+)$/);
      if (!match || !String(match[1]).toLowerCase().includes("base64")) {
        respond(response, 400, { ok: false, error: "Invalid file upload." });
        return;
      }
      const mime = mimeFromHeader(match[1], body.name);
      const buffer = Buffer.from(String(match[2]).replace(/\s/g, ""), "base64");
      if (!mime || !buffer.length || buffer.length > maxFileBytes || !hasExpectedSignature(mime, buffer)) {
        respond(response, 400, { ok: false, error: "Unsupported file. Upload a JPG, PNG, WebP, GIF, AVIF, or PDF." });
        return;
      }
      const extension = mimeExtensions[mime];
      const fileName = safeFileName(body.name, extension);
      const isPdf = mime === "application/pdf";
      const directory = isPdf ? uploadDirectory : imageDirectory;
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, fileName), buffer);
      respond(response, 200, { ok: true, path: `${isPdf ? "/uploads" : "/images"}/${fileName}` });
      return;
    }

    respond(response, 404, { ok: false, error: "Not found." });
  } catch (error) {
    respond(response, 500, { ok: false, error: error instanceof Error ? error.message : "Unexpected server error." });
  }
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Local content API ready at http://127.0.0.1:${port}\n`);
});
