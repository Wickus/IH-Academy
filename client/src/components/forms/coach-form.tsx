import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useOrganization } from "@/contexts/organization-context";

const coachFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  bio: z.string().optional(),
  specializations: z.string().optional(),
  hourlyRate: z.string().optional(),
  phone: z.string().optional(),
  profilePicture: z.string().optional(),
});

type CoachFormData = z.infer<typeof coachFormSchema>;

interface CoachFormProps {
  onSuccess: () => void;
  initialData?: any;
  isEdit?: boolean;
  editId?: number;
}

export default function CoachForm({ onSuccess, initialData, isEdit = false, editId }: CoachFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { organization } = useOrganization();

  const form = useForm<CoachFormData>({
    resolver: zodResolver(coachFormSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
      specializations: "",
      hourlyRate: "",
      phone: "",
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      const formData = {
        name: initialData.displayName || initialData.user?.name || "",
        email: initialData.contactEmail || initialData.user?.email || "",
        bio: initialData.bio || "",
        specializations: Array.isArray(initialData.specializations) 
          ? initialData.specializations.join(", ") 
          : initialData.specializations || "",
        hourlyRate: initialData.hourlyRate?.toString() || "",
        phone: initialData.phone || initialData.user?.phone || "",
      };
      
      // Use setTimeout to ensure form is mounted before resetting
      setTimeout(() => {
        form.reset(formData);
      }, 0);
    }
  }, [initialData, form]);

  const createCoachMutation = useMutation({
    mutationFn: api.createCoach,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coaches"] });
      toast({
        title: "Success",
        description: "Coach created successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create coach",
        variant: "destructive",
      });
    },
  });

  const updateCoachMutation = useMutation({
    mutationFn: (data: any) => api.updateCoach(editId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coaches"] });
      toast({
        title: "Success",
        description: "Coach updated successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update coach",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CoachFormData) => {
    setIsSubmitting(true);
    try {
      const coachData = {
        organizationId: initialData?.organizationId, // Use organization from initialData
        bio: data.bio || null,
        specializations: data.specializations ? data.specializations.split(",").map(s => s.trim()) : [],
        hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : null,
        phone: data.phone || null,
        profilePicture: data.profilePicture || null,
        user: {
          name: data.name,
          email: data.email,
        },
      };

      if (isEdit) {
        await updateCoachMutation.mutateAsync(coachData);
      } else {
        await createCoachMutation.mutateAsync(coachData);
      }
    } catch (error) {
      console.error(`Failed to ${isEdit ? 'update' : 'create'} coach:`, error);
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
                <FormLabel className="text-[#20366B] font-medium">Full Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., John Smith" 
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#20366B] font-medium">Email Address *</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="john@example.com" 
                    {...field} 
                    className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#20366B] font-medium">Phone Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., +27 11 123 4567" 
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
            name="hourlyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#20366B] font-medium">Hourly Rate (ZAR)</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    placeholder="e.g., 350" 
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
          name="specializations"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#20366B] font-medium">Specializations</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Basketball, Youth Training, Fitness" 
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
          name="profilePicture"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#20366B] font-medium">Profile Picture URL</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://example.com/profile-photo.jpg" 
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
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#20366B] font-medium">Bio</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell us about the coach's experience, qualifications, and coaching philosophy..."
                  {...field} 
                  className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4] min-h-[80px] text-slate-900 placeholder:text-slate-500"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
            disabled={isSubmitting || createCoachMutation.isPending}
            className="text-white border-0 shadow-lg"
            style={{ backgroundColor: organization?.accentColor || '#24D367' }}
          >
            {isSubmitting || createCoachMutation.isPending 
              ? "Creating..." 
              : "Create Coach"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}