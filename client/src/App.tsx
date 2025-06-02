import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationsProvider } from "@/contexts/notifications-context";
import { api, type User } from "@/lib/api";
import { useMobileDetection } from "@/hooks/use-mobile-detection";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Classes from "@/pages/classes";
import Bookings from "@/pages/bookings";
import Coaches from "@/pages/coaches";
import Payments from "@/pages/payments";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Achievements from "@/pages/achievements";
import Notifications from "@/pages/notifications";
import Memberships from "@/pages/memberships";
import DailySchedules from "@/pages/daily-schedules";
import PublicBooking from "@/pages/public-booking";
import GlobalAdminDashboard from "@/pages/global-admin-dashboard-working";
import PublicDiscovery from "@/pages/public-discovery";
import OrganizationDashboard from "@/pages/organization-dashboard";
import OrganizationClasses from "@/pages/organization-classes";
import MobileCoach from "@/pages/mobile-coach";
import MobileParticipant from "@/pages/mobile-participant";
import UserDashboard from "@/pages/user-dashboard";
import Auth from "@/pages/auth";
import OrganizationSetup from "@/pages/organization-setup";
import OrganizationPayment from "@/pages/organization-payment";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import Header from "@/components/layout/header";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-transparent">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

function RoleBasedRouter({ user }: { user?: User }) {
  const { isMobile } = useMobileDetection();

  // Mobile app routing for coaches and participants
  if (isMobile) {
    if (user?.role === 'coach' || user?.role === 'organization_admin') {
      return <MobileCoach user={user} />;
    } else if (user?.role === 'member') {
      return <MobileParticipant user={user} />;
    }
  }

  // Global Admin Interface
  if (user?.role === 'global_admin') {
    return (
      <Switch>
        <Route path="/" component={GlobalAdminDashboard} />
        <Route path="/organizations" component={GlobalAdminDashboard} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Organization Admin/Coach Interface  
  if (user?.role === 'organization_admin' || user?.role === 'coach') {
    return (
      <Switch>
        <Route path="/organization-setup" component={OrganizationSetup} />
        <Route path="/organization-payment" component={OrganizationPayment} />
        <Route path="/" component={() => (
          <AppLayout>
            <Dashboard />
          </AppLayout>
        )} />
        <Route path="/dashboard" component={() => (
          <AppLayout>
            <Dashboard />
          </AppLayout>
        )} />
        <Route path="/classes" component={() => (
          <AppLayout>
            <Classes />
          </AppLayout>
        )} />
        <Route path="/bookings" component={() => (
          <AppLayout>
            <Bookings />
          </AppLayout>
        )} />
        <Route path="/coaches" component={() => (
          <AppLayout>
            <Coaches />
          </AppLayout>
        )} />
        <Route path="/memberships" component={() => (
          <AppLayout>
            <Memberships />
          </AppLayout>
        )} />
        <Route path="/daily-schedules" component={() => (
          <AppLayout>
            <DailySchedules />
          </AppLayout>
        )} />
        <Route path="/payments" component={() => (
          <AppLayout>
            <Payments />
          </AppLayout>
        )} />
        <Route path="/reports" component={() => (
          <AppLayout>
            <Reports />
          </AppLayout>
        )} />
        <Route path="/settings" component={() => (
          <AppLayout>
            <Settings />
          </AppLayout>
        )} />
        <Route path="/achievements" component={() => (
          <AppLayout>
            <Achievements />
          </AppLayout>
        )} />
        <Route path="/notifications" component={() => (
          <AppLayout>
            <Notifications />
          </AppLayout>
        )} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Member Interface - Show user dashboard if authenticated  
  if (user) {
    return (
      <Switch>
        <Route path="/" component={UserDashboard} />
        <Route path="/dashboard" component={UserDashboard} />
        <Route path="/discover" component={PublicDiscovery} />
        <Route path="/book" component={PublicBooking} />
        <Route path="/organizations/:id" component={PublicBooking} />
        <Route path="/organizations/:id/classes" component={OrganizationClasses} />
        <Route path="/achievements" component={Achievements} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Public Interface (unauthenticated)
  return (
    <Switch>
      <Route path="/" component={PublicDiscovery} />
      <Route path="/discover" component={PublicDiscovery} />
      <Route path="/book" component={PublicBooking} />
      <Route path="/organizations/:id" component={PublicBooking} />
      <Route path="/organizations/:id/classes" component={OrganizationClasses} />
      <Route path="/organization-setup" component={OrganizationSetup} />
      <Route path="/organization-payment" component={OrganizationPayment} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await api.getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
      } catch (error) {
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Auth onAuthSuccess={(authenticatedUser) => {
      setUser(authenticatedUser);
      setIsAuthenticated(true);
    }} />;
  }

  return <RoleBasedRouter user={user} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationsProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </NotificationsProvider>
    </QueryClientProvider>
  );
}

export default App;
