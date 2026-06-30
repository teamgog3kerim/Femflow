import crypto from "node:crypto";

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

/**
 * Validate Telegram Mini App initData using the bot token.
 * See https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 * Returns the parsed Telegram user when the signature is valid, otherwise null.
 */
export function validateInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 86400,
): TelegramUser | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;
    params.delete("hash");

    const dataCheckString = [...params.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join("\n");

    const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
    const computed = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

    const valid =
      computed.length === hash.length &&
      crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(hash, "hex"));
    if (!valid) return null;

    // Reject stale payloads to prevent replay.
    const authDate = Number(params.get("auth_date"));
    if (authDate && maxAgeSeconds > 0) {
      const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
      if (ageSeconds > maxAgeSeconds) return null;
    }

    const userJson = params.get("user");
    if (!userJson) return null;
    return JSON.parse(userJson) as TelegramUser;
  } catch {
    return null;
  }
}
