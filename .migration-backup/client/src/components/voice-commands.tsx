import { useState, useEffect } from "react";
import { useSafeRef } from "@/hooks/useSafeRef";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Mic, MicOff, Volume2, VolumeX, MessageSquare, 
  CheckCircle, Plus, Navigation, Settings, Play, Pause 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface VoiceInteraction {
  id: number;
  command: string;
  transcript: string;
  action: string;
  success: boolean;
  createdAt: string;
}

interface VoiceCommand {
  phrase: string;
  action: string;
  description: string;
  category: string;
}

export function VoiceCommands() {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  
  const recognition = useSafeRef<any>(null);
  const synthesis = useSafeRef<any>(null);
  const { toast } = useToast();

  // Available voice commands
  const voiceCommands: VoiceCommand[] = [
    // Task Management
    { phrase: "add task", action: "add_task", description: "Add a new daily task", category: "tasks" },
    { phrase: "complete task", action: "complete_task", description: "Mark task as complete", category: "tasks" },
    { phrase: "show tasks", action: "show_tasks", description: "View daily tasks", category: "tasks" },
    { phrase: "what's next", action: "next_task", description: "Show next upcoming task", category: "tasks" },
    
    // Mood & Wellness
    { phrase: "record mood", action: "record_mood", description: "Open mood tracking", category: "mood" },
    { phrase: "how am I feeling", action: "mood_summary", description: "Show recent mood entries", category: "mood" },
    { phrase: "I feel", action: "mood_entry", description: "Quick mood entry", category: "mood" },
    
    // Navigation
    { phrase: "go to dashboard", action: "navigate_dashboard", description: "Open main dashboard", category: "navigation" },
    { phrase: "open calendar", action: "navigate_calendar", description: "View calendar", category: "navigation" },
    { phrase: "show messages", action: "navigate_messages", description: "Open caregiver messages", category: "navigation" },
    { phrase: "help", action: "show_help", description: "Show voice command help", category: "navigation" },
    
    // Financial
    { phrase: "show bills", action: "show_bills", description: "View upcoming bills", category: "financial" },
    { phrase: "add expense", action: "add_expense", description: "Record new expense", category: "financial" },
    { phrase: "budget status", action: "budget_status", description: "Check budget summary", category: "financial" },
    
    // Quick Actions
    { phrase: "emergency contact", action: "emergency_contact", description: "Show emergency contacts", category: "emergency" },
    { phrase: "call caregiver", action: "call_caregiver", description: "Contact your caregiver", category: "emergency" },
    { phrase: "take break", action: "take_break", description: "Start relaxation timer", category: "wellness" }
  ];

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognition.current = new SpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            setConfidence(event.results[i][0].confidence);
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);

        if (finalTranscript) {
          processVoiceCommand(finalTranscript);
        }
      };

      recognition.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Voice Recognition Error",
          description: "Please try again or check your microphone permissions.",
          variant: "destructive"
        });
      };

        recognition.current.onend = () => {
          setIsListening(false);
        };

        // Initialize speech synthesis
        if ('speechSynthesis' in window) {
          synthesis.current = window.speechSynthesis;
        }
      }
    }

    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
    };
  }, []);

  // Record voice interaction
  const recordInteractionMutation = useMutation({
    mutationFn: async (interaction: {
      command: string;
      transcript: string;
      action: string;
      success: boolean;
    }) => {
      return await apiRequest('POST', '/api/voice-interactions', interaction);
    }
  });

  // Process voice command
  const processVoiceCommand = async (transcript: string) => {
    const lowerTranscript = transcript.toLowerCase().trim();
    
    // Find matching command
    const matchedCommand = voiceCommands.find(cmd => 
      lowerTranscript.includes(cmd.phrase.toLowerCase())
    );

    if (matchedCommand) {
      await executeCommand(matchedCommand, transcript);
    } else {
      // Try to parse natural language commands
      await processNaturalLanguage(transcript);
    }
  };

  // Execute recognized command
  const executeCommand = async (command: VoiceCommand, transcript: string) => {
    let success = true;
    let responseMessage = "";

    try {
      switch (command.action) {
        case "add_task":
          // Extract task name from transcript
          const taskMatch = transcript.match(/add task (.+)/i);
          if (taskMatch) {
            const taskTitle = taskMatch[1];
            await apiRequest('POST', '/api/daily-tasks', {
              title: taskTitle,
              description: `Added via voice command`,
              category: "voice_added",
              estimatedMinutes: 30
            });
            responseMessage = `Task "${taskTitle}" added successfully`;
          } else {
            responseMessage = "What task would you like to add?";
          }
          break;

        case "complete_task":
          responseMessage = "Please specify which task to complete";
          break;

        case "show_tasks":
          responseMessage = "Opening your daily tasks";
          window.location.hash = "#daily-tasks";
          break;

        case "navigate_dashboard":
          responseMessage = "Opening dashboard";
          window.location.hash = "#dashboard";
          break;

        case "navigate_calendar":
          responseMessage = "Opening calendar";
          window.location.hash = "#calendar";
          break;

        case "record_mood":
          responseMessage = "Opening mood tracker";
          window.location.hash = "#mood";
          break;

        case "mood_entry":
          // Extract mood from transcript
          const moodMatch = transcript.match(/I feel (happy|sad|angry|excited|calm|anxious|content|frustrated)/i);
          if (moodMatch) {
            const mood = moodMatch[1].toLowerCase();
            const moodValue = getMoodValue(mood);
            await apiRequest('POST', '/api/mood-entries', {
              mood: moodValue,
              notes: `Voice entry: ${mood}`
            });
            responseMessage = `Mood recorded as ${mood}`;
          } else {
            responseMessage = "How are you feeling today?";
          }
          break;

        case "show_bills":
          responseMessage = "Showing your bills";
          window.location.hash = "#financial";
          break;

        case "emergency_contact":
          responseMessage = "Showing emergency contacts";
          window.location.hash = "#medical";
          break;

        case "show_help":
          responseMessage = "Here are the voice commands you can use";
          setShowHistory(true);
          break;

        default:
          responseMessage = `Command recognized: ${command.description}`;
      }

      // Provide audio feedback if enabled
      if (audioFeedback && responseMessage) {
        speak(responseMessage);
      }

      // Show visual feedback
      toast({
        title: "Voice Command Executed",
        description: responseMessage,
        duration: 3000
      });

    } catch (error) {
      success = false;
      responseMessage = "Sorry, I couldn't complete that action";
      
      toast({
        title: "Command Failed",
        description: responseMessage,
        variant: "destructive"
      });
    }

    // Record the interaction
    recordInteractionMutation.mutate({
      command: command.phrase,
      transcript,
      action: command.action,
      success
    });
  };

  // Process natural language
  const processNaturalLanguage = async (transcript: string) => {
    const lowerTranscript = transcript.toLowerCase();
    
    // Simple natural language processing
    if (lowerTranscript.includes("tired") || lowerTranscript.includes("exhausted")) {
      speak("It sounds like you need a break. Would you like me to set a relaxation reminder?");
    } else if (lowerTranscript.includes("stressed") || lowerTranscript.includes("overwhelmed")) {
      speak("I understand you're feeling stressed. Let me open your relaxation resources.");
      window.location.hash = "#resources";
    } else if (lowerTranscript.includes("forgot") || lowerTranscript.includes("remember")) {
      speak("Let me show you your tasks and appointments for today.");
      window.location.hash = "#dashboard";
    } else {
      speak("I didn't recognize that command. Try saying 'help' to see what I can do.");
    }

    // Record unrecognized interaction
    recordInteractionMutation.mutate({
      command: "natural_language",
      transcript,
      action: "unrecognized",
      success: false
    });
  };

  // Convert mood words to numbers
  const getMoodValue = (mood: string): number => {
    const moodMap: { [key: string]: number } = {
      sad: 1, angry: 1, frustrated: 2, anxious: 2,
      calm: 3, content: 4, happy: 5, excited: 5
    };
    return moodMap[mood] || 3;
  };

  // Text-to-speech function
  const speak = (text: string) => {
    if (synthesis.current && audioFeedback) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      synthesis.current.speak(utterance);
    }
  };

  // Start/stop listening
  const toggleListening = () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Voice recognition is not supported in this browser.",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognition.current?.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      setConfidence(0);
      recognition.current?.start();
      setIsListening(true);
      
      if (audioFeedback) {
        speak("Listening for your command");
      }
    }
  };

  const commandCategories = [
    { id: "tasks", name: "Tasks", commands: voiceCommands.filter(c => c.category === "tasks") },
    { id: "navigation", name: "Navigation", commands: voiceCommands.filter(c => c.category === "navigation") },
    { id: "mood", name: "Mood & Wellness", commands: voiceCommands.filter(c => c.category === "mood") },
    { id: "financial", name: "Financial", commands: voiceCommands.filter(c => c.category === "financial") },
    { id: "emergency", name: "Emergency", commands: voiceCommands.filter(c => c.category === "emergency") }
  ];

  if (!isSupported) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="text-center py-8">
          <MicOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Voice Commands Not Supported</h3>
          <p className="text-gray-600">
            Your browser doesn't support voice recognition. Please use a modern browser like Chrome or Firefox.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Voice Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Commands
            <Badge variant={voiceEnabled ? "default" : "secondary"} className="ml-auto">
              {voiceEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Control */}
          <div className="flex items-center justify-center">
            <Button
              size="lg"
              onClick={toggleListening}
              disabled={!voiceEnabled}
              className={`h-20 w-20 rounded-full transition-all duration-200 ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isListening ? 
                <MicOff className="h-8 w-8" /> : 
                <Mic className="h-8 w-8" />
              }
            </Button>
          </div>
          
          {/* Status Display */}
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">
              {isListening ? "Listening..." : "Click to start voice commands"}
            </p>
            
            {transcript && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-900 font-medium">You said:</p>
                <p className="text-blue-700">"{transcript}"</p>
                {confidence > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Confidence: {Math.round(confidence * 100)}%
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={voiceEnabled}
                  onCheckedChange={setVoiceEnabled}
                />
                <label className="text-sm font-medium">Voice Commands</label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch 
                  checked={audioFeedback}
                  onCheckedChange={setAudioFeedback}
                />
                {audioFeedback ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                <label className="text-sm font-medium">Audio Feedback</label>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? "Hide Commands" : "Show Commands"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Commands */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle>Available Voice Commands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {commandCategories.map((category) => (
                <div key={category.id}>
                  <h3 className="font-medium text-lg mb-3">{category.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.commands.map((command, index) => (
                      <div 
                        key={index}
                        className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                          <code className="text-sm font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            "{command.phrase}"
                          </code>
                        </div>
                        <p className="text-sm text-gray-600">{command.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Tips for Better Recognition:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Speak clearly and at a normal pace</li>
                <li>• Use the exact phrases shown above</li>
                <li>• Ensure your microphone is working properly</li>
                <li>• Reduce background noise when possible</li>
                <li>• You can also use natural language like "I feel happy" or "I'm stressed"</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}