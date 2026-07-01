import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  TrendingUp,
  Lightbulb,
  BookOpen,
  MessageCircle,
  Settings as SettingsIcon,
  Shield,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/lib/translations";
import { DancingLady } from "@/components/dancing-lady";

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
    { href: "/insights", icon: TrendingUp, label: nav.insights },
    { href: "/log", icon: PlusCircle, label: nav.log },
    { href: "/tips", icon: Lightbulb, label: nav.tips },
    { href: "/education", icon: BookOpen, label: nav.education },
    { href: "/chat", icon: MessageCircle, label: nav.chat },
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
                  <DancingLady />
                </div>
                <span className="font-serif font-bold text-xl text-gradient-primary">FemFlow</span>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <motion.button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="w-9 h-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={theme}
                    initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center"
                  >
                    {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value as "en" | "ar")}
                aria-label="Language"
                className="h-9 rounded-full bg-secondary text-secondary-foreground text-sm font-medium px-3 border-none outline-none cursor-pointer transition-colors hover:bg-secondary/70"
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
              <Link href="/settings">
                <motion.button
                  aria-label={nav.settings}
                  title={nav.settings}
                  whileHover={{ scale: 1.08, rotate: 45 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    location === "/settings"
                      ? "gradient-primary text-white shadow-md shadow-primary/25"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <SettingsIcon className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          </div>
        </header>

        <main className={`pb-20 ${isRtl ? "text-right" : ""}`}>{children}</main>

        {/* Bottom tab bar */}
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-background/90 backdrop-blur-lg border-t border-border">
          <div className="mx-auto max-w-lg flex items-center justify-between gap-1 px-2 py-2">
            {tabs.map((tab) => {
              const isActive = location === tab.href;
              const Icon = tab.icon;
              return (
                <Link key={tab.href} href={tab.href}>
                  <motion.button
                    aria-label={tab.label}
                    title={tab.label}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.85 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className={`relative flex h-11 w-11 items-center justify-center rounded-2xl ${
                      isActive ? "text-white" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="activeTab"
                        transition={{ type: "spring", stiffness: 500, damping: 32 }}
                        className="absolute inset-0 rounded-2xl gradient-primary shadow-md shadow-primary/25"
                      />
                    )}
                    <motion.span
                      key={isActive ? "on" : "off"}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      className="relative z-10 flex items-center justify-center"
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                    </motion.span>
                  </motion.button>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
