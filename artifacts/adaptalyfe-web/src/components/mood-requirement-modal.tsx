import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MoodRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MoodRequirementModal({ isOpen, onClose }: MoodRequirementModalProps) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const moodOptions = [
    { value: 1, emoji: "😢", label: "Struggling", description: "Having a really tough day" },
    { value: 2, emoji: "😐", label: "Okay", description: "Getting by, feeling neutral" },
    { value: 3, emoji: "😊", label: "Good", description: "Feeling positive and content" },
    { value: 4, emoji: "😃", label: "Great", description: "Having a wonderful day" },
    { value: 5, emoji: "🤩", label: "Amazing", description: "Feeling fantastic and energized" },
  ];

  const moodMutation = useMutation({
    mutationFn: async (mood: number) => {
      const response = await apiRequest("POST", "/api/mood-entries", { mood });
      return response.json();
    },
    onSuccess: () => {
      console.log('Mood submission successful, refreshing data');
      
      // Refresh mood data so the hook knows mood is completed
      queryClient.invalidateQueries({ queryKey: ["/api/mood-entries/today"] });
      
      toast({
        title: "Daily check-in complete!",
        description: "Thank you for taking care of your mental health.",
      });
      
      onClose();
    },
    onError: (error) => {
      console.error('Mood submission error:', error);
      toast({
        title: "Submission failed",
        description: "Unable to save your mood entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (selectedMood && !moodMutation.isPending) {
      moodMutation.mutate(selectedMood);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Heart className="w-6 h-6 text-red-500" />
            Daily Mental Health Check-in Required
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Your daily mood check-in helps track your mental wellness and is required to continue using AdaptaLyfe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4 pb-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="font-medium text-amber-800">Why this matters</span>
            </div>
            <p className="text-sm text-amber-700">
              Regular mood tracking helps identify patterns, celebrate progress, and recognize when you might need extra support.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              How are you feeling today?
            </label>
            <div className="grid grid-cols-1 gap-2">
              {moodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedMood(option.value)}
                  className={`p-3 text-left rounded-lg border-2 transition-all ${
                    selectedMood === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{option.emoji}</span>
                    <div>
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!selectedMood || moodMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {moodMutation.isPending ? "Recording..." : "Complete Check-in"}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Skip for now
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            This information is private and helps you track your wellness journey.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}