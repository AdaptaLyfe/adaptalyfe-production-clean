import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, HelpCircle, Bell, Star, Volume2, Zap, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import { useMoodRequirement } from "@/hooks/useMoodRequirement";
import SubscriptionBanner from "@/components/subscription-banner";
import WelcomeSection from "@/components/welcome-section";
import QuickActions from "@/components/quick-actions/QuickActions";
import DailyTasksModule from "@/components/daily-tasks-module";
import FinancialModule from "@/components/financial-module";
import MoodModule from "@/components/mood-module";
import AchievementsModule from "@/components/achievements-module";
import CaregiverModule from "@/components/caregiver-module";
import AppointmentsModule from "@/components/appointments-module";
import DailySummary from "@/components/daily-summary";
import DashboardCustomizer from "@/components/dashboard-customizer";
import MoodRequirementModal from "@/components/mood-requirement-modal";
import AIChatbot from "@/components/ai-chatbot";
import HealthWellnessModule from "@/components/health-wellness-module";
import AccessibilitySettingsModule from "@/components/accessibility-settings-module";
import LifeSkillsModule from "@/components/life-skills-module";
import ProgressMotivationModule from "@/components/progress-motivation-module";
import PharmacyModule from "@/components/pharmacy-module";
import SafetyTransportationModule from "@/components/safety-transportation-module";
import LocationSafetyModule from "@/components/location-safety-module";
// Enhanced features components - temporarily commented out due to integration issues
// import { SmartNotifications } from "@/components/smart-notifications";
// import { AchievementSystem } from "@/components/achievement-system";
// import { VoiceCommands } from "@/components/voice-commands";
// import { SmartDashboardInsights } from "@/components/smart-dashboard-insights";
// import { EnhancedCommunication } from "@/components/enhanced-communication";
// import { PersonalizationEngine } from "@/components/personalization-engine";

export default function Dashboard() {


  const [isDragMode, setIsDragMode] = useState(false);
  const { modules, reorderModules } = useDashboardLayout();
  const { showMoodModal, closeMoodModal } = useMoodRequirement();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    // Get enabled modules to work with filtered indices
    const enabledModules = modules.filter(module => module.enabled);
    const sourceModuleId = enabledModules[sourceIndex].id;
    const destinationModuleId = enabledModules[destinationIndex].id;
    
    // Find original indices in the full modules array
    const originalSourceIndex = modules.findIndex(m => m.id === sourceModuleId);
    const originalDestinationIndex = modules.findIndex(m => m.id === destinationModuleId);
    
    reorderModules(originalSourceIndex, originalDestinationIndex);
  };

  // Component mapping for dynamic rendering
  const componentMap = {
    'DailySummary': DailySummary,
    'DailyTasksModule': DailyTasksModule,
    'MoodModule': MoodModule,
    'FinancialModule': FinancialModule,
    'AppointmentsModule': AppointmentsModule,
    'AchievementsModule': AchievementsModule,
    'CaregiverModule': CaregiverModule,
    'PharmacyModule': PharmacyModule,
    'SafetyTransportationModule': SafetyTransportationModule,
    'LocationSafetyModule': LocationSafetyModule,
    'HealthWellnessModule': HealthWellnessModule,
    'AccessibilitySettingsModule': AccessibilitySettingsModule,
    'LifeSkillsModule': LifeSkillsModule,
    'ProgressMotivationModule': ProgressMotivationModule,

  };

  const renderModule = (moduleId: string, component: string, isDraggable = false) => {
    const Component = componentMap[component as keyof typeof componentMap];
    if (!Component) return null;

    if (isDraggable && isDragMode) {
      return (
        <div className="relative group">
          <div className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-blue-500 text-white rounded-full p-1 shadow-lg flex items-center gap-1 text-xs px-2">
              <GripVertical className="w-3 h-3" />
              Drag to reorder
            </div>
          </div>
          <div className="border-2 border-dashed border-blue-200 rounded-lg p-2 hover:border-blue-400 transition-colors">
            <Component key={moduleId} />
          </div>
        </div>
      );
    }

    return <Component key={moduleId} />;
  };

  return (
    <>
      <SubscriptionBanner />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header with customization button */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            <WelcomeSection />
          </div>

        </div>

        <QuickActions />
        
        {/* Drag mode indicator */}
        {isDragMode && (
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6 flex items-center gap-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <GripVertical className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-blue-800 font-medium">Tile Reorder Mode Active</p>
              <p className="text-blue-600 text-sm">Click and drag any tile below to reorder your dashboard</p>
            </div>
          </div>
        )}
        
        {/* Dynamic module rendering based on user preferences */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="dashboard-modules" isDropDisabled={!isDragMode}>
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`space-y-8 mt-8 ${
                  isDragMode && snapshot.isDraggingOver 
                    ? 'bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-4' 
                    : ''
                }`}
              >
                {modules
                  .filter(module => module.enabled)
                  .map((module, dragIndex) => {
                    const originalIndex = modules.findIndex(m => m.id === module.id);

                    return (
                      <Draggable 
                        key={module.id} 
                        draggableId={module.id} 
                        index={dragIndex}
                        isDragDisabled={!isDragMode}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`${
                              snapshot.isDragging ? 'opacity-75 transform scale-105 shadow-lg' : ''
                            } transition-all duration-200`}
                          >
                            {/* Special layout for daily summary - pair with next module if it's daily tasks */}
                            {module.id === 'daily-summary' ? (() => {
                              const nextModule = modules[originalIndex + 1];
                              const isDailyTasksNext = nextModule && nextModule.id === 'daily-tasks' && nextModule.enabled;
                              
                              return (
                                <div className="grid lg:grid-cols-3 gap-8">
                                  <div className="lg:col-span-1">
                                    {renderModule(module.id, module.component, isDragMode)}
                                  </div>
                                  <div className="lg:col-span-2">
                                    {isDailyTasksNext ? renderModule(nextModule.id, nextModule.component, isDragMode) : null}
                                  </div>
                                </div>
                              );
                            })() : null}
                            
                            {/* Skip daily tasks if already rendered with daily summary */}
                            {module.id === 'daily-tasks' && originalIndex > 0 && (() => {
                              const prevModule = modules[originalIndex - 1];
                              if (prevModule && prevModule.id === 'daily-summary' && prevModule.enabled) {
                                return null; // Already rendered
                              }
                              
                              // Render standalone daily tasks if not paired
                              const premiumModules = ['safety-transportation', 'location-safety', 'health-wellness', 'accessibility', 'life-skills', 'progress-motivation'];
                              if (premiumModules.includes(module.id)) {
                                return (
                                  <div className="mb-8 border-2 border-purple-200 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-1">
                                    <div className="bg-white rounded-lg">
                                      {renderModule(module.id, module.component, isDragMode)}
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div className="mb-8">
                                  {renderModule(module.id, module.component, isDragMode)}
                                </div>
                              );
                            })()}

                            {/* Regular modules (not daily-summary or daily-tasks) */}
                            {module.id !== 'daily-summary' && module.id !== 'daily-tasks' ? (() => {
                              const premiumModules = ['safety-transportation', 'location-safety', 'health-wellness', 'accessibility', 'life-skills', 'progress-motivation'];
                              if (premiumModules.includes(module.id)) {
                                return (
                                  <div className="mb-8 border-2 border-purple-200 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-1">
                                    <div className="bg-white rounded-lg">
                                      {renderModule(module.id, module.component, isDragMode)}
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div className="mb-8">
                                  {renderModule(module.id, module.component, isDragMode)}
                                </div>
                              );
                            })() : null}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* AI Chatbot */}
      <AIChatbot />

      {/* Modals disabled - customizer removed */}


      
      {/* Mood requirement modal disabled to prevent interface blocking */}
    </>
  );
}
