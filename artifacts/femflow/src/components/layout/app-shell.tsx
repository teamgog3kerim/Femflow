import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  TrendingUp,
  Lightbulb,
  BookOpen,
  MessageCircle,
  Crown,
  Settings as SettingsIcon,
  Shield,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/lib/translations";

interface TabItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, language, changeLanguage, isRtl } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const t = useTranslation(language);
  const nav = t.nav;

  const tabs: TabItem[] = [
    { href: "/home", icon: LayoutDashboard, label: nav.home },
    { href: "/cycle", icon: CalendarDays, label: nav.cycle },
    { href: "/log", icon: PlusCircle, label: nav.log },
    { href: "/insights", icon: TrendingUp, label: nav.insights },
    { href: "/tips", icon: Lightbulb, label: nav.tips },
    { href: "/education", icon: BookOpen, label: nav.education },
    { href: "/chat", icon: MessageCircle, label: nav.chat },
    { href: "/subscription", icon: Crown, label: nav.subscription },
    { href: "/settings", icon: SettingsIcon, label: nav.settings },
  ];

  if (user?.isAdmin) {
    tabs.push({ href: "/admin", icon: Shield, label: nav.admin });
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground transition-colors duration-300">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between px-5 py-3">
            <Link href="/home">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-9 h-9 rounded-2xl gradient-primary flex items-center justify-center text-white shadow-md shadow-primary/20">
                  <span className="font-serif font-bold text-lg leading-none">F</span>
                </div>
                <span className="font-serif font-bold text-xl text-gradient-primary">FemFlow</span>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="w-9 h-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value as "en" | "ar")}
                aria-label="Language"
                className="h-9 rounded-full bg-secondary text-secondary-foreground text-sm font-medium px-3 border-none outline-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-3">
            {tabs.map((tab) => {
              const isActive = location === tab.href;
              const Icon = tab.icon;
              return (
                <Link key={tab.href} href={tab.href}>
                  <button
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "gradient-primary text-white shadow-md shadow-primary/25"
                        : "bg-secondary text-secondary-foreground hover:opacity-80"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                </Link>
              );
            })}
          </nav>
        </header>

        <main className={isRtl ? "text-right" : ""}>{children}</main>
      </div>
    </div>
  );
}
