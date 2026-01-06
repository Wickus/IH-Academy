import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Clock, User, Users, X } from "lucide-react";
import { api, type Sport } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

const classFormSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  description: z.string().optional(),
  sportId: z.string().min(1, "Sport is required"),
  coachId: z.string().optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  capacity: z.string().min(1, "Capacity is required"),
  price: z.string().min(1, "Price is required"),
  location: z.string().optional(),
  requirements: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.string().optional(),
});

type ClassFormData = z.infer<typeof classFormSchema>;

interface ClassFormProps {
  sports: Sport[];
  onSuccess: () => void;
  initialData?: any;
  organizationId?: number;
}

export default function ClassForm({ sports, onSuccess, initialData, organizationId }: ClassFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCoaches, setSelectedCoaches] = useState<number[]>([]);

  const { data: organizations } = useQuery({
    queryKey: ["/api/organizations/my"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/organizations/my');
      return response.json();
    },
  });

  const organizationsArray = Array.isArray(organizations) ? organizations : [];
  const organization = organizationsArray.find((org: any) => org.id === organizationId) || organizationsArray[0] || {
    primaryColor: "#20366B",
    secondaryColor: "#278DD4", 
    accentColor: "#24D367"
  };

  const { data: coaches = [], isLoading: coachesLoading } = useQuery({
    queryKey: ["/api/coaches"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/coaches');
      return response.json();
    },
  });

  // Fetch existing coach assignments when editing a class
  const { data: classCoaches = [], isLoading: classCoachesLoading } = useQuery({
    queryKey: ["/api/classes", initialData?.id, "coaches"],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/classes/${initialData!.id}/coaches`);
      return response.json();
    },
    enabled: !!initialData?.id,
  });

  // Convert data to arrays for safe processing
  const coachesArray = Array.isArray(coaches) ? coaches : [];
  const classCoachesArray = Array.isArray(classCoaches) ? classCoaches : [];

  // Initialize selected coaches from class coach assignments
  useEffect(() => {
    console.log('ClassForm coach data:', { 
      classCoaches, 
      classCoachesArray, 
      coachesArray,
      coaches,
      initialData: initialData?.id,
      coachesLoading,
      classCoachesLoading,
      coachesType: typeof coaches,
      classCoachesType: typeof classCoaches,
      coachesIsArray: Array.isArray(coaches),
      classCoachesIsArray: Array.isArray(classCoaches)
    });
    
    // Wait for data to load
    if (coachesLoading || classCoachesLoading) {
      console.log('Still loading data...');
      return;
    }
    
    if (classCoachesArray.length > 0) {
      // Sort by role priority (primary, assistant, substitute)
      const sortedCoaches = [...classCoachesArray].sort((a: any, b: any) => {
        const roleOrder: { [key: string]: number } = { primary: 0, assistant: 1, substitute: 2 };
        return (roleOrder[a.role] || 3) - (roleOrder[b.role] || 3);
      });
      const coachIds = sortedCoaches.map((cc: any) => cc.coachId);
      console.log('Setting selected coaches from assignments:', coachIds, 'sortedCoaches:', sortedCoaches);
      setSelectedCoaches(coachIds);
    } else if (initialData?.coachId && classCoachesArray.length === 0) {
      // Fallback to initial coachId if no coach assignments exist yet
      console.log('Setting selected coaches from initialData:', [initialData.coachId]);
      setSelectedCoaches([initialData.coachId]);
    }
  }, [classCoaches, classCoachesArray, initialData, coaches, coachesArray, coachesLoading, classCoachesLoading]);

  // Helper to convert ISO date string to datetime-local format
  const formatDateTimeLocal = (dateStr: string | undefined): string => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      // Format as YYYY-MM-DDTHH:MM in local time
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  };

  const form = useForm<ClassFormData>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      sportId: initialData?.sportId?.toString() || "",
      coachId: initialData?.coachId?.toString() || "",
      startTime: formatDateTimeLocal(initialData?.startTime),
      endTime: formatDateTimeLocal(initialData?.endTime),
      capacity: initialData?.capacity?.toString() || "",
      price: initialData?.price?.toString() || "",
      location: initialData?.location || "",
      requirements: initialData?.requirements || "",
      isRecurring: initialData?.isRecurring || false,
      recurrencePattern: initialData?.recurrencePattern || "",
    },
  });

  const createClassMutation = useMutation({
    mutationFn: (data: any) => {
      // Include selectedCoaches in the data to let backend handle assignments
      const createData = {
        ...data,
        selectedCoaches: selectedCoaches
      };
      return api.createClass(createData);
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      
      // Invalidate coach assignments cache if class ID exists
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/classes", data.id, "coaches"] });
      }

      toast({
        title: "Class created",
        description: "Your class has been created successfully.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create class. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateClassMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => {
      // Include selectedCoaches in the data to let backend handle assignments
      const updateData = {
        ...data,
        selectedCoaches: selectedCoaches
      };
      return api.updateClass(id, updateData);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      
      // Invalidate coach assignments cache if class ID exists
      if (initialData?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/classes", initialData.id, "coaches"] });
      }

      toast({
        title: "Class updated",
        description: "Your class has been updated successfully.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update class. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: () => api.deleteClass(initialData.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Class deleted",
        description: "The class has been deleted successfully.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete class. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ClassFormData) => {
    setIsSubmitting(true);
    try {
      const classData = {
        ...data,
        sportId: parseInt(data.sportId),
        coachId: data.coachId ? parseInt(data.coachId) : null,
        capacity: parseInt(data.capacity),
        price: parseFloat(data.price),
        organizationId: initialData?.organizationId || organizationId || 1, // Preserve existing organizationId for updates
        selectedCoaches, // Include selected coaches in submission
      };

      if (initialData?.id) {
        updateClassMutation.mutate({ id: initialData.id, ...classData });
      } else {
        createClassMutation.mutate(classData);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCoach = (coachId: string) => {
    const id = parseInt(coachId);
    if (!selectedCoaches.includes(id)) {
      const newCoaches = [...selectedCoaches, id];
      // Ensure unique IDs
      const uniqueCoaches = newCoaches.filter((value, index, self) => self.indexOf(value) === index);
      setSelectedCoaches(uniqueCoaches);
    }
  };

  const removeCoach = (coachId: number) => {
    setSelectedCoaches(selectedCoaches.filter(id => id !== coachId));
  };

  const getCoachName = (coachId: number) => {
    const coach = coachesArray.find((c: any) => c.id === coachId || c.userId === coachId);
    return coach?.user?.name || coach?.displayName || coach?.name || coach?.username || 'Unknown Coach';
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium" style={{ color: organization.primaryColor }}>Class Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Youth Basketball Training" 
                    {...field} 
                    className="border-slate-300"
                    onFocus={(e) => {
                      e.target.style.borderColor = organization.secondaryColor;
                      e.target.style.boxShadow = `0 0 0 3px ${organization.secondaryColor}20`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sportId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium" style={{ color: organization.primaryColor }}>Sport *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger 
                      className="border-slate-300"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = organization.secondaryColor;
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${organization.secondaryColor}20`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <SelectValue placeholder="Select a sport" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white border-slate-300">
                    {sports.map((sport) => (
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
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium" style={{ color: organization.primaryColor }}>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Class description and details..." 
                  {...field} 
                  className="border-slate-300 min-h-[100px]"
                  onFocus={(e) => {
                    e.target.style.borderColor = organization.secondaryColor;
                    e.target.style.boxShadow = `0 0 0 3px ${organization.secondaryColor}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Coach Selection */}
        <div className="space-y-3">
          <FormLabel className="font-medium" style={{ color: organization.primaryColor }}>
            <Users className="inline h-4 w-4 mr-1" />
            Assigned Coaches
          </FormLabel>
          
          {/* Selected Coaches Display */}
          <div className="space-y-2">
            <div 
              className="min-h-[60px] p-3 border-2 border-dashed rounded-lg flex items-center"
              style={{ borderColor: organization.secondaryColor + '40' }}
            >
              {selectedCoaches.length === 0 ? (
                <span className="text-slate-500">Select coaches (optional)</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedCoaches.map((coachId, index) => {
                    const coach = coachesArray.find((c: any) => c.id === coachId || c.userId === coachId);
                    console.log('Looking for coach:', coachId, 'Found:', coach, 'Available coaches:', coachesArray);
                    if (!coach) return null;
                    return (
                      <div 
                        key={`coach-${coachId}-${index}`}
                        className="inline-flex items-center px-2 py-1 rounded-md text-sm text-white"
                        style={{ backgroundColor: organization.primaryColor }}
                      >
                        <span className="mr-1">
                          {index === 0 && <User className="h-3 w-3" />}
                          {index === 1 && <Users className="h-3 w-3" />}
                          {index >= 2 && <Users className="h-3 w-3" />}
                        </span>
                        {getCoachName(coachId)} 
                        <span className="ml-1 text-xs opacity-75">
                          ({index === 0 ? 'Primary' : index === 1 ? 'Assistant' : 'Substitute'})
                        </span>
                        <button
                          type="button"
                          onClick={() => removeCoach(coachId)}
                          className="ml-2 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Coach Selection Dropdown */}
            <div className="flex items-center gap-2">
              <Select onValueChange={addCoach} value="">
                <SelectTrigger 
                  className="w-full border-slate-300"
                  style={{
                    borderColor: organization.secondaryColor + '80'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.setProperty('border-color', organization.secondaryColor, 'important');
                    e.currentTarget.style.setProperty('box-shadow', `0 0 0 3px ${organization.secondaryColor}20`, 'important');
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.setProperty('border-color', organization.secondaryColor + '80', 'important');
                    e.currentTarget.style.setProperty('box-shadow', 'none', 'important');
                  }}
                >
                  <SelectValue placeholder="Add a coach..." className="text-slate-900" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-300">
                  {coachesArray
                    .filter((coach: any) => !selectedCoaches.includes(coach.id))
                    .map((coach: any) => (
                    <SelectItem 
                      key={coach.id} 
                      value={coach.id.toString()}
                      className="text-slate-900 focus:bg-transparent data-[highlighted]:bg-transparent"
                      style={{ backgroundColor: 'transparent' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.setProperty('background-color', `${organization.secondaryColor}20`, 'important');
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.setProperty('background-color', 'transparent', 'important');
                      }}
                    >
                      {coach.user?.name || coach.displayName || coach.name || coach.username || 'Unknown Coach'}
                    </SelectItem>
                  ))}
                  {coachesArray.filter((coach: any) => !selectedCoaches.includes(coach.id)).length === 0 && (
                    <div className="px-2 py-2 text-sm text-slate-500">
                      All available coaches have been selected
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              You can assign multiple coaches to this class. The first coach selected will be the primary coach.
            </p>
          </div>
        </div>

        {/* Schedule Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#20366B] font-medium">Start Date & Time *</FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    {...field} 
                    className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
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
                <FormLabel className="text-[#20366B] font-medium">End Date & Time *</FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    {...field} 
                    className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Capacity and Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#20366B] font-medium">Capacity *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Maximum participants"
                    min="1"
                    {...field} 
                    className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#20366B] font-medium">Price (ZAR) *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    {...field} 
                    className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
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
                <FormLabel className="text-[#20366B] font-medium">Location</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Main Court"
                    {...field} 
                    className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="requirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#20366B] font-medium">Requirements</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="e.g., Must bring own equipment, minimum skill level..."
                  {...field} 
                  className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4] min-h-[80px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Recurring Class Options */}
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="isRecurring"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="border-slate-300"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-[#20366B] font-medium">
                    Recurring Class
                  </FormLabel>
                  <p className="text-sm text-slate-600">
                    This class will repeat according to the selected pattern
                  </p>
                </div>
              </FormItem>
            )}
          />

          {form.watch("isRecurring") && (
            <FormField
              control={form.control}
              name="recurrencePattern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#20366B] font-medium">Recurrence Pattern</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]">
                        <SelectValue placeholder="Select recurrence pattern" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {initialData?.id && (
            <Button 
              type="button"
              variant="destructive"
              onClick={() => deleteClassMutation.mutate()}
              disabled={deleteClassMutation.isPending}
              className="order-3 sm:order-1"
            >
              {deleteClassMutation.isPending ? "Deleting..." : "Delete Class"}
            </Button>
          )}
          <div className="flex gap-3 order-1 sm:order-2 sm:ml-auto">
            <Button 
              type="button"
              variant="outline"
              onClick={onSuccess}
              className="border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || createClassMutation.isPending || updateClassMutation.isPending}
              className="text-white border-0 shadow-lg"
              style={{ 
                backgroundColor: organization.accentColor,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = organization.secondaryColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = organization.accentColor;
              }}
            >
              {isSubmitting || createClassMutation.isPending || updateClassMutation.isPending 
                ? (initialData?.id ? "Updating..." : "Creating...") 
                : (initialData?.id ? "Update Class" : "Create Class")
              }
            </Button>
          </div>
        </div>
        </form>
      </Form>
    </div>
  );
}