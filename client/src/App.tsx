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
import CoachRegister from "@/pages/coach-register";
import EditProfile from "@/pages/edit-profile";
import PaymentMethods from "@/pages/payment-methods";
import FavouriteOrganizations from "@/pages/favourite-organizations";
import CompletedClasses from "@/pages/completed-classes";
import Messages from "@/pages/messages";

import CoachProfile from "@/pages/coach-profile";
import CoachClasses from "@/pages/coach-classes";
import CoachSettings from "@/pages/coach-settings";
import CoachAvailabilityGeneral from "@/pages/coach-availability-general";
import MobileAdmin from "@/pages/mobile-admin";
import PaymentRedirect from "@/components/payment-redirect";
import OrganizationInvite from "@/pages/organization-invite";
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

function RoleBasedRouter({ user, setUser, setIsAuthenticated }: { 
  user?: User; 
  setUser: (user: User | null) => void;
  setIsAuthenticated: (auth: boolean) => void;
}) {
  const { isMobile } = useMobileDetection();

  // Mobile app routing for coaches and participants - but allow specific routes to use normal routing
  const [location] = useLocation();
  
  if (isMobile) {
    // Only use desktop routing for these specific pages
    const specialRoutes = ['/edit-profile', '/payment-methods', '/favourite-organizations'];
    const isSpecialRoute = specialRoutes.includes(location) || (location.startsWith('/organizations/') && location.includes('/classes'));
    
    if (!isSpecialRoute) {
      if (user?.role === 'coach') {
        return <MobileCoach user={user} />;
      } else if (user?.role === 'organization_admin') {
        return <MobileAdmin user={user} />;
      } else if (user?.role === 'member') {
        return <MobileParticipant user={user} />;
      }
    }
  }

  // Member Interface (check first to prevent fallthrough)
  if (user?.role === 'member') {
    return (
      <Switch>
        <Route path="/" component={UserDashboard} />
        <Route path="/dashboard" component={UserDashboard} />
        <Route path="/discover" component={PublicDiscovery} />
        <Route path="/book" component={PublicBooking} />
        <Route path="/organizations/:id" component={PublicBooking} />
        <Route path="/organizations/:id/classes" component={OrganizationClasses} />
        <Route path="/achievements" component={Achievements} />
        <Route path="/edit-profile" component={EditProfile} />
        <Route path="/payment-methods" component={PaymentMethods} />
        <Route path="/favourite-organizations" component={FavouriteOrganizations} />
        <Route path="/completed-classes" component={CompletedClasses} />
        <Route path="/messages" component={Messages} />
        <Route path="/payment/success" component={PaymentRedirect} />
        <Route path="/payment/cancelled" component={PaymentRedirect} />
        <Route component={NotFound} />
      </Switch>
    );
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

  // Organization Admin Interface  
  if (user?.role === 'organization_admin') {
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
        <Route path="/payment/success" component={PaymentRedirect} />
        <Route path="/payment/cancelled" component={PaymentRedirect} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Coach Interface
  if (user?.role === 'coach') {
    return (
      <Switch>
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
        <Route path="/coach-profile/:organizationId" component={() => (
          <AppLayout>
            <CoachProfile />
          </AppLayout>
        )} />
        <Route path="/coach-classes" component={() => (
          <AppLayout>
            <CoachClasses />
          </AppLayout>
        )} />
        <Route path="/coach-settings" component={() => (
          <AppLayout>
            <CoachSettings />
          </AppLayout>
        )} />
        <Route path="/availability" component={() => (
          <AppLayout>
            <CoachAvailabilityGeneral />
          </AppLayout>
        )} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route path="/payment-cancelled" component={PaymentCancelled} />
        <Route path="/payment/success" component={PaymentRedirect} />
        <Route path="/payment/cancelled" component={PaymentRedirect} />
        <Route component={NotFound} />
      </Switch>
    );
  }



  // Global routes that work for all authenticated users
  return (
    <Switch>
      <Route path="/edit-profile" component={EditProfile} />
      <Route path="/payment-methods" component={PaymentMethods} />
      <Route path="/favourite-organizations" component={FavouriteOrganizations} />
      <Route path="/organizations/:id/classes" component={OrganizationClasses} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/payment-cancelled" component={PaymentCancelled} />
      <Route path="/payment/success" component={PaymentRedirect} />
      <Route path="/payment/cancelled" component={PaymentRedirect} />
      <Route component={NotFound} />
    </Switch>
  );

  // Fallback for any other authenticated user
  if (user) {
    return (
      <Switch>
        <Route path="/" component={UserDashboard} />
        <Route path="/dashboard" component={UserDashboard} />
        <Route path="/discover" component={PublicDiscovery} />
        <Route path="/book" component={PublicBooking} />
        <Route path="/organizations/:id/classes" component={OrganizationClasses} />
        <Route path="/invite/:inviteCode" component={OrganizationInvite} />
        <Route path="/edit-profile" component={EditProfile} />
        <Route path="/payment-methods" component={PaymentMethods} />
        <Route path="/favourite-organizations" component={FavouriteOrganizations} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route path="/payment-cancelled" component={PaymentCancelled} />
        <Route path="/payment/success" component={PaymentRedirect} />
        <Route path="/payment/cancelled" component={PaymentRedirect} />
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
      <Route path="/invite/:inviteCode" component={OrganizationInvite} />
      <Route path="/membership-payment/:organizationId" component={MembershipPayment} />
      <Route path="/membership-success" component={MembershipSuccess} />
      <Route path="/organization-setup" component={OrganizationSetup} />
      <Route path="/organization-payment" component={OrganizationPayment} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/payment-cancelled" component={PaymentCancelled} />
      <Route path="/payment/success" component={PaymentRedirect} />
      <Route path="/payment/cancelled" component={PaymentRedirect} />
      <Route path="/coach-register/:token" component={CoachRegister} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [location] = useLocation();

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

  // Handle invite routes before authentication checks
  if (location.startsWith('/invite/')) {
    return (
      <Switch>
        <Route path="/invite/:inviteCode" component={OrganizationInvite} />
      </Switch>
    );
  }

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#278DD4] mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
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

  return (
    <OrganizationProvider user={user}>
      <RoleBasedRouter user={user} setUser={setUser} setIsAuthenticated={setIsAuthenticated} />
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
