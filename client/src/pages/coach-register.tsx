import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const coachRegistrationSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password confirmation is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type CoachRegistrationData = z.infer<typeof coachRegistrationSchema>;

export default function CoachRegister() {
  const [, params] = useRoute("/coach-register/:token");
  const [invitation, setInvitation] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<CoachRegistrationData>({
    resolver: zodResolver(coachRegistrationSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (params?.token) {
      loadInvitation(params.token);
    }
  }, [params?.token]);

  const loadInvitation = async (token: string) => {
    try {
      const response = await apiRequest("GET", `/api/coach-invitations/${token}`);
      const data = await response.json();
      
      if (response.ok) {
        setInvitation(data.invitation);
        setOrganization(data.organization);
      } else {
        toast({
          title: "Invalid Invitation",
          description: data.message || "This invitation link is invalid or expired.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load invitation details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CoachRegistrationData) => {
    if (!invitation || !params?.token) return;

    setSubmitting(true);
    try {
      const response = await apiRequest("POST", `/api/coach-invitations/${params.token}/accept`, data);
      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Registration Successful",
          description: "Your coach account has been created successfully!",
        });
        
        // Redirect to login page or auto-login
        window.location.href = "/auth";
      } else {
        toast({
          title: "Registration Failed",
          description: result.message || "Failed to complete registration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during registration.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!invitation || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid, expired, or has already been used.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100"
      style={{
        background: organization.primaryColor ? 
          `linear-gradient(135deg, ${organization.primaryColor}10, ${organization.secondaryColor || organization.primaryColor}05)` :
          undefined
      }}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle 
            className="text-2xl font-bold"
            style={{ color: organization.primaryColor || '#20366B' }}
          >
            Join {organization.name}
          </CardTitle>
          <CardDescription>
            Complete your coach registration for {organization.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold mb-2">Invitation Details</h3>
            <p className="text-sm text-slate-600">
              <strong>Name:</strong> {invitation.firstName} {invitation.lastName}
            </p>
            <p className="text-sm text-slate-600">
              <strong>Email:</strong> {invitation.email}
            </p>
            {invitation.phone && (
              <p className="text-sm text-slate-600">
                <strong>Phone:</strong> {invitation.phone}
              </p>
            )}
            {invitation.specializations && invitation.specializations.length > 0 && (
              <p className="text-sm text-slate-600">
                <strong>Specializations:</strong> {invitation.specializations.join(", ")}
              </p>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Choose a username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Create a password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={submitting}
                style={{
                  backgroundColor: organization.primaryColor || '#20366B',
                  borderColor: organization.primaryColor || '#20366B'
                }}
              >
                {submitting ? "Creating Account..." : "Complete Registration"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}