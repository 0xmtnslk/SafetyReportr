import { Switch, Route, useLocation } from "wouter";
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
import LandingPage from "@/pages/landing-page";
import ChecklistDashboard from "@/pages/checklist";
import Navigation from "@/components/navigation";
import OfflineIndicator from "@/components/offline-indicator";
import { useOfflineSync } from "./hooks/useOfflineSync";

function Router() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Landing page - no authentication required
  if (location === '/') {
    return <LandingPage />;
  }

  // Protected routes - require authentication
  const protectedRoutes = ['/dashboard', '/create-report', '/reports', '/edit-report', '/view-report', '/admin', '/change-password', '/checklist'];
  const isProtectedRoute = protectedRoutes.some(route => location.startsWith(route));

  if (isProtectedRoute && !user) {
    return <Login />;
  }

  // If user is authenticated but on landing page, redirect to dashboard
  if (user && location === '/') {
    return <LandingPage />;
  }

  // Redirect to change password if it's first login
  if (user && user.firstLogin && !location.includes('/change-password')) {
    return <ChangePassword />;
  }

  // If authenticated and on protected route, render with navigation layout
  if (user && !user.firstLogin && isProtectedRoute) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation>
          {user && <OfflineIndicator />}
          <Switch>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/create-report" component={CreateReport} />
            <Route path="/reports" component={Reports} />
            <Route path="/edit-report/:id" component={EditReport} />
            <Route path="/view-report/:id">
              {(params) => <ViewReport id={params.id} />}
            </Route>
            <Route path="/admin" component={AdminPanel} />
            <Route path="/change-password" component={ChangePassword} />
            <Route path="/checklist" component={ChecklistDashboard} />
            <Route component={() => <div className="p-8"><div>404 - Page Not Found</div></div>} />
          </Switch>
        </Navigation>
      </div>
    );
  }

  // For non-authenticated routes or special cases
  return (
    <div className="min-h-screen bg-background">
      {user && <OfflineIndicator />}
      
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/dashboard" component={user ? Dashboard : Login} />
        <Route path="/create-report" component={user ? CreateReport : Login} />
        <Route path="/reports" component={user ? Reports : Login} />
        <Route path="/edit-report/:id" component={user ? EditReport : Login} />
        <Route path="/view-report/:id">
          {(params) => user ? <ViewReport id={params.id} /> : <Login />}
        </Route>
        <Route path="/admin" component={user ? AdminPanel : Login} />
        <Route path="/change-password" component={user ? ChangePassword : Login} />
        <Route path="/checklist" component={user ? ChecklistDashboard : Login} />
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
