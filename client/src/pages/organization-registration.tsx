import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Building, 
  User, 
  CreditCard, 
  Mail, 
  Phone, 
  Globe, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PayfastCredentials, { type PayfastCredentialsData } from "@/components/forms/payfast-credentials";

const organizationRegistrationSchema = z.object({
  // Organization details
  name: z.string().min(1, "Organisation name is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Valid email is required"),
  website: z.string().optional(),
  
  // Admin user details
  adminName: z.string().min(1, "Admin name is required"),
  adminEmail: z.string().email("Valid admin email is required"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
  adminPasswordConfirm: z.string(),
}).refine((data) => data.adminPassword === data.adminPasswordConfirm, {
  message: "Passwords don't match",
  path: ["adminPasswordConfirm"],
});

type OrganizationRegistrationData = z.infer<typeof organizationRegistrationSchema>;

export default function OrganizationRegistration() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [organizationData, setOrganizationData] = useState<OrganizationRegistrationData | null>(null);
  const [payfastData, setPayfastData] = useState<PayfastCredentialsData | null>(null);
  const { toast } = useToast();

  const form = useForm<OrganizationRegistrationData>({
    resolver: zodResolver(organizationRegistrationSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      adminName: "",
      adminEmail: "",
      adminPassword: "",
      adminPasswordConfirm: "",
    },
  });

  const registrationMutation = useMutation({
    mutationFn: async (data: { 
      organization: OrganizationRegistrationData, 
      payfast: PayfastCredentialsData 
    }) => {
      // Create organization with Payfast credentials
      const orgResponse = await api.createOrganization({
        name: data.organization.name,
        description: data.organization.description,
        address: data.organization.address,
        phone: data.organization.phone,
        email: data.organization.email,
        website: data.organization.website,
        payfastMerchantId: data.payfast.payfastMerchantId,
        payfastMerchantKey: data.payfast.payfastMerchantKey,
        payfastPassphrase: data.payfast.payfastPassphrase,
        payfastSandbox: data.payfast.payfastSandbox,
      });

      // Create admin user
      const userResponse = await api.register({
        username: data.organization.adminEmail,
        email: data.organization.adminEmail,
        password: data.organization.adminPassword,
        name: data.organization.adminName,
        role: "admin",
      });

      return { organization: orgResponse, user: userResponse };
    },
    onSuccess: () => {
      toast({
        title: "Registration successful!",
        description: "Your organisation has been created successfully. You can now log in.",
      });
      setCurrentStep(4); // Success step
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create organisation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStep1Submit = (data: OrganizationRegistrationData) => {
    setOrganizationData(data);
    setCurrentStep(2);
  };

  const handleStep2Submit = (data: PayfastCredentialsData) => {
    setPayfastData(data);
    setCurrentStep(3);
  };

  const handleFinalSubmit = () => {
    if (organizationData && payfastData) {
      registrationMutation.mutate({
        organization: organizationData,
        payfast: payfastData,
      });
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep >= step 
                ? 'bg-[#278DD4] text-white' 
                : 'bg-slate-200 text-slate-400'
            }`}>
              {currentStep > step ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                step
              )}
            </div>
            {step < 3 && (
              <div className={`w-8 h-1 mx-2 ${
                currentStep > step 
                  ? 'bg-[#278DD4]' 
                  : 'bg-slate-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-[#20366B] to-[#278DD4] text-white">
        <CardTitle className="flex items-center text-xl">
          <Building className="mr-2 h-5 w-5" />
          Organisation & Admin Details
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleStep1Submit)} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[#20366B] mb-4">Organisation Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organisation Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Your organisation name" {...field} />
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
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input 
                            placeholder="contact@organisation.com" 
                            {...field} 
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input 
                            placeholder="+27 12 345 6789" 
                            {...field} 
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input 
                            placeholder="https://yourwebsite.com" 
                            {...field} 
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Your organisation's physical address" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about your organisation, mission, and what makes you unique..." 
                        {...field} 
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold text-[#20366B] mb-4">Administrator Account</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="adminName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Name *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input 
                            placeholder="Administrator's full name" 
                            {...field} 
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adminEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Email *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input 
                            placeholder="admin@organisation.com" 
                            {...field} 
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adminPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Minimum 6 characters" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adminPasswordConfirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password *</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Confirm your password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit"
                className="bg-[#278DD4] hover:bg-[#278DD4]/90 text-white"
              >
                Next: Payment Setup
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <div className="max-w-2xl mx-auto">
      <PayfastCredentials
        onSubmit={handleStep2Submit}
        onCancel={() => setCurrentStep(1)}
        showTitle={true}
        showButtons={true}
        showSandboxToggle={true}
      />
      <div className="flex justify-between mt-6">
        <Button 
          variant="outline"
          onClick={() => setCurrentStep(1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button 
          onClick={handleStep2Submit}
          className="bg-[#278DD4] hover:bg-[#278DD4]/90 text-white"
        >
          Next: Review
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-[#20366B] to-[#278DD4] text-white">
        <CardTitle className="flex items-center text-xl">
          <CheckCircle className="mr-2 h-5 w-5" />
          Review & Confirm
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {organizationData && (
          <div>
            <h3 className="font-semibold text-[#20366B] mb-3">Organisation Details</h3>
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <p><span className="font-medium">Name:</span> {organizationData.name}</p>
              <p><span className="font-medium">Email:</span> {organizationData.email}</p>
              {organizationData.phone && <p><span className="font-medium">Phone:</span> {organizationData.phone}</p>}
              {organizationData.address && <p><span className="font-medium">Address:</span> {organizationData.address}</p>}
            </div>
          </div>
        )}

        {payfastData && (
          <div>
            <h3 className="font-semibold text-[#20366B] mb-3">Payment Configuration</h3>
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <p><span className="font-medium">Merchant ID:</span> {payfastData.payfastMerchantId}</p>
              <p><span className="font-medium">Mode:</span> 
                <Badge variant={payfastData.payfastSandbox ? "secondary" : "default"} className="ml-2">
                  {payfastData.payfastSandbox ? "Sandbox" : "Live"}
                </Badge>
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <Button 
            variant="outline"
            onClick={() => setCurrentStep(2)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button 
            onClick={handleFinalSubmit}
            disabled={registrationMutation.isPending}
            className="bg-[#24D367] hover:bg-[#24D367]/90 text-white"
          >
            {registrationMutation.isPending ? "Creating..." : "Create Organisation"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep4 = () => (
    <Card className="max-w-md mx-auto text-center">
      <CardContent className="p-8">
        <div className="mb-6">
          <CheckCircle className="mx-auto h-16 w-16 text-[#24D367] mb-4" />
          <h2 className="text-2xl font-bold text-[#20366B] mb-2">Success!</h2>
          <p className="text-slate-600">
            Your organisation has been created successfully. You can now log in and start managing your classes.
          </p>
        </div>
        <Button 
          onClick={() => setLocation("/login")}
          className="bg-[#278DD4] hover:bg-[#278DD4]/90 text-white w-full"
        >
          Go to Login
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#20366B] mb-2">Register Your Organisation</h1>
          <p className="text-slate-600">Join ItsHappening.Africa and start managing your sports academy today</p>
        </div>

        {renderStepIndicator()}

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>
    </div>
  );
}