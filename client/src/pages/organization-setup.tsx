import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Building2, Users, CreditCard, Calendar, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Organization } from "@shared/schema";

const organizationSetupSchema = z.object({
  businessModel: z.enum(["membership", "pay_per_class"]),
  membershipPrice: z.string().optional(),
  membershipBillingCycle: z.enum(["monthly", "quarterly", "yearly"]).default("monthly"),
  primaryColor: z.string().default("#20366B"),
  secondaryColor: z.string().default("#278DD4"),
  accentColor: z.string().default("#24D367"),
});

type OrganizationSetupForm = z.infer<typeof organizationSetupSchema>;

export default function OrganizationSetup() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get organization ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const orgId = urlParams.get('orgId');

  // Fetch existing organization data
  const { data: organization } = useQuery({
    queryKey: [`/api/organizations/${orgId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/organizations/${orgId}`);
      return response.json();
    },
    enabled: !!orgId,
  }) as { data: Organization | undefined };

  const form = useForm<OrganizationSetupForm>({
    resolver: zodResolver(organizationSetupSchema),
    defaultValues: {
      businessModel: "pay_per_class",
      membershipBillingCycle: "monthly",
      primaryColor: "#20366B",
      secondaryColor: "#278DD4",
      accentColor: "#24D367",
    },
  });

  const businessModel = form.watch("businessModel");

  const updateOrganizationMutation = useMutation({
    mutationFn: async (data: OrganizationSetupForm) => {
      if (!orgId) {
        throw new Error("Organisation ID is required");
      }
      const organizationData = {
        ...data,
        membershipPrice: businessModel === "membership" ? parseFloat(data.membershipPrice || "0") : 0,
      };
      return apiRequest("PUT", `/api/organizations/${orgId}`, organizationData);
    },
    onSuccess: () => {
      toast({
        title: "Organisation Setup Complete",
        description: "Your organisation has been configured successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update organisation",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OrganizationSetupForm) => {
    updateOrganizationMutation.mutate(data);
  };

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#20366B] via-[#278DD4] to-[#24D367] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome to ItsHappening.Africa
          </h1>
          <p className="text-white/90 text-lg">
            Let's set up your organisation with our complete sports management platform
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-4">
            {[1, 2].map((step) => (
              <div
                key={step}
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 font-semibold ${
                  currentStep >= step
                    ? "bg-white text-[#20366B] border-white shadow-lg"
                    : "bg-transparent text-white border-white/50"
                }`}
              >
                {step}
              </div>
            ))}
          </div>
        </div>

        <Card className="bg-white/95 backdrop-blur shadow-2xl border-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Step 1: Business Model */}
              {currentStep === 1 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Business Model
                    </CardTitle>
                    <CardDescription>
                      Choose how your organisation operates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="businessModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Your Business Model</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="space-y-4"
                            >
                              <div className="border rounded-lg p-4 space-y-2">
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="membership" id="membership" />
                                  <label htmlFor="membership" className="flex items-center gap-2 font-medium">
                                    <Users className="h-4 w-4" />
                                    Membership-Based
                                  </label>
                                </div>
                                <p className="text-sm text-gray-600 ml-6">
                                  Members pay a monthly subscription and can book from your daily schedule of classes.
                                  Perfect for gyms, studios, and regular training programs.
                                </p>
                              </div>

                              <div className="border rounded-lg p-4 space-y-2">
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="pay_per_class" id="pay_per_class" />
                                  <label htmlFor="pay_per_class" className="flex items-center gap-2 font-medium">
                                    <Calendar className="h-4 w-4" />
                                    Pay-Per-Class
                                  </label>
                                </div>
                                <p className="text-sm text-gray-600 ml-6">
                                  Users book and pay for individual classes or clinics. 
                                  Ideal for workshops, private lessons, and one-off events.
                                </p>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {businessModel === "membership" && (
                      <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-medium text-blue-900">Membership Settings</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="membershipPrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Monthly Membership Price (ZAR)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01"
                                    placeholder="299.00"
                                    className="border-[#278DD4] focus:border-[#24D367] focus:ring-[#24D367]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="membershipBillingCycle"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Billing Cycle</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="border-[#278DD4] focus:border-[#24D367] focus:ring-[#24D367]">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </>
              )}

              {/* Step 2: Branding */}
              {currentStep === 2 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Branding & Colors
                    </CardTitle>
                    <CardDescription>
                      Customize the look of your organisation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Color</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input type="color" {...field} className="w-12 h-10 border-[#278DD4] focus:border-[#24D367] focus:ring-[#24D367]" />
                                <Input {...field} placeholder="#20366B" className="border-[#278DD4] focus:border-[#24D367] focus:ring-[#24D367]" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="secondaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secondary Color</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input type="color" {...field} className="w-12 h-10 border-[#278DD4] focus:border-[#24D367] focus:ring-[#24D367]" />
                                <Input {...field} placeholder="#278DD4" className="border-[#278DD4] focus:border-[#24D367] focus:ring-[#24D367]" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="accentColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Accent Color</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input type="color" {...field} className="w-12 h-10 border-[#278DD4] focus:border-[#24D367] focus:ring-[#24D367]" />
                                <Input {...field} placeholder="#24D367" className="border-[#278DD4] focus:border-[#24D367] focus:ring-[#24D367]" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Preview</h4>
                      <div 
                        className="h-20 rounded-lg flex items-center justify-center text-white font-medium"
                        style={{ 
                          background: `linear-gradient(135deg, ${form.watch("primaryColor")} 0%, ${form.watch("secondaryColor")} 100%)` 
                        }}
                      >
                        {organization?.name || "Your Organisation"}
                      </div>
                    </div>
                  </CardContent>
                </>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between p-6 bg-gradient-to-r from-slate-50 to-blue-50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="border-[#20366B] text-[#20366B] hover:bg-[#20366B] hover:text-white"
                >
                  Previous
                </Button>

                {currentStep < 2 ? (
                  <Button 
                    type="button" 
                    onClick={nextStep}
                    className="bg-gradient-to-r from-[#278DD4] to-[#24D367] hover:from-[#20366B] hover:to-[#278DD4] text-white font-semibold"
                  >
                    Next
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={updateOrganizationMutation.isPending}
                    className="bg-gradient-to-r from-[#24D367] to-[#24D3BF] hover:from-[#20366B] hover:to-[#278DD4] text-white font-semibold"
                  >
                    {updateOrganizationMutation.isPending ? "Saving..." : "Complete Setup"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}