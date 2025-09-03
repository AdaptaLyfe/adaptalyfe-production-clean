import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Heart, Wind, Lightbulb, Phone } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MoodEntry } from "@shared/schema";

export default function MoodModule() {
  const { toast } = useToast();
  
  const { data: todayMood } = useQuery<MoodEntry>({
    queryKey: ["/api/mood-entries/today"],
  });

  const moodOptions = [
    { value: 1, emoji: "😢", label: "Sad" },
    { value: 2, emoji: "😐", label: "Okay" },
    { value: 3, emoji: "😊", label: "Good" },
    { value: 4, emoji: "😃", label: "Great" },
    { value: 5, emoji: "🤩", label: "Amazing" },
  ];

  const moodMutation = useMutation({
    mutationFn: async (mood: number) => {
      return apiRequest("POST", "/api/mood-entries", { mood });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mood-entries"] });
      toast({
        title: "Mood recorded!",
        description: "Thanks for checking in today!",
      });
    },
  });

  // Show required indicator if mood not logged today
  const isRequired = !todayMood;
  const borderColor = isRequired ? "border-red-400" : "border-happy-purple";
  const bgColor = isRequired ? "bg-red-50" : "bg-white";

  return (
    <div className={`mt-8 ${bgColor} rounded-2xl shadow-lg p-6 border-t-4 ${borderColor} ${isRequired ? 'ring-2 ring-red-200' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 ${isRequired ? 'bg-red-500' : 'bg-happy-purple'} rounded-lg flex items-center justify-center ${isRequired ? 'animate-pulse' : ''}`}>
            <Heart className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Mood & Wellbeing
              {isRequired && (
                <span className="text-red-500 text-sm font-medium bg-red-100 px-2 py-1 rounded-full">
                  Required
                </span>
              )}
            </h3>
            {isRequired && (
              <p className="text-sm text-red-600 mt-1">
                Daily mood check-in is required to continue
              </p>
            )}
          </div>
        </div>
        <Link href="/mood-tracking">
          <Button className={`${isRequired ? 'bg-red-500 hover:bg-red-600' : 'bg-happy-purple hover:bg-happy-purple'} text-white ${isRequired ? 'animate-bounce' : ''}`}>
            {isRequired ? 'Required Check-in' : 'Check In Now'}
          </Button>
        </Link>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-4">How are you feeling today?</h4>
          <div className="flex justify-between items-center space-x-2">
            {moodOptions.map((mood) => (
              <Button
                key={mood.value}
                variant="outline"
                className={`flex-1 p-3 border-2 ${
                  todayMood?.mood === mood.value
                    ? "border-happy-purple bg-purple-50"
                    : "border-gray-200 hover:border-happy-purple"
                } transition-colors`}
                onClick={() => moodMutation.mutate(mood.value)}
                disabled={moodMutation.isPending}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">{mood.emoji}</div>
                  <p className="text-xs text-gray-600">{mood.label}</p>
                </div>
              </Button>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Quick Resources</h4>
          <div className="space-y-3">
            <Link href="/resources">
              <Button 
                variant="outline" 
                className="w-full bg-purple-50 border-purple-200 hover:bg-purple-100 justify-start space-x-3"
              >
                <Wind className="text-happy-purple" size={16} />
                <span className="font-medium text-gray-900">Breathing Exercise</span>
              </Button>
            </Link>
            <Link href="/resources">
              <Button 
                variant="outline" 
                className="w-full bg-purple-50 border-purple-200 hover:bg-purple-100 justify-start space-x-3"
              >
                <Lightbulb className="text-happy-purple" size={16} />
                <span className="font-medium text-gray-900">Coping Strategies</span>
              </Button>
            </Link>
            <Link href="/resources">
              <Button 
                variant="outline" 
                className="w-full bg-red-50 border-red-200 hover:bg-red-100 justify-start space-x-3"
              >
                <Phone className="text-red-500" size={16} />
                <span className="font-medium text-gray-900">Emergency Support</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
