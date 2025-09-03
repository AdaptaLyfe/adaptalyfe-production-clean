import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Trophy, Flame, Star, GraduationCap } from "lucide-react";
import type { Achievement, User, DailyTask } from "@shared/schema";

export default function AchievementsModule() {
  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: tasks = [] } = useQuery<DailyTask[]>({
    queryKey: ["/api/daily-tasks"],
  });

  const completedTasksThisWeek = tasks.filter(task => task.isCompleted).length;
  const weeklyGoal = 5;
  const weeklyProgress = Math.min(completedTasksThisWeek, weeklyGoal);
  const weeklyProgressPercentage = (weeklyProgress / weeklyGoal) * 100;

  // Sample achievements for display
  const sampleAchievements = [
    {
      title: `${user?.streakDays || 0}-Day Streak!`,
      description: "Daily check-ins completed",
      icon: Flame,
      gradient: "from-sunny-orange to-yellow-400"
    },
    {
      title: "Task Master",
      description: "50 tasks completed",
      icon: Star,
      gradient: "from-vibrant-green to-emerald-400"
    },
    {
      title: "Budget Pro",
      description: "Financial lesson completed",
      icon: GraduationCap,
      gradient: "from-bright-blue to-blue-400"
    }
  ];

  return (
    <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border-t-4 border-sunny-orange">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-sunny-orange rounded-lg flex items-center justify-center">
            <Trophy className="text-white" size={20} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Achievements & Progress</h3>
        </div>
        <Button variant="ghost" className="text-sunny-orange hover:text-orange-600 font-medium">
          View All
        </Button>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {sampleAchievements.map((achievement, index) => {
          const IconComponent = achievement.icon;
          return (
            <div key={index} className="text-center">
              <div className={`w-16 h-16 bg-gradient-to-br ${achievement.gradient} rounded-full flex items-center justify-center mx-auto mb-3`}>
                <IconComponent className="text-white" size={24} />
              </div>
              <h4 className="font-bold text-gray-900">{achievement.title}</h4>
              <p className="text-sm text-gray-600">{achievement.description}</p>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Weekly Goal Progress</h4>
            <p className="text-sm text-gray-600">Complete {weeklyGoal} daily routines</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-sunny-orange">
              {weeklyProgress}/{weeklyGoal}
            </span>
            <p className="text-xs text-gray-600">
              {weeklyProgress === weeklyGoal ? "Complete!" : "Almost there!"}
            </p>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
          <div 
            className="bg-sunny-orange h-2 rounded-full transition-all duration-300"
            style={{ width: `${weeklyProgressPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
