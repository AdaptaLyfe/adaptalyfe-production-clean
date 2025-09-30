import { Link } from "wouter";
import { 
  Smile, 
  CheckSquare, 
  Calendar, 
  Stethoscope, 
  DollarSign, 
  MessageSquare,
  Users,
  ShoppingCart
} from "lucide-react";

export default function CustomizableQuickActions() {
  const quickActions = [
    {
      label: "Mood & Tracking",
      description: "Track your mood",
      icon: Smile,
      route: "/mood-tracking",
      bgColor: "bg-orange-500"
    },
    {
      label: "Mood Check-in",
      description: "How are you feeling?",
      icon: Smile,
      route: "/mood-tracking",
      bgColor: "bg-pink-500"
    },
    {
      label: "Daily Tasks",
      description: "Complete activities",
      icon: CheckSquare,
      route: "/daily-tasks",
      bgColor: "bg-teal-500"
    },
    {
      label: "Medical Info & Appointments",
      description: "Manage health info",
      icon: Stethoscope,
      route: "/medical",
      bgColor: "bg-purple-500"
    },
    {
      label: "Financial Management",
      description: "Track finances",
      icon: DollarSign,
      route: "/financial",
      bgColor: "bg-blue-500"
    },
    {
      label: "AI Chat Assistant",
      description: "Get help from AI",
      icon: MessageSquare,
      route: "/ai-chat",
      bgColor: "bg-cyan-500"
    },
    {
      label: "Contact Support",
      description: "Reach caregivers",
      icon: Users,
      route: "/caregiver",
      bgColor: "bg-indigo-500"
    },
    {
      label: "Meal Shopping",
      description: "Plan meals",
      icon: ShoppingCart,
      route: "/meal-shopping",
      bgColor: "bg-green-500"
    }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
        <div className="flex gap-2">
          <button className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50">
            Modify
          </button>
          <button className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50">
            Customize
          </button>
        </div>
      </div>
      
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            
            return (
              <Link key={index} href={action.route}>
                <div className="flex-shrink-0 w-[140px] bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="p-4 flex flex-col items-center text-center">
                    <div className={`w-14 h-14 ${action.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                      <Icon className="text-white w-7 h-7" />
                    </div>
                    <h4 className="font-semibold text-gray-900 text-xs mb-1 leading-tight">
                      {action.label}
                    </h4>
                    <p className="text-[10px] text-gray-600 leading-tight">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
