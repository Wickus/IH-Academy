import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X } from "lucide-react";

const coachInvitationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string().optional(),
  hourlyRate: z.string().optional(),
  specializations: z.array(z.string()).optional(),
});

type CoachInvitationData = z.infer<typeof coachInvitationSchema>;

interface CoachInvitationFormProps {
  onSuccess?: () => void;
  organization?: any;
}

export default function CoachInvitationForm({ onSuccess, organization }: CoachInvitationFormProps) {
  const [specializationsInput, setSpecializationsInput] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CoachInvitationData>({
    resolver: zodResolver(coachInvitationSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      hourlyRate: "",
      specializations: [],
    },
  });

  const createInvitationMutation = useMutation({
    mutationFn: async (data: CoachInvitationData) => {
      const response = await apiRequest("POST", "/api/coach-invitations", {
        ...data,
        specializations,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Invitation Sent",
        description: `Coach invitation sent to ${form.getValues("email")}. They will receive an email with registration instructions.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/coach-invitations"] });
      form.reset();
      setSpecializations([]);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send coach invitation",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CoachInvitationData) => {
    createInvitationMutation.mutate({
      ...data,
      specializations,
    });
  };

  const addSpecialization = () => {
    const trimmed = specializationsInput.trim();
    if (trimmed && !specializations.includes(trimmed)) {
      setSpecializations([...specializations, trimmed]);
      setSpecializationsInput("");
    }
  };

  const removeSpecialization = (spec: string) => {
    setSpecializations(specializations.filter(s => s !== spec));
  };

  const handleSpecializationKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSpecialization();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter first name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="coach@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="+27 12 345 6789" {...field} />
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
                <FormLabel>Hourly Rate (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="R500" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormLabel>Specializations (Optional)</FormLabel>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Add specialization (e.g., Soccer, Tennis)"
              value={specializationsInput}
              onChange={(e) => setSpecializationsInput(e.target.value)}
              onKeyPress={handleSpecializationKeyPress}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addSpecialization}
              disabled={!specializationsInput.trim()}
            >
              Add
            </Button>
          </div>
          {specializations.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {specializations.map((spec, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {spec}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeSpecialization(spec)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="submit"
            disabled={createInvitationMutation.isPending}
            style={{
              backgroundColor: organization?.primaryColor || '#20366B',
              borderColor: organization?.primaryColor || '#20366B'
            }}
          >
            {createInvitationMutation.isPending ? "Sending Invitation..." : "Send Invitation"}
          </Button>
        </div>
      </form>
    </Form>
  );
}