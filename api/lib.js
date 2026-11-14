import { put, list, del } from "@vercel/blob";
import crypto from "node:crypto";

const MANIFEST_PATH = "vortex-config/manifest.json";
const COOKIE_NAME = "vortex_admin_session";
const SESSION_SECONDS = 60 * 60 * 24;

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}

export function errorMessage(error) {
  return error instanceof Error
    ? error.message
    : "Terjadi kesalahan server.";
}

export async function readManifest() {
  const { blobs } = await list({
    prefix: MANIFEST_PATH,
    limit: 10
  });

  const manifest = blobs.find(
    blob => blob.pathname === MANIFEST_PATH
  );

  if (!manifest) return [];

  const response = await fetch(manifest.url, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Gagal membaca data config.");
  }

  const data = await response.json();

  return Array.isArray(data) ? data : [];
}

export async function writeManifest(items) {
  await put(
    MANIFEST_PATH,
    JSON.stringify(items),
    {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true
    }
  );
}

export async function saveBlob(pathname, body, contentType) {
  return await put(
    pathname,
    body,
    {
      access: "public",
      contentType,
      addRandomSuffix: true
    }
  );
}

export async function deleteBlob(url) {
  if (url) {
    await del(url);
  }
}

function secret() {
  const value = process.env.SESSION_SECRET;

  if (!value) {
    throw new Error("SESSION_SECRET belum diatur.");
  }

  return value;
}

function sign(value) {
  return crypto
    .createHmac("sha256", secret())
    .update(value)
    .digest("base64url");
}

export function createSessionToken() {
  const payload = Buffer.from(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS
    })
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token) {
  if (!token || !token.includes(".")) {
    return false;
  }

  try {
    const [payload, signature] = token.split(".");
    const expected = sign(payload);

    const a = Buffer.from(signature);
    const b = Buffer.from(expected);

    if (
      a.length !== b.length ||
      !crypto.timingSafeEqual(a, b)
    ) {
      return false;
    }

    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    );

    return Number(data.exp) > Math.floor(Date.now() / 1000);

  } catch {
    return false;
  }
}

export function isAdmin(request) {
  const cookie = request.headers.get("cookie") || "";

  const token = cookie
    .split(";")
    .map(value => value.trim())
    .find(value => value.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);

  return verifySessionToken(token);
}

export function sessionCookie(token) {
  return [
    `${COOKIE_NAME}=${token}`,
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${SESSION_SECONDS}`
  ].join("; ");
}

export function clearSessionCookie() {
  return [
    `${COOKIE_NAME}=`,
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Path=/",
    "Max-Age=0"
  ].join("; ");
}

export function cleanFileName(name) {
  return String(name || "config.bin")
    .split(/[\\/]/)
    .pop()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .trim()
    .slice(0, 180) || "config.bin";
}
