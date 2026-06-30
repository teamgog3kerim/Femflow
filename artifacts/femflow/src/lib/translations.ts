export const translations = {
  en: {
    nav: {
      home: "Home",
      cycle: "Cycle",
      log: "Log",
      chat: "Chat",
      education: "Learn",
      admin: "Admin",
      settings: "Settings",
      subscription: "Premium"
    },
    onboarding: {
      welcome: "Welcome to FemFlow",
      subtitle: "Your personal menstrual health companion.",
      start: "Get Started",
      language: "Select Language"
    },
    home: {
      greeting: "Hello, ",
      cycleDay: "Cycle Day",
      phase: "Phase",
      wellnessScore: "Wellness Score",
      logToday: "Log Today's Health",
      nextPeriod: "Next period in",
      days: "days",
      aiTip: "AI Tip of the Day",
      recentActivity: "Recent Notifications"
    },
    log: {
      title: "Daily Log",
      symptoms: "Symptoms",
      mood: "Mood",
      pain: "Pain Level",
      energy: "Energy",
      sleep: "Sleep (hrs)",
      water: "Water (L)",
      save: "Save Log",
      success: "Log saved successfully"
    },
    chat: {
      title: "Health Companion",
      placeholder: "Ask me anything...",
      send: "Send"
    },
    settings: {
      title: "Settings",
      language: "Language",
      notifications: "Notifications",
      timezone: "Timezone",
      save: "Save Changes"
    }
  },
  ar: {
    nav: {
      home: "الرئيسية",
      cycle: "الدورة",
      log: "سجل",
      chat: "محادثة",
      education: "تعلم",
      admin: "إدارة",
      settings: "الإعدادات",
      subscription: "بريميوم"
    },
    onboarding: {
      welcome: "مرحباً بك في FemFlow",
      subtitle: "رفيقك الشخصي لصحة الدورة الشهرية.",
      start: "البدء",
      language: "اختر اللغة"
    },
    home: {
      greeting: "مرحباً، ",
      cycleDay: "يوم الدورة",
      phase: "المرحلة",
      wellnessScore: "مؤشر الصحة",
      logToday: "سجل صحتك اليوم",
      nextPeriod: "الدورة القادمة في",
      days: "أيام",
      aiTip: "نصيحة اليوم",
      recentActivity: "الإشعارات الأخيرة"
    },
    log: {
      title: "السجل اليومي",
      symptoms: "الأعراض",
      mood: "المزاج",
      pain: "مستوى الألم",
      energy: "الطاقة",
      sleep: "النوم (ساعات)",
      water: "الماء (لتر)",
      save: "حفظ السجل",
      success: "تم الحفظ بنجاح"
    },
    chat: {
      title: "الرفيق الصحي",
      placeholder: "اسألني أي شيء...",
      send: "إرسال"
    },
    settings: {
      title: "الإعدادات",
      language: "اللغة",
      notifications: "الإشعارات",
      timezone: "المنطقة الزمنية",
      save: "حفظ التغييرات"
    }
  }
};

export type Language = 'en' | 'ar';
export const useTranslation = (lang: Language) => {
  return translations[lang] || translations.en;
};