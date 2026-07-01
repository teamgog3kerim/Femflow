import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { isLoading, login, isAuthenticated, language, changeLanguage } = useAuth();
  const t = useTranslation(language).onboarding;

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/home");
    }
  }, [isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleStart = async () => {
    // We pass a mock first name for demo purposes
    await login("Beautiful", language);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-secondary/30 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-sm text-center"
      >
        <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-tr from-primary to-primary/50 rounded-3xl rotate-12 flex items-center justify-center shadow-xl shadow-primary/20">
          <div className="w-12 h-12 bg-white rounded-full -rotate-12 flex items-center justify-center">
            <span className="text-primary font-serif font-bold text-xl">F</span>
          </div>
        </div>

        <h1 className="text-3xl font-serif font-bold text-foreground mb-3">{t.welcome}</h1>
        <p className="text-muted-foreground mb-10">{t.subtitle}</p>

        <Card className="p-6 bg-card/80 backdrop-blur border-card-border shadow-lg space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">{t.language}</p>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant={language === 'en' ? 'default' : 'outline'} 
                className="w-full rounded-2xl"
                onClick={() => changeLanguage('en')}
              >
                English
              </Button>
              <Button 
                variant={language === 'ar' ? 'default' : 'outline'} 
                className="w-full rounded-2xl font-arabic"
                onClick={() => changeLanguage('ar')}
              >
                العربية
              </Button>
            </div>
          </div>

          <Button 
            className="w-full rounded-2xl h-12 text-lg shadow-md shadow-primary/20" 
            onClick={handleStart}
          >
            {t.start}
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}