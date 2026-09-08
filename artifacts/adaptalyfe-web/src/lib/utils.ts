import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInHours < 1) {
    return "Just now";
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function getDaysUntilDue(dueDate: number): number {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  let targetDate = new Date(currentYear, currentMonth, dueDate);
  
  // If the due date has passed this month, move to next month
  if (dueDate < currentDay) {
    targetDate = new Date(currentYear, currentMonth + 1, dueDate);
  }
  
  const diffInMs = targetDate.getTime() - today.getTime();
  return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
}

export function getDailyMotivationalQuote(): { quote: string; author: string } {
  const quotes = [
    { quote: "Every small step forward is a victory worth celebrating.", author: "Unknown" },
    { quote: "You are braver than you believe, stronger than you seem, and smarter than you think.", author: "A.A. Milne" },
    { quote: "Progress, not perfection, is the goal.", author: "Unknown" },
    { quote: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
    { quote: "Your pace doesn't matter. Forward is forward.", author: "Unknown" },
    { quote: "Every expert was once a beginner.", author: "Helen Hayes" },
    { quote: "You don't have to be great to get started, but you have to get started to be great.", author: "Les Brown" },
    { quote: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
    { quote: "You are capable of amazing things.", author: "Unknown" },
    { quote: "Independence comes from understanding your own strength.", author: "Unknown" },
    { quote: "Each day is a fresh start and a new opportunity to grow.", author: "Unknown" },
    { quote: "Your potential is endless.", author: "Unknown" },
    { quote: "Small daily improvements lead to stunning yearly results.", author: "Robin Sharma" },
    { quote: "Believe in yourself and all that you are.", author: "Christian D. Larson" },
    { quote: "You have the power to create the life you want.", author: "Unknown" },
    { quote: "Every challenge you face today makes you stronger for tomorrow.", author: "Unknown" },
    { quote: "Your independence is your superpower.", author: "Unknown" },
    { quote: "Growth happens outside of your comfort zone.", author: "Unknown" },
    { quote: "You are writing your own success story, one day at a time.", author: "Unknown" },
    { quote: "The skills you build today will serve you for a lifetime.", author: "Unknown" }
  ];

  // Use the current date to get a consistent quote for the day
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const index = dayOfYear % quotes.length;
  
  return quotes[index];
}
