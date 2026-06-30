import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET ?? "femflow-dev-secret";

export function sign(userId: number): string {
  const payload = Buffer.from(JSON.stringify({ userId, iat: Date.now() })).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verify(token: string): number | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
    if (expected !== sig) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof data.userId === "number" ? data.userId : null;
  } catch {
    return null;
  }
}
