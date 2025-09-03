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

export function useDashboardLayout() {
  const [modules, setModules] = useState<DashboardModule[]>([]);
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Load layout from localStorage on mount and merge with new modules
  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboard-layout');
    if (savedLayout) {
      try {
        const parsedLayout: DashboardModule[] = JSON.parse(savedLayout);
        
        // Get existing module IDs
        const existingIds = parsedLayout.map(m => m.id);
        
        // Find new modules that aren't in the saved layout
        const newModules = DEFAULT_MODULES.filter(m => !existingIds.includes(m.id));
        
        // Merge saved layout with new modules
        const mergedModules = [...parsedLayout, ...newModules];
        
        // Remove duplicates by ID (keep first occurrence)
        const deduplicatedModules = mergedModules.filter((module, index) => 
          mergedModules.findIndex(m => m.id === module.id) === index
        );
        
        setModules(deduplicatedModules);
      } catch (error) {
        console.error('Failed to parse saved layout:', error);
        setModules(DEFAULT_MODULES);
      }
    } else {
      setModules(DEFAULT_MODULES);
    }
  }, []);



  // Save layout to localStorage whenever modules change
  useEffect(() => {
    if (modules.length > 0) {
      localStorage.setItem('dashboard-layout', JSON.stringify(modules));
    }
  }, [modules]);

  const reorderModules = (startIndex: number, endIndex: number) => {
    const newModules = Array.from(modules);
    const [reorderedItem] = newModules.splice(startIndex, 1);
    newModules.splice(endIndex, 0, reorderedItem);
    
    // Update order values
    const updatedModules = newModules.map((module, index) => ({
      ...module,
      order: index
    }));
    
    setModules(updatedModules);
  };

  const toggleModule = (moduleId: string) => {
    setModules(prev => 
      prev.map(module => 
        module.id === moduleId 
          ? { ...module, enabled: !module.enabled }
          : module
      )
    );
  };

  const resetToDefault = () => {
    setModules(DEFAULT_MODULES);
    localStorage.removeItem('dashboard-layout');
  };

  const removeDuplicates = () => {
    const deduplicatedModules = modules.filter((module, index) => 
      modules.findIndex(m => m.id === module.id) === index
    );
    if (deduplicatedModules.length !== modules.length) {
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
      const existingIds = prev.map(m => m.id);
      const newModules = enhancedModules.filter(m => !existingIds.includes(m.id));
      return [...prev, ...newModules];
    });
  };

  const moveModuleUp = (moduleId: string) => {
    const currentIndex = modules.findIndex(m => m.id === moduleId);
    if (currentIndex > 0) {
      reorderModules(currentIndex, currentIndex - 1);
    }
  };

  const moveModuleDown = (moduleId: string) => {
    const currentIndex = modules.findIndex(m => m.id === moduleId);
    if (currentIndex < modules.length - 1) {
      reorderModules(currentIndex, currentIndex + 1);
    }
  };

  // Get modules sorted by order for rendering
  const sortedModules = modules
    .filter(module => module.enabled)
    .sort((a, b) => a.order - b.order);

  const enabledModules = modules.filter(module => module.enabled);
  const disabledModules = modules.filter(module => !module.enabled);

  return {
    modules: sortedModules,
    allModules: modules,
    enabledModules,
    disabledModules,
    isCustomizing,
    setIsCustomizing,
    reorderModules,
    toggleModule,
    resetToDefault,
    moveModuleUp,
    moveModuleDown,
    addEnhancedFeatures
  };
}