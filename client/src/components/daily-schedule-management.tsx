import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit2, Trash2, Clock, Users, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import DailyScheduleCoachesForm from "@/components/forms/daily-schedule-coaches-form";

const scheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  className: z.string().min(1, "Class name is required"),
  description: z.string().optional(),
  sportId: z.number().optional(),
  coachId: z.number().optional(),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  location: z.string().optional(),
  requirements: z.string().optional(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

interface DailyScheduleManagementProps {
  organizationId: number;
  organization: any;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

export default function DailyScheduleManagement({ organizationId, organization }: DailyScheduleManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch daily schedules
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['/api/daily-schedules', organizationId],
    queryFn: () => api.getDailySchedules(organizationId),
  });

  // Fetch sports for dropdown
  const { data: sports = [] } = useQuery({
    queryKey: ['/api/sports'],
    queryFn: () => api.getSports(),
  });

  // Fetch coaches for dropdown
  const { data: coaches = [] } = useQuery({
    queryKey: ['/api/coaches', { organizationId }],
    queryFn: () => api.getCoaches(organizationId),
  });

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      dayOfWeek: 1,
      startTime: "",
      endTime: "",
      className: "",
      description: "",
      capacity: 20,
      location: "",
      requirements: "",
    },
  });

  // Create schedule mutation
  const createMutation = useMutation({
    mutationFn: (data: ScheduleFormData) => api.createDailySchedule({
      ...data,
      organizationId,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/daily-schedules', organizationId] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Schedule Created",
        description: "Daily schedule has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create daily schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update schedule mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ScheduleFormData }) => 
      api.updateDailySchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/daily-schedules', organizationId] });
      setIsDialogOpen(false);
      setEditingSchedule(null);
      form.reset();
      toast({
        title: "Schedule Updated",
        description: "Daily schedule has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update daily schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete schedule mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteDailySchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/daily-schedules', organizationId] });
      toast({
        title: "Schedule Deleted",
        description: "Daily schedule has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete daily schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ScheduleFormData) => {
    if (editingSchedule) {
      updateMutation.mutate({ id: editingSchedule.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (schedule: any) => {
    setEditingSchedule(schedule);
    form.reset({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      className: schedule.className,
      description: schedule.description || "",
      sportId: schedule.sportId || undefined,
      coachId: schedule.coachId || undefined,
      capacity: schedule.capacity,
      location: schedule.location || "",
      requirements: schedule.requirements || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this schedule?")) {
      deleteMutation.mutate(id);
    }
  };

  const groupedSchedules = schedules.reduce((acc: any, schedule: any) => {
    if (!acc[schedule.dayOfWeek]) {
      acc[schedule.dayOfWeek] = [];
    }
    acc[schedule.dayOfWeek].push(schedule);
    return acc;
  }, {});

  // Sort schedules by start time within each day
  Object.keys(groupedSchedules).forEach(day => {
    groupedSchedules[day].sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with organization-specific branding */}
      <div 
        className="p-8 rounded-xl text-white shadow-lg"
        style={{
          background: `linear-gradient(to right, ${organization?.primaryColor || '#20366B'}, ${organization?.secondaryColor || '#278DD4'}, ${organization?.accentColor || '#24D367'})`
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Daily Schedule Management</h1>
            <p className="text-white/90">
              Manage your weekly schedule for {organization?.name}
            </p>
            <p className="text-sm text-white/75 mt-1">
              Set up recurring classes for your membership programme
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-white hover:bg-white/90"
                style={{ 
                  color: organization?.primaryColor || '#20366B' 
                }}
                onClick={() => {
                  setEditingSchedule(null);
                  form.reset();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pb-4 border-b border-slate-200">
                <DialogTitle 
                  className="text-xl font-bold"
                  style={{ color: organization?.primaryColor || '#20366B' }}
                >
                  {editingSchedule ? "Edit Daily Schedule" : "Add Daily Schedule"}
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  {editingSchedule ? "Update the schedule details below." : "Create a new recurring schedule for your members."}
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="details" className="pt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Schedule Details</TabsTrigger>
                  <TabsTrigger value="coaches">
                    Coach Assignments
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="mt-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dayOfWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel 
                            className="font-semibold"
                            style={{ color: organization?.primaryColor || '#20366B' }}
                          >
                            Day of Week
                          </FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger 
                                className="h-11 border-slate-300"
                                style={{
                                  '--tw-ring-color': organization?.secondaryColor || '#278DD4',
                                  borderColor: organization?.secondaryColor || '#278DD4'
                                } as React.CSSProperties}
                              >
                                <SelectValue placeholder="Select day" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DAYS_OF_WEEK.map((day) => (
                                <SelectItem key={day.value} value={day.value.toString()}>
                                  {day.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="className"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel 
                            className="font-semibold"
                            style={{ color: organization?.primaryColor || '#20366B' }}
                          >
                            Class Name
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Morning Yoga" 
                              className="h-11 border-slate-300"
                              style={{
                                '--tw-ring-color': organization?.secondaryColor || '#278DD4'
                              } as React.CSSProperties}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel 
                            className="font-semibold"
                            style={{ color: organization?.primaryColor || '#20366B' }}
                          >
                            Start Time
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="time" 
                              className="h-11 border-slate-300"
                              style={{
                                '--tw-ring-color': organization?.secondaryColor || '#278DD4'
                              } as React.CSSProperties}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel 
                            className="font-semibold"
                            style={{ color: organization?.primaryColor || '#20366B' }}
                          >
                            End Time
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="time" 
                              className="h-11 border-slate-300"
                              style={{
                                '--tw-ring-color': organization?.secondaryColor || '#278DD4'
                              } as React.CSSProperties}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sportId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#20366B] font-semibold">Sport (Optional)</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]">
                                <SelectValue placeholder="Select sport" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {sports.map((sport: any) => (
                                <SelectItem key={sport.id} value={sport.id.toString()}>
                                  {sport.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="coachId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#20366B] font-semibold">Coach (Optional)</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]">
                                <SelectValue placeholder="Select coach" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {coaches.map((coach: any) => (
                                <SelectItem key={coach.id} value={coach.id.toString()}>
                                  {coach.user?.name || coach.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#20366B] font-semibold">Capacity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              className="h-11 border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#20366B] font-semibold">Location (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Studio A" 
                              className="h-11 border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#20366B] font-semibold">Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of the class..."
                            className="min-h-[80px] border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#20366B] font-semibold">Requirements (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any equipment or prerequisites needed..."
                            className="min-h-[80px] border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="border-slate-300 text-slate-600 hover:bg-slate-50"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r from-[#24D367] to-[#24D3BF] hover:from-[#24D367]/90 hover:to-[#24D3BF]/90 text-white font-semibold"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {createMutation.isPending || updateMutation.isPending ? 
                        "Saving..." : 
                        editingSchedule ? "Update Schedule" : "Create Schedule"
                      }
                    </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="coaches" className="mt-6">
                {editingSchedule && organization ? (
                  <DailyScheduleCoachesForm 
                    dailyScheduleId={editingSchedule.id} 
                    organization={organization}
                  />
                ) : organization ? (
                  <div className="space-y-4">
                    <div className="text-center p-8 border-2 border-dashed border-slate-300 rounded-lg">
                      <Users className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">
                        Create Schedule First
                      </h3>
                      <p className="text-slate-500 mb-4">
                        Please complete the schedule details first, then you can assign coaches to this recurring class.
                      </p>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          const tabs = document.querySelector('[role="tablist"]');
                          const detailsTab = tabs?.querySelector('[value="details"]') as HTMLElement;
                          detailsTab?.click();
                        }}
                        className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      >
                        Go to Schedule Details
                      </Button>
                    </div>
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Weekly Schedule Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#278DD4] mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading schedules...</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {DAYS_OF_WEEK.map((day) => (
            <Card key={day.value} className="border-l-4 border-l-[#278DD4] shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-blue-50/30">
                <CardTitle className="flex items-center text-[#20366B] text-lg font-bold">
                  <Calendar className="h-5 w-5 mr-2 text-[#278DD4]" />
                  {day.label}
                </CardTitle>
                <CardDescription className="text-slate-600 font-medium">
                  {groupedSchedules[day.value]?.length || 0} class
                  {groupedSchedules[day.value]?.length !== 1 ? 'es' : ''} scheduled
                </CardDescription>
              </CardHeader>
              <CardContent>
                {groupedSchedules[day.value]?.length > 0 ? (
                  <div className="space-y-3">
                    {groupedSchedules[day.value].map((schedule: any) => (
                      <div
                        key={schedule.id}
                        className="p-4 bg-gradient-to-r from-[#20366B]/5 to-[#278DD4]/5 rounded-lg border border-[#278DD4]/20"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-[#20366B]">
                                {schedule.className}
                              </h3>
                              <Badge 
                                variant="secondary" 
                                className="bg-[#24D367]/20 text-[#20366B]"
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                {schedule.startTime} - {schedule.endTime}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {schedule.capacity} spots
                              </div>
                              {schedule.location && (
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {schedule.location}
                                </div>
                              )}
                            </div>
                            
                            {schedule.description && (
                              <p className="text-sm text-gray-600 mt-2">
                                {schedule.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex space-x-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(schedule)}
                              className="text-[#278DD4] border-[#278DD4]/30 hover:bg-[#278DD4]/10"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(schedule.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-[#278DD4]/30" />
                    <p className="font-medium text-slate-600">No classes scheduled for {day.label}</p>
                    <p className="text-sm text-slate-500 mt-1">Click "Add Schedule" above to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}