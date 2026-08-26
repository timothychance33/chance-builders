// Local checks that Brick's upload helpers stay aligned with src/supabase.js.
// Run: node supabase/functions/upload-job-receipt/helpers.test.mjs

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const fnSrc = readFileSync(join(here, "index.ts"), "utf8");
const appSrc = readFileSync(join(here, "../../../src/supabase.js"), "utf8");

const sanitizeFilename = (name) => {
  const base = String(name || "receipt").split(/[/\\]/).pop() || "receipt";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^\.+/, "");
  return cleaned || "receipt";
};

const cases = [
  ["receipt.jpg", "receipt.jpg"],
  ["Home Depot #42.JPG", "Home_Depot_42.JPG"],
  ["../../etc/passwd", "passwd"],
  ["C:\\invoices\\foo bar.pdf", "foo_bar.pdf"],
  ["...hidden", "hidden"],
  ["", "receipt"],
  [null, "receipt"],
];

for (const [input, expected] of cases) {
  assert.equal(sanitizeFilename(input), expected, `sanitize(${JSON.stringify(input)})`);
}

assert.ok(appSrc.includes("[^a-zA-Z0-9._-]+"), "app sanitizes filenames");
assert.ok(fnSrc.includes("[^a-zA-Z0-9._-]+"), "function sanitizes filenames");
assert.ok(fnSrc.includes("job-receipts"));
assert.ok(fnSrc.includes("upsert: false"));
assert.ok(fnSrc.includes("x-upload-secret"));
assert.ok(fnSrc.includes("RECEIPT_UPLOAD_SECRET"));
assert.ok(fnSrc.includes("{ id, path, name, mime }"));
assert.ok(fnSrc.includes("payment.attachments"));
assert.ok(!fnSrc.includes("createSignedUrl"));
assert.ok(appSrc.includes("return { id: uid(), path, name, mime }"));

function requireId(value, field) {
  const s = String(value ?? "").trim();
  if (!s) throw new Error(`missing ${field}`);
  if (/[/\\]/.test(s) || s.includes("..")) throw new Error(`invalid ${field}`);
  return s;
}
assert.throws(() => requireId("", "projectId"), /missing projectId/);
assert.throws(() => requireId("../x", "taskId"), /invalid taskId/);
assert.equal(requireId(" abc ", "paymentId"), "abc");

function decodeBase64(raw) {
  let s = String(raw || "").trim();
  const dataUrl = s.match(/^data:([^;]+);base64,(.+)$/s);
  if (dataUrl) s = dataUrl[2];
  s = s.replace(/\s+/g, "");
  if (!s) throw new Error("empty file");
  const bin = Buffer.from(s, "base64");
  if (!bin.byteLength) throw new Error("empty file");
  return bin;
}
assert.equal(decodeBase64("aGVsbG8=").toString(), "hello");
assert.equal(decodeBase64("data:image/jpeg;base64,aGVsbG8=").toString(), "hello");
assert.throws(() => decodeBase64(""), /empty file/);

function secretsMatch(provided, expected) {
  if (!expected || provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
assert.equal(secretsMatch("abc", "abc"), true);
assert.equal(secretsMatch("abd", "abc"), false);
assert.equal(secretsMatch("", "abc"), false);
assert.equal(secretsMatch("abc", ""), false);

console.log("upload-job-receipt helper checks passed");
