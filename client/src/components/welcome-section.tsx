import { useQuery } from "@tanstack/react-query";
import { Rocket, Quote } from "lucide-react";
import { getDailyMotivationalQuote } from "@/lib/utils";
const adaptalyfeIcon = "/adaptalyfe-icon.png";
import type { User, DailyTask } from "@shared/schema";

export default function WelcomeSection() {
  // Fetch the actual logged-in user data
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: tasks } = useQuery<DailyTask[]>({
    queryKey: ["/api/daily-tasks"],
  });

  const completedTasks = tasks?.filter(task => task.isCompleted).length || 0;
  const totalTasks = tasks?.length || 0;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const dailyQuote = getDailyMotivationalQuote();

  // Show loading state while user data is being fetched
  if (!user) {
    return (
      <div className="mb-4">
        <div className="bg-black rounded-xl p-4 text-white shadow-lg border-2 border-teal-400">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-48 mb-2"></div>
            <div className="h-8 bg-gray-700 rounded w-64 mb-4"></div>
            <div className="flex space-x-3">
              <div className="h-16 bg-gray-700 rounded w-24"></div>
              <div className="h-16 bg-gray-700 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="bg-black rounded-xl p-4 text-white shadow-lg border-2 border-teal-400">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <img src={adaptalyfeIcon} alt="Adaptalyfe" className="w-6 h-6 rounded shadow-sm" />
              <div>
                <h1 className="text-lg font-bold text-teal-400">Adaptalyfe</h1>
                <p className="text-sm text-white/90">Grow with Guidance. Thrive with Confidence.</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white flex items-center gap-2">
              {getGreeting()}, {user?.name}!
              <span className="text-teal-400 text-2xl">★</span>
            </h2>
            <div className="flex items-center space-x-3">
              <div className="bg-gray-800/50 border border-teal-400/40 rounded-lg px-3 py-2">
                <span className="text-xs text-white/90 font-medium">Today's Progress</span>
                <div className="text-xl font-bold text-teal-400">{progressPercentage}%</div>
              </div>
              <div className="bg-gray-800/50 border border-teal-400/40 rounded-lg px-3 py-2">
                <span className="text-xs text-white/90 font-medium">Current Streak</span>
                <div className="text-xl font-bold text-teal-400">{user?.streakDays || 0} days</div>
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="w-16 h-16 bg-gray-800/50 border border-teal-400/40 rounded-full flex items-center justify-center">
              <Rocket size={32} className="text-teal-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
