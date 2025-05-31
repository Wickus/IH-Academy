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
    <nav className="hidden lg:flex lg:flex-col lg:w-72 bg-white/80 backdrop-blur-lg shadow-xl border-r border-white/20">
      <div className="p-8 border-b border-slate-200 bg-white">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
            <Dumbbell className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary drop-shadow-sm">ItsHappening.Africa</h1>
            <p className="text-sm text-primary/80 drop-shadow-sm">Sports Platform</p>
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
                  ? "bg-primary text-white shadow-lg"
                  : "text-slate-600 hover:bg-slate-100 hover:text-primary hover:shadow-md"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-transform duration-200",
                isActive ? "text-white" : "text-slate-500 group-hover:text-primary group-hover:scale-110"
              )} />
              <span className="font-medium">{item.name}</span>
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
