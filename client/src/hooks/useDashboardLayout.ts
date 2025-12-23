import { useState, useEffect } from "react";

export interface DashboardModule {
  id: string;
  name: string;
  component: string;
  enabled: boolean;
  order: number;
}

const DEFAULT_MODULES: DashboardModule[] = [
  { id: 'daily-summary', name: 'Daily Summary', component: 'DailySummary', enabled: true, order: 0 },
  { id: 'daily-tasks', name: 'Task Management', component: 'DailyTasksModule', enabled: true, order: 1 },
  { id: 'mood', name: 'Mood & Wellbeing', component: 'MoodModule', enabled: true, order: 2 },
  { id: 'financial', name: 'Financial Tracker', component: 'FinancialModule', enabled: false, order: 3 },
  { id: 'appointments', name: 'Appointments', component: 'AppointmentsModule', enabled: false, order: 4 },
  { id: 'pharmacy', name: 'Pharmacy & Medications', component: 'PharmacyModule', enabled: false, order: 5 },
  { id: 'safety-transportation', name: 'Safety & Transportation (Premium)', component: 'SafetyTransportationModule', enabled: false, order: 6 },
  { id: 'location-safety', name: 'Location & Safety (Premium)', component: 'LocationSafetyModule', enabled: false, order: 7 },
  { id: 'achievements', name: 'Achievements', component: 'AchievementsModule', enabled: false, order: 8 },
  { id: 'caregiver', name: 'Support Network', component: 'CaregiverModule', enabled: false, order: 9 },
  { id: 'health-wellness', name: 'Health & Wellness (Premium)', component: 'HealthWellnessModule', enabled: false, order: 10 },
  { id: 'accessibility', name: 'Accessibility Settings (Premium)', component: 'AccessibilitySettingsModule', enabled: false, order: 11 },
  { id: 'life-skills', name: 'Life Skills Training (Premium)', component: 'LifeSkillsModule', enabled: false, order: 12 },
  { id: 'progress-motivation', name: 'Progress & Motivation (Premium)', component: 'ProgressMotivationModule', enabled: false, order: 13 },
];

// Helper function to ensure modules array is always valid
function ensureValidModules(modules: unknown): DashboardModule[] {
  if (!modules || !Array.isArray(modules)) {
    return [...DEFAULT_MODULES];
  }
  
  // Filter out any null/undefined items and validate structure
  const validModules = modules.filter((m): m is DashboardModule => {
    return m != null && 
           typeof m === 'object' && 
           typeof m.id === 'string' && 
           typeof m.enabled === 'boolean';
  });
  
  return validModules.length > 0 ? validModules : [...DEFAULT_MODULES];
}

export function useDashboardLayout() {
  // CRITICAL: Initialize with DEFAULT_MODULES, never empty array
  const [modules, setModules] = useState<DashboardModule[]>(() => [...DEFAULT_MODULES]);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load layout from localStorage on mount and merge with new modules
  useEffect(() => {
    try {
      const savedLayout = localStorage.getItem('dashboard-layout');
      if (savedLayout) {
        const parsedLayout = JSON.parse(savedLayout);
        const validLayout = ensureValidModules(parsedLayout);
        
        // Get existing module IDs
        const existingIds = validLayout.map(m => m.id);
        
        // Find new modules that aren't in the saved layout
        const newModules = DEFAULT_MODULES.filter(m => !existingIds.includes(m.id));
        
        // Merge saved layout with new modules
        const mergedModules = [...validLayout, ...newModules];
        
        // Remove duplicates by ID (keep first occurrence)
        const deduplicatedModules = mergedModules.filter((module, index) => 
          mergedModules.findIndex(m => m.id === module.id) === index
        );
        
        setModules(ensureValidModules(deduplicatedModules));
      } else {
        setModules([...DEFAULT_MODULES]);
      }
    } catch (error) {
      console.error('Failed to parse saved layout:', error);
      setModules([...DEFAULT_MODULES]);
    }
    setIsLoaded(true);
  }, []);

  // Save layout to localStorage whenever modules change (only after loaded)
  useEffect(() => {
    if (isLoaded && modules && modules.length > 0) {
      try {
        localStorage.setItem('dashboard-layout', JSON.stringify(modules));
      } catch (error) {
        console.error('Failed to save layout:', error);
      }
    }
  }, [modules, isLoaded]);

  const reorderModules = (startIndex: number, endIndex: number) => {
    const safeModules = ensureValidModules(modules);
    const newModules = Array.from(safeModules);
    const [reorderedItem] = newModules.splice(startIndex, 1);
    if (reorderedItem) {
      newModules.splice(endIndex, 0, reorderedItem);
    }
    
    // Update order values
    const updatedModules = newModules.map((module, index) => ({
      ...module,
      order: index
    }));
    
    setModules(updatedModules);
  };

  const toggleModule = (moduleId: string) => {
    setModules(prev => {
      const safePrev = ensureValidModules(prev);
      return safePrev.map(module => 
        module.id === moduleId 
          ? { ...module, enabled: !module.enabled }
          : module
      );
    });
  };

  const resetToDefault = () => {
    setModules([...DEFAULT_MODULES]);
    try {
      localStorage.removeItem('dashboard-layout');
    } catch (error) {
      console.error('Failed to remove layout from storage:', error);
    }
  };

  const removeDuplicates = () => {
    const safeModules = ensureValidModules(modules);
    const deduplicatedModules = safeModules.filter((module, index) => 
      safeModules.findIndex(m => m.id === module.id) === index
    );
    if (deduplicatedModules.length !== safeModules.length) {
      setModules(deduplicatedModules);
    }
  };

  const addEnhancedFeatures = () => {
    const enhancedModules = [
      { id: 'health-wellness', name: 'Health & Wellness (Premium)', component: 'HealthWellnessModule', enabled: false, order: 7 },
      { id: 'accessibility', name: 'Accessibility Settings (Premium)', component: 'AccessibilitySettingsModule', enabled: false, order: 8 },
      { id: 'life-skills', name: 'Life Skills Training (Premium)', component: 'LifeSkillsModule', enabled: false, order: 9 },
      { id: 'progress-motivation', name: 'Progress & Motivation (Premium)', component: 'ProgressMotivationModule', enabled: false, order: 10 },
    ];
    
    setModules(prev => {
      const safePrev = ensureValidModules(prev);
      const existingIds = safePrev.map(m => m.id);
      const newModules = enhancedModules.filter(m => !existingIds.includes(m.id));
      return [...safePrev, ...newModules];
    });
  };

  const moveModuleUp = (moduleId: string) => {
    const safeModules = ensureValidModules(modules);
    const currentIndex = safeModules.findIndex(m => m.id === moduleId);
    if (currentIndex > 0) {
      reorderModules(currentIndex, currentIndex - 1);
    }
  };

  const moveModuleDown = (moduleId: string) => {
    const safeModules = ensureValidModules(modules);
    const currentIndex = safeModules.findIndex(m => m.id === moduleId);
    if (currentIndex < safeModules.length - 1) {
      reorderModules(currentIndex, currentIndex + 1);
    }
  };

  // CRITICAL: Always ensure we return valid arrays, never null/undefined
  const safeModules = ensureValidModules(modules);
  
  // Get modules sorted by order for rendering (with bulletproof safety)
  const sortedModules = safeModules
    .filter(module => module && module.enabled === true)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const enabledModules = safeModules.filter(module => module && module.enabled === true);
  const disabledModules = safeModules.filter(module => module && module.enabled === false);

  return {
    modules: sortedModules,
    allModules: safeModules,
    enabledModules,
    disabledModules,
    isCustomizing,
    setIsCustomizing,
    reorderModules,
    toggleModule,
    resetToDefault,
    moveModuleUp,
    moveModuleDown,
    addEnhancedFeatures,
    isLoaded
  };
}
