import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck, MessageCircle, Share, Plus, Send, Users, Heart } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatTimeAgo } from "@/lib/utils";
import { useSubscriptionEnforcement } from "@/middleware/subscription-middleware";
import PremiumFeaturePrompt from "@/components/premium-feature-prompt";
import type { Caregiver, Message, User, DailyTask } from "@shared/schema";

const caregiverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
});

const messageSchema = z.object({
  caregiverId: z.number().min(1, "Please select a caregiver"),
  content: z.string().min(1, "Message cannot be empty"),
});

export default function Caregiver() {
  const { isPremiumUser } = useSubscriptionEnforcement();
  const { toast } = useToast();
  const [showCaregiverDialog, setCaregiverDialog] = useState(false);
  
  // Block access if trial expired and no active subscription
  if (!isPremiumUser) {
    return (
      <div className="container mx-auto p-6">
        <PremiumFeaturePrompt
          title="Caregiver Communication"
          description="Connect with your support network, share updates, and coordinate care. Subscribe to continue using Adaptalyfe's caregiver features."
          feature="caregiver"
          requiredPlan="family"
          className="max-w-md mx-auto mt-20"
        />
      </div>
    );
  }
  const [showMessageDialog, setMessageDialog] = useState(false);
  const [selectedCaregiver, setSelectedCaregiver] = useState<number | null>(null);

  const { data: caregivers = [], isLoading: caregiversLoading } = useQuery<Caregiver[]>({
    queryKey: ["/api/caregivers"],
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: tasks = [] } = useQuery<DailyTask[]>({
    queryKey: ["/api/daily-tasks"],
  });

  const caregiverForm = useForm({
    resolver: zodResolver(caregiverSchema),
    defaultValues: {
      name: "",
      relationship: "",
      email: "",
    },
  });

  const messageForm = useForm({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      caregiverId: 0,
      content: "",
    },
  });

  const createCaregiverMutation = useMutation({
    mutationFn: async (data: z.infer<typeof caregiverSchema>) => {
      return apiRequest("POST", "/api/caregivers", {
        ...data,
        email: data.email || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/caregivers"] });
      setCaregiverDialog(false);
      caregiverForm.reset();
      toast({
        title: "Caregiver added!",
        description: "Your support person has been added to your network.",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: z.infer<typeof messageSchema>) => {
      return apiRequest("POST", "/api/messages", {
        ...data,
        fromUser: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setMessageDialog(false);
      messageForm.reset();
      toast({
        title: "Message sent!",
        description: "Your message has been sent to your caregiver.",
      });
    },
  });

  const shareProgressMutation = useMutation({
    mutationFn: async () => {
      // Simulate sharing progress - in a real app this would send progress data
      return new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Progress shared!",
        description: "Your progress has been shared with your caregivers.",
      });
    },
  });

  const completedTasks = tasks.filter(task => task.isCompleted).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const messagesByCaregiver = messages.reduce((acc, message) => {
    if (!acc[message.caregiverId]) {
      acc[message.caregiverId] = [];
    }
    acc[message.caregiverId].push(message);
    return acc;
  }, {} as Record<number, Message[]>);

  const recentMessages = messages
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
    .slice(0, 5);

  if (caregiversLoading || messagesLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Support Network</h1>
        <p className="text-lg text-gray-600">
          Connect with your caregivers and support team to share your progress and get help when you need it.
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="border-t-4 border-calm-teal mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Heart className="text-calm-teal" size={24} />
              <span>Your Progress Today</span>
            </div>
            <Button
              className="bg-calm-teal hover:bg-calm-teal text-white"
              onClick={() => shareProgressMutation.mutate()}
              disabled={shareProgressMutation.isPending}
            >
              <Share size={16} className="mr-2" />
              Share Progress
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-calm-teal mb-2">{progressPercentage}%</div>
              <p className="text-sm text-gray-600">Daily Tasks Complete</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-sunny-orange mb-2">{user?.streakDays || 0}</div>
              <p className="text-sm text-gray-600">Day Streak</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-happy-purple mb-2">{caregivers.length}</div>
              <p className="text-sm text-gray-600">Support Connections</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Caregivers List */}
        <Card className="border-t-4 border-vibrant-green">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="text-vibrant-green" size={24} />
                <span>My Support Team</span>
              </div>
              <Dialog open={showCaregiverDialog} onOpenChange={setCaregiverDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-vibrant-green hover:bg-vibrant-green text-white">
                    <Plus size={16} className="mr-2" />
                    Add Caregiver
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Caregiver</DialogTitle>
                  </DialogHeader>
                  <Form {...caregiverForm}>
                    <form onSubmit={caregiverForm.handleSubmit((data) => createCaregiverMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={caregiverForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Mom, Dr. Smith" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={caregiverForm.control}
                        name="relationship"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select relationship" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="parent">Parent</SelectItem>
                                <SelectItem value="therapist">Therapist</SelectItem>
                                <SelectItem value="support worker">Support Worker</SelectItem>
                                <SelectItem value="family member">Family Member</SelectItem>
                                <SelectItem value="friend">Friend</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={caregiverForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="caregiver@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={createCaregiverMutation.isPending}>
                        Add Caregiver
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {caregivers.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No caregivers added yet. Add someone to your support team!
                </p>
              ) : (
                caregivers.map((caregiver) => (
                  <div key={caregiver.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-calm-teal rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {caregiver.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{caregiver.name}</h4>
                      <p className="text-sm text-gray-600 capitalize">
                        {caregiver.relationship}
                        {caregiver.email && ` • ${caregiver.email}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {messagesByCaregiver[caregiver.id]?.length || 0} messages
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-calm-teal text-calm-teal hover:bg-teal-50"
                      onClick={() => {
                        setSelectedCaregiver(caregiver.id);
                        messageForm.setValue("caregiverId", caregiver.id);
                        setMessageDialog(true);
                      }}
                    >
                      <MessageCircle size={16} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="border-t-4 border-bright-blue">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageCircle className="text-bright-blue" size={24} />
                <span>Messages</span>
              </div>
              <Dialog open={showMessageDialog} onOpenChange={setMessageDialog}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-bright-blue hover:bg-bright-blue text-white"
                    disabled={caregivers.length === 0}
                  >
                    <Send size={16} className="mr-2" />
                    Send Message
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Message</DialogTitle>
                  </DialogHeader>
                  <Form {...messageForm}>
                    <form onSubmit={messageForm.handleSubmit((data) => sendMessageMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={messageForm.control}
                        name="caregiverId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Send to</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select caregiver" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {caregivers.map((caregiver) => (
                                  <SelectItem key={caregiver.id} value={caregiver.id.toString()}>
                                    {caregiver.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={messageForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Type your message here..."
                                className="min-h-24"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={sendMessageMutation.isPending}>
                        Send Message
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMessages.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No messages yet. Send a message to start communicating!
                </p>
              ) : (
                recentMessages.map((message) => {
                  const caregiver = caregivers.find(c => c.id === message.caregiverId);
                  return (
                    <div 
                      key={message.id} 
                      className={`p-4 rounded-lg border-2 ${
                        message.fromUser 
                          ? "bg-blue-50 border-blue-200 ml-8" 
                          : "bg-teal-50 border-teal-200 mr-8"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 text-sm">
                          {message.fromUser ? "You" : caregiver?.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(new Date(message.sentAt))}
                        </span>
                      </div>
                      <p className="text-gray-700">{message.content}</p>
                    </div>
                  );
                })
              )}
            </div>
            
            {messages.length > 5 && (
              <div className="text-center mt-6">
                <Button variant="outline" className="border-bright-blue text-bright-blue hover:bg-blue-50">
                  View All Messages
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card className="border-t-4 border-sunny-orange mt-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <UserCheck className="text-sunny-orange" size={24} />
            <span>Getting Help</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">When to Reach Out</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• When you're feeling overwhelmed or stressed</li>
                <li>• If you need help with daily tasks</li>
                <li>• When you have questions about your progress</li>
                <li>• If you want to celebrate achievements</li>
                <li>• When you need emotional support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Communication Tips</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Be specific about what you need</li>
                <li>• Share your feelings openly and honestly</li>
                <li>• Ask questions if you don't understand</li>
                <li>• Celebrate your wins, big and small</li>
                <li>• Remember that asking for help is a sign of strength</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
