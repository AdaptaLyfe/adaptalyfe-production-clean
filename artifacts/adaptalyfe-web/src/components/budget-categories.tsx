import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertBudgetCategorySchema, type BudgetCategory, type InsertBudgetCategory } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { FolderOpen, Plus, DollarSign, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';

const categoryColors = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Orange', value: '#F97316' },
];

export default function BudgetCategories() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['/api/budget-categories'],
  });

  const { data: budgetEntries = [] } = useQuery({
    queryKey: ['/api/budget-entries'],
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: InsertBudgetCategory) => {
      const response = await apiRequest('POST', '/api/budget-categories', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budget-categories'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Budget category created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create budget category",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertBudgetCategory>({
    resolver: zodResolver(insertBudgetCategorySchema),
    defaultValues: {
      name: '',
      type: 'expense',
      budgetedAmount: 0,
      color: '#6B7280',
      isActive: true,
    },
  });

  const onSubmit = (data: InsertBudgetCategory) => {
    createCategoryMutation.mutate(data);
  };

  // Calculate spending for each category
  const getCategorySpending = (category: BudgetCategory) => {
    return budgetEntries
      .filter((entry: any) => entry.category === category.name && entry.type === category.type)
      .reduce((total: number, entry: any) => total + entry.amount, 0);
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'savings':
        return <PiggyBank className="h-5 w-5 text-blue-600" />;
      default:
        return <TrendingDown className="h-5 w-5 text-red-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-blue-600" />
            Budget Categories
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Organize your spending into categories</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Budget Category</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Food, Transportation, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="expense">Expense</SelectItem>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="savings">Savings</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budgetedAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Budget</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="500.00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Color</FormLabel>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {categoryColors.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            className={`w-8 h-8 rounded-full border-2 ${
                              field.value === color.value ? 'border-gray-900 dark:border-white' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color.value }}
                            onClick={() => field.onChange(color.value)}
                            title={color.name}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={createCategoryMutation.isPending}>
                  {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No categories yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Create categories to better organize your budget!</p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Category
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category: BudgetCategory) => {
            const spent = getCategorySpending(category);
            const budgeted = category.budgetedAmount || 0;
            const percentage = budgeted > 0 ? (spent / budgeted) * 100 : 0;
            const isOverBudget = spent > budgeted && budgeted > 0;

            return (
              <Card 
                key={category.id} 
                className="border-l-4" 
                style={{ borderLeftColor: category.color }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getCategoryIcon(category.type)}
                      {category.name}
                    </CardTitle>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      category.type === 'income' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      category.type === 'savings' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {category.type}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {category.type === 'expense' ? 'Spent' : category.type === 'income' ? 'Earned' : 'Saved'}
                      </span>
                      <span className={isOverBudget ? 'text-red-600 font-semibold' : ''}>
                        ${spent.toFixed(2)} {budgeted > 0 && `/ $${budgeted.toFixed(2)}`}
                      </span>
                    </div>
                    
                    {budgeted > 0 && (
                      <>
                        <Progress 
                          value={Math.min(percentage, 100)}
                          className={`h-2 ${isOverBudget ? '[&>div]:bg-red-500' : ''}`}
                        />
                        
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>{percentage.toFixed(1)}% of budget</span>
                          {budgeted > spent && (
                            <span className="text-green-600 dark:text-green-400">
                              ${(budgeted - spent).toFixed(2)} remaining
                            </span>
                          )}
                          {isOverBudget && (
                            <span className="text-red-600 dark:text-red-400">
                              ${(spent - budgeted).toFixed(2)} over budget
                            </span>
                          )}
                        </div>
                      </>
                    )}
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Add Entry
                      </Button>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}