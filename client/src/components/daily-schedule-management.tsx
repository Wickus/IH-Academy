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
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

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
    <div className="space-y-6">
      {/* Header with ItsHappening.Africa branding */}
      <div className="bg-gradient-to-r from-[#20366B] via-[#278DD4] to-[#24D367] p-6 rounded-lg text-white">
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
                className="bg-white text-[#20366B] hover:bg-white/90"
                onClick={() => {
                  setEditingSchedule(null);
                  form.reset();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-[#20366B]">
                  {editingSchedule ? "Edit Daily Schedule" : "Add Daily Schedule"}
                </DialogTitle>
                <DialogDescription>
                  {editingSchedule ? "Update the schedule details below." : "Create a new recurring schedule for your members."}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dayOfWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Day of Week</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
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
                          <FormLabel>Class Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Morning Yoga" {...field} />
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
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
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
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
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
                          <FormLabel>Sport (Optional)</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
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
                          <FormLabel>Coach (Optional)</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
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
                          <FormLabel>Capacity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
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
                          <FormLabel>Location (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Studio A" {...field} />
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
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of the class..."
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
                        <FormLabel>Requirements (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any equipment or prerequisites needed..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-[#24D367] hover:bg-[#24D367]/90"
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
            <Card key={day.value} className="border-l-4 border-l-[#278DD4]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-[#20366B]">
                  <Calendar className="h-5 w-5 mr-2" />
                  {day.label}
                </CardTitle>
                <CardDescription>
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
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No classes scheduled for {day.label}</p>
                    <p className="text-sm">Add a schedule to get started</p>
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