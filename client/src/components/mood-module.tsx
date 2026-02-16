import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link } from "wouter";
import { Heart, Wind, Lightbulb, Phone, Sparkles } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { trackMoodEntry } from "@/lib/firebase";
import type { MoodEntry } from "@shared/schema";

const moodMessages: Record<number, { title: string; message: string; tip: string; color: string }> = {
  1: {
    title: "We hear you",
    message: "It's okay to have tough days. You're not alone, and checking in shows real strength.",
    tip: "Try a breathing exercise or reach out to a trusted contact. Small steps matter.",
    color: "from-blue-400 to-blue-600",
  },
  2: {
    title: "Hanging in there",
    message: "Neutral days are part of the journey. You showed up and that counts!",
    tip: "A short walk or a favorite song can give your mood a gentle boost.",
    color: "from-teal-400 to-teal-600",
  },
  3: {
    title: "Looking good!",
    message: "You're feeling positive today — keep that energy going!",
    tip: "Write down one thing you're grateful for to hold onto this feeling.",
    color: "from-green-400 to-emerald-600",
  },
  4: {
    title: "What a great day!",
    message: "You're doing amazing! Your positivity is something to celebrate.",
    tip: "Share your good mood with someone — happiness is contagious!",
    color: "from-purple-400 to-purple-600",
  },
  5: {
    title: "You're on fire!",
    message: "Incredible energy today! You should be so proud of yourself.",
    tip: "Channel this energy into a goal or challenge — you've got this!",
    color: "from-amber-400 to-orange-500",
  },
};

export default function MoodModule() {
  const { toast } = useToast();
  const [pendingMood, setPendingMood] = useState<number | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
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
    onSuccess: (_data, moodValue) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mood-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mood-entries/today"] });
      trackMoodEntry(moodValue, moodOptions.find(m => m.value === moodValue)?.label || "unknown");
      setShowConfirmation(true);
    },
  });

  const handleMoodSelect = (moodValue: number) => {
    if (!todayMood && !moodMutation.isPending) {
      setPendingMood(moodValue);
      moodMutation.mutate(moodValue);
    }
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    setPendingMood(null);
  };

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
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {moodOptions.map((mood) => (
              <Button
                key={mood.value}
                variant="outline"
                className={`h-16 sm:h-20 flex flex-col items-center justify-center p-1 sm:p-2 border-2 ${
                  todayMood?.mood === mood.value
                    ? "border-happy-purple bg-purple-50"
                    : todayMood
                    ? "border-gray-200 opacity-50 cursor-not-allowed"
                    : "border-gray-200 hover:border-happy-purple"
                } transition-colors`}
                onClick={() => handleMoodSelect(mood.value)}
                disabled={moodMutation.isPending || !!todayMood}
                data-testid={`button-mood-${mood.value}`}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                  <span className="text-xl sm:text-2xl leading-none">{mood.emoji}</span>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-600 leading-tight mt-0.5">{mood.label}</p>
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

      {pendingMood && moodMessages[pendingMood] && (
        <Dialog open={showConfirmation} onOpenChange={handleCloseConfirmation}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className={`w-full -mt-6 -mx-6 mb-4 px-6 py-5 bg-gradient-to-r ${moodMessages[pendingMood].color} rounded-t-lg`} style={{ width: 'calc(100% + 3rem)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{moodOptions.find(m => m.value === pendingMood)?.emoji}</span>
                  <div>
                    <DialogTitle className="text-white text-xl">{moodMessages[pendingMood].title}</DialogTitle>
                    <p className="text-white/80 text-sm mt-1">
                      You're feeling {moodOptions.find(m => m.value === pendingMood)?.label?.toLowerCase()} today
                    </p>
                  </div>
                </div>
              </div>
              <DialogDescription className="text-base text-gray-700 leading-relaxed">
                {moodMessages[pendingMood].message}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-2">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 mb-1">Daily Tip</p>
                  <p className="text-sm text-amber-700">{moodMessages[pendingMood].tip}</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleCloseConfirmation}
              className={`w-full mt-2 bg-gradient-to-r ${moodMessages[pendingMood].color} text-white font-semibold py-3 rounded-xl hover:opacity-90`}
            >
              Got it, thanks!
            </Button>
            <p className="text-xs text-gray-400 text-center">Your mood has been recorded for today.</p>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
