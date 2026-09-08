import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  CreditCard, 
  Building2, 
  DollarSign, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Shield,
  Zap,
  Clock,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';

interface BankAccount {
  id: number;
  accountName: string;
  accountType: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  balance: number;
  isActive: boolean;
  plaidAccountId?: string;
  lastSynced: string;
}

interface BillPayment {
  id: number;
  billId: number;
  billName: string;
  payeeWebsite: string;
  accountNumber: string;
  isAutoPay: boolean;
  paymentAmount: number;
  paymentDate: number; // day of month
  isActive: boolean;
  lastPayment?: string;
  nextPayment: string;
  status: 'active' | 'paused' | 'failed';
}

interface PaymentLimit {
  id: number;
  limitType: 'daily' | 'monthly' | 'per_transaction';
  amount: number;
  isActive: boolean;
}

export default function BankingIntegration() {
  const [activeTab, setActiveTab] = useState('accounts');
  const [showBalance, setShowBalance] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [showBillPayDialog, setShowBillPayDialog] = useState(false);
  const [billFormData, setBillFormData] = useState({
    billName: '',
    payeeWebsite: '',
    accountNumber: '',
    paymentAmount: '',
    paymentDate: '',
    isAutoPay: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch bank accounts
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['/api/bank-accounts'],
  });

  // Fetch bill payments
  const { data: billPayments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/bill-payments'],
  });

  // Fetch payment limits
  const { data: paymentLimits = [], isLoading: limitsLoading } = useQuery({
    queryKey: ['/api/payment-limits'],
  });

  // Connect bank account via Plaid
  const connectBankMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/bank-accounts/connect-plaid', {});
      return response.json();
    },
    onSuccess: (data) => {
      if (data.demo_mode) {
        toast({
          title: "Demo Bank Accounts Added",
          description: "Sample checking and savings accounts have been connected for testing. Real banking requires Plaid API credentials.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/bank-accounts'] });
      } else if (data.linkToken) {
        // Open Plaid Link in popup
        window.open(`/api/plaid-link?token=${data.linkToken}`, 'plaid', 'width=600,height=700');
        
        // Listen for success message
        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === 'PLAID_SUCCESS') {
            queryClient.invalidateQueries({ queryKey: ['/api/bank-accounts'] });
            toast({
              title: "Bank Connected",
              description: "Your bank account has been successfully linked!",
            });
            window.removeEventListener('message', handleMessage);
          }
        };
        window.addEventListener('message', handleMessage);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to your bank. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Setup automatic bill payment
  const setupBillPayMutation = useMutation({
    mutationFn: (data: {
      billName: string;
      payeeWebsite: string;
      accountNumber: string;
      paymentAmount: number;
      paymentDate: number;
      isAutoPay: boolean;
    }) => {
      return apiRequest('POST', '/api/bill-payments', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bill-payments'] });
      setShowBillPayDialog(false);
      setBillFormData({
        billName: '',
        payeeWebsite: '',
        accountNumber: '',
        paymentAmount: '',
        paymentDate: '',
        isAutoPay: true
      });
      toast({
        title: "Bill Pay Setup",
        description: "Automatic bill payment has been configured!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to setup automatic bill payment.",
        variant: "destructive",
      });
    },
  });

  const handleBillPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billFormData.billName || !billFormData.paymentAmount || !billFormData.paymentDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setupBillPayMutation.mutate({
      billName: billFormData.billName,
      payeeWebsite: billFormData.payeeWebsite,
      accountNumber: billFormData.accountNumber,
      paymentAmount: parseFloat(billFormData.paymentAmount),
      paymentDate: parseInt(billFormData.paymentDate),
      isAutoPay: billFormData.isAutoPay,
    });
  };

  // Toggle auto pay
  const toggleAutoPayMutation = useMutation({
    mutationFn: ({ paymentId, isActive }: { paymentId: number; isActive: boolean }) =>
      apiRequest('PATCH', `/api/bill-payments/${paymentId}/toggle`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bill-payments'] });
      toast({
        title: "Auto Pay Updated",
        description: "Automatic payment setting has been updated.",
      });
    },
  });

  // Sync account balance
  const syncBalanceMutation = useMutation({
    mutationFn: (accountId: number) =>
      apiRequest('POST', `/api/bank-accounts/${accountId}/sync`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bank-accounts'] });
      toast({
        title: "Balance Updated",
        description: "Account balance has been synced.",
      });
    },
  });

  const totalBalance = accounts.reduce((sum: number, account: BankAccount) => sum + account.balance, 0);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Banking & Bill Pay</h1>
        <p className="text-gray-600">Connect your bank accounts and automate bill payments securely</p>
      </div>

      {/* Security Notice */}
      <Alert className="mb-6 border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Bank-level security:</strong> Your financial data is encrypted and protected using the same security standards as major banks.
          We partner with Plaid (trusted by Chase, Wells Fargo, and others) for secure account connections.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Accounts
          </TabsTrigger>
          <TabsTrigger value="billpay" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Bill Pay
          </TabsTrigger>
          <TabsTrigger value="limits" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Safety Limits
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Bank Accounts Tab */}
        <TabsContent value="accounts" className="space-y-6">
          {/* Account Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Account Summary
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBalance(!showBalance)}
                  className="flex items-center gap-2"
                >
                  {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showBalance ? 'Hide' : 'Show'} Balance
                </Button>
              </CardTitle>
              <CardDescription>
                Total across {accounts.length} connected account{accounts.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {showBalance ? `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••'}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {accounts.length > 0 ? new Date(accounts[0]?.lastSynced).toLocaleString() : 'Never'}
              </p>
            </CardContent>
          </Card>

          {/* Connected Accounts */}
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Connected Accounts</h3>
              <Button 
                onClick={() => connectBankMutation.mutate()}
                disabled={connectBankMutation.isPending}
                className="flex items-center gap-2"
              >
                <Building2 className="h-4 w-4" />
                Connect Bank Account
              </Button>
            </div>

            {accounts.length === 0 ? (
              <Card className="p-8 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No Bank Accounts Connected</h3>
                <p className="text-gray-600 mb-4">
                  Connect your bank account to enable automatic bill payments and balance monitoring.
                </p>
                <Button 
                  onClick={() => connectBankMutation.mutate()}
                  disabled={connectBankMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  Connect Your First Account
                </Button>
              </Card>
            ) : (
              accounts.map((account: BankAccount) => (
                <Card key={account.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{account.accountName}</h4>
                          <p className="text-sm text-gray-500">{account.bankName} • {account.accountType}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>••••{account.accountNumber.slice(-4)}</span>
                        <Badge variant={account.isActive ? "default" : "secondary"}>
                          {account.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {showBalance ? `$${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••'}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => syncBalanceMutation.mutate(account.id)}
                        disabled={syncBalanceMutation.isPending}
                        className="mt-2"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Sync
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Bill Pay Tab */}
        <TabsContent value="billpay" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Automatic Bill Payments</h3>
            <Dialog open={showBillPayDialog} onOpenChange={setShowBillPayDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Setup New Bill Pay
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Setup Automatic Bill Payment</DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto pr-2">
                  <form onSubmit={handleBillPaySubmit} className="space-y-4">
                    <div>
                    <Label htmlFor="billName">Bill Name *</Label>
                    <Input
                      id="billName"
                      placeholder="e.g., Electric Bill, Internet"
                      value={billFormData.billName}
                      onChange={(e) => setBillFormData({...billFormData, billName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="payeeWebsite">Payee Website</Label>
                    <Input
                      id="payeeWebsite"
                      placeholder="e.g., power-company.com"
                      value={billFormData.payeeWebsite}
                      onChange={(e) => setBillFormData({...billFormData, payeeWebsite: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      placeholder="Your account number with the company"
                      value={billFormData.accountNumber}
                      onChange={(e) => setBillFormData({...billFormData, accountNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentAmount">Payment Amount ($) *</Label>
                    <Input
                      id="paymentAmount"
                      type="number"
                      step="0.01"
                      placeholder="85.00"
                      value={billFormData.paymentAmount}
                      onChange={(e) => setBillFormData({...billFormData, paymentAmount: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentDate">Payment Date (Day of Month) *</Label>
                    <Input
                      id="paymentDate"
                      type="number"
                      min="1"
                      max="31"
                      placeholder="15"
                      value={billFormData.paymentDate}
                      onChange={(e) => setBillFormData({...billFormData, paymentDate: e.target.value})}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoPay"
                      checked={billFormData.isAutoPay}
                      onCheckedChange={(checked) => setBillFormData({...billFormData, isAutoPay: checked})}
                    />
                    <Label htmlFor="autoPay">Enable automatic payments</Label>
                  </div>
                    <div className="flex gap-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowBillPayDialog(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={setupBillPayMutation.isPending}
                        className="flex-1"
                      >
                        {setupBillPayMutation.isPending ? 'Setting up...' : 'Setup Bill Pay'}
                      </Button>
                    </div>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {billPayments.length === 0 ? (
            <Card className="p-8 text-center">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Automatic Payments Setup</h3>
              <p className="text-gray-600 mb-4">
                Set up automatic bill payments to never miss a due date and avoid late fees.
              </p>
              <Button 
                onClick={() => setShowBillPayDialog(true)}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Setup Your First Auto Payment
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {billPayments.map((payment: BillPayment) => (
                <Card key={payment.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{payment.billName}</h4>
                          <p className="text-sm text-gray-500">
                            {payment.payeeWebsite} • Account: ••••{payment.accountNumber.slice(-4)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          ${payment.paymentAmount.toFixed(2)} on the {payment.paymentDate}th
                        </span>
                        <Badge 
                          variant={payment.status === 'active' ? 'default' : 
                                  payment.status === 'failed' ? 'destructive' : 'secondary'}
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm">
                        <div className="text-gray-600">Next Payment:</div>
                        <div className="font-semibold">
                          {new Date(payment.nextPayment).toLocaleDateString()}
                        </div>
                      </div>
                      <Switch
                        checked={payment.isAutoPay}
                        onCheckedChange={(checked) =>
                          toggleAutoPayMutation.mutate({
                            paymentId: payment.id,
                            isActive: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Safety Limits Tab */}
        <TabsContent value="limits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Payment Safety Limits
              </CardTitle>
              <CardDescription>
                Set spending limits to protect your accounts from unauthorized or excessive payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  These limits help prevent accidental overspending. Your caregiver can help adjust these settings if needed.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Daily Spending Limit</h4>
                    <p className="text-sm text-gray-600">Maximum amount that can be spent per day</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      placeholder="$500"
                      className="w-24"
                    />
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Monthly Budget Limit</h4>
                    <p className="text-sm text-gray-600">Maximum automatic payments per month</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      placeholder="$2000"
                      className="w-24"
                    />
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Single Payment Limit</h4>
                    <p className="text-sm text-gray-600">Maximum amount for any individual payment</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      placeholder="$1000"
                      className="w-24"
                    />
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Button className="w-full">
                Save Safety Limits
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Payment History</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Export</Button>
              <Button variant="outline" size="sm">Filter</Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500 py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">No Payment History Yet</h3>
                <p>Once you start making automatic payments, your transaction history will appear here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}