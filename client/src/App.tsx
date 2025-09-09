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
import CreateInspection from "@/pages/create-inspection";
import InspectionDetail from "@/pages/inspection-detail";
import CreateAssignment from "@/pages/create-assignment";
import TemplateDetail from "@/pages/template-detail";
import TemplateEdit from "@/pages/template-edit";
import CreateTemplate from "@/pages/create-template";
import SectionEdit from "@/pages/section-edit";
import AddQuestion from "@/pages/add-question";
import QuestionEdit from "@/pages/question-edit";
import AddSection from "@/pages/add-section";
import SectionDetail from "@/pages/section-detail";
import LiveChecklist from "@/pages/live-checklist";
import InspectionCreatePage from "@/pages/inspection-create";
import InspectionResults from "@/pages/inspection-results";
import AdminInspections from "@/pages/admin-inspections";
import InspectionHistory from "@/pages/inspection-history";
import InspectionResultsAdmin from "@/pages/inspection-results-admin";
import HospitalInspections from "@/pages/hospital-inspections";
import ChecklistInspections from "@/pages/checklist-inspections";
import InspectionTitleDetail from "@/pages/inspection-title-detail";
import InspectionAnalysis from "@/pages/inspection-analysis";
import SpecialistDashboard from "@/pages/specialist-dashboard";
import SpecialistChecklists from "@/pages/specialist-checklists";
import SpecialistInspections from "@/pages/specialist-inspections";
import SpecialistInspectionDetail from "@/pages/specialist-inspection-detail";
import ProfileEdit from "@/pages/profile-edit";
import NotificationsPage from "@/pages/notifications";
import HospitalManagement from "@/pages/hospital-management";
import RiskAssessmentPage from "@/pages/risk-assessment";
import DepartmentRiskAssessmentPage from "@/pages/department-risk-assessment";
import CreateRiskAssessmentPage from "@/pages/create-risk-assessment";
import EditRiskAssessmentPage from "@/pages/edit-risk-assessment";
import ViewRiskAssessmentPage from "@/pages/view-risk-assessment";
import HospitalSectionsManagement from "@/pages/hospital-sections-management";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
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
  const protectedRoutes = ['/dashboard', '/create-report', '/reports', '/edit-report', '/view-report', '/admin', '/change-password', '/checklist', '/live-checklist', '/inspection-results', '/admin/inspections', '/inspection-history', '/inspection-results-admin', '/hospital-inspections', '/checklist-inspections', '/inspection-title-detail', '/inspection-analysis', '/specialist', '/profile/edit', '/notifications', '/hospital-management', '/risk-assessment'];
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
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation>
          {user && <OfflineIndicator />}
          <div className="flex-1">
            <Switch>
            <Route path="/dashboard">
              {() => ['safety_specialist', 'occupational_physician'].includes(user?.role || '') ? <SpecialistDashboard /> : <Dashboard />}
            </Route>
            <Route path="/create-report" component={CreateReport} />
            <Route path="/reports" component={Reports} />
            <Route path="/edit-report/:id" component={EditReport} />
            <Route path="/view-report/:id">
              {(params) => <ViewReport id={params.id} />}
            </Route>
            <Route path="/reports/:id">
              {(params) => <ViewReport id={params.id} />}
            </Route>
            <Route path="/admin">
              {() => ['central_admin', 'admin'].includes(user?.role || '') ? <AdminPanel /> : <div className="p-8"><div>Yetkisiz Erişim</div></div>}
            </Route>
            <Route path="/admin/create-assignment">
              {() => ['central_admin', 'admin'].includes(user?.role || '') ? <CreateAssignment /> : <div className="p-8"><div>Yetkisiz Erişim</div></div>}
            </Route>
            <Route path="/change-password" component={ChangePassword} />
            <Route path="/checklist" component={ChecklistDashboard} />
            <Route path="/checklist/create-inspection" component={CreateInspection} />
            <Route path="/checklist/inspections/:id">
              {(params) => <InspectionDetail inspectionId={params.id} />}
            </Route>
            <Route path="/checklist/templates/:id">
              {(params) => <TemplateDetail templateId={params.id} />}
            </Route>
            <Route path="/checklist/templates/:id/edit">
              {(params) => <TemplateEdit templateId={params.id} />}
            </Route>
            <Route path="/checklist/create-template" component={CreateTemplate} />
            <Route path="/checklist/sections/:id/edit">
              {(params) => <SectionEdit sectionId={params.id} />}
            </Route>
            <Route path="/checklist/sections/:id/add-question">
              {(params) => {
                const urlParams = new URLSearchParams(window.location.search);
                const templateId = urlParams.get('templateId');
                return <AddQuestion sectionId={params.id} templateId={templateId || undefined} />;
              }}
            </Route>
            <Route path="/checklist/questions/:id/edit">
              {(params) => <QuestionEdit questionId={params.id} />}
            </Route>
            <Route path="/checklist/templates/:id/add-section">
              {(params) => <AddSection templateId={params.id} />}
            </Route>
            <Route path="/checklist/sections/:id/detail">
              {(params) => {
                const urlParams = new URLSearchParams(window.location.search);
                const templateId = urlParams.get('templateId');
                return <SectionDetail sectionId={params.id} templateId={templateId || undefined} />;
              }}
            </Route>
            <Route path="/checklist/live" component={LiveChecklist} />
            <Route path="/live-checklist" component={LiveChecklist} />
            <Route path="/admin/inspections/create">
              {() => ['central_admin', 'admin'].includes(user?.role || '') ? <InspectionCreatePage /> : <div className="p-8"><div>Yetkisiz Erişim</div></div>}
            </Route>
            <Route path="/inspection-results/:assignmentId">
              {(params) => <InspectionResults assignmentId={params.assignmentId} />}
            </Route>
            <Route path="/admin/inspections">
              {() => ['central_admin', 'admin'].includes(user?.role || '') ? <AdminInspections /> : <div className="p-8"><div>Yetkisiz Erişim</div></div>}
            </Route>
            <Route path="/inspection-history">
              {() => ['safety_specialist'].includes(user?.role || '') ? <InspectionHistory /> : <div className="p-8"><div>Yetkisiz Erişim</div></div>}
            </Route>
            <Route path="/inspection-results-admin">
              {() => ['central_admin', 'admin'].includes(user?.role || '') ? <InspectionResultsAdmin /> : <div className="p-8"><div>Yetkisiz Erişim</div></div>}
            </Route>
            <Route path="/hospital-inspections/:hospitalId">
              {() => ['central_admin', 'admin'].includes(user?.role || '') ? <HospitalInspections /> : <div className="p-8"><div>Yetkisiz Erişim</div></div>}
            </Route>
            <Route path="/checklist-inspections/:hospitalId/:checklistId">
              {() => ['central_admin', 'admin'].includes(user?.role || '') ? <ChecklistInspections /> : <div className="p-8"><div>Yetkisiz Erişim</div></div>}
            </Route>
            <Route path="/inspection-title-detail/:hospitalId/:checklistId/:titleName">
              {() => ['central_admin', 'admin'].includes(user?.role || '') ? <InspectionTitleDetail /> : <div className="p-8"><div>Yetkisiz Erişim</div></div>}
            </Route>
            <Route path="/inspection-analysis/:hospitalId/:checklistId/:assignmentId">
              {() => ['central_admin', 'admin', 'safety_specialist', 'occupational_physician'].includes(user?.role || '') ? <InspectionAnalysis /> : <div className="p-8"><div>Yetkisiz Erişim</div></div>}
            </Route>
            <Route path="/specialist/checklists" component={SpecialistChecklists} />
            <Route path="/specialist/checklists/:checklistId/inspections" component={SpecialistInspections} />
            <Route path="/specialist/inspection/:inspectionId" component={SpecialistInspectionDetail} />
            <Route path="/profile/edit" component={ProfileEdit} />
            <Route path="/hospital-management">
              {() => ['safety_specialist', 'occupational_physician'].includes(user?.role || '') ? <HospitalManagement /> : <div className="p-8"><div>Yetkisiz Erişim</div></div>}
            </Route>
            <Route path="/risk-assessment">
              {() => ['safety_specialist', 'occupational_physician'].includes(user?.role || '') ? <RiskAssessmentPage /> : <div className="p-8"><div>Yetkisiz Erişim</div></div>}
            </Route>
            <Route path="/risk-assessment/department/:id">
              {() => ['safety_specialist', 'occupational_physician'].includes(user?.role || '') ? <DepartmentRiskAssessmentPage /> : <div className="p-8"><div>Yetkisiz Erişim</div></div>}
            </Route>
            <Route path="/risk-assessment/create/:departmentId">
              {() => ['safety_specialist', 'occupational_physician'].includes(user?.role || '') ? <CreateRiskAssessmentPage /> : <div className="p-8"><div>Yetkisiz Erişim</div></div>}
            </Route>
            <Route path="/risk-assessment/edit/:id">
              {() => ['safety_specialist', 'occupational_physician'].includes(user?.role || '') ? <EditRiskAssessmentPage /> : <div className="p-8"><div>Yetkisiz Erişim</div></div>}
            </Route>
            <Route path="/risk-assessment/view/:id">
              {() => ['safety_specialist', 'occupational_physician'].includes(user?.role || '') ? <ViewRiskAssessmentPage /> : <div className="p-8"><div>Yetkisiz Erişim</div></div>}
            </Route>
            <Route path="/hospital-sections">
              {() => ['safety_specialist', 'occupational_physician'].includes(user?.role || '') ? <HospitalSectionsManagement /> : <div className="p-8"><div>Yetkisiz Erişim</div></div>}
            </Route>
            <Route path="/notifications" component={NotificationsPage} />
            <Route component={() => <div className="p-8"><div>404 - Page Not Found</div></div>} />
            </Switch>
          </div>
        </Navigation>
        <Footer />
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
        <Route path="/reports/:id">
          {(params) => user ? <ViewReport id={params.id} /> : <Login />}
        </Route>
        <Route path="/admin" component={user ? AdminPanel : Login} />
        <Route path="/admin/create-assignment" component={user ? CreateAssignment : Login} />
        <Route path="/change-password" component={user ? ChangePassword : Login} />
        <Route path="/checklist" component={user ? ChecklistDashboard : Login} />
        <Route path="/checklist/create-inspection" component={user ? CreateInspection : Login} />
        <Route path="/checklist/inspections/:id">
          {(params) => user ? <InspectionDetail inspectionId={params.id} /> : <Login />}
        </Route>
        <Route path="/checklist/templates/:id">
          {(params) => user ? <TemplateDetail templateId={params.id} /> : <Login />}
        </Route>
        <Route path="/checklist/templates/:id/edit">
          {(params) => user ? <TemplateEdit templateId={params.id} /> : <Login />}
        </Route>
        <Route path="/checklist/create-template" component={user ? CreateTemplate : Login} />
        <Route path="/checklist/sections/:id/edit">
          {(params) => user ? <SectionEdit sectionId={params.id} /> : <Login />}
        </Route>
        <Route path="/checklist/sections/:id/add-question">
          {(params) => {
            if (!user) return <Login />;
            const urlParams = new URLSearchParams(window.location.search);
            const templateId = urlParams.get('templateId');
            return <AddQuestion sectionId={params.id} templateId={templateId || undefined} />;
          }}
        </Route>
        <Route path="/checklist/questions/:id/edit">
          {(params) => user ? <QuestionEdit questionId={params.id} /> : <Login />}
        </Route>
        <Route path="/checklist/templates/:id/add-section">
          {(params) => user ? <AddSection templateId={params.id} /> : <Login />}
        </Route>
        <Route path="/checklist/sections/:id/detail">
          {(params) => {
            if (!user) return <Login />;
            const urlParams = new URLSearchParams(window.location.search);
            const templateId = urlParams.get('templateId');
            return <SectionDetail sectionId={params.id} templateId={templateId || undefined} />;
          }}
        </Route>
        <Route path="/checklist/live" component={user ? LiveChecklist : Login} />
        <Route path="/live-checklist" component={user ? LiveChecklist : Login} />
        <Route path="/inspection-results/:assignmentId">
          {(params) => user ? <InspectionResults assignmentId={params.assignmentId} /> : <Login />}
        </Route>
        <Route path="/admin/inspections">
          {() => ['central_admin', 'admin'].includes((user as any)?.role || '') ? <AdminInspections /> : <Login />}
        </Route>
        <Route path="/inspection-history">
          {() => ['safety_specialist'].includes((user as any)?.role || '') ? <InspectionHistory /> : <Login />}
        </Route>
        <Route path="/inspection-results-admin">
          {() => ['central_admin', 'admin'].includes((user as any)?.role || '') ? <InspectionResultsAdmin /> : <Login />}
        </Route>
        <Route path="/hospital-inspections/:hospitalId">
          {() => ['central_admin', 'admin'].includes((user as any)?.role || '') ? <HospitalInspections /> : <Login />}
        </Route>
        <Route path="/checklist-inspections/:hospitalId/:checklistId">
          {() => ['central_admin', 'admin'].includes((user as any)?.role || '') ? <ChecklistInspections /> : <Login />}
        </Route>
        <Route path="/inspection-title-detail/:hospitalId/:checklistId/:titleName">
          {() => ['central_admin', 'admin'].includes((user as any)?.role || '') ? <InspectionTitleDetail /> : <Login />}
        </Route>
        <Route path="/inspection-analysis/:hospitalId/:checklistId/:assignmentId">
          {() => ['central_admin', 'admin', 'safety_specialist', 'occupational_physician'].includes((user as any)?.role || '') ? <InspectionAnalysis /> : <Login />}
        </Route>
        <Route path="/specialist/checklists">
          {() => ['safety_specialist', 'occupational_physician'].includes((user as any)?.role || '') ? <SpecialistChecklists /> : <Login />}
        </Route>
        <Route path="/specialist/checklists/:checklistId/inspections">
          {() => ['safety_specialist', 'occupational_physician'].includes((user as any)?.role || '') ? <SpecialistInspections /> : <Login />}
        </Route>
        <Route path="/specialist/inspection/:inspectionId">
          {() => ['safety_specialist', 'occupational_physician'].includes((user as any)?.role || '') ? <SpecialistInspectionDetail /> : <Login />}
        </Route>
        <Route path="/profile/edit" component={user ? ProfileEdit : Login} />
        <Route path="/notifications" component={user ? NotificationsPage : Login} />
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
