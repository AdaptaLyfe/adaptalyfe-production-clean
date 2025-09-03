import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Wallet, Clock, GraduationCap, Plus, ArrowRight } from "lucide-react";
import { formatCurrency, getDaysUntilDue } from "@/lib/utils";
import type { Bill, BudgetEntry } from "@shared/schema";

export default function FinancialModule() {
  const { data: bills = [], isLoading: billsLoading } = useQuery<Bill[]>({
    queryKey: ["/api/bills"],
  });

  const { data: budgetEntries = [], isLoading: budgetLoading } = useQuery<BudgetEntry[]>({
    queryKey: ["/api/budget-entries"],
  });

  const upcomingBills = bills
    .filter(bill => !bill.isPaid)
    .sort((a, b) => getDaysUntilDue(a.dueDate) - getDaysUntilDue(b.dueDate))
    .slice(0, 1);

  const totalExpenses = budgetEntries
    .filter(entry => entry.type === "expense")
    .reduce((sum, entry) => sum + entry.amount, 0);
  
  const totalIncome = budgetEntries
    .filter(entry => entry.type === "income")
    .reduce((sum, entry) => sum + entry.amount, 0);
  
  const budgetUsed = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

  if (billsLoading || budgetLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-bright-blue">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-bright-blue">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-bright-blue rounded-lg flex items-center justify-center">
            <Wallet className="text-white" size={20} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Financial Management</h3>
        </div>
        <span className="bg-bright-blue text-white px-3 py-1 rounded-full text-sm font-medium">
          Level 2
        </span>
      </div>
      
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Monthly Budget</h4>
            <span className="text-sm text-blue-600 font-medium">
              {budgetUsed < 80 ? "On track" : budgetUsed < 100 ? "Watch spending" : "Over budget"}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full ${
                budgetUsed < 80 ? "bg-bright-blue" : budgetUsed < 100 ? "bg-sunny-orange" : "bg-red-500"
              }`}
              style={{ width: `${Math.min(budgetUsed, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {formatCurrency(totalExpenses)} of {formatCurrency(totalIncome)} used this month
          </p>
        </div>
        
        {upcomingBills.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-sunny-orange rounded-full flex items-center justify-center">
                <Clock className="text-white" size={16} />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Upcoming Bills</h4>
                <p className="text-sm text-gray-600">
                  {upcomingBills[0].name} due in {getDaysUntilDue(upcomingBills[0].dueDate)} days - {formatCurrency(upcomingBills[0].amount)}
                </p>
              </div>
              <Link href="/financial">
                <Button variant="ghost" size="sm" className="text-sunny-orange hover:text-orange-600">
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <Link href="/financial">
            <Button
              variant="outline"
              className="bg-blue-50 border-blue-200 hover:bg-blue-100 h-auto p-4 flex-col space-y-2"
            >
              <GraduationCap className="text-bright-blue" size={20} />
              <p className="text-sm font-medium text-gray-900">Budgeting Lesson</p>
            </Button>
          </Link>
          <Link href="/financial?action=add-expense">
            <Button
              variant="outline"
              className="bg-blue-50 border-blue-200 hover:bg-blue-100 h-auto p-4 flex-col space-y-2"
            >
              <Plus className="text-bright-blue" size={20} />
              <p className="text-sm font-medium text-gray-900">Add Expense</p>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
