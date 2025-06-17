import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Clock, MapPin, Filter, X } from "lucide-react";
import { formatTime, formatDate, formatCurrency, getSportColor } from "@/lib/utils";
import ClassForm from "@/components/forms/class-form";
import RealTimeAvailability from "@/components/real-time-availability";
import RealTimeNotifications from "@/components/real-time-notifications";

export default function Classes() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [coachFilter, setCoachFilter] = useState<string | null>(null);
  const [coachName, setCoachName] = useState<string>("");
  const [location, setLocation] = useLocation();

  // Check for coach filter in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const coachId = urlParams.get('coach');
    const coachNameParam = urlParams.get('coachName');
    
    if (coachId) {
      setCoachFilter(coachId);
      setCoachName(coachNameParam ? decodeURIComponent(coachNameParam) : 'Selected Coach');
    }
  }, [location]);

  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => api.getCurrentUser(),
    retry: false
  });

  const { data: organizations } = useQuery({
    queryKey: ['/api/organizations/my'],
    queryFn: () => api.getUserOrganizations(),
    enabled: !!user,
  });

  const organization = organizations?.[0];

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["/api/classes"],
    queryFn: () => api.getClasses({ organizationId: organization?.id || 1 }),
    enabled: !!organization?.id,
  });

  const { data: sports = [] } = useQuery({
    queryKey: ["/api/sports"],
    queryFn: api.getSports,
  });

  // Filter classes by coach if filter is active
  const filteredClasses = coachFilter 
    ? classes.filter(cls => cls.coachId === parseInt(coachFilter))
    : classes;

  const clearCoachFilter = () => {
    setCoachFilter(null);
    setCoachName("");
    setLocation('/classes');
  };

  if (isLoading || !organization) {
    return (
      <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: `${organization?.primaryColor || '#20366B'}10` }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: organization?.primaryColor || '#20366B' }}>Classes & Clinics</h1>
            <p className="text-slate-600">Manage your sports classes and training sessions with ItsHappening.Africa</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: `${organization.primaryColor}10` }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: organization.primaryColor }}>Classes & Clinics</h1>
          <p className="text-slate-600">Manage your sports classes and training sessions with ItsHappening.Africa</p>
          {coachFilter && (
            <div className="flex items-center gap-2 mt-2">
              <Badge 
                variant="outline" 
                className="text-sm"
                style={{ borderColor: organization.secondaryColor, color: organization.primaryColor }}
              >
                <Filter className="mr-1 h-3 w-3" />
                Showing classes for: {coachName}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearCoachFilter}
                className="h-6 w-6 p-0 text-slate-500 hover:text-slate-700"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <RealTimeNotifications userId={user?.id || 1} organizationId={organization.id} />
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button 
                className="text-white shadow-lg border-0"
                style={{ 
                  backgroundColor: organization.accentColor,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${organization.accentColor}dd`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = organization.accentColor;
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Class
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle style={{ color: organization.primaryColor }}>Create New Class</DialogTitle>
              </DialogHeader>
              <div className="max-h-[75vh] overflow-y-auto pr-2">
                <ClassForm 
                  sports={sports}
                  organizationId={user?.organizationId}
                  onSuccess={() => setShowCreateDialog(false)}
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Class Dialog */}
          <Dialog open={!!editingClass} onOpenChange={() => setEditingClass(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-[#20366B]">Edit Class</DialogTitle>
              </DialogHeader>
              <div className="max-h-[75vh] overflow-y-auto pr-2">
                <ClassForm 
                  sports={sports}
                  initialData={editingClass} 
                  onSuccess={() => setEditingClass(null)} 
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.length === 0 && coachFilter ? (
          <div className="col-span-full text-center py-12">
            <div className="text-slate-400 mb-4">
              <Users className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600">No classes found</h3>
              <p className="text-sm text-slate-500 mt-2">
                {coachName} doesn't have any classes scheduled yet.
              </p>
            </div>
            <Button
              onClick={clearCoachFilter}
              variant="outline"
              className="mt-4"
              style={{ borderColor: organization.secondaryColor, color: organization.primaryColor }}
            >
              View All Classes
            </Button>
          </div>
        ) : (
          filteredClasses.map((classItem) => {
            const sportColor = getSportColor(classItem.sport?.name || '');
            const isUpcoming = new Date(classItem.startTime) > new Date();

            return (
            <Card key={classItem.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-[#20366B]">{classItem.name}</CardTitle>
                  <Badge 
                    variant="secondary" 
                    className="text-white border-0"
                    style={{ backgroundColor: organization?.primaryColor || '#278DD4' }}
                  >
                    {classItem.sport?.name}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">{classItem.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" style={{ color: organization.secondaryColor }} />
                    <span className="text-slate-600">{formatTime(classItem.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" style={{ color: organization.secondaryColor }} />
                    <span className="font-medium" style={{ color: organization.primaryColor }}>{classItem.availableSpots || 0}/{classItem.capacity}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin className="h-4 w-4" style={{ color: organization.secondaryColor }} />
                    <span className="text-slate-600">{classItem.location || 'Location TBA'}</span>
                  </div>
                </div>

                {/* Real-time availability component */}
                <RealTimeAvailability
                  classId={classItem.id}
                  className={classItem.name}
                  initialAvailableSpots={classItem.availableSpots || 0}
                  totalSpots={classItem.capacity}
                  userId={1}
                  organization={organization}
                />

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 truncate mb-1">
                      {formatDate(classItem.startTime)}
                    </p>
                    {classItem.price && (
                      <p className="font-semibold text-base" style={{ color: organization.accentColor }}>
                        {formatCurrency(classItem.price)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="hover:text-white"
                      style={{
                        borderColor: organization.secondaryColor,
                        color: organization.secondaryColor
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = organization.secondaryColor;
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = organization.secondaryColor;
                      }}
                      onClick={() => setEditingClass(classItem)}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="sm"
                      disabled={!isUpcoming}
                      className={isUpcoming ? 'text-white border-0' : 'bg-slate-400 text-white'}
                      style={isUpcoming ? { backgroundColor: organization.accentColor } : {}}
                    >
                      {isUpcoming ? 'View Details' : 'Completed'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })
        )}
      </div>

      {filteredClasses.length === 0 && !coachFilter && (
        <div className="text-center py-12">
          <div className="mb-4" style={{ color: organization.secondaryColor }}>
            <Users className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium mb-2" style={{ color: organization.primaryColor }}>No classes yet</h3>
          <p className="text-slate-600 mb-4">Get started by creating your first class or clinic.</p>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="text-white border-0 shadow-lg"
            style={{ backgroundColor: organization.accentColor }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create First Class
          </Button>
        </div>
      )}
    </div>
  );
}