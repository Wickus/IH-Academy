import { useState } from "react";
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
import { CalendarIcon, Clock } from "lucide-react";
import { api, type Sport } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const classFormSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  description: z.string().optional(),
  sportId: z.string().min(1, "Sport is required"),
  coachId: z.string().min(1, "Coach is required"),
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
}

export default function ClassForm({ sports, onSuccess, initialData }: ClassFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: coaches = [] } = useQuery({
    queryKey: ["/api/coaches"],
    queryFn: () => api.getCoaches(1), // Default academy
  });

  const form = useForm<ClassFormData>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      sportId: initialData?.sportId?.toString() || "",
      coachId: initialData?.coachId?.toString() || "",
      startTime: initialData?.startTime ? new Date(initialData.startTime).toISOString().slice(0, 16) : "",
      endTime: initialData?.endTime ? new Date(initialData.endTime).toISOString().slice(0, 16) : "",
      capacity: initialData?.capacity?.toString() || "",
      price: initialData?.price?.toString() || "",
      location: initialData?.location || "",
      requirements: initialData?.requirements || "",
      isRecurring: initialData?.isRecurring || false,
      recurrencePattern: initialData?.recurrencePattern || "",
    },
  });

  const createClassMutation = useMutation({
    mutationFn: api.createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
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
    mutationFn: ({ id, ...data }: any) => api.updateClass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
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

  const onSubmit = async (data: ClassFormData) => {
    setIsSubmitting(true);
    
    try {
      // Combine date and time for startTime and endTime
      const startDateTime = new Date(`${data.startTime}:00`).toISOString();
      const endDateTime = new Date(`${data.endTime}:00`).toISOString();

      const classData = {
        organizationId: 1, // Default organization
        name: data.name,
        description: data.description || null,
        sportId: parseInt(data.sportId),
        coachId: parseInt(data.coachId),
        startTime: startDateTime,
        endTime: endDateTime,
        capacity: parseInt(data.capacity),
        price: parseFloat(data.price),
        location: data.location || null,
        requirements: data.requirements || null,
        isRecurring: data.isRecurring,
        recurrencePattern: data.isRecurring ? data.recurrencePattern || null : null,
      };

      if (initialData?.id) {
        // Update existing class
        await updateClassMutation.mutateAsync({ id: initialData.id, ...classData });
      } else {
        // Create new class
        await createClassMutation.mutateAsync(classData);
      }
    } catch (error) {
      console.error('Failed to create class:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#20366B] font-medium">Class Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Youth Basketball Training" 
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
            name="sportId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#20366B] font-medium">Sport *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4] text-slate-900">
                      <SelectValue placeholder="Select a sport" className="text-slate-900" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white border-slate-300">
                    {sports.map((sport) => (
                      <SelectItem key={sport.id} value={sport.id.toString()} className="text-slate-900 hover:bg-slate-100">
                        <div className="flex items-center space-x-2">
                          <i className={`${sport.icon} text-sm`} style={{ color: sport.color }}></i>
                          <span>{sport.name}</span>
                        </div>
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
              <FormLabel className="text-[#20366B] font-medium">Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe the class objectives, skill level, and what participants can expect..."
                  {...field} 
                  className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4] min-h-[60px] text-slate-900 placeholder:text-slate-500"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Coach and Scheduling */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="coachId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#20366B] font-medium">Coach *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4] text-slate-900">
                      <SelectValue placeholder="Select a coach" className="text-slate-900" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white border-slate-300">
                    {coaches.map((coach) => (
                      <SelectItem key={coach.id} value={coach.id.toString()} className="text-slate-900 hover:bg-slate-100">
                        {coach.user?.name || `Coach ${coach.id}`}
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
                    min="0"
                    step="0.01"
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
                    placeholder="e.g., Court 1, Swimming Pool" 
                    {...field} 
                    className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Additional Information */}
        <FormField
          control={form.control}
          name="requirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#20366B] font-medium">Requirements & Equipment</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="List any equipment, skill level, or preparation requirements..."
                  {...field} 
                  className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4] min-h-[60px] text-slate-900 placeholder:text-slate-500"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Recurring Options */}
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
                    className="border-slate-300 data-[state=checked]:bg-[#278DD4] data-[state=checked]:border-[#278DD4]"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-[#20366B] font-medium">Recurring Class</FormLabel>
                  <p className="text-sm text-slate-600">
                    This class will repeat according to the schedule pattern
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4] text-slate-900">
                        <SelectValue placeholder="Select recurrence pattern" className="text-slate-900" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border-slate-300">
                      <SelectItem value="daily" className="text-slate-900 hover:bg-slate-100">Daily</SelectItem>
                      <SelectItem value="weekly" className="text-slate-900 hover:bg-slate-100">Weekly</SelectItem>
                      <SelectItem value="biweekly" className="text-slate-900 hover:bg-slate-100">Bi-weekly</SelectItem>
                      <SelectItem value="monthly" className="text-slate-900 hover:bg-slate-100">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200">
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
            className="bg-[#24D367] hover:bg-[#1fb557] text-white border-0 shadow-lg"
          >
            {isSubmitting || createClassMutation.isPending || updateClassMutation.isPending 
              ? (initialData?.id ? "Updating..." : "Creating...") 
              : (initialData?.id ? "Update Class" : "Create Class")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
