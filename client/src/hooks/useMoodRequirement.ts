import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MoodEntry } from "@shared/schema";

export function useMoodRequirement() {
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [hasCheckedToday, setHasCheckedToday] = useState(false);

  const { data: todayMood, isLoading } = useQuery<MoodEntry>({
    queryKey: ["/api/mood-entries/today"],
  });

  useEffect(() => {
    if (isLoading) return;
    
    const today = new Date().toDateString();
    const lastCheck = localStorage.getItem('mood-check-date');
    
    console.log('Mood check - todayMood:', todayMood, 'lastCheck:', lastCheck, 'today:', today);
    
    // If mood exists, hide modal and mark as checked
    if (todayMood) {
      console.log('Mood exists, hiding modal');
      setHasCheckedToday(true);
      setShowMoodModal(false);
      return;
    }
    
    // Disabled automatic mood modal to prevent interface blocking
    // Users can access mood tracking through navigation instead
    if (!todayMood && lastCheck !== today && !showMoodModal) {
      console.log('Mood check available via navigation');
      setHasCheckedToday(false);
    }
  }, [todayMood, isLoading]);

  const closeMoodModal = () => {
    console.log('closeMoodModal called');
    setShowMoodModal(false);
    setHasCheckedToday(true);
    const today = new Date().toDateString();
    localStorage.setItem('mood-check-date', today);
    console.log('Modal closed successfully');
  };

  const isMoodRequired = !todayMood && !isLoading;
  const shouldBlockNavigation = false; // Keep disabled for now

  return {
    showMoodModal,
    closeMoodModal,
    isMoodRequired,
    shouldBlockNavigation,
    moodData: todayMood
  };
}