import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  ChefHat, 
  CreditCard, 
  Bus, 
  Users, 
  Play, 
  CheckCircle, 
  Clock, 
  Star,
  Award,
  BookOpen,
  Video,
  FileText,
  ArrowRight,
  Trophy,
  Target
} from "lucide-react";

interface SkillLesson {
  id: number;
  title: string;
  category: 'cooking' | 'banking' | 'transportation' | 'social';
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  steps: string[];
  tips: string[];
  videoUrl?: string;
  completed: boolean;
  score?: number;
}

interface SkillChallenge {
  id: number;
  title: string;
  description: string;
  category: string;
  points: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  requirements: string[];
  badge: string;
  completed: boolean;
}

export default function LifeSkillsModule() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedLesson, setSelectedLesson] = useState<SkillLesson | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();

  const skillLessons: SkillLesson[] = [
    {
      id: 1,
      title: "Basic Cooking Safety",
      category: "cooking",
      description: "Learn essential kitchen safety rules and basic cooking techniques",
      difficulty: "beginner",
      estimatedTime: 15,
      steps: [
        "Wash your hands thoroughly before cooking",
        "Check that all cooking surfaces are clean",
        "Keep pot handles turned inward on the stove",
        "Never leave cooking food unattended",
        "Clean up spills immediately to prevent slips",
        "Turn off all appliances when finished"
      ],
      tips: [
        "Always have a first aid kit nearby",
        "Keep a fire extinguisher accessible",
        "Don't wear loose clothing while cooking"
      ],
      completed: true,
      score: 95
    },
    {
      id: 2,
      title: "Using an ATM Safely",
      category: "banking",
      description: "Step-by-step guide to using ATMs and protecting your money",
      difficulty: "beginner",
      estimatedTime: 20,
      steps: [
        "Choose a well-lit ATM in a safe location",
        "Check for any suspicious devices attached to the ATM",
        "Insert your card and wait for prompts",
        "Enter your PIN while covering the keypad",
        "Select your transaction type",
        "Take your receipt and card before leaving",
        "Count your money in a safe place"
      ],
      tips: [
        "Never share your PIN with anyone",
        "Cover the keypad when entering your PIN",
        "Keep your receipts for record-keeping"
      ],
      completed: false
    },
    {
      id: 3,
      title: "Reading Bus Schedules",
      category: "transportation",
      description: "How to read and understand public transportation schedules",
      difficulty: "beginner",
      estimatedTime: 25,
      steps: [
        "Find your bus route number",
        "Locate your starting bus stop",
        "Find your destination stop",
        "Check the schedule for departure times",
        "Account for weekend and holiday schedules",
        "Plan to arrive 5 minutes early",
        "Have exact change or a bus pass ready"
      ],
      tips: [
        "Download the transit app for real-time updates",
        "Keep a backup route in mind",
        "Ask the driver if you're unsure about stops"
      ],
      completed: false
    },
    {
      id: 4,
      title: "Starting Conversations",
      category: "social",
      description: "Learn how to start and maintain friendly conversations",
      difficulty: "beginner",
      estimatedTime: 30,
      steps: [
        "Make eye contact and smile",
        "Use a friendly greeting like 'Hello' or 'Hi'",
        "Ask open-ended questions about their day",
        "Listen actively to their responses",
        "Share something about yourself",
        "Ask follow-up questions to show interest",
        "End with a positive comment"
      ],
      tips: [
        "Practice common conversation starters",
        "Ask about shared interests",
        "It's okay to have quiet moments"
      ],
      completed: false
    }
  ];

  const skillChallenges: SkillChallenge[] = [
    {
      id: 1,
      title: "Master Chef",
      description: "Complete 5 cooking lessons and prepare a full meal",
      category: "cooking",
      points: 100,
      difficulty: "intermediate",
      requirements: [
        "Complete Basic Cooking Safety lesson",
        "Complete Meal Planning lesson", 
        "Complete Kitchen Organization lesson",
        "Prepare and photograph a complete meal",
        "Write a reflection about the experience"
      ],
      badge: "🍳",
      completed: false
    },
    {
      id: 2,
      title: "Money Manager",
      description: "Demonstrate financial independence skills",
      category: "banking",
      points: 150,
      difficulty: "advanced",
      requirements: [
        "Complete ATM Safety lesson",
        "Create a monthly budget",
        "Track expenses for one week",
        "Open a savings account",
        "Demonstrate online banking safety"
      ],
      badge: "💰",
      completed: false
    },
    {
      id: 3,
      title: "Navigation Expert",
      description: "Master independent travel and transportation",
      category: "transportation",
      points: 120,
      difficulty: "intermediate",
      requirements: [
        "Complete Bus Schedule lesson",
        "Successfully plan and take a bus trip",
        "Use a ride-sharing app safely",
        "Navigate using a map app",
        "Create emergency transportation plan"
      ],
      badge: "🚌",
      completed: false
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cooking': return <ChefHat className="w-4 h-4" />;
      case 'banking': return <CreditCard className="w-4 h-4" />;
      case 'transportation': return <Bus className="w-4 h-4" />;
      case 'social': return <Users className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const startLesson = (lesson: SkillLesson) => {
    setSelectedLesson(lesson);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (selectedLesson && currentStep < selectedLesson.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeLesson = () => {
    if (selectedLesson) {
      toast({
        title: "Lesson completed!",
        description: `Great job completing "${selectedLesson.title}". You've earned experience points!`,
      });
      setSelectedLesson(null);
      setCurrentStep(0);
    }
  };

  const calculateOverallProgress = () => {
    const completedLessons = skillLessons.filter(lesson => lesson.completed).length;
    return (completedLessons / skillLessons.length) * 100;
  };

  const getCategoryProgress = (category: string) => {
    const categoryLessons = skillLessons.filter(lesson => lesson.category === category);
    const completedCategoryLessons = categoryLessons.filter(lesson => lesson.completed);
    return categoryLessons.length > 0 ? (completedCategoryLessons.length / categoryLessons.length) * 100 : 0;
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          Life Skills Development
        </CardTitle>
        <CardDescription>
          Build independence through interactive lessons and challenges
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Overall Progress */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Learning Progress</h3>
                <Badge variant="outline" className="text-indigo-600 border-indigo-600">
                  {skillLessons.filter(l => l.completed).length}/{skillLessons.length} Complete
                </Badge>
              </div>
              <Progress value={calculateOverallProgress()} className="mb-2" />
              <p className="text-sm text-gray-600">
                Keep learning to build your independence skills!
              </p>
            </Card>

            {/* Category Overview */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { category: 'cooking', name: 'Cooking', color: 'text-red-500' },
                { category: 'banking', name: 'Banking', color: 'text-green-500' },
                { category: 'transportation', name: 'Transportation', color: 'text-blue-500' },
                { category: 'social', name: 'Social Skills', color: 'text-purple-500' }
              ].map(({ category, name, color }) => (
                <Card key={category} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={color}>
                      {getCategoryIcon(category)}
                    </span>
                    <span className="font-medium text-sm">{name}</span>
                  </div>
                  <Progress value={getCategoryProgress(category)} className="mb-2" />
                  <div className="text-xs text-gray-600">
                    {skillLessons.filter(l => l.category === category && l.completed).length}/
                    {skillLessons.filter(l => l.category === category).length} lessons
                  </div>
                </Card>
              ))}
            </div>

            {/* Recent Achievements */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">Recent Achievements</h3>
              <div className="space-y-2">
                {skillLessons.filter(lesson => lesson.completed).slice(0, 3).map(lesson => (
                  <div key={lesson.id} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{lesson.title}</div>
                      <div className="text-xs text-gray-600">Score: {lesson.score}%</div>
                    </div>
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="lessons" className="space-y-4 mt-4">
            <div className="grid gap-4">
              {skillLessons.map((lesson) => (
                <Card key={lesson.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-gray-500">
                          {getCategoryIcon(lesson.category)}
                        </span>
                        <h4 className="font-medium">{lesson.title}</h4>
                        {lesson.completed && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{lesson.description}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <Badge variant="outline" className={getDifficultyColor(lesson.difficulty)}>
                          {lesson.difficulty}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {lesson.estimatedTime} min
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {lesson.steps.length} steps
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {lesson.completed ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <Trophy className="w-3 h-3 mr-1" />
                          {lesson.score}%
                        </Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => startLesson(lesson)}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="challenges" className="space-y-4 mt-4">
            <div className="grid gap-4">
              {skillChallenges.map((challenge) => (
                <Card key={challenge.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{challenge.badge}</span>
                        <h4 className="font-medium">{challenge.title}</h4>
                        {challenge.completed && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
                      <div className="flex items-center gap-4 text-xs mb-3">
                        <Badge variant="outline" className={getDifficultyColor(challenge.difficulty)}>
                          {challenge.difficulty}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {challenge.points} points
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Requirements:</div>
                        {challenge.requirements.map((req, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 bg-gray-300 rounded-full" />
                            {req}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {challenge.completed ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <Trophy className="w-3 h-3 mr-1" />
                          Complete
                        </Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                        >
                          <Target className="w-4 h-4 mr-2" />
                          Start Challenge
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4 mt-4">
            {/* Skills Breakdown */}
            <Card className="p-4">
              <h3 className="font-medium mb-4">Skills Breakdown</h3>
              <div className="space-y-4">
                {[
                  { category: 'cooking', name: 'Cooking & Nutrition', icon: <ChefHat className="w-4 h-4" />, color: 'text-red-500' },
                  { category: 'banking', name: 'Financial Management', icon: <CreditCard className="w-4 h-4" />, color: 'text-green-500' },
                  { category: 'transportation', name: 'Transportation', icon: <Bus className="w-4 h-4" />, color: 'text-blue-500' },
                  { category: 'social', name: 'Social Skills', icon: <Users className="w-4 h-4" />, color: 'text-purple-500' }
                ].map(({ category, name, icon, color }) => {
                  const progress = getCategoryProgress(category);
                  const completedLessons = skillLessons.filter(l => l.category === category && l.completed).length;
                  const totalLessons = skillLessons.filter(l => l.category === category).length;
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={color}>{icon}</span>
                          <span className="font-medium">{name}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {completedLessons}/{totalLessons}
                        </span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Achievement Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {skillLessons.filter(l => l.completed).length}
                </div>
                <div className="text-sm text-gray-600">Lessons Completed</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {skillChallenges.filter(c => c.completed).length}
                </div>
                <div className="text-sm text-gray-600">Challenges Earned</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {skillChallenges.filter(c => c.completed).reduce((acc, c) => acc + c.points, 0)}
                </div>
                <div className="text-sm text-gray-600">Points Earned</div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Lesson Dialog */}
        <Dialog open={!!selectedLesson} onOpenChange={() => setSelectedLesson(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            {selectedLesson && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {getCategoryIcon(selectedLesson.category)}
                    {selectedLesson.title}
                  </DialogTitle>
                  <DialogDescription>
                    Step {currentStep + 1} of {selectedLesson.steps.length} • {selectedLesson.estimatedTime} minutes
                  </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="max-h-96">
                  <div className="space-y-6 p-1">
                    {/* Progress */}
                    <div>
                      <Progress value={((currentStep + 1) / selectedLesson.steps.length) * 100} />
                      <p className="text-sm text-gray-600 mt-1">
                        Progress: {currentStep + 1}/{selectedLesson.steps.length}
                      </p>
                    </div>

                    {/* Current Step */}
                    <Card className="p-4 border-indigo-200 bg-indigo-50">
                      <h4 className="font-medium mb-2">Step {currentStep + 1}</h4>
                      <p className="text-gray-700">{selectedLesson.steps[currentStep]}</p>
                    </Card>

                    {/* Tips */}
                    {selectedLesson.tips.length > 0 && (
                      <Card className="p-4 border-yellow-200 bg-yellow-50">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-600" />
                          Helpful Tips
                        </h4>
                        <ul className="space-y-1 text-sm">
                          {selectedLesson.tips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-1 h-1 bg-yellow-600 rounded-full mt-2" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}

                    {/* All Steps Preview */}
                    <Card className="p-4">
                      <h4 className="font-medium mb-2">All Steps</h4>
                      <div className="space-y-2">
                        {selectedLesson.steps.map((step, index) => (
                          <div 
                            key={index} 
                            className={`flex items-start gap-2 p-2 rounded ${
                              index === currentStep 
                                ? 'bg-indigo-50 border border-indigo-200' 
                                : index < currentStep 
                                  ? 'bg-green-50 text-green-700' 
                                  : 'text-gray-600'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              index < currentStep 
                                ? 'bg-green-500 text-white' 
                                : index === currentStep
                                  ? 'bg-indigo-500 text-white'
                                  : 'bg-gray-200 text-gray-600'
                            }`}>
                              {index < currentStep ? '✓' : index + 1}
                            </div>
                            <span className="text-sm">{step}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </ScrollArea>

                {/* Navigation */}
                <div className="flex justify-between pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={previousStep}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSelectedLesson(null)}>
                      Exit Lesson
                    </Button>
                    
                    {currentStep === selectedLesson.steps.length - 1 ? (
                      <Button onClick={completeLesson} className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Complete Lesson
                      </Button>
                    ) : (
                      <Button onClick={nextStep}>
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}