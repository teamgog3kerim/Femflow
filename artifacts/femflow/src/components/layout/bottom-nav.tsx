import { Link, useLocation } from "wouter";
import { Home, Calendar, PlusCircle, MessageCircle, BookOpen, Settings, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/translations";

export function BottomNav() {
  const [location] = useLocation();
  const { user, language, isRtl } = useAuth();
  const t = useTranslation(language).nav;

  if (!user) return null;

  const items = [
    { href: "/home", icon: Home, label: t.home },
    { href: "/cycle", icon: Calendar, label: t.cycle },
    { href: "/log", icon: PlusCircle, label: t.log, primary: true },
    { href: "/chat", icon: MessageCircle, label: t.chat },
    { href: "/education", icon: BookOpen, label: t.education },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border z-50 px-2 pb-safe">
      <div className={`flex items-center justify-around h-16 ${isRtl ? 'flex-row-reverse' : ''}`}>
        {items.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;

          if (item.primary) {
            return (
              <Link key={item.href} href={item.href}>
                <div className="flex flex-col items-center justify-center -mt-6">
                  <div className="bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover-elevate transition-transform active:scale-95">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] mt-1 font-medium text-primary">{item.label}</span>
                </div>
              </Link>
            );
          }

          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center justify-center w-14 h-full transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'fill-primary/20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}