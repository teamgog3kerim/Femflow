import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

// Pages
import Onboarding from "@/pages/onboarding";
import Home from "@/pages/home";
import Cycle from "@/pages/cycle";
import Log from "@/pages/log";
import Chat from "@/pages/chat";
import Analytics from "@/pages/analytics";
import Education from "@/pages/education";
import Subscription from "@/pages/subscription";
import Settings from "@/pages/settings";
import Admin from "@/pages/admin";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, path }: { component: any, path: string }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!isAuthenticated) return null;

  return <Component />;
}

function Router() {
  const { isRtl } = useAuth();
  
  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [isRtl]);

  return (
    <div className="min-h-[100dvh] pb-20 bg-background text-foreground transition-colors duration-300">
      <Switch>
        <Route path="/" component={Onboarding} />
        <Route path="/home"><ProtectedRoute path="/home" component={Home} /></Route>
        <Route path="/cycle"><ProtectedRoute path="/cycle" component={Cycle} /></Route>
        <Route path="/log"><ProtectedRoute path="/log" component={Log} /></Route>
        <Route path="/chat"><ProtectedRoute path="/chat" component={Chat} /></Route>
        <Route path="/analytics"><ProtectedRoute path="/analytics" component={Analytics} /></Route>
        <Route path="/education"><ProtectedRoute path="/education" component={Education} /></Route>
        <Route path="/subscription"><ProtectedRoute path="/subscription" component={Subscription} /></Route>
        <Route path="/settings"><ProtectedRoute path="/settings" component={Settings} /></Route>
        <Route path="/admin"><ProtectedRoute path="/admin" component={Admin} /></Route>
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
