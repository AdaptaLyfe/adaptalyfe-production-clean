import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Heart, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatTimeAgo } from "@/lib/utils";
import { useSubscriptionEnforcement } from "@/middleware/subscription-middleware";
import PremiumFeaturePrompt from "@/components/premium-feature-prompt";
import type { MoodEntry } from "@shared/schema";

export default function MoodTracking() {
  const { isPremiumUser } = useSubscriptionEnforcement();
  
  // Block access if trial expired and no active subscription
  if (!isPremiumUser) {
    return (
      <div className="container mx-auto p-6">
        <PremiumFeaturePrompt
          title="Mood Check-ins"
          description="Monitor your emotional well-being with daily mood check-ins and progress tracking. Subscribe to continue using Adaptalyfe's mood management features."
          feature="mood"
          requiredPlan="premium"
          className="max-w-md mx-auto mt-20"
        />
      </div>
    );
  }
  const { toast } = useToast();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const { data: moodEntries = [], isLoading } = useQuery<MoodEntry[]>({
    queryKey: ["/api/mood-entries"],
  });

  const { data: todayMood } = useQuery<MoodEntry>({
    queryKey: ["/api/mood-entries/today"],
  });

  const moodOptions = [
    { value: 1, emoji: "😢", label: "Very Sad", color: "bg-red-500" },
    { value: 2, emoji: "😐", label: "Okay", color: "bg-yellow-500" },
    { value: 3, emoji: "😊", label: "Good", color: "bg-green-500" },
    { value: 4, emoji: "😃", label: "Great", color: "bg-blue-500" },
    { value: 5, emoji: "🤩", label: "Amazing", color: "bg-purple-500" },
  ];

  const moodMutation = useMutation({
    mutationFn: async (data: { mood: number; notes?: string }) => {
      const response = await apiRequest("POST", "/api/mood-entries", data);
      if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(errorData.message || 'Failed to save mood');
        (error as any).status = response.status;
        (error as any).data = errorData;
        throw error;
      }
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mood-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mood-entries/today"] });
      setSelectedMood(null);
      setNotes("");
      toast({
        title: "Mood recorded!",
        description: "Thanks for checking in today!",
      });
    },
    onError: (error: any) => {
      console.error("Failed to save mood:", error);
      
      // Check if this is a "already logged today" error
      if (error.status === 400 && error.data?.existing) {
        toast({
          title: "Already Logged Today",
          description: "You've already recorded your mood for today! Check back tomorrow for a new entry.",
          variant: "default",
        });
        // Refresh the today's mood data to show current state
        queryClient.invalidateQueries({ queryKey: ["/api/mood-entries/today"] });
        return;
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to save your mood. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitMood = () => {
    if (selectedMood) {
      moodMutation.mutate({ mood: selectedMood, notes: notes || undefined });
    }
  };

  const recentEntries = moodEntries
    .sort((a, b) => {
      const dateA = a.entryDate ? new Date(a.entryDate).getTime() : 0;
      const dateB = b.entryDate ? new Date(b.entryDate).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 7);

  const averageMood = moodEntries.length > 0 
    ? moodEntries.reduce((sum, entry) => sum + entry.mood, 0) / moodEntries.length 
    : 0;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Mood Log</h1>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-t-4 border-happy-purple">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-happy-purple rounded-lg flex items-center justify-center">
                  <Heart className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Today's Mood</p>
                  <p className="text-2xl">
                    {todayMood ? moodOptions.find(m => m.value === todayMood.mood)?.emoji : "❓"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-sunny-orange">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-sunny-orange rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Mood</p>
                  <p className="text-2xl font-bold text-gray-900">{averageMood.toFixed(1)}/5</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-vibrant-green">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-vibrant-green rounded-lg flex items-center justify-center">
                  <CalendarIcon className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Check-ins</p>
                  <p className="text-2xl font-bold text-gray-900">{moodEntries.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="border-t-4 border-happy-purple">
          <CardHeader>
            <CardTitle>How are you feeling today?</CardTitle>
          </CardHeader>
          <CardContent>
            {todayMood ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">
                  {moodOptions.find(m => m.value === todayMood.mood)?.emoji}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  You're feeling {moodOptions.find(m => m.value === todayMood.mood)?.label}
                </h3>
                <p className="text-gray-600">You've already checked in today!</p>
                <p className="text-sm text-purple-600 mt-2">Come back tomorrow for your next daily check-in.</p>
                {todayMood.notes && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-700">"{todayMood.notes}"</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-5 gap-3">
                  {moodOptions.map((mood) => (
                    <Button
                      key={mood.value}
                      variant="outline"
                      className={`p-4 h-auto border-2 transition-all ${
                        selectedMood === mood.value
                          ? "border-happy-purple bg-purple-50 scale-105"
                          : "border-gray-200 hover:border-happy-purple"
                      }`}
                      onClick={() => setSelectedMood(mood.value)}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">{mood.emoji}</div>
                        <p className="text-xs text-gray-600">{mood.label}</p>
                      </div>
                    </Button>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <Textarea
                    placeholder="Tell us more about how you're feeling..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-20"
                  />
                </div>

                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={handleSubmitMood}
                  disabled={!selectedMood || moodMutation.isPending}
                >
                  {moodMutation.isPending ? "Recording..." : "Record Mood"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-t-4 border-bright-blue">
          <CardHeader>
            <CardTitle>Recent Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEntries.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No mood entries yet</p>
              ) : (
                recentEntries.map((entry) => {
                  const moodOption = moodOptions.find(m => m.value === entry.mood);
                  return (
                    <div key={entry.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl">{moodOption?.emoji}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">{moodOption?.label}</span>
                          <span className="text-xs text-gray-500">
                            {entry.entryDate ? formatTimeAgo(new Date(entry.entryDate)) : 'Unknown date'}
                          </span>
                        </div>
                        {entry.notes && (
                          <p className="text-sm text-gray-600">"{entry.notes}"</p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
