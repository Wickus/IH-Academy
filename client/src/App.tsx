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
import UserSettings from "@/pages/user-settings";
import Achievements from "@/pages/achievements";
import Notifications from "@/pages/notifications";
import Memberships from "@/pages/memberships";
import DailySchedules from "@/pages/daily-schedules";
import PublicBooking from "@/pages/public-booking";
import GlobalAdminDashboard from "@/pages/global-admin-dashboard-clean";
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
import LandingPage from "@/pages/landing";
import DebitOrderManagement from "@/pages/debit-order-management";
import FreeTrialSignup from "@/pages/free-trial-signup";
import ResetPassword from "@/pages/reset-password";
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
  const [location] = useLocation(); // Move useLocation to the top

  // Global Admin Interface - Handle FIRST before any mobile detection
  if (user?.role === 'global_admin') {
    // Check if accessing specific organization dashboard
    const searchParams = new URLSearchParams(window.location.search);
    if (location === '/organization-dashboard' && searchParams.get('globalAdminAccess') === 'true') {
      return (
        <AppLayout>
          <OrganizationDashboard user={user} />
        </AppLayout>
      );
    }

    return (
      <Switch>
        <Route path="/organization-dashboard" component={() => (
          <AppLayout>
            <OrganizationDashboard user={user} />
          </AppLayout>
        )} />
        <Route path="/" component={GlobalAdminDashboard} />
        <Route path="/dashboard" component={GlobalAdminDashboard} />
        <Route path="/organizations" component={GlobalAdminDashboard} />
        <Route component={GlobalAdminDashboard} />
      </Switch>
    );
  }

  // Mobile app routing for coaches and participants - temporarily disabled for members

  if (isMobile) {
    // Only use desktop routing for these specific pages
    const specialRoutes = ['/edit-profile', '/payment-methods', '/favourite-organizations', '/organizations', '/completed-classes', '/messages', '/achievements'];
    const isSpecialRoute = specialRoutes.some(route => location.startsWith(route)) || 
                           (location.startsWith('/organizations/') && location.includes('/classes'));

    // Force organization admins to desktop dashboard at root for better UX
    const isOrgAdminAtRoot = user?.role === 'organization_admin' && location === '/';

    if (!isSpecialRoute && !isOrgAdminAtRoot) {
      if (user?.role === 'coach') {
        return <MobileCoach user={user} />;
      } else if (user?.role === 'organization_admin') {
        return <MobileAdmin user={user} />;
      }
      // Temporarily disable mobile routing for members to fix 404 issue
      // } else if (user?.role === 'member') {
      //   return <MobileParticipant user={user} />;
      // }
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
        <Route path="/user-settings" component={UserSettings} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route path="/payment-canceled" component={PaymentCancelled} />
        <Route path="/payment/success" component={PaymentRedirect} />
        <Route path="/payment/cancelled" component={PaymentRedirect} />
        <Route component={UserDashboard} />
      </Switch>
    );
  }

  // This global admin check is now moved above mobile detection

  // Organization Admin Interface  
  if (user?.role === 'organization_admin') {
    return (
      <Switch>
        <Route path="/organization-setup" component={OrganizationSetup} />
        <Route path="/organization-payment" component={OrganizationPayment} />
        <Route path="/" component={() => (
          <OrganizationProvider user={user}>
            <AppLayout>
              <OrganizationDashboard user={user} />
            </AppLayout>
          </OrganizationProvider>
        )} />
        <Route path="/dashboard" component={() => (
          <OrganizationProvider user={user}>
            <AppLayout>
              <OrganizationDashboard user={user} />
            </AppLayout>
          </OrganizationProvider>
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
        <Route path="/user-settings" component={() => (
          <AppLayout>
            <UserSettings />
          </AppLayout>
        )} />
        <Route path="/debit-order-management" component={() => (
          <AppLayout>
            <DebitOrderManagement />
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
        <Route component={() => (
          <AppLayout>
            <Dashboard />
          </AppLayout>
        )} />
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
        <Route component={() => (
          <AppLayout>
            <Dashboard />
          </AppLayout>
        )} />
      </Switch>
    );
  }

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
        <Route path="/completed-classes" component={CompletedClasses} />
        <Route path="/messages" component={Messages} />
        <Route path="/achievements" component={Achievements} />
        <Route path="/debit-order-setup" component={() => import("./pages/debit-order-setup").then(m => m.default)} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route path="/payment-cancelled" component={PaymentCancelled} />
        <Route path="/payment/success" component={PaymentRedirect} />
        <Route path="/payment/cancelled" component={PaymentRedirect} />
        <Route component={UserDashboard} />
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
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean | null;
    user: User | null;
    isLoading: boolean;
  }>({
    isAuthenticated: null,
    user: null,
    isLoading: true
  });
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const bookingId = searchParams.get('booking_id');
  const orgId = searchParams.get('org_id');
  const sessionId: string | null = searchParams.get('session_id');
  const status: string | null = searchParams.get('status');
  const [location] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication status...');
		window.cookieStore.set("sessionId",sessionId || '')
        const currentUser = await api.getCurrentUser();
        console.log('User authenticated:', currentUser);
        setAuthState({
          isAuthenticated: true,
          user: currentUser,
          isLoading: false
        });
      } catch (error) {
        console.log('Authentication failed:', error);
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false
        });
      }
    };

    // Check auth on initial load only, but not if we're already authenticated
    if (authState.isLoading && authState.isAuthenticated === null) {
      checkAuth();
    }
  }, [authState.isLoading, authState.isAuthenticated]);

  const { isAuthenticated, user, isLoading } = authState;

  // Handle invite routes before authentication checks
  if (location.startsWith('/invite/')) {
    return (
      <Switch>
        <Route path="/invite/:inviteCode" component={OrganizationInvite} />
      </Switch>
    );
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#278DD4] mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated user, apply role-based routing regardless of current location
  if (isAuthenticated && user) {
    return (
      <OrganizationProvider user={user}>
        <RoleBasedRouter user={user} setUser={(newUser) => setAuthState(prev => ({ ...prev, user: newUser }))} setIsAuthenticated={(auth) => setAuthState(prev => ({ ...prev, isAuthenticated: auth }))} />
      </OrganizationProvider>
    );
  }

  if(bookingId && status === 'success'){
	return <PaymentSuccess/>
  }

  if(bookingId && status === 'canceled'){
	return <PaymentCancelled/>
  }

  // Show landing page for unauthenticated users at root
  if (!isAuthenticated && location === "/") {
    return <LandingPage />;
  }

  // Show auth page for login/register routes
  if (!isAuthenticated && (location === "/login" || location === "/register")) {
    return <Auth onAuthSuccess={(authenticatedUser) => {
      console.log("Auth success callback received:", authenticatedUser);
      setAuthState({
        isAuthenticated: true,
        user: authenticatedUser,
        isLoading: false
      });
    }} />;
  }

  // Show free trial signup page
  if (!isAuthenticated && location === "/free-trial") {
    return <FreeTrialSignup />;
  }

  // Show password reset page
  if (!isAuthenticated && location === "/reset-password") {
    return <ResetPassword />;
  }

  // Allow organization setup for authenticated users
  if (isAuthenticated && user && location.startsWith("/organization-setup")) {
    return <OrganizationSetup />;
  }

  // Redirect other routes to landing page when not authenticated
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // User is authenticated but no user object (shouldn't happen with new state management)
  if (!user) {
    return <Auth onAuthSuccess={(authenticatedUser) => {
      setAuthState({
        isAuthenticated: true,
        user: authenticatedUser,
        isLoading: false
      });
    }} />;
  }

  return (
    <OrganizationProvider user={user}>
      <RoleBasedRouter user={user} setUser={(newUser) => setAuthState(prev => ({ ...prev, user: newUser }))} setIsAuthenticated={(auth) => setAuthState(prev => ({ ...prev, isAuthenticated: auth }))} />
    </OrganizationProvider>
  );
}

// Dashboard router component that redirects based on user role
function DashboardRouter() {
  const [location, setLocation] = useLocation();

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: api.getCurrentUser,
    retry: false,
  });

  useEffect(() => {
    if (!isLoading) {
      if (!currentUser) {
        console.log("No user found, redirecting to login");
        setLocation("/login");
        return;
      }

      console.log("User found, redirecting based on role:", currentUser.role);

      // Redirect based on user role
      switch (currentUser.role) {
        case 'global_admin':
          setLocation("/global-admin-dashboard");
          break;
        case 'organization_admin':
          setLocation("/organization-dashboard");
          break;
        case 'coach':
          setLocation("/coach-classes");
          break;
        case 'member':
          setLocation("/user-dashboard");
          break;
        default:
          setLocation("/user-dashboard");
      }
    }
  }, [currentUser, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return null; // Will redirect before rendering
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