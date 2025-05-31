import { Button } from "@/components/ui/button";
import { Bell, Menu, Plus } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="lg:hidden p-2 hover:bg-gray-100">
            <Menu className="h-5 w-5 text-slate-700" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
            <p className="text-sm text-slate-600">Manage your academy bookings and classes</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="relative p-2 hover:bg-gray-100">
            <Bell className="h-5 w-5 text-slate-600" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">New Class</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
