import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/hooks/use-auth";
import { LanguageProvider } from "@/hooks/use-language";
import { useEffect } from "react";

// Pages
import Onboarding from "@/pages/onboarding";
import Home from "@/pages/home";
import Cycle from "@/pages/cycle";
import Log from "@/pages/log";
import Chat from "@/pages/chat";
import Analytics from "@/pages/analytics";
import Tips from "@/pages/tips";
import Education from "@/pages/education";
import Subscription from "@/pages/subscription";
import Settings from "@/pages/settings";
import Admin from "@/pages/admin";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: any }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Onboarding} />
      <Route>
        <AppShell>
          <Switch>
            <Route path="/home"><ProtectedRoute component={Home} /></Route>
            <Route path="/cycle"><ProtectedRoute component={Cycle} /></Route>
            <Route path="/log"><ProtectedRoute component={Log} /></Route>
            <Route path="/chat"><ProtectedRoute component={Chat} /></Route>
            <Route path="/insights"><ProtectedRoute component={Analytics} /></Route>
            <Route path="/tips"><ProtectedRoute component={Tips} /></Route>
            <Route path="/education"><ProtectedRoute component={Education} /></Route>
            <Route path="/subscription"><ProtectedRoute component={Subscription} /></Route>
            <Route path="/settings"><ProtectedRoute component={Settings} /></Route>
            <Route path="/admin"><ProtectedRoute component={Admin} /></Route>
            <Route component={NotFound} />
          </Switch>
        </AppShell>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
