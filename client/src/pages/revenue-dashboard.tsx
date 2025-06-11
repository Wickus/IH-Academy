import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Calendar, Download, CreditCard, Users, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Organization, Booking, Payment } from '@shared/schema';

export default function RevenueDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Fetch current user's organization
  const { data: organizations } = useQuery({
    queryKey: ['/api/organizations/my'],
    queryFn: () => api.getUserOrganizations(),
  });

  const organization = organizations?.[0];

  // Fetch revenue data
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['/api/revenue', organization?.id, selectedPeriod, selectedYear],
    queryFn: async () => {
      if (!organization) return null;
      const response = await fetch(`/api/revenue/${organization.id}?period=${selectedPeriod}&year=${selectedYear}`);
      if (!response.ok) throw new Error('Failed to fetch revenue data');
      return response.json();
    },
    enabled: !!organization,
  });

  // Fetch detailed payment records
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/payments', organization?.id, selectedPeriod],
    queryFn: async () => {
      if (!organization) return [];
      const response = await fetch(`/api/payments?organizationId=${organization.id}&period=${selectedPeriod}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!organization,
  });

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(num);
  };

  const exportRevenueReport = () => {
    if (!revenueData || !payments.length) {
      toast({
        title: 'No data to export',
        description: 'Please select a period with revenue data.',
        variant: 'destructive',
      });
      return;
    }

    const csvContent = [
      ['Date', 'Transaction ID', 'Participant', 'Class', 'Amount', 'Payment Method', 'Status'].join(','),
      ...payments.map((payment: any) => [
        new Date(payment.createdAt || '').toLocaleDateString(),
        payment.id,
        payment.participantName || 'N/A',
        payment.className || 'N/A',
        payment.amount,
        payment.paymentMethod || 'N/A',
        payment.status || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${organization?.name}-revenue-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: 'Revenue report exported successfully' });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': case 'paid': return organization?.primaryColor || '#10b981';
      case 'pending': return organization?.secondaryColor || '#f59e0b';
      case 'failed': case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getGrowthPercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Organization Found</h2>
          <p className="text-muted-foreground">Please create an organization first.</p>
        </div>
      </div>
    );
  }

  const monthlyData = revenueData?.monthlyBreakdown || [];
  const totalRevenue = revenueData?.totalRevenue || 0;
  const previousPeriodRevenue = revenueData?.previousPeriodRevenue || 0;
  const growthPercentage = getGrowthPercentage(totalRevenue, previousPeriodRevenue);

  return (
    <div className="min-h-screen" style={{ backgroundColor: `${organization.accentColor}10` }}>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="h-8 w-px bg-border" />
          <div>
            <h1 className="text-3xl font-bold" style={{ color: organization.accentColor }}>
              Revenue Dashboard
            </h1>
            <p className="text-muted-foreground">
              Financial analytics for {organization.name}
            </p>
          </div>
        </div>

        {/* Controls */}
        <Card className="mb-6" style={{ borderTopColor: organization.accentColor, borderTopWidth: '4px' }}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Period Selection
              </div>
              <Button
                onClick={exportRevenueReport}
                variant="outline"
                className="flex items-center gap-2"
                style={{ borderColor: organization.accentColor, color: organization.accentColor }}
              >
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-month">Current Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="current-quarter">Current Quarter</SelectItem>
                  <SelectItem value="last-quarter">Last Quarter</SelectItem>
                  <SelectItem value="current-year">Current Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: organization.accentColor }}>
                {formatCurrency(totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {growthPercentage >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                {Math.abs(growthPercentage).toFixed(1)}% from previous period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: organization.primaryColor }}>
                {formatCurrency(revenueData?.averageTransaction || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per booking transaction
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: organization.secondaryColor }}>
                {revenueData?.totalTransactions || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Completed payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {revenueData?.payingMembers || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Members who made payments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Breakdown Chart Placeholder */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="flex items-center justify-center py-8">
                <div 
                  className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full"
                  style={{ borderColor: `${organization.accentColor}40`, borderTopColor: 'transparent' }}
                />
              </div>
            ) : monthlyData.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No revenue data available</h3>
                <p className="text-muted-foreground">
                  Revenue data will appear here once payments are processed.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {monthlyData.map((month: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{month.month}</h4>
                      <p className="text-sm text-muted-foreground">{month.transactions} transactions</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold" style={{ color: organization.accentColor }}>
                        {formatCurrency(month.revenue)}
                      </div>
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(month.revenue / Math.max(...monthlyData.map((m: any) => m.revenue))) * 100}%`,
                            backgroundColor: organization.accentColor
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div 
                  className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full"
                  style={{ borderColor: `${organization.accentColor}40`, borderTopColor: 'transparent' }}
                />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No transactions found</h3>
                <p className="text-muted-foreground">
                  Payment transactions will appear here once bookings are made.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.slice(0, 10).map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {new Date(payment.createdAt || '').toLocaleDateString()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(payment.createdAt || '').toLocaleTimeString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{payment.participantName || 'N/A'}</span>
                            <span className="text-sm text-muted-foreground">#{payment.id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: organization.primaryColor }}
                            />
                            {payment.className || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium" style={{ color: organization.accentColor }}>
                            {formatCurrency(payment.amount || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4" />
                            {payment.paymentMethod || 'PayFast'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary"
                            style={{ 
                              backgroundColor: `${getStatusColor(payment.status)}20`,
                              color: getStatusColor(payment.status),
                              borderColor: getStatusColor(payment.status),
                            }}
                          >
                            {payment.status || 'pending'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}