import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings, Palette, Volume2, Bell, Shield, Zap, Star, HelpCircle, Save, RotateCcw, Lock, MapPin, AlertTriangle, Heart, Phone, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    theme: 'light',
    fontSize: 16,
    highContrast: false,
    voiceEnabled: true,
    voiceSpeed: 1.0,
    notificationsEnabled: true,
    reminderTiming: '15',
    quickActionsEnabled: true,
    premiumFeatures: false,
    autoSave: true,
    privacyMode: false,
    locationTracking: true,
    emergencyAlerts: true,
    caregiverAccess: true,
    medicalDataSharing: true,
    automaticCheckIns: true
  });

  // Get current user for locked settings checks
  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });
  
  // Mock locked settings data - in real app this would come from API
  const lockedSettings = {
    locationTracking: { isLocked: true, lockedBy: "Mom (Primary Caregiver)", reason: "Safety - Elopement Risk" },
    emergencyAlerts: { isLocked: true, lockedBy: "Dr. Sarah Johnson", reason: "Medical Supervision Required" },
    caregiverAccess: { isLocked: false, lockedBy: "", reason: "" },
    medicalDataSharing: { isLocked: true, lockedBy: "Case Manager", reason: "Treatment Coordination" },
    automaticCheckIns: { isLocked: false, lockedBy: "", reason: "" }
  };

  const handleSave = () => {
    localStorage.setItem('user-settings', JSON.stringify(settings));
    toast({
      title: "Settings Saved",
      description: "Your preferences have been saved successfully.",
    });
  };

  const handleReset = () => {
    setSettings({
      theme: 'light',
      fontSize: 16,
      highContrast: false,
      voiceEnabled: true,
      voiceSpeed: 1.0,
      notificationsEnabled: true,
      reminderTiming: '15',
      quickActionsEnabled: true,
      premiumFeatures: false,
      autoSave: true,
      privacyMode: false,
      locationTracking: true,
      emergencyAlerts: true,
      caregiverAccess: true,
      medicalDataSharing: true,
      automaticCheckIns: true
    });
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults.",
    });
  };

  const updateSetting = (key: string, value: any) => {
    // Check if setting is locked
    if (lockedSettings[key as keyof typeof lockedSettings]?.isLocked) {
      toast({
        title: "Setting Locked",
        description: `This setting has been locked by ${lockedSettings[key as keyof typeof lockedSettings]?.lockedBy} for your safety and wellbeing.`,
        variant: "destructive"
      });
      return;
    }
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const renderLockedSetting = (settingKey: string, label: string, icon: React.ReactNode, isEnabled: boolean, onToggle: () => void) => {
    const lockInfo = lockedSettings[settingKey as keyof typeof lockedSettings];
    const isLocked = lockInfo?.isLocked;

    return (
      <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
        isEnabled && !isLocked
          ? 'bg-white border-green-400 shadow-md' 
          : isLocked
            ? 'bg-gray-100 border-gray-400 opacity-75'
            : 'bg-white border-gray-300 opacity-75'
      }`}>
        <Label htmlFor={settingKey} className="flex items-center gap-2">
          {icon}
          {label}
          {isEnabled && !isLocked && (
            <Badge variant="secondary" className="bg-green-200 text-green-900 text-xs font-bold px-2 py-1">
              ACTIVE
            </Badge>
          )}
          {isLocked && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    <Lock className="w-3 h-3 mr-1" />
                    LOCKED
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <div className="font-semibold">Locked by: {lockInfo?.lockedBy}</div>
                    <div className="text-muted-foreground">{lockInfo?.reason}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Label>
        <Switch
          id={settingKey}
          checked={isEnabled}
          onCheckedChange={onToggle}
          disabled={isLocked}
          className={`scale-125 ${
            isLocked 
              ? "opacity-60 cursor-not-allowed bg-gray-400" 
              : isEnabled 
                ? 'data-[state=checked]:bg-green-600 shadow-lg shadow-green-200' 
                : 'bg-gray-300 opacity-60'
          }`}
        />
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Settings className="w-8 h-8 text-purple-600" />
          Settings & Customization
        </h1>
        <p className="text-gray-600">
          Personalize your AdaptaLyfe experience with accessibility options, themes, and feature preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-blue-600" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel of your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={settings.theme} onValueChange={(value) => updateSetting('theme', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Font Size: {settings.fontSize}px</Label>
              <Slider
                value={[settings.fontSize]}
                onValueChange={(value) => updateSetting('fontSize', value[0])}
                min={12}
                max={24}
                step={1}
                className="w-full"
              />
            </div>

            <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
              settings.highContrast 
                ? 'bg-yellow-100 border-yellow-300 shadow-md' 
                : 'bg-white border-gray-300 opacity-75'
            }`}>
              <Label htmlFor="high-contrast" className="flex items-center gap-2">
                <Eye className={`w-4 h-4 ${settings.highContrast ? 'text-yellow-600' : 'text-gray-400'}`} />
                High Contrast Mode
                {settings.highContrast && (
                  <Badge variant="secondary" className="bg-yellow-200 text-yellow-900 text-xs font-bold px-2 py-1">
                    ACTIVE
                  </Badge>
                )}
              </Label>
              <Switch
                id="high-contrast"
                checked={settings.highContrast}
                onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                className={`scale-125 ${
                  settings.highContrast 
                    ? 'data-[state=checked]:bg-yellow-600 shadow-lg shadow-yellow-200' 
                    : 'bg-gray-300 opacity-60'
                }`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Safety & Emergency Settings */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              Safety & Emergency Settings
            </CardTitle>
            <CardDescription>Critical safety features managed by your care team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderLockedSetting(
              'locationTracking',
              'Location Tracking',
              <MapPin className="w-4 h-4 text-red-500" />,
              settings.locationTracking,
              () => updateSetting('locationTracking', !settings.locationTracking)
            )}

            {renderLockedSetting(
              'emergencyAlerts',
              'Emergency Alerts',
              <AlertTriangle className="w-4 h-4 text-red-500" />,
              settings.emergencyAlerts,
              () => updateSetting('emergencyAlerts', !settings.emergencyAlerts)
            )}

            {renderLockedSetting(
              'automaticCheckIns',
              'Automatic Check-ins',
              <Heart className="w-4 h-4 text-red-500" />,
              settings.automaticCheckIns,
              () => updateSetting('automaticCheckIns', !settings.automaticCheckIns)
            )}
          </CardContent>
        </Card>

        {/* Privacy & Access Settings */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Privacy & Caregiver Access
            </CardTitle>
            <CardDescription>Control what information caregivers can access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderLockedSetting(
              'medicalDataSharing',
              'Medical Data Sharing',
              <Heart className="w-4 h-4 text-purple-500" />,
              settings.medicalDataSharing,
              () => updateSetting('medicalDataSharing', !settings.medicalDataSharing)
            )}

            {renderLockedSetting(
              'caregiverAccess',
              'Caregiver Dashboard Access',
              <Phone className="w-4 h-4 text-purple-500" />,
              settings.caregiverAccess,
              () => updateSetting('caregiverAccess', !settings.caregiverAccess)
            )}

            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-sm">Why are some settings locked?</span>
              </div>
              <p className="text-xs text-gray-600">
                Your caregivers have locked certain safety-critical settings to ensure your wellbeing. 
                This is especially important for individuals who may be at risk of wandering or have medical conditions requiring supervision.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Voice & Audio Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-green-600" />
              Voice & Audio
            </CardTitle>
            <CardDescription>Configure speech and audio preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
              settings.voiceEnabled 
                ? 'bg-green-100 border-green-300 shadow-md' 
                : 'bg-white border-gray-300 opacity-75'
            }`}>
              <Label htmlFor="voice-enabled" className="flex items-center gap-2">
                <Volume2 className={`w-4 h-4 ${settings.voiceEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                Enable Voice Commands
                {settings.voiceEnabled && (
                  <Badge variant="secondary" className="bg-green-200 text-green-900 text-xs font-bold px-2 py-1">
                    ACTIVE
                  </Badge>
                )}
              </Label>
              <Switch
                id="voice-enabled"
                checked={settings.voiceEnabled}
                onCheckedChange={(checked) => updateSetting('voiceEnabled', checked)}
                className={`scale-125 ${
                  settings.voiceEnabled 
                    ? 'data-[state=checked]:bg-green-600 shadow-lg shadow-green-200' 
                    : 'bg-gray-300 opacity-60'
                }`}
              />
            </div>

            <div className="space-y-2">
              <Label>Voice Speed: {settings.voiceSpeed}x</Label>
              <Slider
                value={[settings.voiceSpeed]}
                onValueChange={(value) => updateSetting('voiceSpeed', value[0])}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>

            <Button 
              onClick={() => {
                if ('speechSynthesis' in window) {
                  const utterance = new SpeechSynthesisUtterance("This is a test of the voice settings at the current speed.");
                  utterance.rate = settings.voiceSpeed;
                  speechSynthesis.speak(utterance);
                }
              }}
              variant="outline"
              className="w-full"
            >
              Test Voice Settings
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-600" />
              Notifications
            </CardTitle>
            <CardDescription>Manage alerts and reminders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
              settings.notificationsEnabled 
                ? 'bg-green-100 border-green-300 shadow-md' 
                : 'bg-white border-gray-300 opacity-75'
            }`}>
              <Label htmlFor="notifications" className="flex items-center gap-2">
                <Bell className={`w-4 h-4 ${settings.notificationsEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                Enable Notifications
                {settings.notificationsEnabled && (
                  <Badge variant="secondary" className="bg-green-200 text-green-900 text-xs font-bold px-2 py-1">
                    ACTIVE
                  </Badge>
                )}
              </Label>
              <Switch
                id="notifications"
                checked={settings.notificationsEnabled}
                onCheckedChange={(checked) => updateSetting('notificationsEnabled', checked)}
                className={`scale-125 ${
                  settings.notificationsEnabled 
                    ? 'data-[state=checked]:bg-green-600 shadow-lg shadow-green-200' 
                    : 'bg-gray-300 opacity-60'
                }`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder-timing">Default Reminder Time</Label>
              <Select value={settings.reminderTiming} onValueChange={(value) => updateSetting('reminderTiming', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes before</SelectItem>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="30">30 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Feature Settings */}
        <Card className="border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600" />
              Features
            </CardTitle>
            <CardDescription>Enable or disable specific features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
              settings.quickActionsEnabled 
                ? 'bg-blue-100 border-blue-300 shadow-md' 
                : 'bg-white border-gray-300 opacity-75'
            }`}>
              <Label htmlFor="quick-actions" className="flex items-center gap-2">
                <Zap className={`w-4 h-4 ${settings.quickActionsEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
                Quick Actions Bar
                {settings.quickActionsEnabled && (
                  <Badge variant="secondary" className="bg-blue-200 text-blue-900 text-xs font-bold px-2 py-1">
                    ACTIVE
                  </Badge>
                )}
              </Label>
              <Switch
                id="quick-actions"
                checked={settings.quickActionsEnabled}
                onCheckedChange={(checked) => updateSetting('quickActionsEnabled', checked)}
                className={`scale-125 ${
                  settings.quickActionsEnabled 
                    ? 'data-[state=checked]:bg-blue-600 shadow-lg shadow-blue-200' 
                    : 'bg-gray-300 opacity-60'
                }`}
              />
            </div>

            <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
              settings.premiumFeatures 
                ? 'bg-purple-100 border-purple-300 shadow-md' 
                : 'bg-white border-gray-300 opacity-75'
            }`}>
              <Label htmlFor="premium-features" className="flex items-center gap-2">
                <Star className={`w-4 h-4 ${settings.premiumFeatures ? 'text-purple-600' : 'text-gray-400'}`} />
                Premium Features
                {settings.premiumFeatures && (
                  <Badge variant="secondary" className="bg-purple-200 text-purple-900 text-xs font-bold px-2 py-1">
                    ACTIVE
                  </Badge>
                )}
              </Label>
              <Switch
                id="premium-features"
                checked={settings.premiumFeatures}
                onCheckedChange={(checked) => updateSetting('premiumFeatures', checked)}
                className={`scale-125 ${
                  settings.premiumFeatures 
                    ? 'data-[state=checked]:bg-purple-600 shadow-lg shadow-purple-200' 
                    : 'bg-gray-300 opacity-60'
                }`}
              />
            </div>

            <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
              settings.autoSave 
                ? 'bg-emerald-100 border-emerald-300 shadow-md' 
                : 'bg-white border-gray-300 opacity-75'
            }`}>
              <Label htmlFor="auto-save" className="flex items-center gap-2">
                <Save className={`w-4 h-4 ${settings.autoSave ? 'text-emerald-600' : 'text-gray-400'}`} />
                Auto-save Changes
                {settings.autoSave && (
                  <Badge variant="secondary" className="bg-emerald-200 text-emerald-900 text-xs font-bold px-2 py-1">
                    ACTIVE
                  </Badge>
                )}
              </Label>
              <Switch
                id="auto-save"
                checked={settings.autoSave}
                onCheckedChange={(checked) => updateSetting('autoSave', checked)}
                className={`scale-125 ${
                  settings.autoSave 
                    ? 'data-[state=checked]:bg-emerald-600 shadow-lg shadow-emerald-200' 
                    : 'bg-gray-300 opacity-60'
                }`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              Privacy & Security
            </CardTitle>
            <CardDescription>Control your privacy and data settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
              settings.privacyMode 
                ? 'bg-red-100 border-red-300 shadow-md' 
                : 'bg-white border-gray-300 opacity-75'
            }`}>
              <Label htmlFor="privacy-mode" className="flex items-center gap-2">
                <Shield className={`w-4 h-4 ${settings.privacyMode ? 'text-red-600' : 'text-gray-400'}`} />
                Privacy Mode
                {settings.privacyMode && (
                  <Badge variant="secondary" className="bg-red-200 text-red-900 text-xs font-bold px-2 py-1">
                    ACTIVE
                  </Badge>
                )}
              </Label>
              <Switch
                id="privacy-mode"
                checked={settings.privacyMode}
                onCheckedChange={(checked) => updateSetting('privacyMode', checked)}
                className={`scale-125 ${
                  settings.privacyMode 
                    ? 'data-[state=checked]:bg-red-600 shadow-lg shadow-red-200' 
                    : 'bg-gray-300 opacity-60'
                }`}
              />
            </div>

            <div className="text-sm text-gray-600">
              Privacy mode hides sensitive information in screenshots and when screen sharing.
            </div>

            <Button variant="outline" className="w-full">
              <Shield className="w-4 h-4 mr-2" />
              View Privacy Policy
            </Button>
          </CardContent>
        </Card>

        {/* Help & Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-600" />
              Help & Support
            </CardTitle>
            <CardDescription>Get help and learn about features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <HelpCircle className="w-4 h-4 mr-2" />
              View User Guide
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <Volume2 className="w-4 h-4 mr-2" />
              Accessibility Tutorial
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <Star className="w-4 h-4 mr-2" />
              Feature Walkthrough
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-between">
        <Button onClick={handleReset} variant="outline" className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          Reset to Defaults
        </Button>
        
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}