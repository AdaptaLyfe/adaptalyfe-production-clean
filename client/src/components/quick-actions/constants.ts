import { 
  Smile, 
  CheckSquare, 
  Calendar, 
  Stethoscope,
  MessageSquare,
  Users,
  ShoppingCart,
  Pill,
  BookOpen,
  Star,
  GraduationCap,
  FileText
} from "lucide-react";

export interface QuickAction {
  key: string;
  label: string;
  description: string;
  icon: any;
  route: string;
  bgColor: string;
}

export const ALL_QUICK_ACTIONS: QuickAction[] = [
  {
    key: "meal-shopping",
    label: "Meals & Shopping",
    description: "Plan and shop",
    icon: ShoppingCart,
    route: "/meal-shopping",
    bgColor: "bg-orange-500"
  },
  {
    key: "medical",
    label: "Health Records",
    description: "Personal health info",
    icon: Stethoscope,
    route: "/medical",
    bgColor: "bg-pink-500"
  },
  {
    key: "daily-tasks",
    label: "Daily Tasks",
    description: "Complete activities",
    icon: CheckSquare,
    route: "/daily-tasks",
    bgColor: "bg-teal-500"
  },
  {
    key: "mood-checkin",
    label: "Mood Check-in",
    description: "How are you feeling?",
    icon: Smile,
    route: "/mood-tracking",
    bgColor: "bg-pink-500"
  },
  {
    key: "personal-documents",
    label: "Personal Documents",
    description: "Your documents",
    icon: FileText,
    route: "/personal-documents",
    bgColor: "bg-blue-400"
  },
  {
    key: "financial",
    label: "Bill Reminders",
    description: "Manage payments",
    icon: Calendar,
    route: "/financial",
    bgColor: "bg-blue-500"
  },
  {
    key: "mood-tracking",
    label: "Mood Log",
    description: "Track your mood",
    icon: Smile,
    route: "/mood-tracking",
    bgColor: "bg-orange-500"
  },
  {
    key: "ai-chat",
    label: "AI Chat Assistant",
    description: "Get help from AI",
    icon: MessageSquare,
    route: "/ai-chat",
    bgColor: "bg-cyan-500"
  },
  {
    key: "caregiver",
    label: "Contact Support",
    description: "Reach caregivers",
    icon: Users,
    route: "/caregiver",
    bgColor: "bg-indigo-500"
  },
  {
    key: "pharmacy",
    label: "Pharmacy",
    description: "Manage medications",
    icon: Pill,
    route: "/pharmacy",
    bgColor: "bg-red-500"
  },
  {
    key: "resources",
    label: "Resources",
    description: "Helpful guides",
    icon: BookOpen,
    route: "/resources",
    bgColor: "bg-yellow-500"
  },
  {
    key: "rewards",
    label: "Achievements",
    description: "View rewards",
    icon: Star,
    route: "/rewards",
    bgColor: "bg-amber-500"
  },
  {
    key: "academic",
    label: "Academic Planner",
    description: "School tasks",
    icon: GraduationCap,
    route: "/academic-planner",
    bgColor: "bg-violet-500"
  }
];

export const DEFAULT_VISIBLE_KEYS = [
  "meal-shopping",
  "medical",
  "daily-tasks",
  "mood-checkin",
  "personal-documents",
  "financial"
];
