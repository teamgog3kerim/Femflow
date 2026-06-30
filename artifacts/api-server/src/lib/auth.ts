import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET;
if (!SECRET) {
  throw new Error(
    "SESSION_SECRET is not set. Refusing to start: a strong SESSION_SECRET is required to sign auth tokens.",
  );
}

// Tokens are valid for 30 days.
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function sign(userId: number): string {
  const now = Date.now();
  const payload = Buffer.from(
    JSON.stringify({ userId, iat: now, exp: now + TOKEN_TTL_MS }),
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET!).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verify(token: string): number | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;

    const expected = crypto.createHmac("sha256", SECRET!).update(payload).digest("base64url");
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data.userId !== "number") return null;
    // Reject tokens without expiry or that have expired.
    if (typeof data.exp !== "number" || Date.now() > data.exp) return null;
    return data.userId;
  } catch {
    return null;
  }
}
