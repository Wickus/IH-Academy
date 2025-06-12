import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar, 
  Users, 
  UserCheck, 
  Presentation, 
  CreditCard, 
  BarChart3, 
  Settings,
  Dumbbell 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";


const navigation = [
  { name: "Dashboard", href: "/", icon: Calendar },
  { name: "Classes & Clinics", href: "/classes", icon: Users },
  { name: "Bookings", href: "/bookings", icon: UserCheck },
  { name: "Coaches", href: "/coaches", icon: Presentation },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => api.getCurrentUser(),
    retry: false
  });

  const { data: userOrganizations } = useQuery({
    queryKey: ["/api/organizations/my"],
    queryFn: api.getUserOrganizations,
    enabled: !!user && user.role !== 'global_admin'
  });

  const organization = userOrganizations?.[0];

  return (
    <nav className="hidden lg:flex lg:flex-col lg:w-72 bg-white/80 backdrop-blur-lg shadow-xl border-r border-white/20">
      <div className="p-8 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-center">
          <div className="py-4">
            <h1 className="text-2xl font-bold" style={{ color: '#20366B' }}>ItsBooked</h1>
          </div>
        </div>
      </div>
      
      <div className="flex-1 px-6 py-8 space-y-3">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-4 px-4 py-3 rounded-xl font-medium transition-all duration-200 group",
                isActive
                  ? "text-white shadow-lg"
                  : "text-slate-600 hover:bg-slate-100 hover:shadow-md"
              )}
              style={{
                backgroundColor: isActive ? (organization?.accentColor || '#24D367') : 'transparent',
                color: isActive ? 'white' : undefined
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = organization?.primaryColor || '#20366B';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#64748b'; // text-slate-600
                }
              }}
            >
              <Icon className={cn(
                "w-5 h-5 transition-transform duration-200",
                isActive ? "text-white" : "text-slate-500 group-hover:scale-110"
              )} 
              style={{
                color: isActive ? 'white' : undefined
              }}
              />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: organization?.primaryColor || '#20366B' }}
          >
            <span className="text-sm font-medium">
              {user?.username?.slice(0, 2).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.username || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {organization?.name || 'Organization'}
            </p>
          </div>
        </div>
      </div>
    </nav>
  );
}
