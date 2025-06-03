import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function MembershipSuccess() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check URL parameters for PayFast response
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment_status');
    const organizationId = urlParams.get('custom_str1');
    const userId = urlParams.get('custom_str2');

    if (paymentStatus === 'COMPLETE' && organizationId && userId) {
      // Payment successful, create membership
      createMembershipMutation.mutate({
        organizationId: parseInt(organizationId),
        userId: parseInt(userId)
      });
    }
  }, []);

  const createMembershipMutation = useMutation({
    mutationFn: async (data: { organizationId: number; userId: number }) => {
      return api.createMembership({
        organizationId: data.organizationId,
        userId: data.userId,
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      });
    },
    onSuccess: () => {
      toast({
        title: "Membership Activated",
        description: "Your membership has been successfully activated!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/memberships"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to activate membership. Please contact support.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#20366B] via-[#278DD4] to-[#24D367] flex items-center justify-center py-8">
      <div className="container mx-auto px-4 max-w-lg">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-[#24D367]/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-[#24D367]" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Welcome to Your Membership!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-3">
              <p className="text-gray-600 leading-relaxed">
                Congratulations! Your payment has been processed successfully and your membership is now active.
              </p>
              <div className="bg-[#24D367]/5 border border-[#24D367]/20 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">What's Next?</h3>
                <ul className="text-sm text-gray-600 space-y-1 text-left">
                  <li>• Access all daily scheduled classes</li>
                  <li>• Book unlimited sessions during your membership</li>
                  <li>• Enjoy priority access to special events</li>
                  <li>• Access member-only resources</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Button
                onClick={() => setLocation("/")}
                className="w-full bg-gradient-to-r from-[#24D367] to-[#24D3BF] hover:from-[#24D367]/90 hover:to-[#24D3BF]/90 text-white font-semibold"
              >
                View Your Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setLocation("/organizations")}
                className="w-full border-[#278DD4] text-[#278DD4] hover:bg-[#278DD4]/5"
              >
                Explore More Organizations
              </Button>
            </div>

            <p className="text-xs text-gray-500 pt-4">
              If you have any questions about your membership, please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}