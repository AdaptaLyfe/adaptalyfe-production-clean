import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, DollarSign, Plus, CheckCircle, AlertCircle, CreditCard, Building, Target, FolderOpen, ExternalLink, Trash2 } from "lucide-react";
import SavingsGoals from "@/components/savings-goals";
import BudgetCategories from "@/components/budget-categories";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getDaysUntilDue } from "@/lib/utils";
import { useSubscriptionEnforcement } from "@/middleware/subscription-middleware";
import PremiumFeaturePrompt from "@/components/premium-feature-prompt";
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

const savingsGoalSchema = z.object({
  title: z.string().min(1, "Goal title is required"),
  description: z.string().optional(),
  targetAmount: z.number().min(0.01, "Target amount must be greater than 0"),
  currentAmount: z.number().min(0, "Current amount cannot be negative"),
  targetDate: z.string().min(1, "Target date is required"),
  category: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  type: z.enum(["income", "expense"]),
  budgetedAmount: z.number().min(0, "Budget amount cannot be negative"),
  color: z.string().optional(),
});

const bankAccountSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountType: z.enum(["checking", "savings", "credit"]),
  accountNickname: z.string().optional(),
  bankWebsite: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  lastFour: z.string().max(4, "Last 4 digits only").optional(),
});

export default function Financial() {
  const { isPremiumUser } = useSubscriptionEnforcement();
  const { toast } = useToast();
  const [showBillDialog, setShowBillDialog] = useState(false);
  
  // Block access if trial expired and no active subscription
  if (!isPremiumUser) {
    return (
      <div className="container mx-auto p-6">
        <PremiumFeaturePrompt
          title="Financial Management"
          description="Track bills, manage budgets, and monitor your financial health. Subscribe to continue using Adaptalyfe's financial management tools."
          feature="financial"
          requiredPlan="premium"
          className="max-w-md mx-auto mt-20"
        />
      </div>
    );
  }
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [showSavingsDialog, setShowSavingsDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showBankDialog, setShowBankDialog] = useState(false);
  const [editingSavingsGoal, setEditingSavingsGoal] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingBill, setEditingBill] = useState<any>(null);
  const [editingBank, setEditingBank] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: bills = [], isLoading: billsLoading } = useQuery<Bill[]>({
    queryKey: ["/api/bills"],
  });

  const { data: budgetEntries = [], isLoading: budgetLoading } = useQuery<BudgetEntry[]>({
    queryKey: ["/api/budget-entries"],
  });

  const { data: savingsGoals = [] } = useQuery<any[]>({
    queryKey: ["/api/savings-goals"],
  });

  const { data: budgetCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/budget-categories"],
  });

  const { data: bankAccounts = [] } = useQuery<BankAccount[]>({
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

  const budgetForm = useForm<{category: string; amount: number; type: "income" | "expense"; description: string}>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: "",
      amount: 0,
      type: "expense" as const,
      description: "",
    },
  });

  const savingsForm = useForm({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: {
      title: "",
      description: "",
      targetAmount: 0,
      currentAmount: 0,
      targetDate: "",
      category: "general",
      priority: "medium" as const,
    },
  });

  const categoryForm = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      type: "expense" as const,
      budgetedAmount: 0,
      color: "#3b82f6",
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



  const createBudgetMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/budget-entries", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-entries"] });
      setShowBudgetDialog(false);
      budgetForm.reset();
      toast({
        title: "Success",
        description: "Budget entry added successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add budget entry",
        variant: "destructive",
      });
    },
  });

  const savingsGoalMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = editingSavingsGoal 
        ? `/api/savings-goals/${editingSavingsGoal.id}` 
        : "/api/savings-goals";
      const method = editingSavingsGoal ? "PATCH" : "POST";
      
      // Backend now handles date conversion, send raw data
      const processedData = data;
      
      const response = await apiRequest(method, endpoint, processedData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-goals"] });
      queryClient.refetchQueries({ queryKey: ["/api/savings-goals"] });
      setShowSavingsDialog(false);
      setEditingSavingsGoal(null);
      savingsForm.reset();
      toast({
        title: "Success",
        description: editingSavingsGoal 
          ? "Savings goal updated successfully!" 
          : "Savings goal created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save savings goal",
        variant: "destructive",
      });
    },
  });

  const billMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = editingBill 
        ? `/api/bills/${editingBill.id}` 
        : "/api/bills";
      const method = editingBill ? "PATCH" : "POST";
      const response = await apiRequest(method, endpoint, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      queryClient.refetchQueries({ queryKey: ["/api/bills"] });
      setShowBillDialog(false);
      setEditingBill(null);
      billForm.reset();
      toast({
        title: "Success",
        description: editingBill 
          ? "Bill updated successfully!" 
          : "Bill created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save bill",
        variant: "destructive",
      });
    },
  });

  const categoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = editingCategory 
        ? `/api/budget-categories/${editingCategory.id}` 
        : "/api/budget-categories";
      const method = editingCategory ? "PATCH" : "POST";
      const response = await apiRequest(method, endpoint, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-categories"] });
      queryClient.refetchQueries({ queryKey: ["/api/budget-categories"] });
      setShowCategoryDialog(false);
      setEditingCategory(null);
      categoryForm.reset();
      toast({
        title: "Success",
        description: editingCategory 
          ? "Category updated successfully!" 
          : "Category created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive",
      });
    },
  });

  const bankMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = editingBank 
        ? `/api/bank-accounts/${editingBank.id}` 
        : "/api/bank-accounts";
      const method = editingBank ? "PATCH" : "POST";
      const response = await apiRequest(method, endpoint, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      queryClient.refetchQueries({ queryKey: ["/api/bank-accounts"] });
      setShowBankDialog(false);
      setEditingBank(null);
      bankForm.reset();
      toast({
        title: "Success",
        description: editingBank 
          ? "Bank account updated successfully!" 
          : "Bank account added successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save bank account",
        variant: "destructive",
      });
    },
  });

  const deleteBankMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/bank-accounts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({
        title: "Success",
        description: "Bank account removed successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove bank account",
        variant: "destructive",
      });
    },
  });

  // Calculate totals
  const totalIncome = budgetEntries
    .filter((entry: BudgetEntry) => entry.type === "income")
    .reduce((sum: number, entry: BudgetEntry) => sum + entry.amount, 0);

  const totalExpenses = budgetEntries
    .filter((entry: BudgetEntry) => entry.type === "expense")
    .reduce((sum: number, entry: BudgetEntry) => sum + entry.amount, 0);

  const budgetUsed = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

  if (billsLoading || budgetLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Financial Management</h1>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-t-4 border-bright-blue">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-bright-blue rounded-lg flex items-center justify-center">
                  <DollarSign className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Income</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalIncome)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-sunny-orange">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-sunny-orange rounded-lg flex items-center justify-center">
                  <CreditCard className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalExpenses)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-vibrant-green">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-vibrant-green rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Budget Status</p>
                  <p className={`text-2xl font-bold ${
                    budgetUsed < 80 ? "text-green-600" : 
                    budgetUsed < 100 ? "text-yellow-600" : 
                    "text-red-600"
                  }`}>
                    {Math.round(budgetUsed)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bills">Bills</TabsTrigger>
            <TabsTrigger value="savings">
              <Target className="h-4 w-4 mr-1" />
              Savings
            </TabsTrigger>
            <TabsTrigger value="categories">
              <FolderOpen className="h-4 w-4 mr-1" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="banking">Banking</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="space-y-6">
              <Card className="border-t-4 border-bright-blue">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Monthly Budget Overview</span>
                    <div className="flex gap-2">
                      <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
                        <DialogTrigger asChild>
                          <Button className="bg-red-600 hover:bg-red-700 text-white">
                            <Plus size={16} className="mr-2" />
                            Add Expense
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Budget Entry</DialogTitle>
                          </DialogHeader>
                          <Form {...budgetForm}>
                            <form onSubmit={budgetForm.handleSubmit((data) => createBudgetMutation.mutate(data))} className="space-y-4">
                              <FormField
                                control={budgetForm.control}
                                name="type"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Entry Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select entry type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="income">Income</SelectItem>
                                        <SelectItem value="expense">Expense</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={budgetForm.control}
                                name="category"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g., Groceries, Gas, Shopping" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={budgetForm.control}
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
                                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={budgetForm.control}
                                name="description"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Add a note..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={createBudgetMutation.isPending}>
                                {createBudgetMutation.isPending ? "Adding..." : "Add Entry"}
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          budgetForm.reset({ type: 'income' as const, category: '', amount: 0, description: '' });
                          setShowBudgetDialog(true);
                        }}
                      >
                        <Plus size={16} className="mr-2" />
                        Add Income
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Budget Usage</span>
                      <span className={`text-sm font-medium ${
                        budgetUsed < 80 ? "text-green-600" : budgetUsed < 100 ? "text-yellow-600" : "text-red-600"
                      }`}>
                        {budgetUsed < 80 ? "On track" : budgetUsed < 100 ? "Watch spending" : "Over budget"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                      <div 
                        className={`h-4 rounded-full transition-all duration-500 ${
                          budgetUsed < 80 ? "bg-gradient-to-r from-green-400 to-green-600" : 
                          budgetUsed < 100 ? "bg-gradient-to-r from-yellow-400 to-orange-500" : 
                          "bg-gradient-to-r from-red-400 to-red-600"
                        }`}
                        style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                      >
                        <div className="h-full rounded-full opacity-30 bg-white"></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-red-600">{formatCurrency(totalExpenses)}</span> spent
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-green-600">{formatCurrency(totalIncome)}</span> budget
                      </p>
                    </div>
                    <div className="text-center mt-2">
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                        budgetUsed < 80 ? "bg-green-100 text-green-800" : 
                        budgetUsed < 100 ? "bg-yellow-100 text-yellow-800" : 
                        "bg-red-100 text-red-800"
                      }`}>
                        {Math.round(budgetUsed)}% Used • {formatCurrency(totalIncome - totalExpenses)} Remaining
                      </span>
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
                    {budgetEntries.length > 0 ? (
                      <div className="space-y-3">
                        {budgetEntries.slice(-5).reverse().map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                entry.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                              }`}></div>
                              <div>
                                <p className="font-medium text-gray-900">{entry.category}</p>
                                <p className="text-sm text-gray-600">{entry.description || 'No description'}</p>
                              </div>
                            </div>
                            <span className={`font-semibold ${
                              entry.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {entry.type === 'income' ? '+' : '-'}{formatCurrency(entry.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No transactions yet</p>
                    )}
                  </div>

                  {/* Category Breakdown */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Expense Categories</h3>
                    {(() => {
                      const categoryTotals = budgetEntries
                        .filter(entry => entry.type === 'expense')
                        .reduce((acc, entry) => {
                          acc[entry.category] = (acc[entry.category] || 0) + entry.amount;
                          return acc;
                        }, {} as Record<string, number>);
                      
                      return Object.entries(categoryTotals).length > 0 ? (
                        <div className="space-y-3">
                          {Object.entries(categoryTotals).map(([category, amount]) => (
                            <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="font-medium text-gray-900">{category}</span>
                              <span className="font-semibold text-red-600">{formatCurrency(amount)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No expenses tracked yet</p>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bills" className="mt-6">
            <Card className="border-t-4 border-sunny-orange">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="text-sunny-orange" size={24} />
                    <span>Bill Calendar</span>
                  </div>
                  <Dialog open={showBillDialog} onOpenChange={(open) => {
                    setShowBillDialog(open);
                    if (!open) {
                      setEditingBill(null);
                      billForm.reset();
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        <Plus size={16} className="mr-2" />
                        Add Bill
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingBill ? "Edit Bill" : "Add New Bill"}
                        </DialogTitle>
                      </DialogHeader>
                      <Form {...billForm}>
                        <form onSubmit={billForm.handleSubmit((data) => billMutation.mutate(data))} className="space-y-4">
                          <FormField
                            control={billForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bill Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Electric Bill, Rent" {...field} />
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
                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
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
                                    onChange={e => field.onChange(parseInt(e.target.value) || 1)}
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
                                <FormControl>
                                  <Input placeholder="e.g., Utilities, Housing" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={billMutation.isPending}>
                            {billMutation.isPending ? "Saving..." : 
                             editingBill ? "Update Bill" : "Add Bill"}
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bills.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600">No bills added yet</p>
                      <p className="text-sm text-gray-500 mb-4">Add your recurring bills to track due dates</p>
                      <Button 
                        className="bg-sunny-orange hover:bg-sunny-orange"
                        onClick={() => setShowBillDialog(true)}
                      >
                        <Plus size={16} className="mr-2" />
                        Add Your First Bill
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {bills.map((bill: Bill) => {
                        const daysUntilDue = getDaysUntilDue(bill.dueDate);
                        const isOverdue = daysUntilDue < 0;
                        const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;
                        
                        return (
                          <Card key={bill.id} className={`border-l-4 ${
                            isOverdue ? "border-l-red-500" : 
                            isDueSoon ? "border-l-sunny-orange" : 
                            "border-l-bright-blue"
                          }`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold">{bill.name}</h3>
                                  <p className="text-sm text-gray-600">{bill.category}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">{formatCurrency(bill.amount)}</p>
                                  <p className={`text-sm ${
                                    isOverdue ? "text-red-600" : 
                                    isDueSoon ? "text-sunny-orange" : 
                                    "text-gray-600"
                                  }`}>
                                    {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` :
                                     isDueSoon ? `Due in ${daysUntilDue} days` :
                                     `Due ${daysUntilDue} days`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setEditingBill(bill);
                                    billForm.reset({
                                      name: bill.name,
                                      amount: bill.amount,
                                      dueDate: bill.dueDate,
                                      category: bill.category,
                                      isRecurring: bill.isRecurring ?? true,
                                    });
                                    setShowBillDialog(true);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="bg-bright-blue hover:bg-blue-600"
                                  onClick={() => {
                                    // For now, show a helpful message about bill payment
                                    toast({
                                      title: "Bill Payment",
                                      description: `Ready to pay ${bill.name}! In the full version, this would redirect to your payment portal or banking app.`,
                                    });
                                  }}
                                >
                                  Pay Bill
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="savings" className="mt-6">
            <Card className="border-t-4 border-vibrant-green">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Target className="text-vibrant-green" size={24} />
                    <span>Savings Goals</span>
                  </div>
                  <Dialog open={showSavingsDialog} onOpenChange={setShowSavingsDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        <Plus size={16} className="mr-2" />
                        Add Goal
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingSavingsGoal ? "Edit Savings Goal" : "Create Savings Goal"}
                        </DialogTitle>
                      </DialogHeader>
                      <Form {...savingsForm}>
                        <form onSubmit={savingsForm.handleSubmit((data) => savingsGoalMutation.mutate(data))} className="space-y-4">
                          <FormField
                            control={savingsForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Goal Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Emergency Fund, Vacation" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={savingsForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="What are you saving for?" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={savingsForm.control}
                              name="targetAmount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Target Amount</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="0.01" 
                                      placeholder="0.00"
                                      {...field}
                                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={savingsForm.control}
                              name="currentAmount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Current Amount</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="0.01" 
                                      placeholder="0.00"
                                      {...field}
                                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={savingsForm.control}
                            name="targetDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Target Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={savingsForm.control}
                            name="priority"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Priority</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={savingsGoalMutation.isPending}>
                            {savingsGoalMutation.isPending ? "Saving..." : 
                             editingSavingsGoal ? "Update Goal" : "Create Goal"}
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savingsGoals.length > 0 ? (
                  <div className="space-y-4">
                    {savingsGoals.map((goal: any) => {
                      const progress = (goal.currentAmount / goal.targetAmount) * 100;
                      return (
                        <div key={goal.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-600">
                                {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                              </span>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setEditingSavingsGoal(goal);
                                  savingsForm.reset({
                                    title: goal.title,
                                    description: goal.description || "",
                                    targetAmount: goal.targetAmount,
                                    currentAmount: goal.currentAmount,
                                    targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : "",
                                    category: goal.category || "general",
                                    priority: goal.priority || "medium",
                                  });
                                  setShowSavingsDialog(true);
                                }}
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 bg-vibrant-green rounded-full"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-sm text-gray-600">{Math.round(progress)}% complete</p>
                            <p className="text-sm text-gray-600">
                              Due: {new Date(goal.targetDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No savings goals yet. Create your first goal!</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <Card className="border-t-4 border-bright-blue">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FolderOpen className="text-bright-blue" size={24} />
                    <span>Budget Categories</span>
                  </div>
                  <Dialog open={showCategoryDialog} onOpenChange={(open) => {
                    setShowCategoryDialog(open);
                    if (!open) {
                      setEditingCategory(null);
                      categoryForm.reset();
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        <Plus size={16} className="mr-2" />
                        Add Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingCategory ? "Edit Category" : "Add New Category"}
                        </DialogTitle>
                      </DialogHeader>
                      <Form {...categoryForm}>
                        <form onSubmit={categoryForm.handleSubmit((data) => categoryMutation.mutate(data))} className="space-y-4">
                          <FormField
                            control={categoryForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Food & Dining, Transportation" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={categoryForm.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select category type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="income">Income</SelectItem>
                                    <SelectItem value="expense">Expense</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={categoryForm.control}
                            name="budgetedAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Budgeted Amount</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    placeholder="0.00"
                                    {...field}
                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={categoryForm.control}
                            name="color"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Color</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="color" 
                                    {...field}
                                    className="w-full h-10"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={categoryMutation.isPending}>
                            {categoryMutation.isPending ? "Saving..." : 
                             editingCategory ? "Update Category" : "Add Category"}
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {budgetCategories.length > 0 ? (
                  <div className="space-y-4">
                    {budgetCategories.map((category: any) => (
                      <div key={category.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <div>
                              <h3 className="font-semibold text-gray-900">{category.name}</h3>
                              <p className="text-sm text-gray-600 capitalize">{category.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(category.budgetedAmount)}
                            </span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setEditingCategory(category);
                                categoryForm.reset({
                                  name: category.name,
                                  type: category.type,
                                  budgetedAmount: category.budgetedAmount,
                                  color: category.color || "#3b82f6",
                                });
                                setShowCategoryDialog(true);
                              }}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No budget categories set up yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banking" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>My Bank Accounts</CardTitle>
                  <Dialog open={showBankDialog} onOpenChange={(open) => {
                    setShowBankDialog(open);
                    if (!open) {
                      setEditingBank(null);
                      bankForm.reset();
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-add-bank">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Bank Account
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{editingBank ? "Edit Bank Account" : "Add Bank Account"}</DialogTitle>
                      </DialogHeader>
                      <Form {...bankForm}>
                        <form onSubmit={bankForm.handleSubmit((data) => bankMutation.mutate(data))} className="space-y-4">
                          <FormField
                            control={bankForm.control}
                            name="bankName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bank Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Chase, Bank of America" {...field} data-testid="input-bank-name" />
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
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-account-type">
                                      <SelectValue placeholder="Select type" />
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
                                  <Input placeholder="e.g., Main Checking" {...field} data-testid="input-nickname" />
                                </FormControl>
                                <FormDescription>
                                  Give this account a friendly name
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={bankForm.control}
                            name="bankWebsite"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bank Website URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://www.yourbank.com/login" {...field} data-testid="input-bank-website" />
                                </FormControl>
                                <FormDescription>
                                  The login page for your online banking
                                </FormDescription>
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
                                  <Input placeholder="1234" maxLength={4} {...field} data-testid="input-last-four" />
                                </FormControl>
                                <FormDescription>
                                  For easy identification
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={bankMutation.isPending} data-testid="button-save-bank">
                            {bankMutation.isPending ? "Saving..." : 
                             editingBank ? "Update Account" : "Add Account"}
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {bankAccounts.length > 0 ? (
                    <div className="space-y-3">
                      {bankAccounts.map((account) => (
                        <div key={account.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Building className="h-5 w-5 text-blue-600" />
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {account.accountNickname || account.accountName}
                                </h3>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{account.bankName}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-500 capitalize">{account.accountType}</p>
                              {account.lastFour && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  ****{account.lastFour}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {account.bankWebsite && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(account.bankWebsite || '', '_blank')}
                                  data-testid={`button-visit-bank-${account.id}`}
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Visit Bank
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingBank(account);
                                  bankForm.reset({
                                    bankName: account.bankName,
                                    accountType: account.accountType as any,
                                    accountNickname: account.accountNickname || "",
                                    bankWebsite: account.bankWebsite || "",
                                    lastFour: account.lastFour || "",
                                  });
                                  setShowBankDialog(true);
                                }}
                                data-testid={`button-edit-bank-${account.id}`}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Are you sure you want to remove this bank account?")) {
                                    deleteBankMutation.mutate(account.id);
                                  }
                                }}
                                data-testid={`button-delete-bank-${account.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Building className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No bank accounts added yet.</p>
                      <p className="text-sm text-gray-400 mt-1">Add your bank's website URL for quick access to online banking.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}