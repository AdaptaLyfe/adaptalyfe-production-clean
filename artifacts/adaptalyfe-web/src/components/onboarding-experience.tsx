import { useState, useEffect } from "react";
import { useSafeRef } from "@/hooks/useSafeRef";
import { ChevronRight, ChevronLeft, X, CheckCircle, AlertTriangle, Heart, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector for the element to highlight
  content: React.ReactNode;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
}

interface OnboardingExperienceProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingExperience({ isVisible, onComplete, onSkip }: OnboardingExperienceProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const overlayRef = useSafeRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to SkillBridge!',
      description: 'Your personal independence companion',
      target: 'body',
      position: 'top',
      content: (
        <div className="text-center space-y-4 p-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center mx-auto">
            <Heart className="text-white w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Welcome to SkillBridge!</h2>
          <p className="text-muted-foreground">
            SkillBridge is designed to help you build independence and manage daily life with confidence. 
            Let's take a quick tour to get you started!
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>Built specifically for neurodevelopmental support</span>
          </div>
        </div>
      )
    },
    {
      id: 'emergency',
      title: 'Emergency Access',
      description: 'Always accessible safety features',
      target: '[data-tour="emergency-button"]',
      position: 'bottom',
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold">Emergency Button</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            This red emergency button is always visible and provides instant access to your emergency contacts 
            and crisis resources. You can access it from any page.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-800">
              <strong>Keyboard shortcut:</strong> Press Alt+E for quick emergency access
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'dashboard',
      title: 'Your Dashboard',
      description: 'Command center for daily life',
      target: '[data-tour="dashboard"]',
      position: 'right',
      content: (
        <div className="space-y-3">
          <h3 className="font-semibold">Your Personal Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            The dashboard shows an overview of all your important information: tasks, appointments, 
            mood tracking, and more. Everything is customizable to match your preferences.
          </p>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• View daily tasks and progress</li>
            <li>• Check upcoming appointments</li>
            <li>• Track mood and wellness</li>
            <li>• Manage medications and refills</li>
          </ul>
        </div>
      )
    },
    {
      id: 'quick-actions',
      title: 'Quick Actions',
      description: 'Fast access to common tasks',
      target: '[data-tour="quick-actions"]',
      position: 'bottom',
      content: (
        <div className="space-y-3">
          <h3 className="font-semibold">Quick Actions</h3>
          <p className="text-sm text-muted-foreground">
            These buttons give you fast access to your most-used features. You can customize 
            which actions appear here based on your daily routine.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Tip:</strong> Click the gear icon to customize your quick actions
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'daily-tasks',
      title: 'Daily Tasks',
      description: 'Manage your daily routine',
      target: '[data-tour="daily-tasks"]',
      position: 'left',
      content: (
        <div className="space-y-3">
          <h3 className="font-semibold">Daily Task Management</h3>
          <p className="text-sm text-muted-foreground">
            Keep track of your daily activities with visual progress indicators. 
            Tasks are organized by category and show time estimates to help you plan your day.
          </p>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• Health tasks (medications, exercise)</li>
            <li>• Social connections (calls, messages)</li>
            <li>• Education and learning</li>
            <li>• Life skills practice</li>
          </ul>
        </div>
      )
    },
    {
      id: 'navigation',
      title: 'Navigation',
      description: 'Find your way around',
      target: '[data-tour="navigation"]',
      position: 'bottom',
      content: (
        <div className="space-y-3">
          <h3 className="font-semibold">Easy Navigation</h3>
          <p className="text-sm text-muted-foreground">
            Use the navigation menu to access all features. On mobile, tap the menu button 
            to see all options including accessibility settings.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-50 p-2 rounded">
              <strong>Alt+1:</strong> Dashboard
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <strong>Alt+2:</strong> Tasks
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <strong>Alt+3:</strong> Resources
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <strong>Alt+E:</strong> Emergency
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Stay on top of important reminders',
      target: '[data-tour="notifications"]',
      position: 'bottom',
      content: (
        <div className="space-y-3">
          <h3 className="font-semibold">Smart Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Get reminders for medications, appointments, and tasks. You can customize 
            notification timing and quiet hours in the settings.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-800">
              <strong>Privacy:</strong> Notifications work locally on your device
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'caregivers',
      title: 'Support Network',
      description: 'Connect with your care team',
      target: '[data-tour="caregivers"]',
      position: 'top',
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold">Support Network</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Stay connected with your caregivers, family, and support team. They can help 
            you manage settings and provide encouragement on your independence journey.
          </p>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• Message your support team</li>
            <li>• Share progress updates</li>
            <li>• Get help when needed</li>
          </ul>
        </div>
      )
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Ready to start your independence journey',
      target: 'body',
      position: 'top',
      content: (
        <div className="text-center space-y-4 p-6">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="text-white w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">You're All Set!</h2>
          <p className="text-muted-foreground">
            You've completed the SkillBridge tour. Remember, you can always access help 
            and tutorials from the Resources section. We're here to support your journey!
          </p>
          <div className="space-y-2">
            <Button onClick={onComplete} className="w-full">
              Start Using SkillBridge
            </Button>
            <p className="text-xs text-muted-foreground">
              You can replay this tour anytime from Settings → Help & Tutorials
            </p>
          </div>
        </div>
      )
    }
  ];

  useEffect(() => {
    if (isVisible) {
      setIsActive(true);
    }
  }, [isVisible]);

  useEffect(() => {
    if (isActive && currentStep < onboardingSteps.length - 1) {
      const step = onboardingSteps[currentStep];
      const element = document.querySelector(step.target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('onboarding-highlight');
      }

      return () => {
        if (element) {
          element.classList.remove('onboarding-highlight');
        }
      };
    }
  }, [currentStep, isActive]);

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    localStorage.setItem('onboardingCompleted', 'true');
    toast({
      title: "Welcome to SkillBridge!",
      description: "You're ready to start building independence. Great job!",
    });
    onComplete();
  };

  const handleSkip = () => {
    setIsActive(false);
    localStorage.setItem('onboardingCompleted', 'true');
    onSkip();
  };

  if (!isActive || !isVisible) return null;

  const currentStepData = onboardingSteps[currentStep];
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        style={{ pointerEvents: 'auto' }}
      />

      {/* Tour Card */}
      <Card className="fixed z-[60] max-w-sm mx-4 shadow-2xl border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Step {currentStep + 1} of {onboardingSteps.length}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Progress value={progress} className="w-full h-2" />
        </CardHeader>

        <CardContent className="space-y-4">
          {currentStepData.content}

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            {currentStep === onboardingSteps.length - 1 ? (
              <Button onClick={handleComplete} size="sm">
                Get Started
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={nextStep} size="sm">
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={handleSkip} className="text-xs">
              Skip tour
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Positioning styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .onboarding-highlight {
            position: relative;
            z-index: 51;
            border-radius: 8px;
            box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.4), 
                        0 0 0 8px rgba(168, 85, 247, 0.2);
            background-color: rgba(255, 255, 255, 0.95);
          }
        `
      }} />
    </>
  );
}

// Setup Wizard Component
interface SetupWizardProps {
  isVisible: boolean;
  onComplete: () => void;
}

export function SetupWizard({ isVisible, onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    primaryGoals: [] as string[],
    supportNeeds: [] as string[],
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    preferences: {
      notifications: true,
      darkMode: false,
      largeText: false
    }
  });

  const { toast } = useToast();

  const setupSteps = [
    {
      title: 'Welcome to SkillBridge',
      content: (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center mx-auto">
            <Heart className="text-white w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Let's get you set up!</h2>
          <p className="text-muted-foreground">
            We'll help you customize SkillBridge to work best for your needs. 
            This will only take a few minutes.
          </p>
        </div>
      )
    },
    {
      title: 'Tell us about yourself',
      content: (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">What would you like to be called?</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your preferred name"
              className="w-full p-3 border rounded-lg text-lg"
            />
          </div>
        </div>
      )
    },
    {
      title: 'What are your main goals?',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Select what you'd like to work on (choose any that apply):</p>
          <div className="space-y-2">
            {[
              'Managing daily routines',
              'Taking medications on time',
              'Keeping track of appointments',
              'Building social connections',
              'Learning life skills',
              'Managing emotions and mood',
              'Financial planning',
              'Academic success'
            ].map((goal) => (
              <label key={goal} className="flex items-center space-x-3 p-2 rounded hover:bg-accent cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.primaryGoals.includes(goal)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({ ...prev, primaryGoals: [...prev.primaryGoals, goal] }));
                    } else {
                      setFormData(prev => ({ ...prev, primaryGoals: prev.primaryGoals.filter(g => g !== goal) }));
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm">{goal}</span>
              </label>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Emergency Contact',
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold">Add an Emergency Contact</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <input
                type="text"
                value={formData.emergencyContact.name}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                }))}
                placeholder="Contact name"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Phone Number</label>
              <input
                type="tel"
                value={formData.emergencyContact.phone}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                }))}
                placeholder="Phone number"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Relationship</label>
              <input
                type="text"
                value={formData.emergencyContact.relationship}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                }))}
                placeholder="e.g., Parent, Guardian, Friend"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Preferences',
      content: (
        <div className="space-y-4">
          <h3 className="font-semibold">Customize your experience</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent">
              <div>
                <span className="font-medium">Enable notifications</span>
                <p className="text-xs text-muted-foreground">Get reminders for tasks and appointments</p>
              </div>
              <input
                type="checkbox"
                checked={formData.preferences.notifications}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  preferences: { ...prev.preferences, notifications: e.target.checked }
                }))}
                className="rounded"
              />
            </label>
            
            <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent">
              <div>
                <span className="font-medium">Dark mode</span>
                <p className="text-xs text-muted-foreground">Use darker colors for easier viewing</p>
              </div>
              <input
                type="checkbox"
                checked={formData.preferences.darkMode}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  preferences: { ...prev.preferences, darkMode: e.target.checked }
                }))}
                className="rounded"
              />
            </label>
            
            <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent">
              <div>
                <span className="font-medium">Large text</span>
                <p className="text-xs text-muted-foreground">Make text bigger and easier to read</p>
              </div>
              <input
                type="checkbox"
                checked={formData.preferences.largeText}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  preferences: { ...prev.preferences, largeText: e.target.checked }
                }))}
                className="rounded"
              />
            </label>
          </div>
        </div>
      )
    },
    {
      title: 'All Set!',
      content: (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="text-white w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">You're ready to go!</h2>
          <p className="text-muted-foreground">
            {formData.name ? `Welcome ${formData.name}! ` : 'Welcome! '}
            Adaptalyfe is now customized for your needs. You can always change these settings later.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Remember:</strong> Your emergency contact and other information is stored securely on your device.
            </p>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < setupSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    // Save setup data
    localStorage.setItem('setupCompleted', 'true');
    localStorage.setItem('userSetupData', JSON.stringify(formData));
    
    // Apply preferences immediately
    if (formData.preferences.darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    }
    
    if (formData.preferences.largeText) {
      document.documentElement.classList.add('large-text');
      localStorage.setItem('largeText', 'true');
    }

    toast({
      title: "Setup Complete!",
      description: "Welcome to SkillBridge. Let's start building independence together!",
    });

    onComplete();
  };

  if (!isVisible) return null;

  const currentStepData = setupSteps[currentStep];
  const progress = ((currentStep + 1) / setupSteps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{currentStepData.title}</CardTitle>
            <Badge variant="secondary">
              {currentStep + 1} of {setupSteps.length}
            </Badge>
          </div>
          <Progress value={progress} className="w-full h-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStepData.content}

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            {currentStep === setupSteps.length - 1 ? (
              <Button onClick={handleComplete}>
                Get Started
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={nextStep}>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}