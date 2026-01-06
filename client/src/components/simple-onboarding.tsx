import { useState } from "react";
import { ChevronRight, ChevronLeft, X, Heart, Star, AlertTriangle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SimpleOnboardingProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function SimpleOnboarding({ isVisible, onComplete, onSkip }: SimpleOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Adaptalyfe!",
      content: (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center mx-auto">
            <Heart className="text-white w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold">Your Independence Companion</h3>
          <p className="text-muted-foreground">
            Adaptalyfe helps you build independence and manage daily life with confidence. 
            This app is designed specifically for neurodevelopmental support.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>Built for your success</span>
          </div>
        </div>
      )
    },
    {
      title: "Emergency Access",
      content: (
        <div className="space-y-4">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto">
            <AlertTriangle className="text-red-600 w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-center">Safety First</h3>
          <p className="text-muted-foreground text-center">
            The red Emergency button is always available in the navigation. Click it anytime for immediate 
            access to crisis resources, emergency contacts, and safety information.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700 text-center">
              <strong>Quick tip:</strong> Press Alt+E anywhere in the app for instant emergency access.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Navigation Menu",
      content: (
        <div className="space-y-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
            <div className="w-5 h-5 flex flex-col gap-1">
              <div className="w-full h-0.5 bg-blue-600 rounded"></div>
              <div className="w-full h-0.5 bg-blue-600 rounded"></div>
              <div className="w-full h-0.5 bg-blue-600 rounded"></div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-center">Easy Navigation</h3>
          <p className="text-muted-foreground text-center">
            Click the three-line menu button in the top-right to access all Adaptalyfe features:
          </p>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Daily Tasks & Mood Tracking</li>
            <li>• Financial Management</li>
            <li>• Meal Planning & Shopping</li>
            <li>• Medication List & Medical Info</li>
            <li>• Student Support Tools</li>
            <li>• Caregiver Communication</li>
          </ul>
        </div>
      )
    },
    {
      title: "Quick Actions",
      content: (
        <div className="space-y-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
            <Star className="text-green-600 w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-center">Personalized Dashboard</h3>
          <p className="text-muted-foreground text-center">
            Your dashboard shows personalized quick actions for your most-used features. 
            You can customize these by clicking the "Customize" button.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700 text-center">
              <strong>Pro tip:</strong> Drag and drop to reorder your favorite features!
            </p>
          </div>
        </div>
      )
    },
    {
      title: "You're All Set!",
      content: (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
            <HelpCircle className="text-white w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold">Ready to Build Independence!</h3>
          <p className="text-muted-foreground">
            You're ready to start using Adaptalyfe. Remember, this app grows with you as you 
            develop new skills and confidence in daily life.
          </p>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-700">
              <strong>Need help?</strong> Click the "Start Tour" button anytime to see this guide again.
            </p>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={isVisible} onOpenChange={onSkip}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Getting Started</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          <div className="min-h-[300px]">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-center">{steps[currentStep].title}</CardTitle>
              </CardHeader>
              <CardContent>
                {steps[currentStep].content}
              </CardContent>
            </Card>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <Button
              variant="ghost"
              onClick={onSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip Tour
            </Button>

            <Button
              onClick={nextStep}
              className="flex items-center gap-2"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}