import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, Plus, Trash2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PaymentMethods() {
  const { toast } = useToast();
  const [paymentMethods] = useState([
    {
      id: 1,
      type: "card",
      brand: "Visa",
      last4: "4242",
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
    },
    {
      id: 2,
      type: "card", 
      brand: "Mastercard",
      last4: "8888",
      expiryMonth: 8,
      expiryYear: 2026,
      isDefault: false,
    }
  ]);

  const handleAddPaymentMethod = () => {
    toast({
      title: "Add Payment Method",
      description: "Payment method integration with PayFast coming soon",
    });
  };

  const handleRemovePaymentMethod = (id: number) => {
    toast({
      title: "Remove Payment Method",
      description: "Payment method removal feature coming soon",
    });
  };

  const handleSetDefault = (id: number) => {
    toast({
      title: "Set Default",
      description: "Default payment method update coming soon",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-4 text-[#20366B] hover:bg-[#278DD4]/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="bg-gradient-to-r from-[#20366B] to-[#278DD4] rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Payment Methods</h1>
                  <p className="text-white/80">Manage your payment options</p>
                </div>
              </div>
              <Button
                onClick={handleAddPaymentMethod}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Card
              </Button>
            </div>
          </div>
        </div>

        {/* Payment Methods List */}
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <Card key={method.id} className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#278DD4]/10 rounded-full flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-[#278DD4]" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-semibold text-[#20366B]">
                          {method.brand} •••• {method.last4}
                        </p>
                        {method.isDefault && (
                          <Badge className="bg-[#24D367] text-white text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">
                        Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!method.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                        className="border-[#278DD4]/30 text-[#278DD4] hover:bg-[#278DD4]/10"
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemovePaymentMethod(method.id)}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Security Notice */}
        <Card className="mt-6 border-0 shadow-lg bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Secure Payments</h3>
                <p className="text-sm text-blue-800">
                  All payment information is securely processed through PayFast. 
                  We never store your full card details on our servers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}