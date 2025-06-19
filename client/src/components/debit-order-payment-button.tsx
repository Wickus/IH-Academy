import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Building, CheckCircle, AlertCircle, CreditCard } from "lucide-react";

interface DebitOrderPaymentButtonProps {
  bookingId: number;
  amount: string;
  organizationId: number;
  onPaymentSuccess?: () => void;
}

interface DebitOrderMandate {
  id: number;
  organizationId: number;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  accountType: string;
  maxAmount: string;
  frequency: string;
  status: string;
  mandateReference?: string;
}

export default function DebitOrderPaymentButton({
  bookingId,
  amount,
  organizationId,
  onPaymentSuccess
}: DebitOrderPaymentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMandateId, setSelectedMandateId] = useState<string>("");
  const { toast } = useToast();

  // Fetch user's debit order mandates
  const { data: mandates = [], isLoading } = useQuery({
    queryKey: ["/api/debit-order/mandates"],
    queryFn: () => fetch("/api/debit-order/mandates").then(res => res.json()),
  });

  // Filter mandates for this organization and active status
  const activeMandates = mandates.filter((mandate: DebitOrderMandate) => 
    mandate.organizationId === organizationId && 
    mandate.status === 'active' &&
    parseFloat(mandate.maxAmount) >= parseFloat(amount)
  );

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/debit-order/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mandateId: parseInt(selectedMandateId),
          bookingId,
          amount,
          transactionType: "class_payment"
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Successful",
        description: `Payment of R${amount} processed successfully via debit order`,
      });
      setIsOpen(false);
      onPaymentSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePayment = () => {
    if (!selectedMandateId) {
      toast({
        title: "Selection Required",
        description: "Please select a debit order mandate",
        variant: "destructive",
      });
      return;
    }
    
    processPaymentMutation.mutate();
  };

  if (isLoading) {
    return (
      <Button disabled variant="outline">
        <CreditCard className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  if (activeMandates.length === 0) {
    return (
      <Button variant="outline" onClick={() => window.open('/debit-order-setup', '_blank')}>
        <Building className="h-4 w-4 mr-2" />
        Set Up Debit Order
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Building className="h-4 w-4 mr-2" />
          Pay via Debit Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Pay via Debit Order
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Payment amount: <strong>R{amount}</strong>
            </AlertDescription>
          </Alert>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Select Debit Order Mandate
            </label>
            <Select value={selectedMandateId} onValueChange={setSelectedMandateId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a debit order mandate" />
              </SelectTrigger>
              <SelectContent>
                {activeMandates.map((mandate: DebitOrderMandate) => (
                  <SelectItem key={mandate.id} value={mandate.id.toString()}>
                    <div className="flex flex-col">
                      <div className="font-medium">
                        {mandate.bankName} • {mandate.accountType.toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-500">
                        ****{mandate.accountNumber.slice(-4)} • Max: R{mandate.maxAmount}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMandateId && (
            <div className="p-3 bg-gray-50 rounded-lg">
              {(() => {
                const selectedMandate = activeMandates.find((m: DebitOrderMandate) => m.id.toString() === selectedMandateId);
                if (!selectedMandate) return null;
                
                return (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Account Holder:</span>
                      <span className="font-medium">{selectedMandate.accountHolder}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Bank:</span>
                      <span className="font-medium">{selectedMandate.bankName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Reference:</span>
                      <span className="font-mono text-xs">{selectedMandate.mandateReference}</span>
                    </div>
                    <Badge className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active Mandate
                    </Badge>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handlePayment}
              disabled={!selectedMandateId || processPaymentMutation.isPending}
              className="flex-1"
            >
              {processPaymentMutation.isPending ? "Processing..." : `Pay R${amount}`}
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Payment will be processed according to your debit order mandate terms. 
              You will receive confirmation once the transaction is complete.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}