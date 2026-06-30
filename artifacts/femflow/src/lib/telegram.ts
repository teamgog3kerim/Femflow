interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: {
    user?: { id: number; first_name?: string; last_name?: string; username?: string; language_code?: string };
  };
  ready: () => void;
  expand: () => void;
  colorScheme?: string;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  const wa = window.Telegram?.WebApp;
  // initData is only populated when actually launched from within Telegram.
  if (wa && typeof wa.initData === "string" && wa.initData.length > 0) return wa;
  return null;
}

export function isTelegram(): boolean {
  return getTelegramWebApp() !== null;
}
