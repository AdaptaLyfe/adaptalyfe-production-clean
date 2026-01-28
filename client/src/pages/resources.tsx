import { useState, useEffect } from "react";
import { useSafeRef } from "@/hooks/useSafeRef";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Wind, Lightbulb, Phone, BookOpen, Heart, Play, Pause, RotateCcw, Download, Settings, Smartphone, Accessibility } from "lucide-react";
import EmergencyResourcesModule from "@/components/emergency-resources-module";
import PersonalResourcesModule from "@/components/personal-resources-module";
import EmergencyContacts from "@/components/emergency-contacts";
import { DataExportBackup } from "@/components/data-export-backup";
import { EnhancedNotificationSystem } from "@/components/enhanced-notification-system";

const educationalContent = {
  anxiety: {
    title: "Understanding Anxiety",
    content: [
      { heading: "What is Anxiety?", text: "Anxiety is your body's natural response to stress. It's a feeling of fear or worry that can be mild or severe. Everyone feels anxious sometimes, but when anxiety becomes overwhelming or persistent, it may need attention." },
      { heading: "Common Signs", text: "Physical signs include rapid heartbeat, sweating, and trouble sleeping. Emotional signs include constant worry, feeling restless, and difficulty concentrating." },
      { heading: "Healthy Coping", text: "Try deep breathing exercises, take regular breaks, get enough sleep, exercise regularly, and talk to someone you trust. The breathing exercises on this page can help!" },
      { heading: "When to Seek Help", text: "If anxiety is affecting your daily life, work, or relationships, consider talking to a healthcare provider. There's no shame in asking for support." }
    ]
  },
  resilience: {
    title: "Building Resilience",
    content: [
      { heading: "What is Resilience?", text: "Resilience is the ability to bounce back from challenges, adapt to change, and keep going during difficult times. It's like a muscle that gets stronger with practice." },
      { heading: "Building Connections", text: "Strong relationships with family, friends, and community provide support during tough times. Don't be afraid to reach out and accept help when offered." },
      { heading: "Healthy Thinking", text: "Try to see challenges as opportunities for growth. Focus on what you can control, and practice self-compassion when things don't go as planned." },
      { heading: "Taking Action", text: "Set small, achievable goals each day. Celebrate your progress, no matter how small. Taking action helps build confidence and momentum." }
    ]
  },
  habits: {
    title: "Healthy Habits",
    content: [
      { heading: "Sleep Matters", text: "Aim for 7-9 hours of sleep each night. Good sleep improves mood, concentration, and overall health. Try to keep a consistent sleep schedule." },
      { heading: "Stay Active", text: "Regular physical activity, even a short daily walk, can boost your mood and energy. Find activities you enjoy to make exercise feel less like a chore." },
      { heading: "Eat Well", text: "A balanced diet with fruits, vegetables, and whole grains supports mental and physical health. Stay hydrated and limit caffeine and sugar." },
      { heading: "Take Breaks", text: "Regular breaks throughout the day help prevent burnout. Step away from screens, stretch, or do something you enjoy for a few minutes." }
    ]
  }
};

export default function Resources() {
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [breathingProgress, setBreathingProgress] = useState(0);
  const [breathingCycle, setBreathingCycle] = useState(0);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [openEducational, setOpenEducational] = useState<string | null>(null);
  const animationFrameRef = useSafeRef<number | null>(null);
  const timeoutRef = useSafeRef<number | null>(null);

  const copingStrategies = [
    {
      id: "grounding",
      title: "5-4-3-2-1 Grounding Technique",
      description: "Use your senses to ground yourself in the present moment",
      steps: [
        "Notice 5 things you can see around you",
        "Notice 4 things you can touch",
        "Notice 3 things you can hear",
        "Notice 2 things you can smell",
        "Notice 1 thing you can taste"
      ],
      color: "bg-vibrant-green"
    },
    {
      id: "progressive",
      title: "Progressive Muscle Relaxation",
      description: "Tense and relax different muscle groups to reduce stress",
      steps: [
        "Start with your toes - tense for 5 seconds, then relax",
        "Move to your calves - tense and relax",
        "Continue with thighs, abdomen, hands, arms",
        "Finish with shoulders, neck, and face",
        "Take deep breaths throughout the process"
      ],
      color: "bg-happy-purple"
    },
    {
      id: "positive",
      title: "Positive Self-Talk",
      description: "Replace negative thoughts with encouraging ones",
      steps: [
        "Notice when you're being self-critical",
        "Ask yourself: 'What would I tell a friend?'",
        "Replace negative thoughts with realistic, kind ones",
        "Use affirmations: 'I am capable and strong'",
        "Practice daily to build this habit"
      ],
      color: "bg-sunny-orange"
    },
    {
      id: "mindfulness",
      title: "Mindful Moment",
      description: "Take a pause to reconnect with the present",
      steps: [
        "Stop what you're doing and sit comfortably",
        "Close your eyes or soften your gaze",
        "Notice your breath without changing it",
        "When your mind wanders, gently return to your breath",
        "Continue for 2-5 minutes"
      ],
      color: "bg-calm-teal"
    }
  ];

  const emergencyContacts = [
    {
      name: "Crisis Text Line",
      description: "Text HOME to 741741",
      available: "24/7",
      color: "bg-red-500"
    },
    {
      name: "National Suicide Prevention Lifeline",
      description: "Call 988",
      available: "24/7",
      color: "bg-red-600"
    },
    {
      name: "SAMHSA National Helpline",
      description: "1-800-662-4357",
      available: "24/7",
      color: "bg-red-700"
    }
  ];

  const startBreathing = () => {
    if (breathingActive) return;
    
    setBreathingActive(true);
    setBreathingCycle(0);
    setBreathingPhase("inhale");
    setBreathingProgress(0);
  };

  const stopBreathing = () => {
    setBreathingActive(false);
    setBreathingProgress(0);
    setBreathingPhase("inhale");
    
    // Clean up any running animations
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Handle breathing cycle with useEffect
  useEffect(() => {
    if (!breathingActive) return;

    const phases = [
      { name: "inhale" as const, duration: 4000 },
      { name: "hold" as const, duration: 4000 },
      { name: "exhale" as const, duration: 4000 }
    ];
    
    let currentPhaseIndex = 0;
    let currentCycle = 0;
    
    const runPhase = () => {
      const phase = phases[currentPhaseIndex];
      setBreathingPhase(phase.name);
      
      const startTime = Date.now();
      
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / phase.duration) * 100, 100);
        setBreathingProgress(progress);
        
        if (progress < 100) {
          animationFrameRef.current = requestAnimationFrame(updateProgress);
        } else {
          // Move to next phase
          currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
          
          // If we completed all phases, increment cycle
          if (currentPhaseIndex === 0) {
            currentCycle++;
            setBreathingCycle(currentCycle);
          }
          
          // Continue to next phase after a short delay
          timeoutRef.current = window.setTimeout(runPhase, 100);
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    };
    
    runPhase();
    
    // Cleanup function
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [breathingActive]);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">Mental Health Resources</h1>
        <p className="text-base sm:text-lg text-gray-600">
          Take care of your mental health with these helpful tools and resources.
        </p>
      </div>

      {/* Emergency Contacts Quick Access - Moved to top */}
      <div className="mb-8">
        <EmergencyContacts />
      </div>

      {/* Trusted Contacts */}
      <Card className="border-t-4 border-red-500 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 text-red-700">
            <Phone size={24} />
            <span>Trusted Contacts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            If you're in crisis or having thoughts of self-harm, please reach out for help immediately.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className={`${contact.color} text-white rounded-lg p-3 sm:p-4`}>
                <h4 className="font-semibold mb-2 text-sm sm:text-base">{contact.name}</h4>
                <p className="text-xs sm:text-sm opacity-90 mb-1">{contact.description}</p>
                <p className="text-xs opacity-80">{contact.available}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Breathing Exercise */}
        <Card className="border-t-4 border-happy-purple">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-lg sm:text-xl">
              <Wind className="text-happy-purple" size={20} />
              <span>Breathing Exercise</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-center">
              <div className="mb-4 sm:mb-6">
                <div className={`w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-1000 ${
                  breathingPhase === "inhale" ? "bg-blue-200 scale-110" :
                  breathingPhase === "hold" ? "bg-purple-200 scale-110" :
                  "bg-green-200 scale-90"
                }`}>
                  <div className="text-lg sm:text-2xl font-bold text-gray-700 px-2 text-center leading-tight">
                    {breathingPhase === "inhale" ? "Breathe In" :
                     breathingPhase === "hold" ? "Hold" :
                     "Breathe Out"}
                  </div>
                </div>
              </div>
              
              <div className="mb-4 px-2">
                <Progress value={breathingProgress} className="h-2" />
              </div>
              
              <p className="text-gray-600 mb-4 text-sm sm:text-base px-2">
                {breathingActive ? `Cycle ${breathingCycle + 1} • ${breathingPhase}` : "4-4-4 Breathing Pattern"}
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 px-2">
                {!breathingActive ? (
                  <Button
                    className="bg-happy-purple hover:bg-happy-purple text-white w-full sm:w-auto"
                    onClick={startBreathing}
                  >
                    <Play size={16} className="mr-2" />
                    Start Breathing
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={stopBreathing}
                      className="border-happy-purple text-happy-purple w-full sm:w-auto"
                    >
                      <Pause size={16} className="mr-2" />
                      Stop
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        stopBreathing();
                        setTimeout(startBreathing, 100);
                      }}
                      className="border-happy-purple text-happy-purple w-full sm:w-auto"
                    >
                      <RotateCcw size={16} className="mr-2" />
                      Restart
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coping Strategies */}
        <Card className="border-t-4 border-vibrant-green">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-lg sm:text-xl">
              <Lightbulb className="text-vibrant-green" size={20} />
              <span>Coping Strategies</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="space-y-2 sm:space-y-3">
              {copingStrategies.map((strategy) => (
                <Dialog key={strategy.id}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto p-3 sm:p-4 border-2 hover:shadow-md transition-all text-left"
                      onClick={() => setSelectedStrategy(strategy.id)}
                    >
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 ${strategy.color} rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0`}>
                        <Heart className="text-white" size={14} />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{strategy.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 sm:line-clamp-none">{strategy.description}</p>
                      </div>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm sm:max-w-md mx-2 sm:mx-auto max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="pb-3">
                      <DialogTitle className="flex items-center space-x-2 sm:space-x-3 text-base sm:text-lg">
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 ${strategy.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Heart className="text-white" size={14} />
                        </div>
                        <span className="leading-tight">{strategy.title}</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 sm:space-y-4 pb-2">
                      <p className="text-sm sm:text-base text-gray-600">{strategy.description}</p>
                      <div className="space-y-2 sm:space-y-3">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">Steps:</h4>
                        <ol className="space-y-2 sm:space-y-3">
                          {strategy.steps.map((step, index) => (
                            <li key={index} className="flex items-start space-x-2 sm:space-x-3">
                              <span className={`w-5 h-5 sm:w-6 sm:h-6 ${strategy.color} text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0 mt-0.5`}>
                                {index + 1}
                              </span>
                              <span className="text-xs sm:text-sm text-gray-700 leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Educational Resources */}
      <Card className="border-t-4 border-sunny-orange mt-6 sm:mt-8">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-lg sm:text-xl">
            <BookOpen className="text-sunny-orange" size={20} />
            <span>Educational Resources</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Understanding Anxiety</h4>
              <p className="text-sm text-gray-600 mb-3">
                Learn about anxiety symptoms and healthy ways to manage anxious feelings.
              </p>
              <Dialog open={openEducational === 'anxiety'} onOpenChange={(open) => setOpenEducational(open ? 'anxiety' : null)}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-sunny-orange text-sunny-orange hover:bg-orange-100">
                    Learn More
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl text-orange-600 flex items-center gap-2">
                      <Heart size={20} />
                      {educationalContent.anxiety.title}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    {educationalContent.anxiety.content.map((section, i) => (
                      <div key={i} className="bg-orange-50 rounded-lg p-3">
                        <h5 className="font-semibold text-gray-900 mb-1">{section.heading}</h5>
                        <p className="text-sm text-gray-700">{section.text}</p>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Building Resilience</h4>
              <p className="text-sm text-gray-600 mb-3">
                Discover strategies to bounce back from challenges and build emotional strength.
              </p>
              <Dialog open={openEducational === 'resilience'} onOpenChange={(open) => setOpenEducational(open ? 'resilience' : null)}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-bright-blue text-bright-blue hover:bg-blue-100">
                    Learn More
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl text-blue-600 flex items-center gap-2">
                      <Heart size={20} />
                      {educationalContent.resilience.title}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    {educationalContent.resilience.content.map((section, i) => (
                      <div key={i} className="bg-blue-50 rounded-lg p-3">
                        <h5 className="font-semibold text-gray-900 mb-1">{section.heading}</h5>
                        <p className="text-sm text-gray-700">{section.text}</p>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Healthy Habits</h4>
              <p className="text-sm text-gray-600 mb-3">
                Simple daily practices that support your mental and emotional wellbeing.
              </p>
              <Dialog open={openEducational === 'habits'} onOpenChange={(open) => setOpenEducational(open ? 'habits' : null)}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-vibrant-green text-vibrant-green hover:bg-green-100">
                    Learn More
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl text-green-600 flex items-center gap-2">
                      <Heart size={20} />
                      {educationalContent.habits.title}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    {educationalContent.habits.content.map((section, i) => (
                      <div key={i} className="bg-green-50 rounded-lg p-3">
                        <h5 className="font-semibold text-gray-900 mb-1">{section.heading}</h5>
                        <p className="text-sm text-gray-700">{section.text}</p>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Resources Section */}
      <div className="col-span-full">
        <EmergencyResourcesModule />
      </div>

      {/* Personal Resources Section */}
      <div className="col-span-full">
        <PersonalResourcesModule />
      </div>
    </div>
  );
}
