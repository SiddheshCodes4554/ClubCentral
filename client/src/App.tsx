import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ProtectedRoute, InstitutionProtectedRoute } from "@/components/ProtectedRoute";

import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Apply from "@/pages/Apply";
import Dashboard from "@/pages/Dashboard";
import Approvals from "@/pages/Approvals";
import Members from "@/pages/Members";
import Roles from "@/pages/Roles";
import Events from "@/pages/Events";
import Tasks from "@/pages/Tasks";
import Finance from "@/pages/Finance";
import Social from "@/pages/Social";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import Committee from "@/pages/Committee";
import Teams from "@/pages/Teams";
import Permissions from "@/pages/Permissions";
import Landing from "@/pages/Landing";
import InstitutionOnboarding from "@/pages/institution/Onboarding";
import InstitutionDashboard from "@/pages/institution/Dashboard";
import InstitutionClubs from "@/pages/institution/Clubs";
import InstitutionFinance from "@/pages/institution/Finance";
import InstitutionMembers from "@/pages/institution/Members";
import InstitutionAnalytics from "@/pages/institution/Analytics";
import InstitutionReports from "@/pages/institution/Reports";
import InstitutionElections from "@/pages/institution/Elections";
import VotePage from "@/pages/Vote";

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/dashboard" /> : <Login />}
      </Route>
      <Route path="/signup">
        {isAuthenticated ? <Redirect to="/dashboard" /> : <Signup />}
      </Route>
      <Route path="/apply/:clubCode" component={Apply} />

      <Route path="/">
        {isAuthenticated ? (
          <Redirect to={user?.kind === 'institution' ? '/institution/dashboard' : '/dashboard'} />
        ) : (
          <Landing />
        )}
      </Route>

      <Route path="/vote/:accessCode" component={VotePage} />

      <Route path="/institution/onboarding">
        {isAuthenticated && user?.kind === 'institution' ? (
          <Redirect to="/institution/dashboard" />
        ) : (
          <InstitutionOnboarding />
        )}
      </Route>

      <Route path="/institution/dashboard">
        <InstitutionProtectedRoute>
          <InstitutionDashboard />
        </InstitutionProtectedRoute>
      </Route>

      <Route path="/institution/clubs">
        <InstitutionProtectedRoute>
          <InstitutionClubs />
        </InstitutionProtectedRoute>
      </Route>

      <Route path="/institution/elections">
        <InstitutionProtectedRoute>
          <InstitutionElections />
        </InstitutionProtectedRoute>
      </Route>

      <Route path="/institution/finance">
        <InstitutionProtectedRoute>
          <InstitutionFinance />
        </InstitutionProtectedRoute>
      </Route>

      <Route path="/institution/members">
        <InstitutionProtectedRoute>
          <InstitutionMembers />
        </InstitutionProtectedRoute>
      </Route>

      <Route path="/institution/analytics">
        <InstitutionProtectedRoute>
          <InstitutionAnalytics />
        </InstitutionProtectedRoute>
      </Route>

      <Route path="/institution/reports">
        <InstitutionProtectedRoute>
          <InstitutionReports />
        </InstitutionProtectedRoute>
      </Route>

      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/approvals">
        <ProtectedRoute requiredRoles={['President', 'Vice-President']}>
          <Approvals />
        </ProtectedRoute>
      </Route>

      <Route path="/members">
        <ProtectedRoute>
          <Members />
        </ProtectedRoute>
      </Route>

      <Route path="/teams">
        <ProtectedRoute>
          <Teams />
        </ProtectedRoute>
      </Route>

      <Route path="/roles">
        <ProtectedRoute requiredRoles={['President']}>
          <Roles />
        </ProtectedRoute>
      </Route>

      <Route path="/events">
        <ProtectedRoute>
          <Events />
        </ProtectedRoute>
      </Route>

      <Route path="/tasks">
        <ProtectedRoute>
          <Tasks />
        </ProtectedRoute>
      </Route>

      <Route path="/finance">
        <ProtectedRoute>
          <Finance />
        </ProtectedRoute>
      </Route>

      <Route path="/social">
        <ProtectedRoute>
          <Social />
        </ProtectedRoute>
      </Route>

      <Route path="/committee">
        <ProtectedRoute requiredRoles={['President', 'Vice-President']}>
          <Committee />
        </ProtectedRoute>
      </Route>

      <Route path="/settings">
        <ProtectedRoute requiredRoles={['President']}>
          <Settings />
        </ProtectedRoute>
      </Route>

      <Route path="/permissions">
        <ProtectedRoute>
          <Permissions />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedLayout() {
  const { isAuthenticated } = useAuth();

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  if (!isAuthenticated) {
    return <AppRoutes />;
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto bg-background">
            <AppRoutes />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AuthenticatedLayout />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
