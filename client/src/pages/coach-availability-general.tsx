import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Save } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface AvailabilitySlot {
  day: string;
  available: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  notes?: string;
}

export default function CoachAvailabilityGeneral() {
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => api.getCurrentUser(),
    retry: false
  });

  const { data: userOrganizations = [], isLoading: organizationsLoading } = useQuery({
    queryKey: ["/api/organizations/my"],
    queryFn: () => api.getUserOrganizations(),
    enabled: !!user
  });

  const daysOfWeek = [
    { key: 'monday', name: 'Monday' },
    { key: 'tuesday', name: 'Tuesday' },
    { key: 'wednesday', name: 'Wednesday' },
    { key: 'thursday', name: 'Thursday' },
    { key: 'friday', name: 'Friday' },
    { key: 'saturday', name: 'Saturday' },
    { key: 'sunday', name: 'Sunday' }
  ];

  const [availability, setAvailability] = useState<AvailabilitySlot[]>(
    daysOfWeek.map(day => ({
      day: day.key,
      available: false,
      startTime: '09:00',
      endTime: '17:00',
      breakStart: '12:00',
      breakEnd: '13:00',
      notes: ''
    }))
  );

  const updateAvailability = (dayKey: string, updates: Partial<AvailabilitySlot>) => {
    setAvailability(prev => 
      prev.map(slot => 
        slot.day === dayKey ? { ...slot, ...updates } : slot
      )
    );
  };

  const saveAvailabilityMutation = useMutation({
    mutationFn: async () => {
      // This would normally save to the backend
      // For now, we'll just simulate a save
      await new Promise(resolve => setTimeout(resolve, 1000));
      return availability;
    },
    onSuccess: () => {
      toast({
        title: "Availability Updated",
        description: "Your weekly availability has been saved successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/coach-availability'] });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save your availability. Please try again.",
        variant: "destructive"
      });
    }
  });

  if (userLoading || organizationsLoading) {
    return (
      <div className="p-6 lg:p-10 space-y-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-[#20366B]">Weekly Availability</h1>
          <p className="text-slate-600">Set your weekly schedule for coaching sessions.</p>
        </div>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#278DD4] mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-slate-600 mb-2">Loading your schedule...</h3>
            <p className="text-slate-500">Please wait while we fetch your availability settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-[#20366B]">Weekly Availability</h1>
        <p className="text-slate-600">Set your weekly schedule for coaching sessions.</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[#20366B] to-[#278DD4] text-white">
          <CardTitle className="text-2xl flex items-center gap-3">
            <Calendar className="h-6 w-6" />
            Weekly Schedule
          </CardTitle>
          <p className="text-white/90">
            Configure your availability for each day of the week. Organizations can book sessions during your available hours.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {daysOfWeek.map((day, index) => {
              const dayAvailability = availability.find(a => a.day === day.key);
              return (
                <Card key={day.key} className="border border-slate-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-[#278DD4]"></div>
                        <h3 className="text-lg font-semibold text-[#20366B]">{day.name}</h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`available-${day.key}`} className="text-sm font-medium">
                          Available
                        </Label>
                        <Switch
                          id={`available-${day.key}`}
                          checked={dayAvailability?.available || false}
                          onCheckedChange={(checked) => 
                            updateAvailability(day.key, { available: checked })
                          }
                        />
                      </div>
                    </div>
                  </CardHeader>
                  
                  {dayAvailability?.available && (
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`start-${day.key}`} className="text-sm font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Start Time
                          </Label>
                          <Input
                            id={`start-${day.key}`}
                            type="time"
                            value={dayAvailability.startTime}
                            onChange={(e) => 
                              updateAvailability(day.key, { startTime: e.target.value })
                            }
                            className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`end-${day.key}`} className="text-sm font-medium">
                            End Time
                          </Label>
                          <Input
                            id={`end-${day.key}`}
                            type="time"
                            value={dayAvailability.endTime}
                            onChange={(e) => 
                              updateAvailability(day.key, { endTime: e.target.value })
                            }
                            className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`break-start-${day.key}`} className="text-sm font-medium">
                            Break Start
                          </Label>
                          <Input
                            id={`break-start-${day.key}`}
                            type="time"
                            value={dayAvailability.breakStart || ''}
                            onChange={(e) => 
                              updateAvailability(day.key, { breakStart: e.target.value })
                            }
                            className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
                            placeholder="Optional"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`break-end-${day.key}`} className="text-sm font-medium">
                            Break End
                          </Label>
                          <Input
                            id={`break-end-${day.key}`}
                            type="time"
                            value={dayAvailability.breakEnd || ''}
                            onChange={(e) => 
                              updateAvailability(day.key, { breakEnd: e.target.value })
                            }
                            className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <Label htmlFor={`notes-${day.key}`} className="text-sm font-medium">
                          Notes (Optional)
                        </Label>
                        <Textarea
                          id={`notes-${day.key}`}
                          value={dayAvailability.notes || ''}
                          onChange={(e) => 
                            updateAvailability(day.key, { notes: e.target.value })
                          }
                          placeholder="Add any specific notes for this day..."
                          className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4] resize-none"
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
          
          <div className="mt-8 flex justify-end">
            <Button
              onClick={() => saveAvailabilityMutation.mutate()}
              disabled={saveAvailabilityMutation.isPending}
              className="bg-[#278DD4] hover:bg-[#20366B] text-white font-medium px-6 py-2"
            >
              {saveAvailabilityMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Availability
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Organization Summary */}
      {userOrganizations.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-[#20366B]/10">
            <CardTitle className="text-[#20366B]">Your Organizations</CardTitle>
            <p className="text-slate-600">
              Your availability applies to sessions with these organizations.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userOrganizations.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg"
                >
                  {org.logo ? (
                    <img 
                      src={org.logo} 
                      alt={`${org.name} logo`}
                      className="w-10 h-10 rounded-full object-cover border-2"
                      style={{ borderColor: org.secondaryColor + '40' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${org.logo ? 'hidden' : ''}`}
                    style={{ backgroundColor: org.primaryColor }}
                  >
                    {org.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">{org.name}</h4>
                    <p className="text-sm text-slate-600 capitalize">{org.businessModel} model</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}