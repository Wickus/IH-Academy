import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Clock, Calendar } from "lucide-react";

const availabilityFormSchema = z.object({
  day: z.string().min(1, "Day is required"),
  isAvailable: z.boolean(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  breakStartTime: z.string().optional(),
  breakEndTime: z.string().optional(),
  notes: z.string().optional(),
});

type AvailabilityFormData = z.infer<typeof availabilityFormSchema>;

interface AvailabilityFormProps {
  coachId: string;
  initialData?: any;
  onSuccess: () => void;
  organization: any;
}

const days = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export default function AvailabilityForm({ coachId, initialData, onSuccess, organization }: AvailabilityFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AvailabilityFormData>({
    resolver: zodResolver(availabilityFormSchema),
    defaultValues: {
      day: initialData?.day || "",
      isAvailable: initialData?.available ?? true,
      startTime: initialData?.startTime || "09:00",
      endTime: initialData?.endTime || "17:00",
      breakStartTime: initialData?.breakStartTime || "",
      breakEndTime: initialData?.breakEndTime || "",
      notes: initialData?.notes || "",
    },
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: async (data: AvailabilityFormData) => {
      const response = await fetch(`/api/coach-availability`, {
        method: initialData?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          coachId: parseInt(coachId),
          id: initialData?.id,
        }),
      });
      if (!response.ok) throw new Error('Failed to update availability');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coach-availability'] });
      toast({
        title: "Availability Updated",
        description: "Coach availability has been successfully updated.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update availability. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: AvailabilityFormData) => {
    setIsSubmitting(true);
    try {
      await updateAvailabilityMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAvailable = form.watch("isAvailable");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Day Selection */}
        <FormField
          control={form.control}
          name="day"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium" style={{ color: organization.primaryColor }}>
                Day *
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger 
                    className="border-slate-300 text-slate-900"
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = organization.secondaryColor;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${organization.secondaryColor}20`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgb(203 213 225)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <SelectValue placeholder="Select a day" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border-slate-300">
                  {days.map((day) => (
                    <SelectItem 
                      key={day} 
                      value={day}
                      className="text-slate-900 focus:bg-transparent data-[highlighted]:bg-transparent"
                      style={{
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.setProperty('background-color', `${organization.secondaryColor}20`, 'important');
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.setProperty('background-color', 'transparent', 'important');
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.setProperty('background-color', `${organization.secondaryColor}20`, 'important');
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.setProperty('background-color', 'transparent', 'important');
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{day}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Availability Toggle */}
        <FormField
          control={form.control}
          name="isAvailable"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="border-slate-300"
                  style={field.value ? {
                    backgroundColor: organization.secondaryColor,
                    borderColor: organization.secondaryColor
                  } : {}}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="font-medium" style={{ color: organization.primaryColor }}>
                  Available on this day
                </FormLabel>
                <p className="text-sm text-slate-600">
                  Check this box if the coach is available on this day
                </p>
              </div>
            </FormItem>
          )}
        />

        {/* Working Hours - Only show if available */}
        {isAvailable && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium" style={{ color: organization.primaryColor }}>
                    Start Time
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="time"
                      {...field}
                      className="border-slate-300 text-slate-900"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = organization.secondaryColor;
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${organization.secondaryColor}20`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgb(203 213 225)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
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
                  <FormLabel className="font-medium" style={{ color: organization.primaryColor }}>
                    End Time
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="time"
                      {...field}
                      className="border-slate-300 text-slate-900"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = organization.secondaryColor;
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${organization.secondaryColor}20`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgb(203 213 225)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Break Times - Optional */}
        {isAvailable && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" style={{ color: organization.primaryColor }} />
              <h4 className="font-medium" style={{ color: organization.primaryColor }}>
                Break Time (Optional)
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="breakStartTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium" style={{ color: organization.primaryColor }}>
                      Break Start
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="time"
                        {...field}
                        className="border-slate-300 text-slate-900"
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = organization.secondaryColor;
                          e.currentTarget.style.boxShadow = `0 0 0 3px ${organization.secondaryColor}20`;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'rgb(203 213 225)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="breakEndTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium" style={{ color: organization.primaryColor }}>
                      Break End
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="time"
                        {...field}
                        className="border-slate-300 text-slate-900"
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = organization.secondaryColor;
                          e.currentTarget.style.boxShadow = `0 0 0 3px ${organization.secondaryColor}20`;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'rgb(203 213 225)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium" style={{ color: organization.primaryColor }}>
                Notes (Optional)
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Additional notes or special instructions..."
                  {...field}
                  className="border-slate-300 text-slate-900"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = organization.secondaryColor;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${organization.secondaryColor}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgb(203 213 225)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Buttons */}
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
            disabled={isSubmitting || updateAvailabilityMutation.isPending}
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
            {isSubmitting || updateAvailabilityMutation.isPending 
              ? "Updating..." 
              : "Update Availability"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}