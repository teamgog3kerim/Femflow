import { useEffect, useState } from 'react';
import { useAuthUser, useTelegramAuth, useGetMe, getGetMeQueryKey } from '@workspace/api-client-react';
import { getTelegramWebApp } from '@/lib/telegram';
import { useLanguage } from '@/hooks/use-language';

export function useAuth() {
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const { language, changeLanguage, isRtl } = useLanguage();

  useEffect(() => {
    const wa = getTelegramWebApp();
    if (wa) {
      wa.ready();
      wa.expand();
    }

    let tid = localStorage.getItem('femflow_telegram_id');
    if (!tid) {
      tid = 'tg_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('femflow_telegram_id', tid);
    }
    setTelegramId(tid);
  }, []);

  const authMutation = useAuthUser();
  const telegramAuthMutation = useTelegramAuth();
  const { data: user, isLoading: isUserLoading, refetch } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!localStorage.getItem('femflow_token'),
      retry: false,
    }
  });

  const persist = (token: string | undefined, lang: 'en' | 'ar') => {
    if (token) localStorage.setItem('femflow_token', token);
    changeLanguage(lang);
  };

  const login = async (firstName: string, lang: 'en' | 'ar' = 'en') => {
    const wa = getTelegramWebApp();
    // Real Telegram Mini App users authenticate via signed initData.
    if (wa) {
      const result = await telegramAuthMutation.mutateAsync({
        data: { initData: wa.initData, language: lang },
      });
      persist(result?.token, lang);
      await refetch();
      return;
    }

    // Browser / dev fallback: anonymous Telegram-style id.
    if (!telegramId) return;
    const result = await authMutation.mutateAsync({
      data: { telegramId, firstName, language: lang },
    });
    persist(result?.token, lang);
    await refetch();
  };

  const logout = () => {
    localStorage.removeItem('femflow_telegram_id');
    localStorage.removeItem('femflow_token');
    window.location.reload();
  };

  return {
    user,
    isLoading: isUserLoading || authMutation.isPending || telegramAuthMutation.isPending,
    language,
    login,
    logout,
    changeLanguage,
    isAuthenticated: !!user,
    isRtl
  };
}
