import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/lib/notifications';
import { 
  Smartphone, 
  Bell, 
  Shield, 
  Users, 
  Accessibility, 
  Heart, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Phone,
  Camera,
  MapPin
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
  required?: boolean;
}

interface OnboardingPreferences {
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    screenReader: boolean;
    keyboardNavigation: boolean;
  };
  notifications: {
    medications: boolean;
    appointments: boolean;
    dailyCheckIn: boolean;
    emergencyAlerts: boolean;
  };
  privacy: {
    locationSharing: boolean;
    caregiverAccess: boolean;
    dataBackup: boolean;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export default function EnhancedOnboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<OnboardingPreferences>({
    accessibility: {
      highContrast: false,
      largeText: false,
      screenReader: false,
      keyboardNavigation: false
    },
    notifications: {
      medications: true,
      appointments: true,
      dailyCheckIn: true,
      emergencyAlerts: true
    },
    privacy: {
      locationSharing: false,
      caregiverAccess: true,
      dataBackup: true
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  const { toast } = useToast();
  const { permission, requestPermission } = useNotifications();

  // Check if user has completed onboarding
  useEffect(() => {
    const completed = localStorage.getItem('adaptalyfe_onboarding_completed');
    if (!completed) {
      setIsOpen(true);
    }
  }, []);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Adaptalyfe Mobile!',
      description: 'Let\'s set up your app for the best experience',
      component: (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Smartphone className="w-10 h-10 text-blue-600" />
          </div>
          <p className="text-gray-600">
            We'll help you configure accessibility settings, notifications, 
            and emergency contacts to make Adaptalyfe work perfectly for you.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Shield className="w-4 h-4" />
            <span>Your privacy and safety are our top priorities</span>
          </div>
        </div>
      )
    },
    {
      id: 'accessibility',
      title: 'Accessibility Preferences',
      description: 'Choose settings that work best for you',
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Accessibility className="w-5 h-5 text-blue-500" />
                <div>
                  <Label>High Contrast Mode</Label>
                  <p className="text-sm text-gray-500">Easier to see colors and text</p>
                </div>
              </div>
              <Switch
                checked={preferences.accessibility.highContrast}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({
                    ...prev,
                    accessibility: { ...prev.accessibility, highContrast: checked }
                  }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">Aa</span>
                <div>
                  <Label>Large Text</Label>
                  <p className="text-sm text-gray-500">Bigger text throughout the app</p>
                </div>
              </div>
              <Switch
                checked={preferences.accessibility.largeText}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({
                    ...prev,
                    accessibility: { ...prev.accessibility, largeText: checked }
                  }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">⌨️</span>
                <div>
                  <Label>Keyboard Navigation</Label>
                  <p className="text-sm text-gray-500">Navigate with keyboard shortcuts</p>
                </div>
              </div>
              <Switch
                checked={preferences.accessibility.keyboardNavigation}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({
                    ...prev,
                    accessibility: { ...prev.accessibility, keyboardNavigation: checked }
                  }))
                }
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      description: 'Stay on track with helpful reminders',
      component: (
        <div className="space-y-4">
          {!permission.granted && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-medium">Enable Notifications</p>
                    <p className="text-sm text-gray-600">Allow notifications to receive important reminders</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={requestPermission}
                    className="ml-auto"
                  >
                    Enable
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">💊</span>
                <div>
                  <Label>Medication Reminders</Label>
                  <p className="text-sm text-gray-500">Never miss your medications</p>
                </div>
              </div>
              <Switch
                checked={preferences.notifications.medications}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, medications: checked }
                  }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">📅</span>
                <div>
                  <Label>Appointment Alerts</Label>
                  <p className="text-sm text-gray-500">Reminders before appointments</p>
                </div>
              </div>
              <Switch
                checked={preferences.notifications.appointments}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, appointments: checked }
                  }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-pink-500" />
                <div>
                  <Label>Daily Check-in</Label>
                  <p className="text-sm text-gray-500">Daily mood and wellness reminders</p>
                </div>
              </div>
              <Switch
                checked={preferences.notifications.dailyCheckIn}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, dailyCheckIn: checked }
                  }))
                }
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'emergency',
      title: 'Emergency Contact',
      description: 'Set up your primary emergency contact',
      required: true,
      component: (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-red-600 mb-4">
            <Phone className="w-5 h-5" />
            <span className="font-medium">Required for your safety</span>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="contact-name">Contact Name</Label>
              <Input
                id="contact-name"
                value={preferences.emergencyContact.name}
                onChange={(e) => 
                  setPreferences(prev => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                  }))
                }
                placeholder="Enter contact name"
              />
            </div>
            
            <div>
              <Label htmlFor="contact-phone">Phone Number</Label>
              <Input
                id="contact-phone"
                type="tel"
                value={preferences.emergencyContact.phone}
                onChange={(e) => 
                  setPreferences(prev => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                  }))
                }
                placeholder="Enter phone number"
              />
            </div>
            
            <div>
              <Label htmlFor="contact-relationship">Relationship</Label>
              <Input
                id="contact-relationship"
                value={preferences.emergencyContact.relationship}
                onChange={(e) => 
                  setPreferences(prev => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                  }))
                }
                placeholder="e.g., Parent, Caregiver, Friend"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'permissions',
      title: 'App Permissions',
      description: 'Allow Adaptalyfe to help you better',
      component: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            These permissions help Adaptalyfe provide better support. You can change these anytime in settings.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Camera className="w-5 h-5 text-blue-500" />
                <div>
                  <Label>Camera Access</Label>
                  <p className="text-sm text-gray-500">Take photos for visual task guides</p>
                </div>
              </div>
              <Badge variant="secondary">Optional</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-green-500" />
                <div>
                  <Label>Location Services</Label>
                  <p className="text-sm text-gray-500">Safety features and location reminders</p>
                </div>
              </div>
              <Switch
                checked={preferences.privacy.locationSharing}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, locationSharing: checked }
                  }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-500" />
                <div>
                  <Label>Caregiver Access</Label>
                  <p className="text-sm text-gray-500">Allow caregivers to monitor progress</p>
                </div>
              </div>
              <Switch
                checked={preferences.privacy.caregiverAccess}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, caregiverAccess: checked }
                  }))
                }
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Adaptalyfe is ready to help you build independence',
      component: (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <p className="text-gray-600">
            Your preferences have been saved. You can change any of these settings 
            later in the app's settings menu.
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-800">Quick Access</p>
              <p className="text-blue-600">Press the emergency button anytime</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="font-medium text-green-800">AdaptAI Assistant</p>
              <p className="text-green-600">Your AI helper is ready</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const canProceed = () => {
    const currentStepData = steps[currentStep];
    if (currentStepData.required && currentStepData.id === 'emergency') {
      return preferences.emergencyContact.name && 
             preferences.emergencyContact.phone && 
             preferences.emergencyContact.relationship;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Save preferences to localStorage and potentially to backend
      localStorage.setItem('adaptalyfe_onboarding_completed', 'true');
      localStorage.setItem('adaptalyfe_user_preferences', JSON.stringify(preferences));
      
      // Apply accessibility settings immediately
      if (preferences.accessibility.highContrast) {
        document.documentElement.classList.add('high-contrast');
      }
      if (preferences.accessibility.largeText) {
        document.documentElement.classList.add('large-text');
      }
      
      toast({
        title: "Welcome to SkillBridge!",
        description: "Your preferences have been saved successfully.",
      });
      
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Setup Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{steps[currentStep].title}</DialogTitle>
          <DialogDescription>{steps[currentStep].description}</DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center justify-center mb-6">
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index === currentStep 
                    ? 'bg-blue-600' 
                    : index < currentStep 
                    ? 'bg-green-500' 
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            {steps[currentStep].component}
          </CardContent>
        </Card>
        
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          {currentStep === steps.length - 1 ? (
            <Button onClick={handleComplete}>
              Complete Setup
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}