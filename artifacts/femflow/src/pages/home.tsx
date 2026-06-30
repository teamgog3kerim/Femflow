import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/translations";
import { useGetCurrentCycle, useGetWellnessScore, useListNotifications } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, Droplets, Moon, Activity, Flame, Plus, Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { user, language } = useAuth();
  const t = useTranslation(language).home;

  const { data: currentCycle } = useGetCurrentCycle();
  const { data: wellness } = useGetWellnessScore();
  const { data: notifications } = useListNotifications();

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center pt-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">
            {t.greeting} {user?.firstName || 'Beautiful'}
          </h1>
        </div>
        <Link href="/settings">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
            <span className="font-medium text-secondary-foreground">{user?.firstName?.[0] || 'F'}</span>
          </div>
        </Link>
      </header>

      {/* Hero Cycle Status */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 text-primary-foreground shadow-lg shadow-primary/20 overflow-hidden"
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col items-center text-center space-y-2">
          <span className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wider">{t.phase}</span>
          <h2 className="text-4xl font-serif font-bold capitalize">{currentCycle?.phase || 'Follicular'}</h2>
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium mt-2">
            {t.cycleDay} {currentCycle?.cycleDay || 1}
          </div>
        </div>
      </motion.div>

      {/* Wellness & Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 flex flex-col items-center justify-center text-center border-none shadow-md bg-card/50 backdrop-blur">
          <div className="relative w-16 h-16 mb-3">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-muted stroke-current"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-primary stroke-current"
                strokeWidth="3"
                strokeDasharray={`${wellness?.score || 85}, 100`}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-primary">
              {wellness?.score || 85}
            </div>
          </div>
          <span className="text-sm font-medium text-muted-foreground">{t.wellnessScore}</span>
        </Card>

        <Link href="/log">
          <Card className="h-full p-5 flex flex-col items-center justify-center text-center border-none shadow-md bg-secondary/50 backdrop-blur cursor-pointer hover:bg-secondary/70 transition-colors">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 text-primary shadow-sm">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-foreground">{t.logToday}</span>
          </Card>
        </Link>
      </div>

      {/* Predictions */}
      <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t.nextPeriod}</p>
            <p className="font-semibold text-foreground">
              {currentCycle?.nextPeriodDate ? new Date(currentCycle.nextPeriodDate).toLocaleDateString() : 'Dec 14'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-primary">12</span>
          <span className="text-sm text-muted-foreground ml-1">{t.days}</span>
        </div>
      </div>

      {/* Notifications */}
      {notifications && notifications.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">{t.recentActivity}</h3>
          <div className="space-y-2">
            {notifications.slice(0, 2).map((n) => (
              <div key={n.id} className="flex gap-3 p-3 rounded-xl bg-card border border-border">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}