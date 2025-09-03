import { useState } from "react";
import { useSafeRef } from "@/hooks/useSafeRef";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { formatTimeAgo } from "@/lib/utils";
import { 
  Camera, 
  Trophy, 
  Star, 
  Heart, 
  TrendingUp, 
  Target, 
  Award,
  Users,
  Calendar,
  Image,
  Plus,
  Share2,
  Eye,
  ChevronRight,
  Medal,
  Zap,
  BookOpen,
  CheckCircle,
  Clock
} from "lucide-react";
import { z } from "zod";

const progressPhotoSchema = z.object({
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  milestone: z.string().optional(),
});

const peerStorySchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(10, "Story must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  isAnonymous: z.boolean().default(false),
});

interface ProgressPhoto {
  id: number;
  photoUrl: string;
  category: string;
  description: string;
  milestone?: string;
  takenAt: Date;
}

interface SkillChallenge {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  points: number;
  requirements: string[];
  progress: number;
  isCompleted: boolean;
  badge: string;
  timeframe: string;
}

interface PeerStory {
  id: number;
  title: string;
  content: string;
  authorName: string;
  category: string;
  likes: number;
  isLiked: boolean;
  createdAt: Date;
  isAnonymous: boolean;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  category: string;
  icon: string;
  points: number;
  earnedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export default function ProgressMotivationModule() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [showStoryDialog, setShowStoryDialog] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<SkillChallenge | null>(null);
  const fileInputRef = useSafeRef<HTMLInputElement | null>(null);
  
  const { toast } = useToast();

  const progressPhotos: ProgressPhoto[] = [
    {
      id: 1,
      photoUrl: "/photos/progress-1.jpg",
      category: "cooking",
      description: "Successfully made my first homemade pasta from scratch! It took 2 hours but was totally worth it.",
      milestone: "First Homemade Pasta",
      takenAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: 2,
      photoUrl: "/photos/progress-2.jpg",
      category: "independence",
      description: "Took public transportation to the grocery store by myself for the first time!",
      milestone: "Independent Shopping Trip",
      takenAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      id: 3,
      photoUrl: "/photos/progress-3.jpg",
      category: "social",
      description: "Had coffee with my neighbor and we're planning to meet again next week. Building friendships!",
      takenAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
  ];

  const skillChallenges: SkillChallenge[] = [
    {
      id: 1,
      title: "Master Chef Challenge",
      description: "Learn to cook 5 different meals independently",
      category: "cooking",
      difficulty: "intermediate",
      points: 150,
      requirements: [
        "Cook pasta dish",
        "Prepare a salad", 
        "Make breakfast eggs",
        "Cook rice perfectly",
        "Bake simple cookies"
      ],
      progress: 60,
      isCompleted: false,
      badge: "A",
      timeframe: "Complete in 30 days"
    },
    {
      id: 2,
      title: "Social Butterfly",
      description: "Build confidence in social interactions",
      category: "social",
      difficulty: "beginner",
      points: 100,
      requirements: [
        "Start 3 conversations with strangers",
        "Join a community group",
        "Make plans with a friend",
        "Give someone a genuine compliment",
        "Share a personal story"
      ],
      progress: 40,
      isCompleted: false,
      badge: "B",
      timeframe: "Complete in 21 days"
    },
    {
      id: 3,
      title: "Independence Hero",
      description: "Master essential life skills for independent living",
      category: "independence",
      difficulty: "advanced",
      points: 200,
      requirements: [
        "Use public transportation 5 times",
        "Complete grocery shopping alone",
        "Pay bills independently",
        "Attend medical appointment solo",
        "Plan and execute a day trip"
      ],
      progress: 80,
      isCompleted: false,
      badge: "C",
      timeframe: "Complete in 45 days"
    }
  ];

  const peerStories: PeerStory[] = [
    {
      id: 1,
      title: "My First Job Interview Success",
      content: "I was so nervous about my first job interview, but I practiced with my caregiver and prepared answers to common questions. When the day came, I arrived early, dressed professionally, and remembered to make eye contact. The interviewer was really nice and I got the job! The key was preparation and believing in myself.",
      authorName: "Sarah M.",
      category: "employment",
      likes: 24,
      isLiked: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      isAnonymous: false
    },
    {
      id: 2,
      title: "Learning to Manage My Money",
      content: "Managing money used to stress me out so much. I started small by tracking every expense for a week, then learned to create a simple budget. Now I save a little each month and feel confident about my finances. The budget app on my phone really helps!",
      authorName: "Anonymous",
      category: "financial",
      likes: 18,
      isLiked: false,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      isAnonymous: true
    },
    {
      id: 3,
      title: "Making Friends as an Adult",
      content: "Making friends felt impossible at first. I joined a local art class and started small by just saying hello to people. One person invited me for coffee after class, and now we're good friends! Sometimes you just need to take that first small step.",
      authorName: "Mike R.",
      category: "social",
      likes: 31,
      isLiked: false,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      isAnonymous: false
    }
  ];

  const achievements: Achievement[] = [
    {
      id: 1,
      title: "First Step",
      description: "Completed your first daily task",
      category: "tasks",
      icon: "*",
      points: 10,
      earnedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      rarity: "common"
    },
    {
      id: 2,
      title: "Consistent Performer",
      description: "Completed tasks for 7 days in a row",
      category: "tasks",
      icon: "+",
      points: 50,
      earnedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      rarity: "rare"
    },
    {
      id: 3,
      title: "Cooking Novice",
      description: "Successfully completed your first cooking lesson",
      category: "cooking",
      icon: "O",
      points: 25,
      earnedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      rarity: "common"
    },
    {
      id: 4,
      title: "Social Connector",
      description: "Made a new friend or strengthened a relationship",
      category: "social",
      icon: "#",
      points: 75,
      earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      rarity: "epic"
    }
  ];

  const photoForm = useForm({
    resolver: zodResolver(progressPhotoSchema),
    defaultValues: {
      description: "",
      category: "",
      milestone: "",
    },
  });

  const storyForm = useForm({
    resolver: zodResolver(peerStorySchema),
    defaultValues: {
      title: "",
      content: "",
      category: "",
      isAnonymous: false,
    },
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "Photo uploaded",
        description: "Your progress photo has been added to your journal!",
      });
    }
  };

  const likeStory = (storyId: number) => {
    toast({
      title: "Story liked",
      description: "Thank you for supporting your peer's journey!",
    });
  };

  const joinChallenge = (challengeId: number) => {
    toast({
      title: "Challenge joined",
      description: "You're now working on this skill challenge. Good luck!",
    });
  };

  const shareStory = () => {
    toast({
      title: "Story shared",
      description: "Your inspiring story has been shared with the community!",
    });
    setShowStoryDialog(false);
  };

  const totalPoints = achievements.reduce((acc, achievement) => acc + achievement.points, 0);
  const completedChallenges = skillChallenges.filter(c => c.isCompleted).length;

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Progress & Motivation
        </CardTitle>
        <CardDescription>
          Track your growth, celebrate achievements, and stay motivated
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="journal">Journal</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="community">Stories</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Achievement Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{totalPoints}</div>
                <div className="text-sm text-gray-600">Total Points</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{achievements.length}</div>
                <div className="text-sm text-gray-600">Achievements</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{completedChallenges}</div>
                <div className="text-sm text-gray-600">Challenges Done</div>
              </Card>
            </div>

            {/* Recent Achievements */}
            <Card className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Medal className="w-4 h-4 text-yellow-500" />
                Recent Achievements
              </h3>
              <div className="space-y-3">
                {achievements.slice(0, 3).map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <div className="text-3xl font-bold text-purple-600 bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium">{achievement.title}</div>
                      <div className="text-sm text-gray-600">{achievement.description}</div>
                    </div>
                    <div className="text-right">
                      <Badge className={getRarityColor(achievement.rarity)}>
                        {achievement.rarity}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">+{achievement.points} pts</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Active Challenges */}
            <Card className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                Active Challenges
              </h3>
              <div className="space-y-3">
                {skillChallenges.filter(c => !c.isCompleted).slice(0, 2).map((challenge) => (
                  <div key={challenge.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-blue-600 bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center">{challenge.badge}</span>
                        <h4 className="font-medium">{challenge.title}</h4>
                      </div>
                      <Badge className={getDifficultyColor(challenge.difficulty)}>
                        {challenge.difficulty}
                      </Badge>
                    </div>
                    <Progress value={challenge.progress} className="mb-2" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{challenge.progress}% complete</span>
                      <span className="text-blue-600">{challenge.points} points</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Motivational Quote */}
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <div className="text-center">
                <div className="text-lg font-medium text-blue-900 mb-2">
                  "Progress, not perfection, is the goal."
                </div>
                <div className="text-sm text-blue-700">
                  Every small step forward is a victory worth celebrating!
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="journal" className="space-y-4 mt-4">
            {/* Add Photo Button */}
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Progress Journal</h3>
              <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Camera className="w-4 h-4 mr-2" />
                    Add Photo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Progress Photo</DialogTitle>
                    <DialogDescription>
                      Document your achievements and milestones
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...photoForm}>
                    <form className="space-y-4">
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Click to upload a photo</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                      <FormField
                        control={photoForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <select {...field} className="w-full border rounded-md p-2">
                                <option value="">Select category</option>
                                <option value="cooking">Cooking</option>
                                <option value="independence">Independence</option>
                                <option value="social">Social</option>
                                <option value="health">Health</option>
                                <option value="learning">Learning</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={photoForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us about this achievement or milestone..."
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={photoForm.control}
                        name="milestone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Milestone (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., First Time Cooking Alone" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1">Save Photo</Button>
                        <Button type="button" variant="outline" onClick={() => setShowPhotoDialog(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Photo Timeline */}
            <div className="space-y-4">
              {progressPhotos.map((photo) => (
                <Card key={photo.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{photo.category}</Badge>
                        {photo.milestone && (
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                            <Star className="w-3 h-3 mr-1" />
                            {photo.milestone}
                          </Badge>
                        )}
                        <span className="text-sm text-gray-500">{formatTimeAgo(photo.takenAt)}</span>
                      </div>
                      <p className="text-gray-700">{photo.description}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
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
                        <Badge className={getDifficultyColor(challenge.difficulty)}>
                          {challenge.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
                      
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{challenge.progress}%</span>
                        </div>
                        <Progress value={challenge.progress} />
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Requirements:</div>
                        {challenge.requirements.map((req, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle 
                              className={`w-4 h-4 ${
                                index < (challenge.requirements.length * challenge.progress / 100) 
                                  ? 'text-green-500' 
                                  : 'text-gray-300'
                              }`} 
                            />
                            <span className={
                              index < (challenge.requirements.length * challenge.progress / 100)
                                ? 'text-green-700 line-through'
                                : 'text-gray-700'
                            }>
                              {req}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {challenge.points} points
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {challenge.timeframe}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {challenge.isCompleted ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <Trophy className="w-3 h-3 mr-1" />
                          Complete
                        </Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => joinChallenge(challenge.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Target className="w-4 h-4 mr-2" />
                          Join Challenge
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedChallenge(challenge)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="community" className="space-y-4 mt-4">
            {/* Share Story Button */}
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Community Stories</h3>
              <Dialog open={showStoryDialog} onOpenChange={setShowStoryDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Share Story
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Share Your Story</DialogTitle>
                    <DialogDescription>
                      Inspire others by sharing your journey and achievements
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...storyForm}>
                    <form className="space-y-4">
                      <FormField
                        control={storyForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Story Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., How I Learned to Cook My Favorite Meal" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={storyForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <select {...field} className="w-full border rounded-md p-2">
                                <option value="">Select category</option>
                                <option value="cooking">Cooking</option>
                                <option value="employment">Employment</option>
                                <option value="social">Social</option>
                                <option value="financial">Financial</option>
                                <option value="independence">Independence</option>
                                <option value="health">Health</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={storyForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Story</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell your story... What challenge did you face? How did you overcome it? What advice would you give others?"
                                className="min-h-32"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={storyForm.control}
                        name="isAnonymous"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Share anonymously</FormLabel>
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2">
                        <Button type="button" onClick={shareStory} className="flex-1">
                          Share Story
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowStoryDialog(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Peer Stories */}
            <div className="space-y-4">
              {peerStories.map((story) => (
                <Card key={story.id} className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        {story.isAnonymous ? "?" : story.authorName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{story.authorName}</span>
                        <Badge variant="outline">{story.category}</Badge>
                        <span className="text-sm text-gray-500">{formatTimeAgo(story.createdAt)}</span>
                      </div>
                      <h4 className="font-medium text-lg mb-2">{story.title}</h4>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4 leading-relaxed">{story.content}</p>
                  
                  <div className="flex items-center justify-between">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => likeStory(story.id)}
                      className={story.isLiked ? "text-red-500" : ""}
                    >
                      <Heart className={`w-4 h-4 mr-1 ${story.isLiked ? 'fill-current' : ''}`} />
                      {story.likes}
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Share2 className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}