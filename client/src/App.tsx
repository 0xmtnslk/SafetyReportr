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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <OfflineIndicator />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/create-report" component={CreateReport} />
        <Route path="/reports" component={Reports} />
        <Route path="/edit-report/:id" component={EditReport} />
        <Route path="/view-report/:id">
          {(params) => <ViewReport id={params.id} />}
        </Route>
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
