import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Banknote, 
  Building2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Calendar,
  CreditCard,
  ArrowLeft,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const mandateSchema = z.object({
  organizationId: z.number(),
  bankName: z.string().min(1, "Bank name is required"),
  accountHolder: z.string().min(1, "Account holder name is required"),
  accountNumber: z.string().min(9, "Account number must be at least 9 digits").max(11, "Account number must be at most 11 digits"),
  branchCode: z.string().length(6, "Branch code must be 6 digits"),
  accountType: z.enum(["current", "savings", "transmission"]),
  maxAmount: z.string().min(1, "Maximum amount is required"),
  frequency: z.enum(["monthly", "weekly", "bi-weekly"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
});

export default function DebitOrderManagement() {
  const { toast } = useToast();
  const [showMandateForm, setShowMandateForm] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => api.getCurrentUser(),
  });

  const { data: organizations } = useQuery({
    queryKey: ['/api/organizations/my'],
    queryFn: () => api.getUserOrganizations(),
    enabled: !!user,
  });

  const organization = organizations?.[0];

  const { data: mandates = [], isLoading: mandatesLoading } = useQuery({
    queryKey: ['/api/debit-order/mandates'],
    queryFn: async () => {
      const response = await fetch('/api/debit-order/mandates', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch mandates');
      return response.json();
    },
    enabled: !!organization,
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/debit-order/transactions'],
    queryFn: async () => {
      const response = await fetch('/api/debit-order/transactions', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    enabled: !!organization,
  });

  const form = useForm({
    resolver: zodResolver(mandateSchema),
    defaultValues: {
      organizationId: organization?.id || 0,
      bankName: "",
      accountHolder: "",
      accountNumber: "",
      branchCode: "",
      accountType: "current" as const,
      maxAmount: "",
      frequency: "monthly" as const,
      startDate: "",
      endDate: "",
    },
  });

  const createMandateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/debit-order/mandates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create mandate');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/debit-order/mandates'] });
      setShowMandateForm(false);
      form.reset();
      toast({
        title: "Success",
        description: "Debit order mandate created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create mandate",
        variant: "destructive",
      });
    },
  });

  const activateMandateMutation = useMutation({
    mutationFn: async (mandateId: number) => {
      const response = await fetch(`/api/debit-order/mandates/${mandateId}/activate`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to activate mandate');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/debit-order/mandates'] });
      toast({
        title: "Success",
        description: "Mandate activated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to activate mandate",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createMandateMutation.mutate({
      ...data,
      organizationId: organization?.id,
    });
  };

  const downloadMandateForm = async (mandateId: number) => {
    try {
      const response = await fetch(`/api/debit-order/mandates/${mandateId}/form`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to generate mandate form');
      
      const html = await response.text();
      const blob = new Blob([html], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mandate-${mandateId}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Mandate form downloaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download mandate form",
        variant: "destructive",
      });
    }
  };

  if (!organization) {
    return (
      <div className="p-4 lg:p-8 min-h-screen">
        <div className="text-center">
          <p>Loading organization data...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="p-4 lg:p-8 min-h-screen"
      style={{ backgroundColor: `${organization.accentColor}10` }}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="hover:bg-white/50"
            style={{ color: organization.primaryColor }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: organization.accentColor }}>
              Debit Order Management
            </h1>
            <p className="text-slate-600">Manage automated payment collections</p>
          </div>
        </div>
        <Dialog open={showMandateForm} onOpenChange={setShowMandateForm}>
          <DialogTrigger asChild>
            <Button 
              className="text-white"
              style={{ backgroundColor: organization.accentColor }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Mandate
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle style={{ color: organization.primaryColor }}>
                Create Debit Order Mandate
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select bank" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Standard Bank">Standard Bank</SelectItem>
                              <SelectItem value="FNB">FNB</SelectItem>
                              <SelectItem value="ABSA">ABSA</SelectItem>
                              <SelectItem value="Nedbank">Nedbank</SelectItem>
                              <SelectItem value="Capitec">Capitec</SelectItem>
                              <SelectItem value="African Bank">African Bank</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Type</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="current">Current</SelectItem>
                              <SelectItem value="savings">Savings</SelectItem>
                              <SelectItem value="transmission">Transmission</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="accountHolder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Holder Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Full name as per bank records" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="9-11 digits" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="branchCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="6 digits" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="maxAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Amount (R)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="500.00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Frequency</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowMandateForm(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMandateMutation.isPending}
                    className="text-white"
                    style={{ backgroundColor: organization.accentColor }}
                  >
                    Create Mandate
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Active Mandates</p>
                <p className="text-2xl font-bold" style={{ color: organization.primaryColor }}>
                  {mandates.filter(m => m.status === 'active').length}
                </p>
              </div>
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${organization.primaryColor}20` }}
              >
                <Building2 className="h-6 w-6" style={{ color: organization.primaryColor }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Collected</p>
                <p className="text-2xl font-bold" style={{ color: organization.secondaryColor }}>
                  R{formatCurrency(transactions.filter(t => t.status === 'successful').reduce((sum, t) => sum + Number(t.amount), 0))}
                </p>
              </div>
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${organization.secondaryColor}20` }}
              >
                <Banknote className="h-6 w-6" style={{ color: organization.secondaryColor }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">This Month</p>
                <p className="text-2xl font-bold" style={{ color: organization.accentColor }}>
                  {transactions.filter(t => 
                    t.status === 'successful' && 
                    new Date(t.processedAt).getMonth() === new Date().getMonth()
                  ).length}
                </p>
              </div>
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${organization.accentColor}20` }}
              >
                <Calendar className="h-6 w-6" style={{ color: organization.accentColor }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mandates Table */}
      <Card className="border-0 shadow-md mb-8">
        <CardHeader 
          className="text-white"
          style={{ background: `linear-gradient(to right, ${organization.primaryColor}, ${organization.secondaryColor})` }}
        >
          <CardTitle>Debit Order Mandates</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Holder</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Max Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mandatesLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading mandates...
                    </TableCell>
                  </TableRow>
                ) : mandates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <CreditCard className="h-12 w-12 text-slate-400" />
                        <p className="text-slate-500">No debit order mandates yet</p>
                        <p className="text-sm text-slate-400">Create your first mandate to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  mandates.map((mandate) => (
                    <TableRow key={mandate.id}>
                      <TableCell className="font-medium">{mandate.accountHolder}</TableCell>
                      <TableCell>{mandate.bankName}</TableCell>
                      <TableCell className="font-mono text-sm">
                        ****{mandate.accountNumber.slice(-4)}
                      </TableCell>
                      <TableCell>R{formatCurrency(mandate.maxAmount)}</TableCell>
                      <TableCell className="capitalize">{mandate.frequency}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={mandate.status === 'active' ? 'default' : 'secondary'}
                          className="flex items-center space-x-1"
                          style={{
                            backgroundColor: mandate.status === 'active' ? organization.accentColor : undefined,
                            color: mandate.status === 'active' ? 'white' : undefined
                          }}
                        >
                          {mandate.status === 'active' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          <span className="capitalize">{mandate.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadMandateForm(mandate.id)}
                            style={{ 
                              borderColor: organization.secondaryColor,
                              color: organization.primaryColor
                            }}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Form
                          </Button>
                          {mandate.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => activateMandateMutation.mutate(mandate.id)}
                              disabled={activateMandateMutation.isPending}
                              className="text-white"
                              style={{ backgroundColor: organization.accentColor }}
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="border-0 shadow-md">
        <CardHeader 
          className="text-white"
          style={{ background: `linear-gradient(to right, ${organization.primaryColor}, ${organization.secondaryColor})` }}
        >
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Mandate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading transactions...
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Clock className="h-12 w-12 text-slate-400" />
                        <p className="text-slate-500">No transactions yet</p>
                        <p className="text-sm text-slate-400">Transactions will appear here once mandates are processed</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">{transaction.transactionReference}</TableCell>
                      <TableCell className="font-semibold">R{formatCurrency(transaction.amount)}</TableCell>
                      <TableCell className="capitalize">{transaction.transactionType.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={transaction.status === 'successful' ? 'default' : 'destructive'}
                          className="flex items-center space-x-1"
                          style={{
                            backgroundColor: transaction.status === 'successful' ? organization.accentColor : undefined,
                            color: transaction.status === 'successful' ? 'white' : undefined
                          }}
                        >
                          {transaction.status === 'successful' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          <span className="capitalize">{transaction.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(transaction.processedAt)}</TableCell>
                      <TableCell>{transaction.mandate?.mandateReference}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}