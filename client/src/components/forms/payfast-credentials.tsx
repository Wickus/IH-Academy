import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Shield, AlertTriangle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const payfastCredentialsSchema = z.object({
  payfastMerchantId: z.string().min(1, "Merchant ID is required"),
  payfastMerchantKey: z.string().min(1, "Merchant Key is required"),
  payfastPassphrase: z.string().optional(),
  payfastSandbox: z.boolean().default(true),
});

export type PayfastCredentialsData = z.infer<typeof payfastCredentialsSchema>;

interface PayfastCredentialsProps {
  initialData?: Partial<PayfastCredentialsData>;
  onSubmit: (data: PayfastCredentialsData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  showTitle?: boolean;
  showButtons?: boolean;
  showSandboxToggle?: boolean;
}

export default function PayfastCredentials({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  showTitle = true,
  showButtons = true,
  showSandboxToggle = true,
}: PayfastCredentialsProps) {
  const form = useForm<PayfastCredentialsData>({
    resolver: zodResolver(payfastCredentialsSchema),
    defaultValues: {
      payfastMerchantId: initialData?.payfastMerchantId || "",
      payfastMerchantKey: initialData?.payfastMerchantKey || "",
      payfastPassphrase: initialData?.payfastPassphrase || "",
      payfastSandbox: initialData?.payfastSandbox ?? true,
    },
  });

  const handleSubmit = (data: PayfastCredentialsData) => {
    onSubmit(data);
  };

  return (
    <Card className="w-full">
      {showTitle && (
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-[#278DD4]" />
            <CardTitle className="text-[#20366B]">Payfast Payment Gateway</CardTitle>
          </div>
        </CardHeader>
      )}
      
      <CardContent className="space-y-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Configure your Payfast merchant account to accept payments for class bookings. 
            These credentials are securely encrypted and stored.
          </AlertDescription>
        </Alert>

        <div className="bg-slate-50 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-slate-800 mb-1">Need a Payfast Account?</h4>
              <p className="text-sm text-slate-600 mb-2">
                Sign up for a Payfast merchant account to start accepting payments.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="text-[#278DD4] border-[#278DD4] hover:bg-[#278DD4]/10"
                onClick={() => window.open('https://www.payfast.co.za/', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Payfast
              </Button>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="payfastMerchantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Merchant ID</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., 15720320" 
                      {...field}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    Your unique Payfast Merchant ID (found in your Payfast dashboard)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payfastMerchantKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Merchant Key</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., s3opz0f8hkx4x" 
                      {...field}
                      className="font-mono"
                      type="password"
                    />
                  </FormControl>
                  <FormDescription>
                    Your Payfast Merchant Key (keep this confidential)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payfastPassphrase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passphrase (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Leave blank if not configured"
                      {...field}
                      className="font-mono"
                      type="password"
                    />
                  </FormControl>
                  <FormDescription>
                    Optional security passphrase (only if configured in your Payfast account)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showSandboxToggle && (
              <FormField
                control={form.control}
                name="payfastSandbox"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Sandbox Mode</FormLabel>
                      <FormDescription>
                        Use Payfast sandbox for testing. Disable for live payments.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Security Notice</p>
                  <p>
                    Your payment credentials are encrypted before storage. Only use your live 
                    credentials when you're ready to accept real payments.
                  </p>
                </div>
              </div>
            </div>

            {showButtons && (
              <div className="flex justify-end space-x-3 pt-4">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-[#278DD4] hover:bg-[#278DD4]/90 text-white"
                >
                  {isLoading ? "Saving..." : "Save Credentials"}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}