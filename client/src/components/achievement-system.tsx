import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Trophy, Star, Zap, Target, Calendar, Heart, DollarSign, 
  Medal, Award, Crown, Flame, TrendingUp, CheckCircle 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Achievement {
  id: number;
  achievementType: string;
  title: string;
  description: string;
  iconName: string;
  category: string;
  points: number;
  level: number;
  earnedAt: string;
}

interface StreakData {
  id: number;
  streakType: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  isActive: boolean;
}

interface UserStats {
  totalPoints: number;
  achievementsEarned: number;
  longestStreak: number;
  completedTasks: number;
  moodEntries: number;
  level: number;
  nextLevelProgress: number;
}

export function AchievementSystem() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { toast } = useToast();

  // Fetch user achievements
  const { data: achievements = [] } = useQuery({
    queryKey: ['/api/user-achievements']
  });

  // Fetch streak data
  const { data: streaks = [] } = useQuery({
    queryKey: ['/api/streaks']
  });

  // Fetch user statistics
  const { data: userStats } = useQuery({
    queryKey: ['/api/user-stats']
  });

  const getIconComponent = (iconName: string, className = "h-6 w-6") => {
    const icons: { [key: string]: any } = {
      trophy: Trophy,
      star: Star,
      zap: Zap,
      target: Target,
      calendar: Calendar,
      heart: Heart,
      dollar: DollarSign,
      medal: Medal,
      award: Award,
      crown: Crown,
      flame: Flame,
      trending: TrendingUp,
      check: CheckCircle
    };
    
    const IconComponent = icons[iconName] || Star;
    return <IconComponent className={className} />;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      daily_tasks: "bg-blue-100 text-blue-800 border-blue-200",
      mood: "bg-purple-100 text-purple-800 border-purple-200",
      financial: "bg-green-100 text-green-800 border-green-200",
      health: "bg-red-100 text-red-800 border-red-200",
      social: "bg-orange-100 text-orange-800 border-orange-200"
    };
    return colors[category] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "text-purple-600 bg-purple-100";
    if (streak >= 14) return "text-orange-600 bg-orange-100";
    if (streak >= 7) return "text-green-600 bg-green-100";
    if (streak >= 3) return "text-blue-600 bg-blue-100";
    return "text-gray-600 bg-gray-100";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const categories = [
    { id: "all", name: "All Achievements", icon: Trophy },
    { id: "daily_tasks", name: "Daily Tasks", icon: CheckCircle },
    { id: "mood", name: "Mood Tracking", icon: Heart },
    { id: "financial", name: "Financial", icon: DollarSign },
    { id: "health", name: "Health", icon: Target }
  ];

  const filteredAchievements = selectedCategory === "all" 
    ? achievements 
    : achievements.filter((a: Achievement) => a.category === selectedCategory);

  // Create celebration animation for new achievements
  const celebrateAchievement = (achievement: Achievement) => {
    toast({
      title: "🎉 Achievement Unlocked!",
      description: `${achievement.title} - ${achievement.points} points earned!`,
      duration: 5000,
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* User Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 text-white rounded-lg">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Total Points</p>
                <p className="text-2xl font-bold text-blue-900">{userStats?.totalPoints || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 text-white rounded-lg">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-purple-700">Achievements</p>
                <p className="text-2xl font-bold text-purple-900">{achievements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 text-white rounded-lg">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-orange-700">Longest Streak</p>
                <p className="text-2xl font-bold text-orange-900">
                  {Math.max(...streaks.map((s: StreakData) => s.longestStreak), 0)} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 text-white rounded-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-green-700">Level</p>
                <p className="text-2xl font-bold text-green-900">{userStats?.level || 1}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      {userStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Level Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Level {userStats.level}</span>
                <span>Level {userStats.level + 1}</span>
              </div>
              <Progress value={userStats.nextLevelProgress || 0} className="h-3" />
              <p className="text-sm text-gray-600 text-center">
                {userStats.nextLevelProgress || 0}% to next level
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {categories.map((category) => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className="flex items-center gap-1 text-xs"
            >
              <category.icon className="h-3 w-3" />
              <span className="hidden sm:inline">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Streaks */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  Current Streaks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {streaks.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">
                    Start completing daily activities to build streaks!
                  </p>
                ) : (
                  streaks.map((streak: StreakData) => (
                    <div 
                      key={streak.id}
                      className={`p-3 rounded-lg border ${getStreakColor(streak.currentStreak)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium capitalize">
                            {streak.streakType.replace('_', ' ')}
                          </p>
                          <p className="text-sm opacity-75">
                            Best: {streak.longestStreak} days
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{streak.currentStreak}</p>
                          <p className="text-xs">days</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Achievements Grid */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  {selectedCategory === "all" ? "All Achievements" : categories.find(c => c.id === selectedCategory)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredAchievements.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No achievements yet</p>
                    <p className="text-sm text-gray-500">
                      Keep using AdaptaLyfe to unlock achievements!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredAchievements.map((achievement: Achievement) => (
                      <div 
                        key={achievement.id}
                        className="p-4 border rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-yellow-500 text-white rounded-lg">
                            {getIconComponent(achievement.iconName, "h-5 w-5")}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-yellow-900">
                                {achievement.title}
                              </h4>
                              <Badge className={getCategoryColor(achievement.category)}>
                                +{achievement.points}
                              </Badge>
                            </div>
                            <p className="text-sm text-yellow-700 mb-2">
                              {achievement.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                Level {achievement.level}
                              </Badge>
                              <p className="text-xs text-yellow-600">
                                {formatDate(achievement.earnedAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Upcoming Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Upcoming Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg border-dashed border-gray-300 bg-gray-50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gray-400 text-white rounded-lg opacity-75">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Week Warrior</h4>
                  <p className="text-xs text-gray-500">+50 points</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Complete all daily tasks for 7 days straight
              </p>
              <Progress value={75} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">5/7 days completed</p>
            </div>

            <div className="p-4 border rounded-lg border-dashed border-gray-300 bg-gray-50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gray-400 text-white rounded-lg opacity-75">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Mood Master</h4>
                  <p className="text-xs text-gray-500">+30 points</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Track your mood for 30 days
              </p>
              <Progress value={60} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">18/30 days completed</p>
            </div>

            <div className="p-4 border rounded-lg border-dashed border-gray-300 bg-gray-50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gray-400 text-white rounded-lg opacity-75">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Budget Boss</h4>
                  <p className="text-xs text-gray-500">+40 points</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Stay within budget for a full month
              </p>
              <Progress value={25} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">1/4 weeks completed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}