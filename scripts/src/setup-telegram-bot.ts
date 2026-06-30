/**
 * Configures the FemFlow Telegram bot (@myfemflowbot) to launch the Mini App.
 *
 * - Sets the chat menu button to open the web app.
 * - Sets the bot's short description and commands.
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run setup-telegram-bot
 *
 * Requires TELEGRAM_BOT_TOKEN in the environment. The Mini App URL is derived
 * from REPLIT_DOMAINS (production/published domain) unless WEB_APP_URL is set.
 */

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is not set. Aborting.");
  process.exit(1);
}

const explicitUrl = process.env.WEB_APP_URL;
const domain = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
const webAppUrl = explicitUrl ?? (domain ? `https://${domain}/` : undefined);

if (!webAppUrl) {
  console.error(
    "Could not determine the Mini App URL. Set WEB_APP_URL or REPLIT_DOMAINS.",
  );
  process.exit(1);
}

const api = (method: string) => `https://api.telegram.org/bot${token}/${method}`;

async function call(method: string, body: unknown): Promise<unknown> {
  const res = await fetch(api(method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { ok: boolean; description?: string };
  if (!json.ok) {
    throw new Error(`${method} failed: ${json.description ?? "unknown error"}`);
  }
  return json;
}

async function main(): Promise<void> {
  const me = (await call("getMe", {})) as { result: { username: string } };
  console.log(`Configuring bot @${me.result.username}`);
  console.log(`Mini App URL: ${webAppUrl}`);

  await call("setChatMenuButton", {
    menu_button: {
      type: "web_app",
      text: "Open FemFlow",
      web_app: { url: webAppUrl },
    },
  });
  console.log("✓ Menu button set to open the Mini App.");

  await call("setMyShortDescription", {
    short_description:
      "FemFlow — your AI companion for menstrual health, cycle tracking & daily wellness.",
  });
  console.log("✓ Short description set.");

  await call("setMyCommands", {
    commands: [
      { command: "start", description: "Open FemFlow" },
      { command: "help", description: "How to use FemFlow" },
    ],
  });
  console.log("✓ Commands set.");

  console.log("\nDone. Open @" + me.result.username + " in Telegram and tap the menu button.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
