import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, Clock, Brain, Target, Lightbulb, Calendar,
  CheckCircle, Heart, DollarSign, Users, Star, Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface DashboardInsight {
  id: string;
  type: 'suggestion' | 'pattern' | 'achievement' | 'reminder' | 'trend';
  priority: 'low' | 'normal' | 'high';
  title: string;
  description: string;
  actionText?: string;
  actionUrl?: string;
  data?: any;
  category: string;
  createdAt: string;
}

interface UserPattern {
  mostActiveTimeOfDay: string;
  preferredDays: number[];
  frequentActivities: Array<{ type: string; frequency: number }>;
  suggestions: string[];
}

interface WeeklySummary {
  tasksCompleted: number;
  totalTasks: number;
  moodAverage: number;
  streakDays: number;
  goalsAchieved: number;
  improvementAreas: string[];
}

export function SmartDashboardInsights() {
  const [selectedInsightType, setSelectedInsightType] = useState<string>("all");

  // Fetch user behavior insights
  const { data: userPatterns } = useQuery({
    queryKey: ['/api/user-behavior-insights']
  });

  // Fetch weekly summary
  const { data: weeklySummary } = useQuery({
    queryKey: ['/api/weekly-summary']
  });

  // Generate smart insights based on user data
  const generateInsights = (): DashboardInsight[] => {
    const insights: DashboardInsight[] = [];
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();

    // Time-based suggestions
    if (userPatterns?.mostActiveTimeOfDay) {
      const activeHour = parseInt(userPatterns.mostActiveTimeOfDay.split(':')[0]);
      if (Math.abs(currentHour - activeHour) <= 1) {
        insights.push({
          id: 'optimal-time',
          type: 'suggestion',
          priority: 'high',
          title: 'Perfect Time for Tasks!',
          description: `You're most productive around ${userPatterns.mostActiveTimeOfDay}. Consider tackling important tasks now.`,
          actionText: 'View Today\'s Tasks',
          actionUrl: '#daily-tasks',
          category: 'productivity',
          createdAt: new Date().toISOString()
        });
      }
    }

    // Streak encouragement
    if (weeklySummary?.streakDays > 0) {
      if (weeklySummary.streakDays >= 7) {
        insights.push({
          id: 'streak-celebration',
          type: 'achievement',
          priority: 'high',
          title: `Amazing ${weeklySummary.streakDays}-Day Streak!`,
          description: 'You\'re building excellent habits. Keep up the fantastic work!',
          actionText: 'View Achievements',
          actionUrl: '#achievements',
          category: 'motivation',
          createdAt: new Date().toISOString()
        });
      } else {
        insights.push({
          id: 'streak-motivation',
          type: 'reminder',
          priority: 'normal',
          title: 'Keep Your Streak Going!',
          description: `You're on a ${weeklySummary.streakDays}-day streak. Complete today's tasks to continue.`,
          actionText: 'Check Tasks',
          actionUrl: '#daily-tasks',
          category: 'motivation',
          createdAt: new Date().toISOString()
        });
      }
    }

    // Mood-based insights
    if (weeklySummary?.moodAverage) {
      if (weeklySummary.moodAverage < 3) {
        insights.push({
          id: 'mood-support',
          type: 'suggestion',
          priority: 'high',
          title: 'Need Some Support?',
          description: 'Your mood has been lower lately. Consider reaching out to a caregiver or trying some relaxation activities.',
          actionText: 'View Resources',
          actionUrl: '#resources',
          category: 'wellness',
          createdAt: new Date().toISOString()
        });
      } else if (weeklySummary.moodAverage >= 4) {
        insights.push({
          id: 'mood-celebration',
          type: 'achievement',
          priority: 'normal',
          title: 'Great Mood This Week!',
          description: 'You\'ve been feeling positive lately. That\'s wonderful to see!',
          category: 'wellness',
          createdAt: new Date().toISOString()
        });
      }
    }

    // Task completion insights
    if (weeklySummary?.tasksCompleted && weeklySummary?.totalTasks) {
      const completionRate = (weeklySummary.tasksCompleted / weeklySummary.totalTasks) * 100;
      
      if (completionRate >= 80) {
        insights.push({
          id: 'task-excellence',
          type: 'achievement',
          priority: 'normal',
          title: 'Task Master!',
          description: `You completed ${Math.round(completionRate)}% of your tasks this week. Excellent work!`,
          category: 'productivity',
          createdAt: new Date().toISOString()
        });
      } else if (completionRate < 50) {
        insights.push({
          id: 'task-support',
          type: 'suggestion',
          priority: 'normal',
          title: 'Let\'s Boost Your Task Success',
          description: 'Consider breaking large tasks into smaller steps or adjusting your daily goals.',
          actionText: 'Review Tasks',
          actionUrl: '#daily-tasks',
          category: 'productivity',
          createdAt: new Date().toISOString()
        });
      }
    }

    // Personalized recommendations based on patterns
    if (userPatterns?.frequentActivities?.length > 0) {
      const topActivity = userPatterns.frequentActivities[0];
      insights.push({
        id: 'pattern-insight',
        type: 'pattern',
        priority: 'normal',
        title: 'Your Most Common Activity',
        description: `You frequently work on ${topActivity.type}. Consider scheduling dedicated time for this.`,
        category: 'patterns',
        createdAt: new Date().toISOString()
      });
    }

    // Weekend vs weekday patterns
    const isWeekend = currentDay === 0 || currentDay === 6;
    if (isWeekend) {
      insights.push({
        id: 'weekend-focus',
        type: 'suggestion',
        priority: 'normal',
        title: 'Weekend Self-Care',
        description: 'Take time for relaxation and activities you enjoy. Balance is important!',
        actionText: 'View Resources',
        actionUrl: '#resources',
        category: 'wellness',
        createdAt: new Date().toISOString()
      });
    }

    // Financial insights
    insights.push({
      id: 'financial-check',
      type: 'reminder',
      priority: 'normal',
      title: 'Weekly Financial Check-in',
      description: 'Review your spending and upcoming bills to stay on track.',
      actionText: 'View Budget',
      actionUrl: '#financial',
      category: 'financial',
      createdAt: new Date().toISOString()
    });

    return insights;
  };

  const insights = generateInsights();

  const getInsightIcon = (type: string, category: string) => {
    if (type === 'achievement') return <Star className="h-5 w-5 text-yellow-500" />;
    if (category === 'productivity') return <Target className="h-5 w-5 text-blue-500" />;
    if (category === 'wellness') return <Heart className="h-5 w-5 text-red-500" />;
    if (category === 'financial') return <DollarSign className="h-5 w-5 text-green-500" />;
    if (category === 'motivation') return <Zap className="h-5 w-5 text-purple-500" />;
    return <Lightbulb className="h-5 w-5 text-orange-500" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'normal': return 'border-l-blue-500 bg-blue-50';
      case 'low': return 'border-l-gray-500 bg-gray-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Not determined yet';
    const hour = parseInt(timeString.split(':')[0]);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const filteredInsights = selectedInsightType === "all" 
    ? insights 
    : insights.filter(insight => insight.category === selectedInsightType);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Today's Focus Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            Today's Focus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {userPatterns?.mostActiveTimeOfDay ? formatTime(userPatterns.mostActiveTimeOfDay) : 'Any time'}
              </div>
              <p className="text-sm text-blue-700">Your Peak Time</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {weeklySummary?.tasksCompleted || 0}/{weeklySummary?.totalTasks || 0}
              </div>
              <p className="text-sm text-purple-700">Tasks This Week</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {weeklySummary?.streakDays || 0} days
              </div>
              <p className="text-sm text-green-700">Current Streak</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Progress Summary */}
      {weeklySummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Weekly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Task Completion</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completed</span>
                    <span>{weeklySummary.tasksCompleted}/{weeklySummary.totalTasks} tasks</span>
                  </div>
                  <Progress 
                    value={weeklySummary.totalTasks > 0 ? (weeklySummary.tasksCompleted / weeklySummary.totalTasks) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Mood Trend</h4>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-sm">
                    Average: {weeklySummary.moodAverage?.toFixed(1) || 'N/A'}/5.0
                  </span>
                  <Badge variant={weeklySummary.moodAverage >= 4 ? "default" : "secondary"}>
                    {weeklySummary.moodAverage >= 4 ? "Great" : weeklySummary.moodAverage >= 3 ? "Good" : "Needs attention"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-orange-500" />
            Smart Insights & Suggestions
          </CardTitle>
          <div className="flex gap-2 mt-4">
            {['all', 'productivity', 'wellness', 'motivation', 'financial'].map((type) => (
              <Button
                key={type}
                variant={selectedInsightType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedInsightType(type)}
                className="capitalize"
              >
                {type === 'all' ? 'All' : type}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {filteredInsights.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No insights available yet</p>
              <p className="text-sm text-gray-500">
                Use AdaptaLyfe more to get personalized recommendations
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInsights.map((insight) => (
                <div 
                  key={insight.id}
                  className={`p-4 border-l-4 rounded-lg ${getPriorityColor(insight.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type, insight.category)}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {insight.title}
                        </h4>
                        <p className="text-sm text-gray-700 mb-2">
                          {insight.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {insight.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {insight.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      {insight.actionText && insight.actionUrl && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.location.hash = insight.actionUrl}
                        >
                          {insight.actionText}
                        </Button>
                      )}
                      {insight.priority === 'high' && (
                        <Badge variant="destructive" className="text-xs">
                          High Priority
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Patterns */}
      {userPatterns?.frequentActivities?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Your Activity Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Most Frequent Activities</h4>
                <div className="space-y-2">
                  {userPatterns.frequentActivities.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm capitalize">
                        {activity.type.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-600">
                        {activity.frequency} times
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Recommendations</h4>
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    • Schedule your most important tasks around {formatTime(userPatterns.mostActiveTimeOfDay)}
                  </p>
                  <p className="text-sm text-gray-700">
                    • Consider setting reminders for your peak productivity time
                  </p>
                  <p className="text-sm text-gray-700">
                    • Use your activity patterns to build better routines
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}