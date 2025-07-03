import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard, Upload, Users, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
// import { DebitOrderSetup } from '@/components/debit-order-setup';

interface PostActivationOnboardingProps {
  organization: any;
  onComplete: () => void;
}

export function PostActivationOnboarding({ organization, onComplete }: PostActivationOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [showDebitOrderSetup, setShowDebitOrderSetup] = useState(false);
  const [memberFile, setMemberFile] = useState<File | null>(null);
  const { toast } = useToast();

  const colors = {
    primaryColor: organization.primaryColor || '#20366B',
    secondaryColor: organization.secondaryColor || '#278DD4',
    accentColor: organization.accentColor || '#24D367'
  };

  const plans = [
    { id: 'basic', name: 'Basic Plan', price: 'R299/month', features: ['Up to 50 members', 'Basic reporting', 'Email support'] },
    { id: 'premium', name: 'Premium Plan', price: 'R599/month', features: ['Up to 200 members', 'Advanced reporting', 'Priority support', 'Custom branding'] },
    { id: 'enterprise', name: 'Enterprise Plan', price: 'R1299/month', features: ['Unlimited members', 'Full analytics', '24/7 support', 'White-label solution'] }
  ];

  const updatePlanMutation = useMutation({
    mutationFn: async (planType: string) => {
      return apiRequest(`/api/organizations/${organization.id}`, {
        method: 'PUT',
        body: JSON.stringify({ planType })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/my'] });
      toast({
        title: "Plan Updated",
        description: "Your plan has been successfully updated.",
      });
      setCurrentStep(2);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const uploadMembersMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('memberFile', file);
      formData.append('organizationId', organization.id.toString());
      
      const response = await fetch('/api/upload-members', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Members Imported",
        description: `Successfully imported ${data.count} members.`,
      });
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: "Failed to import members. Please check your file format.",
        variant: "destructive",
      });
    },
  });

  const handlePlanSelection = () => {
    if (!selectedPlan) {
      toast({
        title: "Plan Required",
        description: "Please select a plan to continue.",
        variant: "destructive",
      });
      return;
    }
    updatePlanMutation.mutate(selectedPlan);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMemberFile(file);
    }
  };

  const handleMemberImport = () => {
    if (!memberFile) {
      toast({
        title: "File Required",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }
    uploadMembersMutation.mutate(memberFile);
  };

  const handleSkipStep = () => {
    if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      onComplete();
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ color: colors.primaryColor }}>
            Welcome to IH Academy! Let's set up your organization
          </DialogTitle>
          <DialogDescription>
            Complete these steps to get the most out of your sports academy management system.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 my-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${
                  currentStep >= step ? 'opacity-100' : 'opacity-50'
                }`}
                style={{ backgroundColor: currentStep >= step ? colors.primaryColor : '#gray' }}
              >
                {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
              </div>
              {step < 3 && (
                <ArrowRight className="w-4 h-4 mx-2 text-gray-400" />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Plan Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2" style={{ color: colors.primaryColor }}>
                Choose Your Plan
              </h3>
              <p className="text-gray-600">Select the plan that best fits your organization's needs.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card 
                  key={plan.id}
                  className={`cursor-pointer transition-all ${
                    selectedPlan === plan.id 
                      ? 'ring-2 ring-offset-2' 
                      : 'hover:shadow-lg'
                  }`}
                  style={{ 
                    borderColor: selectedPlan === plan.id ? colors.primaryColor : undefined
                  }}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <CardHeader className="text-center">
                    <CardTitle style={{ color: colors.primaryColor }}>{plan.name}</CardTitle>
                    <CardDescription className="text-2xl font-bold">{plan.price}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={handlePlanSelection}
                disabled={!selectedPlan || updatePlanMutation.isPending}
                style={{ backgroundColor: colors.primaryColor }}
                className="px-8"
              >
                {updatePlanMutation.isPending ? 'Updating...' : 'Continue'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Debit Order Setup */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2" style={{ color: colors.primaryColor }}>
                Set Up Automatic Payments
              </h3>
              <p className="text-gray-600">
                Set up a debit order for hassle-free monthly payments, or skip this step and pay manually each month.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="text-center">
                  <CreditCard className="w-12 h-12 mx-auto mb-4" style={{ color: colors.primaryColor }} />
                  <h4 className="font-semibold mb-2">Automatic Debit Order</h4>
                  <p className="text-sm text-gray-600 mb-4">Never miss a payment with automatic monthly deductions</p>
                  <Button 
                    onClick={() => setCurrentStep(3)}
                    style={{ backgroundColor: colors.primaryColor }}
                    className="w-full"
                  >
                    Continue
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto mb-4" style={{ color: colors.secondaryColor }} />
                  <h4 className="font-semibold mb-2">Manual Payments</h4>
                  <p className="text-sm text-gray-600 mb-4">Pay monthly via PayFast when convenient</p>
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
                    className="w-full"
                  >
                    Skip for Now
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Step 3: Member Import */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2" style={{ color: colors.primaryColor }}>
                Import Your Members
              </h3>
              <p className="text-gray-600">
                Upload a CSV file with your existing members to get started quickly.
              </p>
            </div>

            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="memberFile" className="text-sm font-medium">
                    Upload Member File (CSV)
                  </Label>
                  <Input
                    id="memberFile"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Required columns: name, email, phone (optional)
                  </p>
                </div>

                {memberFile && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm">Selected file: <span className="font-medium">{memberFile.name}</span></p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button 
                    onClick={handleMemberImport}
                    disabled={!memberFile || uploadMembersMutation.isPending}
                    style={{ backgroundColor: colors.primaryColor }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadMembersMutation.isPending ? 'Importing...' : 'Import Members'}
                  </Button>
                  
                  <Button variant="outline" onClick={handleSkipStep}>
                    Skip & Complete Setup
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Debit Order Setup Modal - Commented out for now */}
        {/* {showDebitOrderSetup && (
          <DebitOrderSetup 
            organization={organization}
            onComplete={() => {
              setShowDebitOrderSetup(false);
              setCurrentStep(3);
            }}
            onCancel={() => setShowDebitOrderSetup(false)}
          />
        )} */}
      </DialogContent>
    </Dialog>
  );
}