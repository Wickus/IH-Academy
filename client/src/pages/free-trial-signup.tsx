import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@/lib/api";
import { CheckCircle, ArrowRight, Building2, Calendar, Users, Trophy } from "lucide-react";

const signupSchema = z.object({
  // User details
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  // Organization details
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
  organizationDescription: z.string().optional(),
  organizationPhone: z.string().optional(),
  organizationAddress: z.string().optional(),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function FreeTrialSignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      organizationName: "",
      organizationDescription: "",
      organizationPhone: "",
      organizationAddress: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (signupData: any) => {
      console.log("Starting signup process...");

      try {
        // Step 1: Register user
        console.log("Step 1: Registering user");
        const user = await api.register({
          username: signupData.email.split('@')[0],
          email: signupData.email,
          password: signupData.password,
          firstName: signupData.firstName,
          lastName: signupData.lastName,
          phone: signupData.phone,
          role: "organization_admin" as const
        });
        console.log("User registered successfully:", user);

        // Step 2: Login to get proper session
        console.log("Step 2: Logging in user");
        await new Promise(resolve => setTimeout(resolve, 300));
        const loginResult = await api.login({
          username: signupData.email.split('@')[0],
          password: signupData.password
        });
        console.log("Login successful:", loginResult);

        // Step 3: Create organization
        console.log("Step 3: Creating organization");
        await new Promise(resolve => setTimeout(resolve, 300));
        const organization = await api.createOrganization({
          name: signupData.organizationName,
          description: signupData.description || `${signupData.organizationName} sports academy`,
          email: signupData.email,
          phone: signupData.phone,
          businessModel: signupData.businessModel || "pay_per_class",
          planType: "free",
          primaryColor: "#20366B",
          secondaryColor: "#278DD4", 
          accentColor: "#24D367",
          maxClasses: 10,
          maxMembers: 100,
          subscriptionStatus: 'trial',
          trialStartDate: new Date(),
          trialEndDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
        });
        console.log("Organization created successfully:", organization);

        return { user: loginResult, organization };
      } catch (error) {
        console.error("Error in signup process:", error);
        throw error;
      }
    },
    onSuccess: ({ user, organization }) => {
      console.log("Signup flow completed successfully");

      // Clear all cache and set fresh data
      queryClient.invalidateQueries();
      queryClient.clear();

      // Set user and organization data
      queryClient.setQueryData(['/api/auth/me'], user);
      queryClient.setQueryData(['/api/organizations/my'], [organization]);

      toast({
        title: "Welcome to IH Academy! 🎉",
        description: `${organization.name} is ready for action. Start with your 21-day free trial!`
      });

      // Navigate directly to the organization dashboard
      setTimeout(() => {
        console.log("Redirecting to organization dashboard");
        setLocation("/dashboard");
      }, 1200);
    },
    onError: (error: any) => {
      console.error("Signup failed:", error);

      let errorMessage = "Please try again or contact support";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.status === 400) {
        errorMessage = "This email is already registered. Please try logging in instead.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error. Please try again in a few moments.";
      }

      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: SignupForm) => {
    signupMutation.mutate(data);
  };

  const nextStep = () => {
    if (currentStep === 1) {
      // Validate user fields
      form.trigger(["firstName", "lastName", "email", "password"]).then((isValid) => {
        if (isValid) setCurrentStep(2);
      });
    } else {
      form.handleSubmit(onSubmit)();
    }
  };

  const prevStep = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#20366B] via-[#278DD4] to-[#24D367] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src="https://itshappening.africa/wp-content/uploads/2024/06/images-1.jpeg" 
              alt="ItsHappening.Africa" 
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-3xl font-bold text-white">Start Your Free Trial</h1>
              <p className="text-blue-100">21 days of full access, no credit card required</p>
            </div>
          </div>

          {/* Trial Benefits */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">What's included in your free trial:</h2>
            <div className="grid md:grid-cols-3 gap-4 text-white">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-[#24D367]" />
                <span>Up to 25 classes</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-[#24D367]" />
                <span>Up to 250 members</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-[#24D367]" />
                <span>Full analytics access</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-[#24D367]" />
                <span>PayFast integration</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-[#24D367]" />
                <span>Coach management</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-[#24D367]" />
                <span>Email support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-[#24D367] text-white' : 'bg-white/20 text-white'}`}>
              1
            </div>
            <div className={`w-16 h-0.5 ${currentStep >= 2 ? 'bg-[#24D367]' : 'bg-white/20'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-[#24D367] text-white' : 'bg-white/20 text-white'}`}>
              2
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className="bg-white/95 backdrop-blur shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-[#20366B]">
              {currentStep === 1 ? "Create Your Account" : "Setup Your Organization"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 
                ? "Enter your personal details to get started"
                : "Tell us about your sports academy or organization"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-6">
                {currentStep === 1 && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
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
                            <Input placeholder="Smith" {...field} />
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
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} />
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
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="organizationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Cape Town Swimming Academy" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="organizationDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us about your academy, the sports you offer, and your goals..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="organizationPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="+27 21 123 4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="organizationAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Cape Town, South Africa" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                  >
                    Previous
                  </Button>

                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={signupMutation.isPending}
                    className="bg-[#24D367] hover:bg-green-500 text-white"
                  >
                    {signupMutation.isPending ? (
                      "Creating Account..."
                    ) : currentStep === 1 ? (
                      <>
                        Next Step
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Start Free Trial
                        <Trophy className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>

            {/* Trial Guarantee */}
            <Separator className="my-6" />
            <div className="text-center text-sm text-gray-600">
              <p className="mb-2">✅ <strong>No credit card required</strong></p>
              <p className="mb-2">✅ <strong>14 days full access</strong></p>
              <p>✅ <strong>Cancel anytime</strong></p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-blue-100">
            Already have an account?{" "}
            <button 
              onClick={() => setLocation("/login")}
              className="text-white underline hover:no-underline"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}