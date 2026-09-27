import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  return process.env.OPENBOOKS_SECRET_ENCRYPTION_KEY || process.env.OWNER_PASSWORD || "openbooks-local";
}

export function signSession(userId: string) {
  const sig = createHmac("sha256", secret()).update(userId).digest("hex");
  return `${userId}.${sig}`;
}

export function readSession(token: string | undefined | null) {
  if (!token) return null;
  const splitAt = token.lastIndexOf(".");
  if (splitAt <= 0) return null;
  const userId = token.slice(0, splitAt);
  const sig = token.slice(splitAt + 1);
  const expected = createHmac("sha256", secret()).update(userId).digest("hex");
  const actualBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) return null;
  return userId;
}

export const SESSION_COOKIE = "ob_session";
