import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Lock, Shield, AlertCircle, MapPin, Heart, DollarSign, Phone, Bell } from "lucide-react";

interface ProtectedUserSettingsProps {
  userId: number;
}

const settingsCategories = [
  {
    key: "safety",
    name: "Safety & Location",
    icon: Shield,
    settings: [
      {
        key: "location_sharing",
        name: "Location Sharing",
        description: "Share your location with caregivers",
        defaultValue: true,
        icon: MapPin
      },
      {
        key: "emergency_contacts",
        name: "Emergency Contacts Access",
        description: "Allow caregivers to access emergency contacts",
        defaultValue: true,
        icon: Phone
      },
      {
        key: "safety_alerts",
        name: "Safety Alerts",
        description: "Receive alerts for unusual activity",
        defaultValue: true,
        icon: AlertCircle
      }
    ]
  },
  {
    key: "health",
    name: "Health & Medical",
    icon: Heart,
    settings: [
      {
        key: "medication_reminders",
        name: "Medication Reminders",
        description: "Get notified when it's time to take medication",
        defaultValue: true,
        icon: Bell
      },
      {
        key: "appointment_notifications",
        name: "Appointment Notifications",
        description: "Receive reminders for medical appointments",
        defaultValue: true,
        icon: Bell
      }
    ]
  },
  {
    key: "financial",
    name: "Financial",
    icon: DollarSign,
    settings: [
      {
        key: "financial_monitoring",
        name: "Financial Monitoring",
        description: "Allow oversight of budgets and bills",
        defaultValue: false,
        icon: DollarSign
      }
    ]
  }
];

export default function ProtectedUserSettings({ userId }: ProtectedUserSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userSettings, setUserSettings] = useState<Record<string, boolean>>({});

  // Fetch locked settings
  const { data: lockedSettings = [], isLoading: lockedLoading } = useQuery({
    queryKey: ["/api/locked-settings", userId],
    queryFn: () => apiRequest("GET", `/api/locked-settings/${userId}`).then(res => res.json())
  });

  // Initialize user settings with defaults
  useEffect(() => {
    const initialSettings: Record<string, boolean> = {};
    settingsCategories.forEach(category => {
      category.settings.forEach(setting => {
        initialSettings[setting.key] = setting.defaultValue;
      });
    });
    setUserSettings(initialSettings);
  }, []);

  // Function to check if a setting is locked
  const isSettingLocked = (settingKey: string) => {
    return lockedSettings.some((ls: any) => ls.settingKey === settingKey && ls.isLocked);
  };

  // Function to get locked setting details
  const getLockedSetting = (settingKey: string) => {
    return lockedSettings.find((ls: any) => ls.settingKey === settingKey);
  };

  // Function to check if user can view a locked setting
  const canUserViewSetting = (settingKey: string) => {
    const lockedSetting = getLockedSetting(settingKey);
    return !lockedSetting || lockedSetting.canUserView;
  };

  // Handle setting change with lock checking
  const handleSettingChange = (settingKey: string, value: boolean) => {
    if (isSettingLocked(settingKey)) {
      toast({
        title: "Setting Locked",
        description: "This setting has been locked by your caregiver for safety reasons.",
        variant: "destructive",
      });
      return;
    }

    setUserSettings(prev => ({
      ...prev,
      [settingKey]: value
    }));

    // Here you would normally save to the backend
    toast({
      title: "Setting Updated",
      description: `${settingKey.replace('_', ' ')} has been ${value ? 'enabled' : 'disabled'}.`,
    });
  };

  const getEffectiveSettingValue = (settingKey: string) => {
    const locked = getLockedSetting(settingKey);
    if (locked) {
      return locked.settingValue === 'enabled' || locked.settingValue === 'true';
    }
    return userSettings[settingKey];
  };

  if (lockedLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Safety Settings
          </CardTitle>
          <CardDescription>
            Manage your privacy and safety preferences. Some settings may be locked by your caregiver for safety.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {settingsCategories.map((category) => {
            const CategoryIcon = category.icon;
            
            return (
              <div key={category.key}>
                <div className="flex items-center gap-2 mb-4">
                  <CategoryIcon className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">{category.name}</h3>
                </div>
                
                <div className="grid gap-4">
                  {category.settings.map((setting) => {
                    const SettingIcon = setting.icon;
                    const locked = isSettingLocked(setting.key);
                    const canView = canUserViewSetting(setting.key);
                    const effectiveValue = getEffectiveSettingValue(setting.key);
                    const lockedSetting = getLockedSetting(setting.key);
                    
                    if (!canView) {
                      return null; // Hide settings that user cannot view
                    }
                    
                    return (
                      <Card key={setting.key} className={`p-4 ${locked ? 'border-red-200 bg-red-50' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <SettingIcon className="h-4 w-4" />
                              <h4 className="font-medium">{setting.name}</h4>
                              {locked && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <Lock className="h-3 w-3" />
                                  Locked
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{setting.description}</p>
                            {locked && lockedSetting?.lockReason && (
                              <div className="text-xs text-red-600 bg-red-100 p-2 rounded">
                                <strong>Locked by caregiver:</strong> {lockedSetting.lockReason}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={effectiveValue}
                              onCheckedChange={(value) => handleSettingChange(setting.key, value)}
                              disabled={locked}
                            />
                            {locked && <Lock className="h-4 w-4 text-red-500" />}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                
                {category !== settingsCategories[settingsCategories.length - 1] && (
                  <Separator className="mt-6" />
                )}
              </div>
            );
          })}
          
          {/* Information about locked settings */}
          {lockedSettings.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">Some Settings Are Protected</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Your caregiver has locked {lockedSettings.length} setting{lockedSettings.length !== 1 ? 's' : ''} for your safety and well-being. 
                      If you need to change these settings, please talk to your caregiver.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}