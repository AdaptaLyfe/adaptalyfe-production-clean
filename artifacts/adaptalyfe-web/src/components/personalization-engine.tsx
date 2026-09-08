import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Settings, Palette, Type, Volume2, Eye, Brain, 
  Clock, Target, Zap, User, Save, RotateCcw 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface PersonalizationSettings {
  themeSettings: {
    colorScheme: string;
    fontSize: number;
    highContrast: boolean;
    reducedMotion: boolean;
    compactMode: boolean;
  };
  accessibilitySettings: {
    screenReader: boolean;
    voiceGuidance: boolean;
    keyboardNavigation: boolean;
    focusIndicators: boolean;
    textToSpeech: boolean;
    speechRate: number;
    voiceVolume: number;
  };
  behaviorPatterns: {
    preferredTaskTime: string;
    reminderStyle: string;
    motivationLevel: string;
    complexityPreference: string;
    supportLevel: string;
  };
  adaptiveFeatures: {
    smartReminders: boolean;
    contextualHelp: boolean;
    progressPrediction: boolean;
    moodBasedSuggestions: boolean;
    energyLevelAdjustments: boolean;
  };
}

interface UserInsights {
  mostActiveTimeOfDay: string;
  averageSessionLength: number;
  preferredCategories: string[];
  completionPatterns: any[];
  strugglingAreas: string[];
  strengths: string[];
  adaptationSuggestions: string[];
}

export function PersonalizationEngine() {
  const [activeTab, setActiveTab] = useState("appearance");
  const [previewMode, setPreviewMode] = useState(false);
  const [tempSettings, setTempSettings] = useState<PersonalizationSettings | null>(null);
  
  const { toast } = useToast();

  // Fetch current personalization settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/user-preferences']
  });

  // Fetch user insights
  const { data: insights } = useQuery({
    queryKey: ['/api/user-behavior-insights']
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<PersonalizationSettings>) => {
      return await apiRequest('PUT', '/api/user-preferences', newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-preferences'] });
      toast({
        title: "Settings Updated",
        description: "Your personalization preferences have been saved."
      });
      setPreviewMode(false);
      setTempSettings(null);
    }
  });

  // Reset to defaults mutation
  const resetSettingsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', '/api/user-preferences/reset');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-preferences'] });
      toast({
        title: "Settings Reset",
        description: "All settings have been restored to defaults."
      });
    }
  });

  const currentSettings = tempSettings || settings || {};

  useEffect(() => {
    // Apply preview settings to document
    if (previewMode && tempSettings) {
      applySettingsToDocument(tempSettings);
    }
  }, [previewMode, tempSettings]);

  const applySettingsToDocument = (settings: PersonalizationSettings) => {
    const root = document.documentElement;
    
    // Apply theme settings
    if (settings.themeSettings) {
      root.style.fontSize = `${settings.themeSettings.fontSize}px`;
      root.classList.toggle('high-contrast', settings.themeSettings.highContrast);
      root.classList.toggle('reduced-motion', settings.themeSettings.reducedMotion);
      root.classList.toggle('compact-mode', settings.themeSettings.compactMode);
      
      // Apply color scheme
      root.setAttribute('data-theme', settings.themeSettings.colorScheme);
    }
  };

  const updateSetting = (category: keyof PersonalizationSettings, key: string, value: any) => {
    const newSettings = {
      ...currentSettings,
      [category]: {
        ...currentSettings[category],
        [key]: value
      }
    };
    
    if (previewMode) {
      setTempSettings(newSettings);
    } else {
      updateSettingsMutation.mutate({ [category]: newSettings[category] });
    }
  };

  const saveSettings = () => {
    if (tempSettings) {
      updateSettingsMutation.mutate(tempSettings);
    }
  };

  const cancelPreview = () => {
    setPreviewMode(false);
    setTempSettings(null);
    // Reset document to original settings
    if (settings) {
      applySettingsToDocument(settings);
    }
  };

  const colorSchemes = [
    { id: 'default', name: 'Default Blue', preview: 'bg-blue-500' },
    { id: 'green', name: 'Calming Green', preview: 'bg-green-500' },
    { id: 'purple', name: 'Focus Purple', preview: 'bg-purple-500' },
    { id: 'orange', name: 'Energizing Orange', preview: 'bg-orange-500' },
    { id: 'teal', name: 'Peaceful Teal', preview: 'bg-teal-500' },
    { id: 'warm', name: 'Warm Earth', preview: 'bg-amber-600' }
  ];

  const reminderStyles = [
    { id: 'gentle', name: 'Gentle Reminders', description: 'Soft notifications that don\'t interrupt' },
    { id: 'standard', name: 'Standard Alerts', description: 'Regular notification style' },
    { id: 'urgent', name: 'Clear & Direct', description: 'More prominent notifications' }
  ];

  const motivationLevels = [
    { id: 'low', name: 'Minimal Motivation', description: 'Simple confirmations' },
    { id: 'moderate', name: 'Encouraging', description: 'Positive reinforcement' },
    { id: 'high', name: 'Enthusiastic', description: 'Celebrations and achievements' }
  ];

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Personalization Engine
            <Badge variant="outline" className="ml-auto">
              AI-Powered Adaptation
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Customize AdaptaLyfe to match your preferences and needs. Our AI learns from your usage patterns to provide personalized suggestions.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch 
                checked={previewMode}
                onCheckedChange={setPreviewMode}
              />
              <label className="text-sm font-medium">Preview Mode</label>
            </div>
            
            {previewMode && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={saveSettings}
                  disabled={!tempSettings}
                  className="flex items-center gap-1"
                >
                  <Save className="h-3 w-3" />
                  Save Changes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelPreview}
                >
                  Cancel
                </Button>
              </div>
            )}
            
            <Button
              size="sm"
              variant="destructive"
              onClick={() => resetSettingsMutation.mutate()}
              className="ml-auto flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      {insights && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              AI Insights & Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">
                  {insights.mostActiveTimeOfDay || 'Learning...'}
                </div>
                <p className="text-sm text-purple-700">Peak Activity Time</p>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {insights.averageSessionLength || 0} min
                </div>
                <p className="text-sm text-blue-700">Average Session</p>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {insights.preferredCategories?.length || 0}
                </div>
                <p className="text-sm text-green-700">Favorite Categories</p>
              </div>
            </div>
            
            {insights.adaptationSuggestions?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Personalized Recommendations:</h4>
                <div className="space-y-1">
                  {insights.adaptationSuggestions.slice(0, 3).map((suggestion: string, index: number) => (
                    <p key={index} className="text-sm text-gray-700 flex items-center gap-2">
                      <Target className="h-3 w-3 text-purple-500" />
                      {suggestion}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="accessibility" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Accessibility
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Behavior
          </TabsTrigger>
          <TabsTrigger value="adaptive" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Features
          </TabsTrigger>
        </TabsList>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visual Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Color Scheme */}
              <div>
                <label className="text-sm font-medium mb-3 block">Color Scheme</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {colorSchemes.map((scheme) => (
                    <Button
                      key={scheme.id}
                      variant={currentSettings.themeSettings?.colorScheme === scheme.id ? "default" : "outline"}
                      onClick={() => updateSetting('themeSettings', 'colorScheme', scheme.id)}
                      className="flex items-center gap-2 justify-start"
                    >
                      <div className={`w-4 h-4 rounded-full ${scheme.preview}`}></div>
                      {scheme.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="text-sm font-medium mb-3 block">Text Size</label>
                <div className="space-y-2">
                  <Slider
                    value={[currentSettings.themeSettings?.fontSize || 16]}
                    onValueChange={([value]) => updateSetting('themeSettings', 'fontSize', value)}
                    min={12}
                    max={24}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>12px</span>
                    <span>Current: {currentSettings.themeSettings?.fontSize || 16}px</span>
                    <span>24px</span>
                  </div>
                </div>
              </div>

              {/* Visual Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">High Contrast</label>
                    <p className="text-xs text-gray-600">Increases contrast for better visibility</p>
                  </div>
                  <Switch 
                    checked={currentSettings.themeSettings?.highContrast || false}
                    onCheckedChange={(checked) => updateSetting('themeSettings', 'highContrast', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Reduced Motion</label>
                    <p className="text-xs text-gray-600">Minimizes animations and transitions</p>
                  </div>
                  <Switch 
                    checked={currentSettings.themeSettings?.reducedMotion || false}
                    onCheckedChange={(checked) => updateSetting('themeSettings', 'reducedMotion', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Compact Mode</label>
                    <p className="text-xs text-gray-600">Reduces spacing for more content</p>
                  </div>
                  <Switch 
                    checked={currentSettings.themeSettings?.compactMode || false}
                    onCheckedChange={(checked) => updateSetting('themeSettings', 'compactMode', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accessibility Settings */}
        <TabsContent value="accessibility" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Voice & Audio */}
              <div>
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Voice & Audio
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Text-to-Speech</label>
                      <p className="text-xs text-gray-600">Read content aloud</p>
                    </div>
                    <Switch 
                      checked={currentSettings.accessibilitySettings?.textToSpeech || false}
                      onCheckedChange={(checked) => updateSetting('accessibilitySettings', 'textToSpeech', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Voice Guidance</label>
                      <p className="text-xs text-gray-600">Audio instructions and confirmations</p>
                    </div>
                    <Switch 
                      checked={currentSettings.accessibilitySettings?.voiceGuidance || false}
                      onCheckedChange={(checked) => updateSetting('accessibilitySettings', 'voiceGuidance', checked)}
                    />
                  </div>

                  {/* Speech Rate */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Speech Rate</label>
                    <Slider
                      value={[currentSettings.accessibilitySettings?.speechRate || 1]}
                      onValueChange={([value]) => updateSetting('accessibilitySettings', 'speechRate', value)}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Slow</span>
                      <span>Normal</span>
                      <span>Fast</span>
                    </div>
                  </div>

                  {/* Volume */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Voice Volume</label>
                    <Slider
                      value={[currentSettings.accessibilitySettings?.voiceVolume || 0.8]}
                      onValueChange={([value]) => updateSetting('accessibilitySettings', 'voiceVolume', value)}
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div>
                <h4 className="font-medium mb-4">Navigation & Interaction</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Enhanced Keyboard Navigation</label>
                      <p className="text-xs text-gray-600">Better keyboard shortcuts and focus</p>
                    </div>
                    <Switch 
                      checked={currentSettings.accessibilitySettings?.keyboardNavigation || false}
                      onCheckedChange={(checked) => updateSetting('accessibilitySettings', 'keyboardNavigation', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Clear Focus Indicators</label>
                      <p className="text-xs text-gray-600">Prominent focus outlines</p>
                    </div>
                    <Switch 
                      checked={currentSettings.accessibilitySettings?.focusIndicators || false}
                      onCheckedChange={(checked) => updateSetting('accessibilitySettings', 'focusIndicators', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Screen Reader Support</label>
                      <p className="text-xs text-gray-600">Enhanced compatibility with screen readers</p>
                    </div>
                    <Switch 
                      checked={currentSettings.accessibilitySettings?.screenReader || false}
                      onCheckedChange={(checked) => updateSetting('accessibilitySettings', 'screenReader', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Behavior Settings */}
        <TabsContent value="behavior" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Behavioral Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Reminder Style */}
              <div>
                <label className="text-sm font-medium mb-3 block">Reminder Style</label>
                <div className="space-y-2">
                  {reminderStyles.map((style) => (
                    <Button
                      key={style.id}
                      variant={currentSettings.behaviorPatterns?.reminderStyle === style.id ? "default" : "outline"}
                      onClick={() => updateSetting('behaviorPatterns', 'reminderStyle', style.id)}
                      className="w-full justify-start text-left"
                    >
                      <div>
                        <div className="font-medium">{style.name}</div>
                        <div className="text-xs opacity-75">{style.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Motivation Level */}
              <div>
                <label className="text-sm font-medium mb-3 block">Motivation Level</label>
                <div className="space-y-2">
                  {motivationLevels.map((level) => (
                    <Button
                      key={level.id}
                      variant={currentSettings.behaviorPatterns?.motivationLevel === level.id ? "default" : "outline"}
                      onClick={() => updateSetting('behaviorPatterns', 'motivationLevel', level.id)}
                      className="w-full justify-start text-left"
                    >
                      <div>
                        <div className="font-medium">{level.name}</div>
                        <div className="text-xs opacity-75">{level.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Other Preferences */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Task Complexity Preference</label>
                  <Select
                    value={currentSettings.behaviorPatterns?.complexityPreference || "moderate"}
                    onValueChange={(value) => updateSetting('behaviorPatterns', 'complexityPreference', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple tasks first</SelectItem>
                      <SelectItem value="moderate">Balanced approach</SelectItem>
                      <SelectItem value="challenging">Challenge me more</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Support Level</label>
                  <Select
                    value={currentSettings.behaviorPatterns?.supportLevel || "standard"}
                    onValueChange={(value) => updateSetting('behaviorPatterns', 'supportLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">Minimal guidance</SelectItem>
                      <SelectItem value="standard">Standard support</SelectItem>
                      <SelectItem value="enhanced">Enhanced assistance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Adaptive Features */}
        <TabsContent value="adaptive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Adaptive Features</CardTitle>
              <p className="text-sm text-gray-600">
                Let our AI learn from your patterns to provide personalized support
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Smart Reminders</label>
                  <p className="text-xs text-gray-600">AI-timed reminders based on your patterns</p>
                </div>
                <Switch 
                  checked={currentSettings.adaptiveFeatures?.smartReminders || false}
                  onCheckedChange={(checked) => updateSetting('adaptiveFeatures', 'smartReminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Contextual Help</label>
                  <p className="text-xs text-gray-600">Personalized assistance based on your needs</p>
                </div>
                <Switch 
                  checked={currentSettings.adaptiveFeatures?.contextualHelp || false}
                  onCheckedChange={(checked) => updateSetting('adaptiveFeatures', 'contextualHelp', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Progress Prediction</label>
                  <p className="text-xs text-gray-600">AI predictions for task completion and goals</p>
                </div>
                <Switch 
                  checked={currentSettings.adaptiveFeatures?.progressPrediction || false}
                  onCheckedChange={(checked) => updateSetting('adaptiveFeatures', 'progressPrediction', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Mood-Based Suggestions</label>
                  <p className="text-xs text-gray-600">Adapt recommendations based on your mood</p>
                </div>
                <Switch 
                  checked={currentSettings.adaptiveFeatures?.moodBasedSuggestions || false}
                  onCheckedChange={(checked) => updateSetting('adaptiveFeatures', 'moodBasedSuggestions', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Energy Level Adjustments</label>
                  <p className="text-xs text-gray-600">Adjust task difficulty based on your energy</p>
                </div>
                <Switch 
                  checked={currentSettings.adaptiveFeatures?.energyLevelAdjustments || false}
                  onCheckedChange={(checked) => updateSetting('adaptiveFeatures', 'energyLevelAdjustments', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}