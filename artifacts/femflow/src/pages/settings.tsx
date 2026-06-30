import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/translations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const { user, language, changeLanguage, logout } = useAuth();
  const t = useTranslation(language).settings;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-serif font-bold text-foreground">{t.title}</h1>
      
      <Card className="p-4 space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">{t.language}</p>
          <div className="flex gap-2">
            <Button variant={language === 'en' ? 'default' : 'outline'} onClick={() => changeLanguage('en')}>English</Button>
            <Button variant={language === 'ar' ? 'default' : 'outline'} onClick={() => changeLanguage('ar')} className="font-arabic">العربية</Button>
          </div>
        </div>
      </Card>

      <Button variant="destructive" className="w-full" onClick={logout}>
        Log Out
      </Button>
    </div>
  );
}