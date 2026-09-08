import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Volume2, 
  Mic, 
  Eye, 
  Type, 
  Palette, 
  Settings, 
  Play, 
  Pause,
  VolumeX,
  Accessibility,
  MessageSquare,
  Sun,
  Moon
} from "lucide-react";

interface AccessibilitySettings {
  textToSpeechEnabled: boolean;
  voiceCommandsEnabled: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra_large';
  highContrastMode: boolean;
  simpleLanguageMode: boolean;
  speechRate: number;
  speechVolume: number;
  voiceGender: 'male' | 'female' | 'neutral';
}

export default function AccessibilitySettingsModule() {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    textToSpeechEnabled: false,
    voiceCommandsEnabled: false,
    fontSize: 'medium',
    highContrastMode: false,
    simpleLanguageMode: false,
    speechRate: 1.0,
    speechVolume: 0.8,
    voiceGender: 'neutral'
  });
  
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        
        if (event.results[event.results.length - 1].isFinal) {
          handleVoiceCommand(transcript.toLowerCase().trim());
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      setSynthesis(window.speechSynthesis);
    }

    // Load saved settings
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      applySettings(parsed);
    }
  };

  const saveSettings = (newSettings: AccessibilitySettings) => {
    localStorage.setItem('accessibility-settings', JSON.stringify(newSettings));
    setSettings(newSettings);
    applySettings(newSettings);
    
    toast({
      title: "Settings saved",
      description: "Your accessibility preferences have been updated.",
    });
  };

  const applySettings = (settings: AccessibilitySettings) => {
    // Apply font size
    const root = document.documentElement;
    switch (settings.fontSize) {
      case 'small':
        root.style.fontSize = '14px';
        break;
      case 'medium':
        root.style.fontSize = '16px';
        break;
      case 'large':
        root.style.fontSize = '18px';
        break;
      case 'extra_large':
        root.style.fontSize = '22px';
        break;
    }

    // Apply high contrast mode
    if (settings.highContrastMode) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    // Apply simple language mode class for conditional styling
    if (settings.simpleLanguageMode) {
      document.body.classList.add('simple-language');
    } else {
      document.body.classList.remove('simple-language');
    }
  };

  const handleVoiceCommand = (command: string) => {
    console.log('Voice command received:', command);
    
    // Basic voice commands
    if (command.includes('go to dashboard') || command.includes('dashboard')) {
      window.location.href = '/';
      speak("Navigating to dashboard");
    } else if (command.includes('go to tasks') || command.includes('tasks')) {
      window.location.href = '/daily-tasks';
      speak("Navigating to daily tasks");
    } else if (command.includes('go to calendar') || command.includes('calendar')) {
      window.location.href = '/calendar';
      speak("Navigating to calendar");
    } else if (command.includes('help') || command.includes('what can i say')) {
      speak("You can say: go to dashboard, go to tasks, go to calendar, read this page, or stop listening");
    } else if (command.includes('read this page') || command.includes('read page')) {
      readPageContent();
    } else if (command.includes('stop listening') || command.includes('stop voice')) {
      stopListening();
      speak("Voice commands disabled");
    } else {
      speak("I didn't understand that command. Say 'help' to hear available commands.");
    }
  };

  const speak = (text: string) => {
    if (!synthesis || !settings.textToSpeechEnabled) return;

    // Cancel any current speech
    synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.speechRate;
    utterance.volume = settings.speechVolume;
    
    // Set voice based on preference
    const voices = synthesis.getVoices();
    const preferredVoice = voices.find(voice => {
      if (settings.voiceGender === 'female') {
        return voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman');
      } else if (settings.voiceGender === 'male') {
        return voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('man');
      }
      return true;
    });
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesis.speak(utterance);
  };

  const readPageContent = () => {
    const mainContent = document.querySelector('main') || document.body;
    const textContent = mainContent.textContent || '';
    const cleanText = textContent
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?]/g, '')
      .trim();
    
    speak(`Reading page content: ${cleanText.slice(0, 500)}${cleanText.length > 500 ? '... and more' : ''}`);
  };

  const startListening = () => {
    if (!recognition) {
      toast({
        title: "Voice commands not supported",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive"
      });
      return;
    }

    try {
      recognition.start();
      setIsListening(true);
      speak("Voice commands activated. I'm listening.");
    } catch (error) {
      console.error('Error starting recognition:', error);
      toast({
        title: "Voice recognition error",
        description: "Could not start voice recognition. Please try again.",
        variant: "destructive"
      });
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);
  };

  const stopSpeaking = () => {
    if (synthesis) {
      synthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const testTextToSpeech = () => {
    // Test function that works regardless of the enabled setting
    if (!synthesis) {
      toast({
        title: "Speech not available",
        description: "Text-to-speech is not supported in this browser.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Cancel any current speech
      synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(
        "This is a test of the text to speech feature. You can adjust the speed and volume in the settings below."
      );
      
      utterance.rate = settings.speechRate;
      utterance.volume = settings.speechVolume;
      
      // Set voice based on preference
      const voices = synthesis.getVoices();
      const preferredVoice = voices.find(voice => {
        if (settings.voiceGender === 'female') {
          return voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman');
        } else if (settings.voiceGender === 'male') {
          return voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('man');
        }
        return true;
      });
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (event) => {
        setIsSpeaking(false);
        toast({
          title: "Speech error",
          description: "There was an error with text-to-speech. Please try again.",
          variant: "destructive"
        });
      };

      synthesis.speak(utterance);
      
      console.log("Test text-to-speech initiated");
    } catch (error) {
      console.error("Text-to-speech error:", error);
      toast({
        title: "Speech error",
        description: "Could not start text-to-speech. Please check your browser permissions.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Accessibility className="w-5 h-5 text-blue-500" />
          Accessibility Settings
        </CardTitle>
        <CardDescription>
          Customize the app to work best for your needs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Text-to-Speech Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-blue-500" />
              <Label className="text-base font-medium">Text-to-Speech</Label>
            </div>
            <Switch
              checked={settings.textToSpeechEnabled}
              onCheckedChange={(checked) =>
                saveSettings({ ...settings, textToSpeechEnabled: checked })
              }
            />
          </div>
          
          {settings.textToSpeechEnabled && (
            <div className="ml-6 space-y-4 border-l-2 border-blue-100 pl-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testTextToSpeech}
                  disabled={isSpeaking}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Test Voice
                </Button>
                {isSpeaking && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={stopSpeaking}
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Speech Rate</Label>
                  <Select
                    value={settings.speechRate.toString()}
                    onValueChange={(value) =>
                      saveSettings({ ...settings, speechRate: parseFloat(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">Very Slow</SelectItem>
                      <SelectItem value="0.75">Slow</SelectItem>
                      <SelectItem value="1">Normal</SelectItem>
                      <SelectItem value="1.25">Fast</SelectItem>
                      <SelectItem value="1.5">Very Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm">Voice Type</Label>
                  <Select
                    value={settings.voiceGender}
                    onValueChange={(value: 'male' | 'female' | 'neutral') =>
                      saveSettings({ ...settings, voiceGender: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neutral">Default</SelectItem>
                      <SelectItem value="female">Female Voice</SelectItem>
                      <SelectItem value="male">Male Voice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Voice Commands */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-green-500" />
              <Label className="text-base font-medium">Voice Commands</Label>
            </div>
            <Switch
              checked={settings.voiceCommandsEnabled}
              onCheckedChange={(checked) =>
                saveSettings({ ...settings, voiceCommandsEnabled: checked })
              }
            />
          </div>

          {settings.voiceCommandsEnabled && (
            <div className="ml-6 space-y-4 border-l-2 border-green-100 pl-4">
              <div className="flex gap-2">
                {!isListening ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startListening}
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Start Listening
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={stopListening}
                    className="border-red-200 text-red-600"
                  >
                    <VolumeX className="w-4 h-4 mr-2" />
                    Stop Listening
                  </Button>
                )}
                {isListening && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Listening...
                  </Badge>
                )}
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Available commands:</p>
                <ul className="space-y-1 text-xs">
                  <li>• "Go to dashboard" - Navigate to main page</li>
                  <li>• "Go to tasks" - Open daily tasks</li>
                  <li>• "Go to calendar" - Open calendar view</li>
                  <li>• "Read this page" - Read current page content</li>
                  <li>• "Help" - Hear available commands</li>
                  <li>• "Stop listening" - Disable voice commands</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Visual Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-purple-500" />
            <Label className="text-base font-medium">Visual Settings</Label>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-gray-500" />
                <Label>Font Size</Label>
              </div>
              <Select
                value={settings.fontSize}
                onValueChange={(value: 'small' | 'medium' | 'large' | 'extra_large') =>
                  saveSettings({ ...settings, fontSize: value })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="extra_large">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-gray-500" />
                <Label>High Contrast Mode</Label>
              </div>
              <Switch
                checked={settings.highContrastMode}
                onCheckedChange={(checked) =>
                  saveSettings({ ...settings, highContrastMode: checked })
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Language Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-orange-500" />
              <Label className="text-base font-medium">Simple Language Mode</Label>
            </div>
            <Switch
              checked={settings.simpleLanguageMode}
              onCheckedChange={(checked) =>
                saveSettings({ ...settings, simpleLanguageMode: checked })
              }
            />
          </div>
          
          {settings.simpleLanguageMode && (
            <div className="ml-6 text-sm text-gray-600 border-l-2 border-orange-100 pl-4">
              <p>When enabled, the app will use simpler words and shorter sentences to make content easier to understand.</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Quick Actions</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => speak("Welcome to Adaptalyfe. This app helps you build independence and manage daily tasks.")}
              disabled={!settings.textToSpeechEnabled}
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Read Welcome
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={readPageContent}
              disabled={!settings.textToSpeechEnabled}
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Read Page
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Need Help?</h4>
          <p className="text-sm text-blue-800">
            These settings make Adaptalyfe easier to use for everyone. 
            Text-to-speech reads content aloud, voice commands let you navigate hands-free, 
            and visual settings improve readability.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}