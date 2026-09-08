import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, PlayCircle, ArrowRight, BookOpen, Utensils, Sparkles, Car, Shield, ChefHat, Timer, CheckSquare, Lightbulb, AlertTriangle } from "lucide-react";

export default function TaskBuilder() {
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Sample task templates with step-by-step breakdown
  const taskTemplates = [
    {
      id: 1,
      title: "Making a Healthy Breakfast",
      description: "Learn to prepare a nutritious breakfast independently",
      category: "cooking",
      difficulty: "beginner",
      estimatedMinutes: 20,
      icon: "ChefHat",
      color: "orange",
      steps: [
        {
          stepNumber: 1,
          title: "Gather Ingredients",
          description: "Collect all ingredients from kitchen before starting",
          visualAid: "🥚🍞🧈",
          estimatedMinutes: 3,
          tips: "Check expiration dates on all ingredients",
          safetyNotes: "Wash hands before handling food"
        },
        {
          stepNumber: 2,
          title: "Prepare Cooking Area",
          description: "Clean the counter and get cooking tools ready",
          visualAid: "🍳🥄🧽",
          estimatedMinutes: 2,
          tips: "Have a clean plate ready for serving",
          safetyNotes: "Keep pot holders nearby for hot surfaces"
        },
        {
          stepNumber: 3,
          title: "Cook the Eggs",
          description: "Heat pan on medium heat and cook eggs as preferred",
          visualAid: "🔥🥚🍳",
          estimatedMinutes: 8,
          tips: "Medium heat prevents burning",
          safetyNotes: "Never leave hot pan unattended"
        },
        {
          stepNumber: 4,
          title: "Toast the Bread",
          description: "Toast bread to your preferred level of doneness",
          visualAid: "🍞🔥",
          estimatedMinutes: 3,
          tips: "Watch carefully to avoid burning",
          safetyNotes: "Use tongs to remove hot toast"
        },
        {
          stepNumber: 5,
          title: "Assemble and Serve",
          description: "Put everything together on a clean plate",
          visualAid: "🍽️✨",
          estimatedMinutes: 4,
          tips: "Add salt and pepper to taste",
          safetyNotes: "Turn off all appliances when finished"
        }
      ]
    },
    {
      id: 2,
      title: "Getting Ready for Work",
      description: "Complete morning routine for professional appearance",
      category: "personal_care",
      difficulty: "beginner",
      estimatedMinutes: 45,
      icon: "Clock",
      color: "blue",
      steps: [
        {
          stepNumber: 1,
          title: "Morning Hygiene",
          description: "Brush teeth, wash face, and use deodorant",
          visualAid: "🦷🧴🚿",
          estimatedMinutes: 10,
          tips: "Brush for at least 2 minutes",
          safetyNotes: "Use lukewarm water to avoid skin irritation"
        },
        {
          stepNumber: 2,
          title: "Choose Appropriate Clothing",
          description: "Select clean, professional outfit for the day",
          visualAid: "👔👗👞",
          estimatedMinutes: 10,
          tips: "Check weather forecast first",
          safetyNotes: "Ensure clothes fit properly for safety"
        },
        {
          stepNumber: 3,
          title: "Prepare Work Items",
          description: "Pack lunch, check work schedule, gather needed items",
          visualAid: "💼📱💵",
          estimatedMinutes: 15,
          tips: "Double-check you have keys and wallet",
          safetyNotes: "Keep important items in secure pockets"
        },
        {
          stepNumber: 4,
          title: "Final Check",
          description: "Look in mirror, check appearance, turn off lights",
          visualAid: "🪞✨🔌",
          estimatedMinutes: 5,
          tips: "Smile! You're ready for a great day",
          safetyNotes: "Lock door when leaving"
        },
        {
          stepNumber: 5,
          title: "Leave on Time",
          description: "Head to work with confidence and punctuality",
          visualAid: "🚶‍♂️⏰",
          estimatedMinutes: 5,
          tips: "Leave 5 minutes early for unexpected delays",
          safetyNotes: "Stay aware of surroundings while traveling"
        }
      ]
    },
    {
      id: 3,
      title: "Safe Social Interaction",
      description: "Guidelines for comfortable social situations",
      category: "social",
      difficulty: "intermediate",
      estimatedMinutes: 30,
      icon: "Sparkles",
      color: "purple",
      steps: [
        {
          stepNumber: 1,
          title: "Prepare for Social Setting",
          description: "Think about the social situation and plan conversation topics",
          visualAid: "💭🗣️📝",
          estimatedMinutes: 5,
          tips: "Think of 2-3 topics you're comfortable discussing",
          safetyNotes: "Choose public places for new social meetings"
        },
        {
          stepNumber: 2,
          title: "Greet Others Appropriately",
          description: "Use friendly greetings and make eye contact",
          visualAid: "👋😊👁️",
          estimatedMinutes: 2,
          tips: "A smile and 'hello' works in most situations",
          safetyNotes: "Maintain comfortable personal space"
        },
        {
          stepNumber: 3,
          title: "Listen Actively",
          description: "Pay attention to what others are saying",
          visualAid: "👂💬🤔",
          estimatedMinutes: 10,
          tips: "Nod to show you're listening",
          safetyNotes: "It's okay to take breaks if feeling overwhelmed"
        },
        {
          stepNumber: 4,
          title: "Share Appropriately",
          description: "Contribute to conversation at natural breaks",
          visualAid: "💬⚖️",
          estimatedMinutes: 10,
          tips: "Ask questions about what others shared",
          safetyNotes: "Keep personal information private until you know someone well"
        },
        {
          stepNumber: 5,
          title: "Wrap Up Politely",
          description: "End conversations gracefully when appropriate",
          visualAid: "🤝👋",
          estimatedMinutes: 3,
          tips: "'It was nice talking with you' is always appropriate",
          safetyNotes: "Trust your instincts if something feels uncomfortable"
        }
      ]
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "cooking": return <ChefHat className="w-5 h-5" />;
      case "personal_care": return <Sparkles className="w-5 h-5" />;
      case "social": return <BookOpen className="w-5 h-5" />;
      case "work": return <CheckSquare className="w-5 h-5" />;
      default: return <CheckCircle className="w-5 h-5" />;
    }
  };

  const startTask = (taskId: number) => {
    console.log("Starting task with ID:", taskId);
    setActiveTaskId(taskId);
    setCurrentStep(1);
  };

  const nextStep = () => {
    const activeTask = taskTemplates.find(t => t.id === activeTaskId);
    if (activeTask && currentStep < activeTask.steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishTask = () => {
    setActiveTaskId(null);
    setCurrentStep(1);
  };

  const activeTask = taskTemplates.find(t => t.id === activeTaskId);
  const currentStepData = activeTask?.steps.find(s => s.stepNumber === currentStep);

  if (activeTaskId && activeTask) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setActiveTaskId(null)}
            className="mb-4"
          >
            ← Back to Tasks
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{activeTask.title}</h1>
          <div className="flex items-center gap-4">
            <Badge className={getDifficultyColor(activeTask.difficulty)}>
              {activeTask.difficulty}
            </Badge>
            <div className="flex items-center gap-2 text-gray-600">
              <Timer className="w-4 h-4" />
              <span>{activeTask.estimatedMinutes} minutes total</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-600">
              Step {currentStep} of {activeTask.steps.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / activeTask.steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        {currentStepData && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  Step {currentStep}: {currentStepData.title}
                </CardTitle>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{currentStepData.estimatedMinutes} min</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">{currentStepData.visualAid}</div>
                <p className="text-lg text-gray-700">{currentStepData.description}</p>
              </div>

              {currentStepData.tips && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Helpful Tip</h4>
                      <p className="text-blue-700">{currentStepData.tips}</p>
                    </div>
                  </div>
                </div>
              )}

              {currentStepData.safetyNotes && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-900 mb-1">Safety Note</h4>
                      <p className="text-yellow-700">{currentStepData.safetyNotes}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={previousStep}
                  disabled={currentStep === 1}
                >
                  Previous Step
                </Button>
                
                {currentStep === activeTask.steps.length ? (
                  <Button onClick={finishTask} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Task
                  </Button>
                ) : (
                  <Button onClick={nextStep}>
                    Next Step
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Steps Overview */}
        <Card>
          <CardHeader>
            <CardTitle>All Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeTask.steps.map((step) => (
                <div 
                  key={step.stepNumber}
                  className={`p-3 rounded-lg border transition-all ${
                    step.stepNumber === currentStep 
                      ? 'border-blue-500 bg-blue-50' 
                      : step.stepNumber < currentStep 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.stepNumber < currentStep 
                        ? 'bg-green-500 text-white' 
                        : step.stepNumber === currentStep 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step.stepNumber < currentStep ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        step.stepNumber
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{step.title}</h4>
                      <p className="text-sm text-gray-600">{step.estimatedMinutes} minutes</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Visual Task Builder</h1>
        <p className="text-lg text-gray-600">
          Learn life skills step-by-step with visual guides and helpful tips
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div></div>
        <Button 
          onClick={() => alert("Custom task creation feature coming soon! For now, you can use the pre-built task templates below.")}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <span className="mr-2">+</span>
          Create Custom Task
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="cooking">Cooking</TabsTrigger>
          <TabsTrigger value="personal_care">Self Care</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="work">Work Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {taskTemplates.map((task) => (
              <Card key={task.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(task.category)}
                      <div>
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <Badge className={getDifficultyColor(task.difficulty)}>
                          {task.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{task.description}</p>
                  
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{task.estimatedMinutes} minutes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckSquare className="w-4 h-4" />
                      <span>{task.steps.length} steps</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => startTask(task.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Start Task
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Category-specific tabs would show filtered results */}
        <TabsContent value="cooking" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {taskTemplates.filter(task => task.category === "cooking").map((task) => (
              <Card key={task.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(task.category)}
                      <div>
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <Badge className={getDifficultyColor(task.difficulty)}>
                          {task.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{task.description}</p>
                  
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{task.estimatedMinutes} minutes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckSquare className="w-4 h-4" />
                      <span>{task.steps.length} steps</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => startTask(task.id)}
                    className="w-full"
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Start Task
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Similar structure for other categories */}
        <TabsContent value="personal_care" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {taskTemplates.filter(task => task.category === "personal_care").map((task) => (
              <Card key={task.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(task.category)}
                      <div>
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <Badge className={getDifficultyColor(task.difficulty)}>
                          {task.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{task.description}</p>
                  
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{task.estimatedMinutes} minutes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckSquare className="w-4 h-4" />
                      <span>{task.steps.length} steps</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => startTask(task.id)}
                    className="w-full"
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Start Task
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="social" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {taskTemplates.filter(task => task.category === "social").map((task) => (
              <Card key={task.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(task.category)}
                      <div>
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <Badge className={getDifficultyColor(task.difficulty)}>
                          {task.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{task.description}</p>
                  
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{task.estimatedMinutes} minutes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckSquare className="w-4 h-4" />
                      <span>{task.steps.length} steps</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => startTask(task.id)}
                    className="w-full"
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Start Task
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="work" className="space-y-6 mt-6">
          <div className="text-center py-12">
            <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Coming Soon</h3>
            <p className="text-gray-500">Work skills tasks will be available soon!</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}