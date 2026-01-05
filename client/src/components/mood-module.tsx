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
    <div className={`mt-8 ${bgColor} rounded-2xl shadow-lg p-4 sm:p-6 border-t-4 ${borderColor} ${isRequired ? 'ring-2 ring-red-200' : ''}`}>
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 ${isRequired ? 'bg-red-500' : 'bg-happy-purple'} rounded-lg flex items-center justify-center ${isRequired ? 'animate-pulse' : ''} flex-shrink-0`}>
            <Heart className="text-white" size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
              <span className="whitespace-nowrap">Mood Log</span>
              {isRequired && (
                <span className="text-red-500 text-xs sm:text-sm font-medium bg-red-100 px-2 py-1 rounded-full whitespace-nowrap">
                  Required
                </span>
              )}
            </h3>
            {isRequired && (
              <p className="text-xs sm:text-sm text-red-600 mt-1">
                Daily mood check-in is required to continue
              </p>
            )}
          </div>
        </div>
        <Link href="/mood-tracking">
          <Button className={`${isRequired ? 'bg-red-500 hover:bg-red-600' : 'bg-happy-purple hover:bg-happy-purple'} text-white ${isRequired ? 'animate-bounce' : ''} text-xs sm:text-sm px-3 sm:px-4 py-2 whitespace-nowrap flex-shrink-0`}>
            {isRequired ? 'Required Check-in' : 'Check In Now'}
          </Button>
        </Link>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">How are you feeling today?</h4>
          <div className="flex justify-between items-center gap-1.5 sm:gap-2">
            {moodOptions.map((mood) => (
              <Button
                key={mood.value}
                variant="outline"
                className={`flex-1 p-2 sm:p-3 border-2 ${
                  todayMood?.mood === mood.value
                    ? "border-happy-purple bg-purple-50"
                    : "border-gray-200 hover:border-happy-purple"
                } transition-colors`}
                onClick={() => moodMutation.mutate(mood.value)}
                disabled={moodMutation.isPending}
                data-testid={`button-mood-${mood.value}`}
              >
                <div className="text-center">
                  <div className="text-xl sm:text-2xl mb-0.5 sm:mb-1">{mood.emoji}</div>
                  <p className="text-[10px] sm:text-xs text-gray-600">{mood.label}</p>
                </div>
              </Button>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Quick Resources</h4>
          <div className="space-y-2 sm:space-y-3">
            <Link href="/resources">
              <Button 
                variant="outline" 
                className="w-full bg-purple-50 border-purple-200 hover:bg-purple-100 justify-start space-x-2 sm:space-x-3 py-2 sm:py-3"
              >
                <Wind className="text-happy-purple flex-shrink-0" size={16} />
                <span className="font-medium text-gray-900 text-xs sm:text-sm">Breathing Exercise</span>
              </Button>
            </Link>
            <Link href="/resources">
              <Button 
                variant="outline" 
                className="w-full bg-purple-50 border-purple-200 hover:bg-purple-100 justify-start space-x-2 sm:space-x-3 py-2 sm:py-3"
              >
                <Lightbulb className="text-happy-purple flex-shrink-0" size={16} />
                <span className="font-medium text-gray-900 text-xs sm:text-sm">Coping Strategies</span>
              </Button>
            </Link>
            <Link href="/resources">
              <Button 
                variant="outline" 
                className="w-full bg-red-50 border-red-200 hover:bg-red-100 justify-start space-x-2 sm:space-x-3 py-2 sm:py-3"
              >
                <Phone className="text-red-500 flex-shrink-0" size={16} />
                <span className="font-medium text-gray-900 text-xs sm:text-sm">Trusted Contacts</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
