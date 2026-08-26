/**
 * Brick / Nova — upload-job-receipt
 *
 * Brick cannot use the official Supabase MCP storage tools, and must NEVER be
 * given SUPABASE_SERVICE_ROLE_KEY. Call this function instead, then write the
 * returned object onto the payment in project JSON.
 *
 * POST https://hkvlvbalojjirzlojvfi.supabase.co/functions/v1/upload-job-receipt
 * Header:  x-upload-secret: <RECEIPT_UPLOAD_SECRET>   (Dashboard secret; not in git)
 * Body:    JSON { projectId, taskId, paymentId, filename, fileBase64, mime? }
 *          fileBase64 = raw base64 or a data: URL. mime is optional (from filename).
 *
 * Storage path (same as src/supabase.js uploadPaymentAttachment):
 *   job-receipts / {projectId}/{taskId}/{paymentId}/{sanitizedName_unique.ext}
 *   upsert: false. Filename is sanitized + unique-suffixed like the app.
 *
 * Response 200: { id, path, name, mime }
 *   Persist THAT object on payment.attachments. NEVER persist a signed URL.
 *
 * Then (Brick/Nova): load projects row by projectId, find
 *   data.phases[].tasks[].payments[] where payment.id === paymentId,
 *   append the response object to payment.attachments (create array if needed),
 *   upsert projects.data. The Directory / in-app uploader already read this shape.
 *
 * verify_jwt is false (config.toml). Auth is the shared secret header only.
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const BUCKET = "job-receipts";
const MAX_BYTES = 10 * 1024 * 1024;
const SECRET_NAME = "RECEIPT_UPLOAD_SECRET";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-upload-secret, apikey",
};

const uid = () => Math.random().toString(36).slice(2, 9);

/** Strip path separators and unsafe characters — keep in sync with src/supabase.js */
const sanitizeFilename = (name: string) => {
  const base = String(name || "receipt").split(/[/\\]/).pop() || "receipt";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^\.+/, "");
  return cleaned || "receipt";
};

const uniqueStoredName = (originalName: string, mime: string) => {
  const safe = sanitizeFilename(originalName);
  const unique = crypto.randomUUID();
  const dot = safe.lastIndexOf(".");
  if (dot > 0) return `${safe.slice(0, dot)}_${unique}${safe.slice(dot)}`;
  const ext = mime === "application/pdf"
    ? ".pdf"
    : mime === "image/jpeg"
    ? ".jpg"
    : mime === "image/png"
    ? ".png"
    : mime === "image/webp"
    ? ".webp"
    : mime === "image/heic"
    ? ".heic"
    : mime === "image/heif"
    ? ".heif"
    : "";
  return `${safe}_${unique}${ext}`;
};

const mimeFromName = (name: string) => {
  const n = String(name || "").toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".heic")) return "image/heic";
  if (n.endsWith(".heif")) return "image/heif";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function requireId(value: unknown, field: string): string {
  const s = String(value ?? "").trim();
  if (!s) throw Object.assign(new Error(`missing ${field}`), { status: 400 });
  if (/[/\\]/.test(s) || s.includes("..")) {
    throw Object.assign(new Error(`invalid ${field}`), { status: 400 });
  }
  return s;
}

function decodeBase64(raw: string): Uint8Array {
  let s = String(raw || "").trim();
  const dataUrl = s.match(/^data:([^;]+);base64,(.+)$/s);
  if (dataUrl) s = dataUrl[2];
  s = s.replace(/\s+/g, "");
  if (!s) throw Object.assign(new Error("empty file"), { status: 400 });
  try {
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    throw Object.assign(new Error("invalid fileBase64"), { status: 400 });
  }
}

function secretsMatch(provided: string, expected: string): boolean {
  if (!expected || provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { error: "method not allowed; use POST" });
  }

  const expected = Deno.env.get(SECRET_NAME) ?? "";
  if (!expected) {
    return json(500, { error: `${SECRET_NAME} is not configured` });
  }
  const provided = req.headers.get("x-upload-secret") ?? "";
  if (!secretsMatch(provided, expected)) {
    return json(401, { error: `unauthorized: x-upload-secret does not match ${SECRET_NAME}` });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json(400, { error: "expected JSON body with projectId, taskId, paymentId, filename, fileBase64" });
    }

    const projectId = requireId((body as Record<string, unknown>).projectId, "projectId");
    const taskId = requireId((body as Record<string, unknown>).taskId, "taskId");
    const paymentId = requireId((body as Record<string, unknown>).paymentId, "paymentId");

    const filename = String(
      (body as Record<string, unknown>).filename ??
        (body as Record<string, unknown>).name ??
        "receipt",
    );
    const fileBase64 = String(
      (body as Record<string, unknown>).fileBase64 ??
        (body as Record<string, unknown>).file ??
        "",
    );
    const mimeHint = String((body as Record<string, unknown>).mime ?? "").trim();
    const dataUrlMime = String(fileBase64).match(/^data:([^;]+);base64,/i)?.[1] ?? "";
    const mime = mimeHint || dataUrlMime || mimeFromName(filename);

    const bytes = decodeBase64(fileBase64);
    if (!bytes.byteLength) return json(400, { error: "empty file" });
    if (bytes.byteLength > MAX_BYTES) {
      return json(413, { error: "file is over 10MB" });
    }

    const stored = uniqueStoredName(filename, mime);
    const path = `${projectId}/${taskId}/${paymentId}/${stored}`;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) {
      return json(500, { error: "function is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: mime,
      upsert: false,
    });
    if (error) {
      console.error("upload-job-receipt storage error:", error.message);
      return json(500, { error: error.message || "storage upload failed" });
    }

    // App attachment object — name is the original filename, not the stored unique name.
    return json(200, { id: uid(), path, name: filename || "receipt", mime });
  } catch (e) {
    const status = typeof (e as { status?: number })?.status === "number"
      ? (e as { status: number }).status
      : 500;
    const message = e instanceof Error ? e.message : String(e);
    if (status >= 500) console.error("upload-job-receipt error:", message);
    return json(status, { error: message });
  }
});
