import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationsProvider } from "@/contexts/notifications-context";
import { OrganizationProvider } from "@/contexts/organization-context";
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
import MembershipPayment from "@/pages/membership-payment";
import MembershipSuccess from "@/pages/membership-success";
import BookingsManagement from "@/pages/bookings-management";
import MembersManagement from "@/pages/members-management";
import RevenueDashboard from "@/pages/revenue-dashboard";
import ClassesManagement from "@/pages/classes-management";
import PaymentSuccess from "@/pages/payment-success";
import PaymentCancelled from "@/pages/payment-cancelled";
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

function RoleBasedRouter({ user, userOrganizations }: { user?: User; userOrganizations?: any[] }) {
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
        <Route path="/bookings-management" component={() => (
          <AppLayout>
            <BookingsManagement />
          </AppLayout>
        )} />
        <Route path="/members-management" component={() => (
          <AppLayout>
            <MembersManagement />
          </AppLayout>
        )} />
        <Route path="/revenue-dashboard" component={() => (
          <AppLayout>
            <RevenueDashboard />
          </AppLayout>
        )} />
        <Route path="/classes-management" component={() => (
          <AppLayout>
            <ClassesManagement />
          </AppLayout>
        )} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Member Interface - Show appropriate dashboard based on organization membership
  if (user) {
    // If user belongs to organization, show organization dashboard directly
    if (userOrganizations && userOrganizations.length > 0) {
      const organization = userOrganizations[0];
      return (
        <Switch>
          <Route path="/" component={() => <OrganizationDashboard user={user} organization={organization} />} />
          <Route path="/dashboard" component={() => <OrganizationDashboard user={user} organization={organization} />} />
          <Route path="/discover" component={PublicDiscovery} />
          <Route path="/book" component={PublicBooking} />
          <Route path="/organizations/:id" component={PublicBooking} />
          <Route path="/organizations/:id/classes" component={OrganizationClasses} />
          <Route path="/achievements" component={Achievements} />
          <Route component={NotFound} />
        </Switch>
      );
    }
    
    // Regular user dashboard for users without organizations
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
      <Route path="/membership-payment/:organizationId" component={MembershipPayment} />
      <Route path="/membership-success" component={MembershipSuccess} />
      <Route path="/organization-setup" component={OrganizationSetup} />
      <Route path="/organization-payment" component={OrganizationPayment} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/payment-cancelled" component={PaymentCancelled} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = await api.getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
        
        // Preload organization data to avoid style switches
        try {
          const orgs = await api.getUserOrganizations();
          setUserOrganizations(orgs);
        } catch (orgError) {
          setUserOrganizations([]);
        }
        
        setDataLoaded(true);
      } catch (error) {
        setUser(null);
        setIsAuthenticated(false);
        setDataLoaded(true);
      }
    };

    loadUserData();
  }, []);

  // Show branded loading screen if user has organization
  if (!dataLoaded) {
    const organization = userOrganizations[0];
    const bgStyle = organization 
      ? { background: `linear-gradient(to bottom right, ${organization.primaryColor}10, ${organization.secondaryColor}10)` }
      : { background: 'linear-gradient(to bottom right, #f8fafc, #e2e8f0)' };
    const spinnerColor = organization?.primaryColor || '#278DD4';
    
    return (
      <div className="flex items-center justify-center min-h-screen" style={bgStyle}>
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-32 w-32 border-b-2 mx-auto"
            style={{ borderColor: spinnerColor }}
          ></div>
          <p className="mt-4 text-slate-600">
            {organization ? `Loading ${organization.name}...` : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Auth onAuthSuccess={(authenticatedUser) => {
      setUser(authenticatedUser);
      setIsAuthenticated(true);
      setDataLoaded(false); // Reload data after auth
    }} />;
  }

  return (
    <OrganizationProvider user={user}>
      <RoleBasedRouter user={user} userOrganizations={userOrganizations} />
    </OrganizationProvider>
  );
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
