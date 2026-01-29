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
    subtitle: "Learn about anxiety symptoms and healthy ways to manage anxious feelings",
    intro: "Anxiety is a feeling of worry, nervousness, or fear. Everyone experiences anxiety sometimes, especially during new or stressful situations.",
    content: [
      { heading: "Common Signs of Anxiety", text: "Racing thoughts, feeling tense or restless, stomach discomfort, trouble focusing, and wanting to avoid certain situations." },
      { heading: "Helpful Coping Tools", text: "Slow breathing exercises, grounding techniques (naming things you see, hear, or feel), creating calming routines, and preparing for situations ahead of time." },
      { heading: "When Anxiety Feels Overwhelming", text: "It's okay to ask for support. Talking to a trusted person can help. Learning coping strategies takes time." }
    ],
    tip: "Remember: Everyone experiences anxiety sometimes. Learning to manage it is a skill that improves with practice."
  },
  resilience: {
    title: "Building Resilience",
    subtitle: "Strategies to bounce back from challenges and build emotional strength",
    intro: "Resilience is the ability to cope with change, stress, and setbacks. Everyone struggles sometimes — resilience helps you recover, adapt, and keep moving forward.",
    content: [
      { heading: "Understanding Challenges", text: "Change and unexpected events can feel overwhelming. Learning that struggles are not failures is an important first step." },
      { heading: "Coping Strategies", text: "Taking breaks during stressful moments, using grounding techniques (deep breathing, sensory tools), and breaking big problems into smaller steps." },
      { heading: "Self-Talk", text: "Recognize negative thoughts and replace harsh self-talk with supportive language. Be kind to yourself the way you would be to a friend." },
      { heading: "Asking for Support", text: "Know when to ask for help. Reach out to family, caregivers, or trusted adults. Asking for help is a strength, not a weakness." }
    ],
    tip: "Resilience grows over time. Each challenge you face helps build confidence for the next one."
  },
  habits: {
    title: "Healthy Habits",
    subtitle: "Simple daily practices that support your wellbeing",
    intro: "Healthy habits are small, everyday actions that help create structure, balance, and stability. Building routines can make daily life feel more predictable, manageable, and less overwhelming.",
    content: [
      { heading: "Daily Routines", text: "Consistent routines can reduce stress and decision fatigue. Examples include morning routines, bedtime routines, and transition routines. Start small and build gradually." },
      { heading: "Basic Self-Care", text: "Drink enough water, eat regular meals, get enough rest, and take breaks when feeling overwhelmed." },
      { heading: "Body Awareness", text: "Try gentle movement like stretching, walking, or light exercise. Notice signs of fatigue, hunger, or stress. Learn when your body needs rest." },
      { heading: "Habit Tracking", text: "Tracking habits can increase motivation. Use checklists or reminders. Celebrate small wins instead of aiming for perfection." }
    ],
    tip: "Healthy habits don't have to be perfect. Progress matters more than consistency."
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">Helpful Resources</h1>
        <p className="text-base sm:text-lg text-gray-600">
          Tools and resources to support your daily wellbeing and personal growth.
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
                  <p className="text-sm text-gray-600 mt-2">{educationalContent.anxiety.subtitle}</p>
                  <div className="bg-orange-100 rounded-lg p-3 mt-3">
                    <p className="text-sm text-gray-800">{educationalContent.anxiety.intro}</p>
                  </div>
                  <div className="space-y-3 mt-4">
                    {educationalContent.anxiety.content.map((section, i) => (
                      <div key={i} className="bg-orange-50 rounded-lg p-3">
                        <h5 className="font-semibold text-gray-900 mb-1">{section.heading}</h5>
                        <p className="text-sm text-gray-700">{section.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-orange-200 rounded-lg p-3 mt-3">
                    <p className="text-sm text-orange-800 font-medium">💡 {educationalContent.anxiety.tip}</p>
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
                  <p className="text-sm text-gray-600 mt-2">{educationalContent.resilience.subtitle}</p>
                  <div className="bg-blue-100 rounded-lg p-3 mt-3">
                    <p className="text-sm text-gray-800">{educationalContent.resilience.intro}</p>
                  </div>
                  <div className="space-y-3 mt-4">
                    {educationalContent.resilience.content.map((section, i) => (
                      <div key={i} className="bg-blue-50 rounded-lg p-3">
                        <h5 className="font-semibold text-gray-900 mb-1">{section.heading}</h5>
                        <p className="text-sm text-gray-700">{section.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-200 rounded-lg p-3 mt-3">
                    <p className="text-sm text-blue-800 font-medium">💪 {educationalContent.resilience.tip}</p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Healthy Habits</h4>
              <p className="text-sm text-gray-600 mb-3">
                Simple daily practices that support your wellbeing.
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
                  <p className="text-sm text-gray-600 mt-2">{educationalContent.habits.subtitle}</p>
                  <div className="bg-green-100 rounded-lg p-3 mt-3">
                    <p className="text-sm text-gray-800">{educationalContent.habits.intro}</p>
                  </div>
                  <div className="space-y-3 mt-4">
                    {educationalContent.habits.content.map((section, i) => (
                      <div key={i} className="bg-green-50 rounded-lg p-3">
                        <h5 className="font-semibold text-gray-900 mb-1">{section.heading}</h5>
                        <p className="text-sm text-gray-700">{section.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-green-200 rounded-lg p-3 mt-3">
                    <p className="text-sm text-green-800 font-medium">🌱 {educationalContent.habits.tip}</p>
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
