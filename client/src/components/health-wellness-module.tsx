import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatTimeAgo } from "@/lib/utils";
import { 
  Pill, 
  Moon, 
  Dumbbell, 
  Droplets, 
  Plus, 
  CheckCircle, 
  Clock, 
  Calendar,
  TrendingUp,
  Heart,
  Target,
  Star
} from "lucide-react";
import { z } from "zod";

// Mock data structures for now - will be replaced with actual API calls
const medicationSchema = z.object({
  name: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  instructions: z.string().optional(),
  reminderTime: z.string().min(1, "Reminder time is required"),
  prescribedBy: z.string().optional(),
});

const sleepLogSchema = z.object({
  bedtime: z.string().min(1, "Bedtime is required"),
  wakeTime: z.string().min(1, "Wake time is required"),
  quality: z.number().min(1).max(5),
  notes: z.string().optional(),
});

const exerciseLogSchema = z.object({
  activityType: z.string().min(1, "Activity type is required"),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  intensity: z.string().min(1, "Intensity is required"),
  notes: z.string().optional(),
});

export default function HealthWellnessModule() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showMedicationDialog, setShowMedicationDialog] = useState(false);
  const [showSleepDialog, setShowSleepDialog] = useState(false);
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  const [waterCount, setWaterCount] = useState(0);
  const waterGoal = 8;

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data - replace with real API calls
  const medications = [
    {
      id: 1,
      name: "Vitamin D",
      dosage: "1000 IU",
      frequency: "Daily",
      reminderTime: "08:00",
      nextDue: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      taken: false
    },
    {
      id: 2,
      name: "Omega-3",
      dosage: "500mg",
      frequency: "Daily",
      reminderTime: "08:00",
      nextDue: new Date(Date.now() + 2 * 60 * 60 * 1000),
      taken: true
    }
  ];

  const recentSleep = [
    { date: "2025-06-28", hours: 7.5, quality: 4, bedtime: "22:30", wakeTime: "06:00" },
    { date: "2025-06-27", hours: 8.0, quality: 5, bedtime: "22:00", wakeTime: "06:00" },
    { date: "2025-06-26", hours: 6.5, quality: 3, bedtime: "23:30", wakeTime: "06:00" }
  ];

  const recentExercise = [
    { date: "2025-06-28", activity: "Walking", duration: 30, intensity: "Moderate" },
    { date: "2025-06-27", activity: "Yoga", duration: 20, intensity: "Low" },
    { date: "2025-06-25", activity: "Swimming", duration: 45, intensity: "High" }
  ];

  // Form handlers
  const medicationForm = useForm({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      name: "",
      dosage: "",
      frequency: "daily",
      instructions: "",
      reminderTime: "08:00",
      prescribedBy: "",
    },
  });

  const sleepForm = useForm({
    resolver: zodResolver(sleepLogSchema),
    defaultValues: {
      bedtime: "",
      wakeTime: "",
      quality: 3,
      notes: "",
    },
  });

  const exerciseForm = useForm({
    resolver: zodResolver(exerciseLogSchema),
    defaultValues: {
      activityType: "",
      duration: 30,
      intensity: "moderate",
      notes: "",
    },
  });

  const handleMedicationTaken = (medicationId: number) => {
    toast({
      title: "Medication taken!",
      description: "Great job staying on top of your health routine.",
    });
  };

  const addWaterGlass = () => {
    if (waterCount < waterGoal + 3) {
      setWaterCount(prev => prev + 1);
      if (waterCount + 1 >= waterGoal) {
        toast({
          title: "Daily water goal reached!",
          description: "Excellent hydration today! Keep it up.",
        });
      }
    }
  };

  const calculateSleepAverage = () => {
    return recentSleep.reduce((acc, sleep) => acc + sleep.hours, 0) / recentSleep.length;
  };

  const calculateWeeklyExercise = () => {
    return recentExercise.reduce((acc, exercise) => acc + exercise.duration, 0);
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          Health & Wellness
        </CardTitle>
        <CardDescription>
          Track your health habits and build wellness routines
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="medications">Meds</TabsTrigger>
            <TabsTrigger value="sleep">Sleep</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Daily Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-sm">Water Intake</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{waterCount}/{waterGoal}</span>
                  <Button size="sm" onClick={addWaterGlass}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <Progress value={(waterCount / waterGoal) * 100} className="mt-2" />
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-sm">Sleep Average</span>
                </div>
                <div className="text-2xl font-bold">{calculateSleepAverage().toFixed(1)}h</div>
                <div className="text-sm text-gray-600 mt-1">Last 7 days</div>
              </Card>
            </div>

            {/* Upcoming Medications */}
            <Card className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Pill className="w-4 h-4 text-green-500" />
                Today's Medications
              </h3>
              <div className="space-y-2">
                {medications.map((med) => (
                  <div key={med.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{med.name}</div>
                      <div className="text-sm text-gray-600">{med.dosage} • {med.reminderTime}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {med.taken ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Taken
                        </Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => handleMedicationTaken(med.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark Taken
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Weekly Activity Summary */}
            <Card className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                This Week's Progress
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Exercise Minutes</div>
                  <div className="text-xl font-bold">{calculateWeeklyExercise()}</div>
                  <div className="text-sm text-green-600">+15 from last week</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Sleep Quality</div>
                  <div className="text-xl font-bold flex items-center gap-1">
                    4.0
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  </div>
                  <div className="text-sm text-green-600">Improving</div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="medications" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">My Medications</h3>
              <Dialog open={showMedicationDialog} onOpenChange={setShowMedicationDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Medication
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Medication</DialogTitle>
                    <DialogDescription>
                      Set up reminders for your medication schedule
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...medicationForm}>
                    <form className="space-y-4">
                      <FormField
                        control={medicationForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medication Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Vitamin D" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={medicationForm.control}
                          name="dosage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dosage</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 1000 IU" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={medicationForm.control}
                          name="frequency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Frequency</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select frequency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="twice_daily">Twice Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="as_needed">As Needed</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={medicationForm.control}
                        name="reminderTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reminder Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={medicationForm.control}
                        name="instructions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instructions (Optional)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Take with food, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1">Save Medication</Button>
                        <Button type="button" variant="outline" onClick={() => setShowMedicationDialog(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {medications.map((med) => (
                <Card key={med.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{med.name}</h4>
                      <p className="text-sm text-gray-600">{med.dosage} • {med.frequency}</p>
                      <p className="text-xs text-gray-500">Next reminder: {med.reminderTime}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {med.taken ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Taken Today
                        </Badge>
                      ) : (
                        <Button size="sm" onClick={() => handleMedicationTaken(med.id)}>
                          Mark Taken
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sleep" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Sleep Tracking</h3>
              <Dialog open={showSleepDialog} onOpenChange={setShowSleepDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Log Sleep
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Log Sleep</DialogTitle>
                    <DialogDescription>
                      Track your sleep patterns to improve rest quality
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...sleepForm}>
                    <form className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={sleepForm.control}
                          name="bedtime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bedtime</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={sleepForm.control}
                          name="wakeTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Wake Time</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={sleepForm.control}
                        name="quality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sleep Quality (1-5)</FormLabel>
                            <FormControl>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Rate your sleep" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1 - Very Poor</SelectItem>
                                  <SelectItem value="2">2 - Poor</SelectItem>
                                  <SelectItem value="3">3 - Fair</SelectItem>
                                  <SelectItem value="4">4 - Good</SelectItem>
                                  <SelectItem value="5">5 - Excellent</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={sleepForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="How did you feel? Any factors affecting sleep?" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1">Save Sleep Log</Button>
                        <Button type="button" variant="outline" onClick={() => setShowSleepDialog(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {recentSleep.map((sleep, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{sleep.date}</h4>
                      <p className="text-sm text-gray-600">
                        {sleep.bedtime} - {sleep.wakeTime} ({sleep.hours}h)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < sleep.quality ? 'text-yellow-500 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Exercise & Activity</h3>
              <Dialog open={showExerciseDialog} onOpenChange={setShowExerciseDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Log Activity
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Log Exercise</DialogTitle>
                    <DialogDescription>
                      Track your physical activities and movement
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...exerciseForm}>
                    <form className="space-y-4">
                      <FormField
                        control={exerciseForm.control}
                        name="activityType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Activity Type</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Walking, Swimming, Yoga" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={exerciseForm.control}
                          name="duration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duration (minutes)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="30"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={exerciseForm.control}
                          name="intensity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Intensity</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select intensity" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="moderate">Moderate</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={exerciseForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="How did you feel? Any achievements?" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1">Save Activity</Button>
                        <Button type="button" variant="outline" onClick={() => setShowExerciseDialog(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {recentExercise.map((exercise, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{exercise.activity}</h4>
                      <p className="text-sm text-gray-600">
                        {exercise.duration} minutes • {exercise.intensity} intensity
                      </p>
                      <p className="text-xs text-gray-500">{exercise.date}</p>
                    </div>
                    <div className="flex items-center">
                      <Dumbbell className="w-5 h-5 text-orange-500" />
                    </div>
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