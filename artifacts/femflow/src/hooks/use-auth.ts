import { useEffect, useState } from 'react';
import { useAuthUser, useGetMe } from '@workspace/api-client-react';

export function useAuth() {
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');

  useEffect(() => {
    let tid = localStorage.getItem('femflow_telegram_id');
    if (!tid) {
      tid = 'tg_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('femflow_telegram_id', tid);
    }
    setTelegramId(tid);

    const lang = localStorage.getItem('femflow_language') as 'en' | 'ar';
    if (lang) setLanguage(lang);
  }, []);

  const authMutation = useAuthUser();
  const { data: user, isLoading: isUserLoading, refetch } = useGetMe({
    query: {
      enabled: !!localStorage.getItem('femflow_token'),
      retry: false,
    }
  });

  const login = async (firstName: string, lang: 'en' | 'ar' = 'en') => {
    if (!telegramId) return;
    const result = await authMutation.mutateAsync({
      data: {
        telegramId,
        firstName,
        language: lang
      }
    });
    // Persist the bearer token so subsequent API calls are authenticated
    if (result?.token) {
      localStorage.setItem('femflow_token', result.token);
    }
    localStorage.setItem('femflow_language', lang);
    setLanguage(lang);
    await refetch();
  };

  const logout = () => {
    localStorage.removeItem('femflow_telegram_id');
    localStorage.removeItem('femflow_token');
    window.location.reload();
  };

  const changeLanguage = (lang: 'en' | 'ar') => {
    setLanguage(lang);
    localStorage.setItem('femflow_language', lang);
  };

  return {
    user,
    isLoading: isUserLoading || authMutation.isPending,
    language,
    login,
    logout,
    changeLanguage,
    isAuthenticated: !!user,
    isRtl: language === 'ar'
  };
}
