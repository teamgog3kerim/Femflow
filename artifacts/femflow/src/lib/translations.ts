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
    },
    sub: {
      title: "Premium",
      planName: "Premium Plan",
      price: "990 ETB / 3 months",
      freeTrial: "Free Trial",
      trialActive: "Your 6-day free trial is active.",
      trialDaysLeft: "days left in your free trial",
      trialEndsToday: "Your free trial ends today.",
      expiringSoon: "Your subscription expires soon — renew to keep full access.",
      premiumActive: "Your premium subscription is active!",
      premiumDaysLeft: "days left",
      expired: "Your access has expired. Subscribe to continue.",
      pending: "Your payment is pending approval.",
      cbeAccount: "CBE Bank Account",
      howTo: "Transfer 990 ETB to the account above, then submit your receipt details below.",
      uploadDetails: "Payment Receipt Details",
      senderName: "Sender Name",
      transferDate: "Transfer Date",
      submit: "Submit Payment",
      renew: "Renew Now",
      submitted: "Receipt submitted successfully"
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
    },
    sub: {
      title: "بريميوم",
      planName: "الخطة المميزة",
      price: "990 بر / 3 أشهر",
      freeTrial: "تجربة مجانية",
      trialActive: "فترتك التجريبية المجانية لمدة 6 أيام نشطة.",
      trialDaysLeft: "أيام متبقية في فترتك التجريبية",
      trialEndsToday: "تنتهي فترتك التجريبية اليوم.",
      expiringSoon: "اشتراكك على وشك الانتهاء — جددي للحفاظ على الوصول الكامل.",
      premiumActive: "اشتراكك المميز نشط!",
      premiumDaysLeft: "أيام متبقية",
      expired: "انتهت صلاحية وصولك. اشتركي للمتابعة.",
      pending: "دفعتك قيد المراجعة.",
      cbeAccount: "حساب بنك CBE",
      howTo: "حوّلي 990 بر إلى الحساب أعلاه، ثم أرسلي تفاصيل الإيصال أدناه.",
      uploadDetails: "تفاصيل إيصال الدفع",
      senderName: "اسم المُرسِل",
      transferDate: "تاريخ التحويل",
      submit: "إرسال الدفع",
      renew: "جددي الآن",
      submitted: "تم إرسال الإيصال بنجاح"
    }
  }
};

export type Language = 'en' | 'ar';
export const useTranslation = (lang: Language) => {
  return translations[lang] || translations.en;
};