import { Link, useLocation } from "wouter";
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

  return (
    <nav className="hidden lg:flex lg:flex-col lg:w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Dumbbell className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">SportBook Pro</h1>
            <p className="text-sm text-muted-foreground">Academy Management</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">SJ</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Sarah Johnson</p>
            <p className="text-xs text-muted-foreground truncate">Elite Sports Academy</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
