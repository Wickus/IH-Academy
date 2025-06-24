import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Phone, Building2, CheckCircle, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: number;
  organizationColors?: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
}

export function UpgradeModal({ isOpen, onClose, organizationId, organizationColors }: UpgradeModalProps) {
  const [, setLocation] = useLocation();
  
  const colors = organizationColors || {
    primaryColor: "#20366B",
    secondaryColor: "#278DD4", 
    accentColor: "#24D367"
  };

  const handlePayActivationFee = () => {
    // Redirect to PayFast payment with R4000 activation fee
    window.location.href = `/api/create-payfast-payment?amount=4000&organizationId=${organizationId}&description=Activation Fee (includes setup and first month)`;
  };

  const handleSetupDebitOrder = () => {
    setLocation(`/debit-order-setup?organizationId=${organizationId}`);
    onClose();
  };

  const handleBookCall = () => {
    window.open('https://service.itshappening.africa/widget/booking/oZM1qWIoJJlfWxzibL30', '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            Upgrade Your Account
          </DialogTitle>
          <p className="text-center text-gray-600">
            Choose how you'd like to complete your upgrade and activate your full account
          </p>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {/* Pay Activation Fee */}
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-3 p-3 rounded-full" style={{ backgroundColor: colors.primaryColor + '20' }}>
                <CreditCard className="h-8 w-8" style={{ color: colors.primaryColor }} />
              </div>
              <CardTitle className="text-lg" style={{ color: colors.primaryColor }}>
                Pay Activation Fee
              </CardTitle>
              <CardDescription>
                Secure payment via PayFast
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: colors.primaryColor }}>
                  R4000
                </div>
                <p className="text-sm text-gray-600">One-time activation fee</p>
              </div>
              
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Data import assistance
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  First month included
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Setup support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Instant activation
                </li>
              </ul>

              <Button 
                onClick={handlePayActivationFee}
                className="w-full"
                style={{ backgroundColor: colors.primaryColor }}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Now
              </Button>
            </CardContent>
          </Card>

          {/* Setup Debit Order */}
          <Card className="border-2 hover:shadow-lg transition-shadow relative">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2" style={{ backgroundColor: colors.accentColor }}>
              Recommended
            </Badge>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-3 p-3 rounded-full" style={{ backgroundColor: colors.accentColor + '20' }}>
                <Building2 className="h-8 w-8" style={{ color: colors.accentColor }} />
              </div>
              <CardTitle className="text-lg" style={{ color: colors.primaryColor }}>
                Setup Debit Order
              </CardTitle>
              <CardDescription>
                Automated monthly payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-semibold" style={{ color: colors.primaryColor }}>
                  From Month 2
                </div>
                <p className="text-sm text-gray-600">Automatic billing</p>
              </div>
              
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Never miss a payment
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Secure bank integration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Easy to manage
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Cancel anytime
                </li>
              </ul>

              <Button 
                onClick={handleSetupDebitOrder}
                className="w-full"
                style={{ backgroundColor: colors.accentColor }}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Setup Debit Order
              </Button>
            </CardContent>
          </Card>

          {/* Book Call */}
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-3 p-3 rounded-full" style={{ backgroundColor: colors.secondaryColor + '20' }}>
                <Phone className="h-8 w-8" style={{ color: colors.secondaryColor }} />
              </div>
              <CardTitle className="text-lg" style={{ color: colors.primaryColor }}>
                Book Setup Call
              </CardTitle>
              <CardDescription>
                Speak with our team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-semibold" style={{ color: colors.primaryColor }}>
                  Free Consultation
                </div>
                <p className="text-sm text-gray-600">30-minute session</p>
              </div>
              
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Personalized setup
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Data migration help
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Training included
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Custom solutions
                </li>
              </ul>

              <Button 
                onClick={handleBookCall}
                variant="outline"
                className="w-full"
                style={{ 
                  borderColor: colors.secondaryColor,
                  color: colors.secondaryColor
                }}
              >
                <Phone className="mr-2 h-4 w-4" />
                Schedule Call
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <span>Need help deciding?</span>
            <Button
              variant="link"
              onClick={handleBookCall}
              className="p-0 h-auto text-sm"
              style={{ color: colors.primaryColor }}
            >
              Talk to our team
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}