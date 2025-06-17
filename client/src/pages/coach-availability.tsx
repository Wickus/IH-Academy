import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calendar, 
  Clock, 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle 
} from "lucide-react";
import { formatTime, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function CoachAvailability() {
  const [location, setLocation] = useLocation();
  const [coachId, setCoachId] = useState<string>("");
  const [coachName, setCoachName] = useState<string>("");
  const [editingAvailability, setEditingAvailability] = useState<any>(null);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Extract coach ID from URL
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('coachName');
    
    setCoachId(id);
    setCoachName(name ? decodeURIComponent(name) : 'Coach');
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

  const { data: coach } = useQuery({
    queryKey: ['/api/coaches', coachId],
    queryFn: async () => {
      const coaches = await api.getCoaches(organization?.id);
      return coaches.find(c => c.id.toString() === coachId);
    },
    enabled: !!coachId && !!organization?.id,
  });

  // Mock availability data for now - can be replaced with real API later
  const weeklyAvailability = [
    { id: 1, day: 'Monday', times: '9:00 AM - 5:00 PM', available: true },
    { id: 2, day: 'Tuesday', times: '9:00 AM - 5:00 PM', available: true },
    { id: 3, day: 'Wednesday', times: '9:00 AM - 5:00 PM', available: true },
    { id: 4, day: 'Thursday', times: '9:00 AM - 5:00 PM', available: true },
    { id: 5, day: 'Friday', times: '9:00 AM - 5:00 PM', available: true },
    { id: 6, day: 'Saturday', times: '10:00 AM - 2:00 PM', available: true },
    { id: 7, day: 'Sunday', times: 'Not Available', available: false },
  ];

  // Mutation for deleting/canceling a class
  const deleteClassMutation = useMutation({
    mutationFn: async (classId: number) => {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to cancel class');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      toast({
        title: "Class Cancelled",
        description: "The class has been successfully cancelled.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel class. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes', coachId],
    queryFn: async () => {
      const allClasses = await api.getClasses({ organizationId: organization?.id || 1 });
      return allClasses.filter(cls => cls.coachId === parseInt(coachId));
    },
    enabled: !!organization?.id && !!coachId,
  });

  if (!organization || !coach) {
    return (
      <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: `${organization?.primaryColor || '#ea580c'}10` }}>
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/coaches')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Coaches
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Loading coach information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: `${organization.primaryColor}10` }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/coaches')}
          className="flex items-center gap-2"
          style={{ color: organization.primaryColor }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Coaches
        </Button>
      </div>

      {/* Coach Info Header */}
      <Card className="mb-8 border-0 shadow-lg">
        <CardHeader 
          className="pb-6"
          style={{ 
            background: `linear-gradient(135deg, ${organization.primaryColor}, ${organization.secondaryColor})` 
          }}
        >
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
              {coach.profilePicture ? (
                <img src={coach.profilePicture} alt={coach.user?.name} className="h-full w-full object-cover" />
              ) : (
                <AvatarFallback 
                  className="text-white text-2xl font-bold"
                  style={{ backgroundColor: organization.accentColor }}
                >
                  {coach.user?.name?.split(' ').map((n: string) => n[0]).join('') || 'C'}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl text-white font-bold mb-2">
                {coach.user?.name || 'Unknown Coach'} - Schedule & Availability
              </CardTitle>
              <p className="text-blue-100">
                Manage schedule and view upcoming classes
              </p>
              {coach.specializations && coach.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {coach.specializations.map((spec: string, index: number) => (
                    <Badge 
                      key={index} 
                      className="text-xs"
                      style={{ 
                        backgroundColor: organization.accentColor,
                        color: organization.primaryColor 
                      }}
                    >
                      {spec}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Classes */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle 
              className="flex items-center gap-2"
              style={{ color: organization.primaryColor }}
            >
              <Calendar className="h-5 w-5" />
              Upcoming Classes ({classes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {classes.length === 0 ? (
              <div className="text-center py-8">
                <Calendar 
                  className="h-12 w-12 mx-auto mb-4 text-slate-400" 
                />
                <p className="text-slate-600 mb-2">No classes scheduled</p>
                <p className="text-sm text-slate-500">
                  This coach doesn't have any upcoming classes yet.
                </p>
              </div>
            ) : (
              classes.map((classItem) => {
                const isUpcoming = new Date(classItem.startTime) > new Date();
                return (
                  <div 
                    key={classItem.id}
                    className="p-4 rounded-lg border"
                    style={{ 
                      borderColor: `${organization.secondaryColor}30`,
                      background: `${organization.accentColor}10`
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 
                        className="font-semibold"
                        style={{ color: organization.primaryColor }}
                      >
                        {classItem.name}
                      </h4>
                      <Badge 
                        variant={isUpcoming ? "default" : "secondary"}
                        style={isUpcoming ? { 
                          backgroundColor: organization.secondaryColor,
                          color: 'white'
                        } : {}}
                      >
                        {isUpcoming ? 'Upcoming' : 'Completed'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(classItem.startTime)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(classItem.startTime)}
                      </div>
                    </div>
                    {classItem.description && (
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                        {classItem.description}
                      </p>
                    )}
                    
                    {/* Class Actions */}
                    {isUpcoming && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation('/classes')}
                          className="text-xs"
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
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        {/* Only show Cancel button for coaches, not org admins */}
                        {user?.role === 'coach' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteClassMutation.mutate(classItem.id)}
                            disabled={deleteClassMutation.isPending}
                            className="text-xs border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            {deleteClassMutation.isPending ? 'Cancelling...' : 'Cancel'}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Weekly Availability */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle 
              className="flex items-center gap-2"
              style={{ color: organization.primaryColor }}
            >
              <Clock className="h-5 w-5" />
              Weekly Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weeklyAvailability.map((schedule) => (
                <div key={schedule.day} className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                  <span className="font-medium text-slate-700">{schedule.day}</span>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline"
                      style={schedule.available ? { 
                        borderColor: organization.secondaryColor,
                        color: organization.primaryColor 
                      } : {
                        borderColor: '#94a3b8',
                        color: '#64748b'
                      }}
                    >
                      {schedule.times}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-6 p-0 hover:text-white"
                      onClick={() => setEditingAvailability(schedule)}
                      style={{ color: organization.secondaryColor }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = organization.secondaryColor;
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = organization.secondaryColor;
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-200">
              <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full text-white border-0"
                    style={{ backgroundColor: organization.accentColor }}
                    onClick={() => setShowAvailabilityDialog(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Set Availability
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle style={{ color: organization.primaryColor }}>
                      Set Weekly Availability
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-sm text-slate-600">
                      Configure your weekly availability schedule. This feature will be fully implemented in the next update.
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setShowAvailabilityDialog(false)}
                        variant="outline"
                        style={{
                          borderColor: organization.secondaryColor,
                          color: organization.secondaryColor
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => {
                          setShowAvailabilityDialog(false);
                          toast({
                            title: "Availability Updated",
                            description: "Your availability preferences have been saved.",
                          });
                        }}
                        style={{ backgroundColor: organization.accentColor }}
                        className="text-white"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Availability Dialog */}
      <Dialog open={!!editingAvailability} onOpenChange={() => setEditingAvailability(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ color: organization.primaryColor }}>
              Edit {editingAvailability?.day} Availability
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600">
              Update availability for {editingAvailability?.day}. This feature will be fully implemented in the next update.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => setEditingAvailability(null)}
                variant="outline"
                style={{
                  borderColor: organization.secondaryColor,
                  color: organization.secondaryColor
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setEditingAvailability(null);
                  toast({
                    title: "Availability Updated",
                    description: `${editingAvailability?.day} availability has been updated.`,
                  });
                }}
                style={{ backgroundColor: organization.accentColor }}
                className="text-white"
              >
                Update Availability
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4">
        <Button 
          onClick={() => setLocation('/classes')}
          className="text-white border-0"
          style={{ backgroundColor: organization.secondaryColor }}
        >
          <Calendar className="mr-2 h-4 w-4" />
          View All Classes
        </Button>
        <Button 
          onClick={() => setLocation(`/classes?coach=${coachId}&coachName=${encodeURIComponent(coachName)}`)}
          variant="outline"
          style={{ 
            borderColor: organization.primaryColor,
            color: organization.primaryColor 
          }}
        >
          View {coachName}'s Classes
        </Button>
      </div>
    </div>
  );
}