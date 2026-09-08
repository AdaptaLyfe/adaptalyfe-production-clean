import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, DollarSign, Plus, CheckCircle, AlertCircle, CreditCard, Building, Link, BarChart3 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getDaysUntilDue } from "@/lib/utils";
import type { Bill, BudgetEntry, BankAccount } from "@shared/schema";

const billSchema = z.object({
  name: z.string().min(1, "Bill name is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  dueDate: z.number().min(1).max(31),
  category: z.string().min(1, "Category is required"),
  isRecurring: z.boolean(),
});

const budgetSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  type: z.enum(["income", "expense"]),
  description: z.string().optional(),
});

const billPaySchema = z.object({
  billId: z.number(),
  payeeWebsite: z.string().url("Please enter a valid payment website URL"),
  payeeAccountNumber: z.string().optional(),
});

const bankAccountSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountType: z.enum(["checking", "savings", "credit"]),
  accountNickname: z.string().optional(),
  bankWebsite: z.string().url("Please enter a valid bank website URL"),
  lastFour: z.string().optional(),
});

export default function FinancialPage() {
  const { toast } = useToast();
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [showBillPayDialog, setShowBillPayDialog] = useState(false);
  const [showBankDialog, setShowBankDialog] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  
  const { data: bills = [], isLoading: billsLoading } = useQuery<Bill[]>({
    queryKey: ["/api/bills"],
  });

  const { data: budgetEntries = [], isLoading: budgetLoading } = useQuery<BudgetEntry[]>({
    queryKey: ["/api/budget-entries"],
  });

  const { data: bankAccounts = [], isLoading: bankLoading } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const billForm = useForm({
    resolver: zodResolver(billSchema),
    defaultValues: {
      name: "",
      amount: 0,
      dueDate: 1,
      category: "",
      isRecurring: true,
    },
  });

  const budgetForm = useForm({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: "",
      amount: 0,
      type: "expense" as const,
      description: "",
    },
  });

  const billPayForm = useForm({
    resolver: zodResolver(billPaySchema),
    defaultValues: {
      billId: 0,
      payeeWebsite: "",
      payeeAccountNumber: "",
    },
  });

  const bankForm = useForm({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      bankName: "",
      accountType: "checking" as const,
      accountNickname: "",
      bankWebsite: "",
      lastFour: "",
    },
  });

  const createBillMutation = useMutation({
    mutationFn: async (data: z.infer<typeof billSchema>) => {
      return apiRequest("POST", "/api/bills", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      setShowBillDialog(false);
      billForm.reset();
      toast({
        title: "Bill added!",
        description: "Your new bill has been added to the calendar.",
      });
    },
  });

  const createBudgetMutation = useMutation({
    mutationFn: async (data: z.infer<typeof budgetSchema>) => {
      return apiRequest("POST", "/api/budget-entries", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-entries"] });
      setShowBudgetDialog(false);
      budgetForm.reset();
      toast({
        title: "Budget entry added!",
        description: "Your budget has been updated.",
      });
    },
  });

  const setupBillPayMutation = useMutation({
    mutationFn: async (data: z.infer<typeof billPaySchema>) => {
      return apiRequest("PATCH", `/api/bills/${data.billId}/payment-link`, {
        payeeWebsite: data.payeeWebsite,
        payeeAccountNumber: data.payeeAccountNumber,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      setShowBillPayDialog(false);
      billPayForm.reset();
      setSelectedBill(null);
      toast({
        title: "Payment link saved!",
        description: "You can now click 'Pay Bill' to visit the secure payment website.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save payment link",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const payBillMutation = useMutation({
    mutationFn: async ({ billId, isPaid }: { billId: number; isPaid: boolean }) => {
      return apiRequest("PATCH", `/api/bills/${billId}/pay`, { isPaid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      toast({
        title: "Bill updated!",
        description: "Payment status has been updated.",
      });
    },
  });

  const createBankMutation = useMutation({
    mutationFn: async (data: z.infer<typeof bankAccountSchema>) => {
      return apiRequest("POST", "/api/bank-accounts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      setShowBankDialog(false);
      bankForm.reset();
      toast({
        title: "Bank account added!",
        description: "You can now access your bank quickly for balance checking.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add bank account",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteBankMutation = useMutation({
    mutationFn: async (accountId: number) => {
      return apiRequest("DELETE", `/api/bank-accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({
        title: "Bank account removed",
        description: "The bank account has been removed from your quick links.",
      });
    },
  });

  const handleSetupBillPay = (bill: Bill) => {
    setSelectedBill(bill);
    billPayForm.setValue('billId', bill.id);
    billPayForm.setValue('payeeWebsite', bill.payeeWebsite || '');
    billPayForm.setValue('payeeAccountNumber', bill.payeeAccountNumber || '');
    setShowBillPayDialog(true);
  };

  const handlePayBillClick = async (bill: Bill, payeeWebsite?: string) => {
    if (payeeWebsite) {
      // Open payment website in new tab
      window.open(payeeWebsite, '_blank', 'noopener,noreferrer');
      
      toast({
        title: "Opening payment website",
        description: `Redirecting to ${new URL(payeeWebsite).hostname} to complete your payment.`,
      });
    }
  };

  const totalIncome = budgetEntries
    .filter(entry => entry.type === "income")
    .reduce((sum, entry) => sum + entry.amount, 0);
  
  const totalExpenses = budgetEntries
    .filter(entry => entry.type === "expense")
    .reduce((sum, entry) => sum + entry.amount, 0);

  const budgetUsed = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

  const upcomingBills = bills
    .filter(bill => !bill.isPaid)
    .sort((a, b) => getDaysUntilDue(a.dueDate) - getDaysUntilDue(b.dueDate));

  if (billsLoading || budgetLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Management</h1>
        <p className="text-gray-600">Track your budget, bills, and payments all in one place</p>
      </div>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="border-t-4 border-vibrant-green">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="mr-2 text-vibrant-green" size={20} />
              Monthly Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-vibrant-green">
              {formatCurrency(totalIncome)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-coral-pink">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <CreditCard className="mr-2 text-coral-pink" size={20} />
              Monthly Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-coral-pink">
              {formatCurrency(totalExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-bright-blue">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="mr-2 text-bright-blue" size={20} />
              Budget Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-bright-blue">
              {budgetUsed.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-bright-blue h-2 rounded-full transition-all" 
                style={{ width: `${Math.min(budgetUsed, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bills */}
      <Card className="border-t-4 border-sunny-orange mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar size={20} />
              <span>Upcoming Bills</span>
            </div>
            <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
              <DialogTrigger asChild>
                <Button className="bg-sunny-orange hover:bg-orange-600">
                  <Plus size={16} className="mr-2" />
                  Add Bill
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Bill</DialogTitle>
                </DialogHeader>
                <Form {...billForm}>
                  <form onSubmit={billForm.handleSubmit((data) => createBillMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={billForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bill Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Electric Bill" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={billForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="0.00" 
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={billForm.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date (Day of Month)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="31" 
                              placeholder="15" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={billForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="utilities">Utilities</SelectItem>
                              <SelectItem value="rent">Rent/Mortgage</SelectItem>
                              <SelectItem value="phone">Phone</SelectItem>
                              <SelectItem value="internet">Internet</SelectItem>
                              <SelectItem value="insurance">Insurance</SelectItem>
                              <SelectItem value="subscription">Subscription</SelectItem>
                              <SelectItem value="credit-card">Credit Card</SelectItem>
                              <SelectItem value="loan">Loan</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={createBillMutation.isPending}>
                      Add Bill
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingBills.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No upcoming bills</p>
            ) : (
              upcomingBills.map((bill) => {
                const daysUntil = getDaysUntilDue(bill.dueDate);
                const isUrgent = daysUntil <= 3;
                
                return (
                  <div key={bill.id} className={`flex items-center space-x-4 p-4 rounded-lg border-2 ${
                    isUrgent ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
                  }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isUrgent ? "bg-red-500" : "bg-sunny-orange"
                    }`}>
                      {isUrgent ? (
                        <AlertCircle className="text-white" size={20} />
                      ) : (
                        <Calendar className="text-white" size={20} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{bill.name}</h4>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(bill.amount)} • Due in {daysUntil} day{daysUntil !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {bill.payeeWebsite ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-vibrant-green text-vibrant-green hover:bg-green-50"
                          onClick={() => handlePayBillClick(bill, bill.payeeWebsite)}
                        >
                          <Link size={14} className="mr-1" />
                          Pay Bill
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-500 text-blue-500 hover:bg-blue-50"
                          onClick={() => handleSetupBillPay(bill)}
                        >
                          <Link size={14} className="mr-1" />
                          Add Payment Link
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-500 text-gray-500 hover:bg-gray-50"
                        onClick={() => payBillMutation.mutate({ billId: bill.id, isPaid: !bill.isPaid })}
                      >
                        {bill.isPaid ? "Mark Unpaid" : "Mark Paid"}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bill Pay Setup Dialog */}
      <Dialog open={showBillPayDialog} onOpenChange={setShowBillPayDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Setup Bill Payment</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Setting up payment for:</p>
              <p className="font-medium">{selectedBill.name} - {formatCurrency(selectedBill.amount)}</p>
            </div>
          )}
          <Form {...billPayForm}>
            <form onSubmit={billPayForm.handleSubmit((data) => setupBillPayMutation.mutate(data))} className="space-y-4">
              
              {/* Simple Payment Link Setup */}
              <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Link className="text-blue-600" size={20} />
                  <div>
                    <p className="font-medium text-blue-900">Payment Link Setup</p>
                    <p className="text-sm text-blue-700">Store the payment website for easy access - simple and secure!</p>
                  </div>
                </div>
              </div>
              
              {/* Payment Website URL */}
              <FormField
                control={billPayForm.control}
                name="payeeWebsite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Website URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://www.yourprovider.com/pay-bill" 
                        {...field} 
                      />
                    </FormControl>
                    <p className="text-sm text-gray-600">
                      Enter the website where you normally pay this bill (e.g., utility company, credit card website)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Optional Account Number */}
              <FormField
                control={billPayForm.control}
                name="payeeAccountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Account Number (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your account number" 
                        {...field} 
                      />
                    </FormControl>
                    <p className="text-sm text-gray-600">
                      Store your account number for easy reference when paying
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowBillPayDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={setupBillPayMutation.isPending}
                >
                  {setupBillPayMutation.isPending ? "Saving..." : "Save Payment Link"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Bank Quick Access */}
      <Card className="border-t-4 border-vibrant-blue mt-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building size={20} />
              <span>Bank Quick Access</span>
            </div>
            <Dialog open={showBankDialog} onOpenChange={setShowBankDialog}>
              <DialogTrigger asChild>
                <Button className="bg-vibrant-blue hover:bg-blue-600">
                  <Plus size={16} className="mr-2" />
                  Add Bank
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Bank Account Link</DialogTitle>
                </DialogHeader>
                <Form {...bankForm}>
                  <form onSubmit={bankForm.handleSubmit((data) => createBankMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={bankForm.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Chase Bank" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bankForm.control}
                      name="accountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select account type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="checking">Checking</SelectItem>
                              <SelectItem value="savings">Savings</SelectItem>
                              <SelectItem value="credit">Credit Card</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bankForm.control}
                      name="accountNickname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nickname (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="My Checking" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bankForm.control}
                      name="bankWebsite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://www.chase.com/login" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bankForm.control}
                      name="lastFour"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last 4 Digits (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="1234" maxLength={4} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-vibrant-blue hover:bg-blue-600"
                      disabled={createBankMutation.isPending}
                    >
                      {createBankMutation.isPending ? "Adding..." : "Add Bank Link"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bankAccounts.length === 0 ? (
            <div className="text-center py-8">
              <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">No bank links added yet</p>
              <p className="text-sm text-gray-400">Add your bank websites for quick balance checking</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {bankAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Building className="text-vibrant-blue" size={20} />
                    <div>
                      <p className="font-medium">{account.accountNickname || account.bankName}</p>
                      <p className="text-sm text-gray-500">
                        {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)}
                        {account.lastFour && ` • ****${account.lastFour}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      className="bg-vibrant-blue hover:bg-blue-600"
                      onClick={() => {
                        window.open(account.bankWebsite, '_blank', 'noopener,noreferrer');
                        toast({
                          title: "Opening bank website",
                          description: `Redirecting to ${new URL(account.bankWebsite).hostname} for balance checking.`,
                        });
                      }}
                    >
                      <Link size={14} className="mr-1" />
                      Check Balance
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteBankMutation.mutate(account.id)}
                      disabled={deleteBankMutation.isPending}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}