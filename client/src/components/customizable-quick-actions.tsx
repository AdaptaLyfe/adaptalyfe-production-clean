import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Smile, CheckSquare, Calendar, Users } from "lucide-react";

export default function CustomizableQuickActions() {
  const quickActions = [
    {
      key: "mood",
      label: "Mood Check-in",
      description: "How are you feeling?",
      icon: Smile,
      route: "/mood-tracking",
      bgColor: "from-purple-500 to-pink-500",
      borderColor: "border-purple-300",
      hoverColor: "hover:border-purple-500"
    },
    {
      key: "tasks",
      label: "Daily Tasks",
      description: "Complete activities",
      icon: CheckSquare,
      route: "/daily-tasks",
      bgColor: "from-green-500 to-emerald-500",
      borderColor: "border-green-300",
      hoverColor: "hover:border-green-500"
    },
    {
      key: "bills",
      label: "Bill Reminders",
      description: "Manage payments",
      icon: Calendar,
      route: "/financial",
      bgColor: "from-blue-500 to-cyan-500",
      borderColor: "border-blue-300",
      hoverColor: "hover:border-blue-500"
    },
    {
      key: "support",
      label: "Contact Support",
      description: "Reach out for help",
      icon: Users,
      route: "/caregiver",
      bgColor: "from-orange-500 to-red-500",
      borderColor: "border-orange-300",
      hoverColor: "hover:border-orange-500"
    }
  ];

  return (
    <div className="mb-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          
          return (
            <Link key={action.key} href={action.route}>
              <Button
                variant="outline"
                className={`
                  h-[140px] w-full
                  bg-white/90 
                  rounded-2xl 
                  p-6 
                  shadow-lg 
                  border-2 
                  ${action.borderColor} 
                  ${action.hoverColor}
                  hover:shadow-2xl 
                  transition-all 
                  duration-300
                  flex 
                  flex-col 
                  items-center 
                  justify-center 
                  gap-3
                `}
              >
                <div className={`
                  w-16 h-16 
                  bg-gradient-to-br ${action.bgColor} 
                  rounded-xl 
                  flex 
                  items-center 
                  justify-center 
                  shadow-md
                `}>
                  <Icon className="text-white w-8 h-8" />
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-gray-900 text-sm">{action.label}</h4>
                  <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                </div>
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
