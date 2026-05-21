import type { JwtPayload } from "./types";

function base64UrlDecodeUtf8(b64url: string): string {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof atob === "function") {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }
  return Buffer.from(b64, "base64").toString("utf8");
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = base64UrlDecodeUtf8(payload);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string): boolean {
  const decoded = decodeJwt(token);
  if (!decoded?.exp) return false;
  return decoded.exp * 1000 < Date.now();
}
