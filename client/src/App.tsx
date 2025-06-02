import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
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
import PublicBooking from "@/pages/public-booking";
import GlobalAdminDashboard from "@/pages/global-admin-dashboard";
import PublicDiscovery from "@/pages/public-discovery";
import OrganizationDashboard from "@/pages/organization-dashboard";
import OrganizationClasses from "@/pages/organization-classes";
import MobileCoach from "@/pages/mobile-coach";
import MobileParticipant from "@/pages/mobile-participant";
import UserDashboard from "@/pages/user-dashboard";
import Auth from "@/pages/auth";
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
      <AppLayout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/classes" component={Classes} />
          <Route path="/bookings" component={Bookings} />
          <Route path="/coaches" component={Coaches} />
          <Route path="/payments" component={Payments} />
          <Route path="/reports" component={Reports} />
          <Route path="/settings" component={Settings} />
          <Route path="/achievements" component={Achievements} />
          <Route path="/notifications" component={Notifications} />
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
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
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => api.getCurrentUser(),
    retry: false
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (error || !user) {
    return <Auth />;
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
