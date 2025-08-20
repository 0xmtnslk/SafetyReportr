import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/useAuth";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import CreateReport from "@/pages/create-report";
import Reports from "@/pages/reports";
import EditReport from "@/pages/edit-report";
import ViewReport from "@/pages/view-report";
import AdminPanel from "@/pages/admin-panel";
import ChangePassword from "@/pages/change-password";
import Navigation from "@/components/navigation";
import OfflineIndicator from "@/components/offline-indicator";
import { useOfflineSync } from "./hooks/useOfflineSync";

function Router() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Redirect to change password if it's first login
  if (user.firstLogin && !window.location.pathname.includes('/change-password')) {
    return <ChangePassword />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hide navigation on change password page for first login */}
      {!user.firstLogin && <Navigation />}
      <OfflineIndicator />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/create-report" component={CreateReport} />
        <Route path="/reports" component={Reports} />
        <Route path="/edit-report/:id" component={EditReport} />
        <Route path="/view-report/:id">
          {(params) => <ViewReport id={params.id} />}
        </Route>
        <Route path="/admin" component={AdminPanel} />
        <Route path="/change-password" component={ChangePassword} />
        <Route component={() => <div>404 - Page Not Found</div>} />
      </Switch>
    </div>
  );
}

function App() {
  useOfflineSync();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
