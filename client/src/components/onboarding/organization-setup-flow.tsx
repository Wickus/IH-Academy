import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api, type Organization } from "@/lib/api";
import { Upload, Palette, CreditCard, Check, ArrowRight, ArrowLeft } from "lucide-react";

interface OrganizationSetupFlowProps {
  isOpen: boolean;
  onComplete: () => void;
  organization: Organization;
}

interface SetupData {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  businessModel: 'membership' | 'pay_per_class';
  membershipPrice?: string;
  membershipBillingCycle?: string;
  planType: 'free' | 'basic' | 'premium';
}

export default function OrganizationSetupFlow({ isOpen, onComplete, organization }: OrganizationSetupFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState<SetupData>({
    primaryColor: organization.primaryColor || "#20366B",
    secondaryColor: organization.secondaryColor || "#278DD4", 
    accentColor: organization.accentColor || "#24D367",
    businessModel: organization.businessModel || 'pay_per_class',
    planType: organization.planType || 'free'
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateOrganizationMutation = useMutation({
    mutationFn: (updateData: Partial<Organization>) => api.updateOrganization(organization.id, updateData),
    onSuccess: (updatedOrg: Organization) => {
      queryClient.setQueryData(['/api/organizations/my'], [updatedOrg]);
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', organization.id] });
      toast({
        title: "Organization updated!",
        description: `${organization.name} setup completed successfully.`,
      });
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update organization",
        variant: "destructive",
      });
    }
  });

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const updatePayload = {
      logo: setupData.logo,
      primaryColor: setupData.primaryColor,
      secondaryColor: setupData.secondaryColor,
      accentColor: setupData.accentColor,
      businessModel: setupData.businessModel,
      membershipPrice: setupData.membershipPrice,
      membershipBillingCycle: setupData.membershipBillingCycle,
      planType: setupData.planType,
      maxClasses: setupData.planType === 'free' ? 10 : setupData.planType === 'basic' ? 50 : 200,
      maxMembers: setupData.planType === 'free' ? 100 : setupData.planType === 'basic' ? 500 : 2000,
    };
    updateOrganizationMutation.mutate(updatePayload);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real implementation, you'd upload to a file storage service
      // For now, we'll create a local URL
      const logoUrl = URL.createObjectURL(file);
      setSetupData({ ...setupData, logo: logoUrl });
    }
  };

  const predefinedColors = [
    { name: "ItsHappening Blue", primary: "#20366B", secondary: "#278DD4", accent: "#24D367" },
    { name: "Ocean Wave", primary: "#1e40af", secondary: "#3b82f6", accent: "#06b6d4" },
    { name: "Forest Green", primary: "#065f46", secondary: "#059669", accent: "#10b981" },
    { name: "Sunset Orange", primary: "#ea580c", secondary: "#f97316", accent: "#fbbf24" },
    { name: "Royal Purple", primary: "#7c2d12", secondary: "#a855f7", accent: "#ec4899" },
  ];

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Palette className="mx-auto h-12 w-12 text-[#278DD4] mb-4" />
        <h3 className="text-xl font-bold text-[#20366B]">Brand Your Organisation</h3>
        <p className="text-gray-600">Upload your logo and choose your brand colors</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-[#20366B] font-medium">Logo Upload</Label>
          <div className="mt-2 flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              {setupData.logo ? (
                <img src={setupData.logo} alt="Logo preview" className="h-24 w-24 object-contain" />
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">Click to upload logo</p>
                </div>
              )}
              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
            </label>
          </div>
        </div>

        <div>
          <Label className="text-[#20366B] font-medium">Choose Color Scheme</Label>
          <div className="grid grid-cols-1 gap-3 mt-2">
            {predefinedColors.map((colorScheme, index) => (
              <Card 
                key={index}
                className={`cursor-pointer transition-all ${
                  setupData.primaryColor === colorScheme.primary 
                    ? 'ring-2 ring-[#278DD4] bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSetupData({
                  ...setupData,
                  primaryColor: colorScheme.primary,
                  secondaryColor: colorScheme.secondary,
                  accentColor: colorScheme.accent
                })}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: colorScheme.primary }}></div>
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: colorScheme.secondary }}></div>
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: colorScheme.accent }}></div>
                      </div>
                      <span className="font-medium text-gray-900">{colorScheme.name}</span>
                    </div>
                    {setupData.primaryColor === colorScheme.primary && (
                      <Check className="h-5 w-5 text-[#278DD4]" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-[#20366B] font-medium">Primary Color</Label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                value={setupData.primaryColor}
                onChange={(e) => setSetupData({ ...setupData, primaryColor: e.target.value })}
                className="w-10 h-10 rounded border border-gray-300"
              />
              <Input
                value={setupData.primaryColor}
                onChange={(e) => setSetupData({ ...setupData, primaryColor: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>
          <div>
            <Label className="text-[#20366B] font-medium">Secondary Color</Label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                value={setupData.secondaryColor}
                onChange={(e) => setSetupData({ ...setupData, secondaryColor: e.target.value })}
                className="w-10 h-10 rounded border border-gray-300"
              />
              <Input
                value={setupData.secondaryColor}
                onChange={(e) => setSetupData({ ...setupData, secondaryColor: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>
          <div>
            <Label className="text-[#20366B] font-medium">Accent Color</Label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                value={setupData.accentColor}
                onChange={(e) => setSetupData({ ...setupData, accentColor: e.target.value })}
                className="w-10 h-10 rounded border border-gray-300"
              />
              <Input
                value={setupData.accentColor}
                onChange={(e) => setSetupData({ ...setupData, accentColor: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CreditCard className="mx-auto h-12 w-12 text-[#278DD4] mb-4" />
        <h3 className="text-xl font-bold text-[#20366B]">Choose Your Business Model</h3>
        <p className="text-gray-600">How do you want to charge your members?</p>
      </div>

      <RadioGroup 
        value={setupData.businessModel} 
        onValueChange={(value) => setSetupData({ ...setupData, businessModel: value as 'membership' | 'pay_per_class' })}
        className="space-y-4"
      >
        <Card className={setupData.businessModel === 'membership' ? 'ring-2 ring-[#278DD4] bg-blue-50' : ''}>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <RadioGroupItem value="membership" id="membership" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="membership" className="text-lg font-medium text-[#20366B] cursor-pointer">
                  Membership Model
                </Label>
                <p className="text-gray-600 mt-1">
                  Members pay a monthly/yearly subscription and can attend unlimited classes or follow daily schedules.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-[#24D367]/10 text-[#20366B]">Recurring Revenue</Badge>
                  <Badge variant="secondary" className="bg-[#24D367]/10 text-[#20366B]">Member Loyalty</Badge>
                  <Badge variant="secondary" className="bg-[#24D367]/10 text-[#20366B]">Predictable Income</Badge>
                </div>
                
                {setupData.businessModel === 'membership' && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[#20366B] font-medium">Monthly Price (R)</Label>
                      <Input
                        type="number"
                        value={setupData.membershipPrice || ''}
                        onChange={(e) => setSetupData({ ...setupData, membershipPrice: e.target.value })}
                        placeholder="299"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-[#20366B] font-medium">Billing Cycle</Label>
                      <RadioGroup 
                        value={setupData.membershipBillingCycle || 'monthly'} 
                        onValueChange={(value) => setSetupData({ ...setupData, membershipBillingCycle: value })}
                        className="mt-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="monthly" id="monthly" />
                          <Label htmlFor="monthly" className="text-sm">Monthly</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="quarterly" id="quarterly" />
                          <Label htmlFor="quarterly" className="text-sm">Quarterly</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yearly" id="yearly" />
                          <Label htmlFor="yearly" className="text-sm">Yearly</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={setupData.businessModel === 'pay_per_class' ? 'ring-2 ring-[#278DD4] bg-blue-50' : ''}>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <RadioGroupItem value="pay_per_class" id="pay_per_class" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="pay_per_class" className="text-lg font-medium text-[#20366B] cursor-pointer">
                  Pay-Per-Class Model
                </Label>
                <p className="text-gray-600 mt-1">
                  Members pay for each individual class they attend. Flexible pricing per session.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-[#24D3BF]/10 text-[#20366B]">Flexible Pricing</Badge>
                  <Badge variant="secondary" className="bg-[#24D3BF]/10 text-[#20366B]">No Commitment</Badge>
                  <Badge variant="secondary" className="bg-[#24D3BF]/10 text-[#20366B]">Easy Start</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </RadioGroup>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CreditCard className="mx-auto h-12 w-12 text-[#278DD4] mb-4" />
        <h3 className="text-xl font-bold text-[#20366B]">Choose Your Plan</h3>
        <p className="text-gray-600">Select the plan that best fits your organisation's needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            id: 'free',
            name: 'Free',
            price: 'R0',
            period: '/month',
            description: 'Perfect for getting started',
            features: ['Up to 10 classes', 'Up to 100 members', 'Basic reporting', 'Email support'],
            maxClasses: 10,
            maxMembers: 100,
            recommended: false
          },
          {
            id: 'basic',
            name: 'Basic',
            price: 'R299',
            period: '/month',
            description: 'Great for growing organisations',
            features: ['Up to 50 classes', 'Up to 500 members', 'Advanced reporting', 'Priority support', 'Custom branding'],
            maxClasses: 50,
            maxMembers: 500,
            recommended: true
          },
          {
            id: 'premium',
            name: 'Premium',
            price: 'R599',
            period: '/month',
            description: 'For large organisations',
            features: ['Unlimited classes', 'Up to 2000 members', 'Analytics dashboard', '24/7 support', 'API access', 'White label'],
            maxClasses: 200,
            maxMembers: 2000,
            recommended: false
          }
        ].map((plan) => (
          <Card 
            key={plan.id}
            className={`cursor-pointer transition-all relative ${
              setupData.planType === plan.id 
                ? 'ring-2 ring-[#278DD4] bg-blue-50' 
                : 'hover:bg-gray-50'
            } ${plan.recommended ? 'border-[#24D367] border-2' : ''}`}
            onClick={() => setSetupData({ ...setupData, planType: plan.id as 'free' | 'basic' | 'premium' })}
          >
            {plan.recommended && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-[#24D367] text-white px-3 py-1">Recommended</Badge>
              </div>
            )}
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-[#20366B]">{plan.name}</CardTitle>
              <div className="text-3xl font-bold text-[#278DD4]">
                {plan.price}<span className="text-sm text-gray-500">{plan.period}</span>
              </div>
              <p className="text-gray-600 text-sm">{plan.description}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-[#24D367] mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              {setupData.planType === plan.id && (
                <div className="mt-4 p-3 bg-[#278DD4]/10 rounded-lg">
                  <Check className="h-5 w-5 text-[#278DD4] mx-auto" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {setupData.planType !== 'free' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> You'll be redirected to PayFast to complete your subscription payment after setup.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#20366B] font-bold">
            Welcome to {organization.name}!
          </DialogTitle>
          <div className="flex items-center justify-center space-x-4 mt-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-[#278DD4] text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step < currentStep ? <Check className="h-4 w-4" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-1 mx-2 ${
                    step < currentStep ? 'bg-[#278DD4]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-2">
            <p className="text-gray-600">
              Step {currentStep} of 3: {
                currentStep === 1 ? 'Branding Setup' :
                currentStep === 2 ? 'Business Model' :
                'Plan Selection'
              }
            </p>
          </div>
        </DialogHeader>

        <div className="py-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          <Button
            onClick={handleNext}
            disabled={updateOrganizationMutation.isPending}
            className="bg-[#278DD4] hover:bg-[#1f7bc4] text-white flex items-center space-x-2"
          >
            <span>
              {currentStep === 3 
                ? updateOrganizationMutation.isPending ? "Completing Setup..." : "Complete Setup"
                : "Next"
              }
            </span>
            {currentStep < 3 && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}