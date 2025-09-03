import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Gift, 
  Star, 
  Trophy, 
  Coins, 
  Plus, 
  Clock, 
  Award,
  Target,
  Zap,
  Heart,
  Gamepad2,
  ShoppingBag,
  MapPin,
  DollarSign
} from "lucide-react";

const REWARD_CATEGORIES = [
  { value: "privilege", label: "Privilege", icon: Star, color: "bg-yellow-100 text-yellow-800" },
  { value: "item", label: "Item/Purchase", icon: ShoppingBag, color: "bg-blue-100 text-blue-800" },
  { value: "activity", label: "Activity/Experience", icon: MapPin, color: "bg-green-100 text-green-800" },
  { value: "money", label: "Money/Allowance", icon: DollarSign, color: "bg-purple-100 text-purple-800" },
  { value: "special", label: "Special Treat", icon: Heart, color: "bg-pink-100 text-pink-800" }
];

const REWARD_TYPES = [
  { value: "immediate", label: "Immediate" },
  { value: "delayed", label: "Delayed" },
  { value: "recurring", label: "Recurring" }
];

const rewardSchema = z.object({
  userId: z.number(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  pointsRequired: z.number().min(1, "Points must be at least 1"),
  category: z.string().min(1, "Category is required"),
  rewardType: z.string().min(1, "Type is required"),
  value: z.string().optional(),
  maxRedemptions: z.number().optional(),
  iconName: z.string().default("gift"),
  color: z.string().default("#3b82f6")
});

interface Reward {
  id: number;
  userId: number;
  title: string;
  description: string;
  pointsRequired: number;
  category: string;
  rewardType: string;
  value?: string;
  maxRedemptions?: number;
  iconName: string;
  color: string;
  isActive: boolean;
  createdAt: string;
}

interface UserPointsBalance {
  userId: number;
  availablePoints: number;
  totalEarned: number;
  totalSpent: number;
}

interface PointsTransaction {
  id: number;
  userId: number;
  points: number;
  description: string;
  source: string;
  createdAt: string;
}

export default function RewardsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  // Fetch rewards for the user - Simple approach
  const { data: rewardsData, isLoading: rewardsLoading, refetch: refetchRewards, error: rewardsError } = useQuery({
    queryKey: ["/api/rewards"],
    queryFn: async () => {
      console.log("=== CUSTOM QUERY FUNCTION ===");
      const response = await fetch("/api/rewards", {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache"
        }
      });
      
      console.log("Custom query response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Custom query failed:", response.status, errorText);
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Custom query response data:", data);
      console.log("Data is array:", Array.isArray(data));
      console.log("Data length:", data?.length);
      return data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    retry: false,
  });

  // Ensure rewards is always an array and log for debugging
  const rewards = Array.isArray(rewardsData) ? rewardsData : [];
  
  // Debug logging
  console.log("=== FRONTEND REWARDS DEBUG ===");
  console.log("Query isLoading:", rewardsLoading);
  console.log("Query error:", rewardsError);
  console.log("Rewards data from API:", rewardsData);
  console.log("Processed rewards array:", rewards);
  console.log("Rewards array length:", rewards.length);
  
  // Force refetch if we have no data but no error and not loading
  useEffect(() => {
    if (!rewardsLoading && !rewardsData && !rewardsError) {
      console.log("Force refetching rewards - no data, no error, not loading");
      refetchRewards();
    }
  }, [rewardsLoading, rewardsData, rewardsError, refetchRewards]);



  // Fetch user's points balance
  const { data: pointsBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ["/api/points/balance"],
  });

  // Fetch points transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/points/transactions"],
  });

  // Create reward mutation (for caregivers)
  const createRewardMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/rewards", data);
    },
    onSuccess: async (newReward) => {
      console.log("Reward created successfully:", newReward);
      // Clear cache and force immediate refetch
      queryClient.removeQueries({ queryKey: ["/api/rewards"] });
      await queryClient.refetchQueries({ queryKey: ["/api/rewards"] });
      // Also try invalidating
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({ title: "Success", description: "Reward created successfully!" });
    },
    onError: (error) => {
      console.error("Reward creation error:", error);
      toast({ title: "Error", description: "Failed to create reward", variant: "destructive" });
    },
  });

  // Redeem reward mutation
  const redeemMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/rewards/redeem", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points/transactions"] });
      setIsRedeemDialogOpen(false);
      setSelectedReward(null);
      toast({ title: "Success", description: "Reward redeemed! Waiting for caregiver approval." });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to redeem reward", variant: "destructive" });
    },
  });

  const form = useForm({
    resolver: zodResolver(rewardSchema),
    defaultValues: {
      userId: 1,
      title: "",
      description: "",
      pointsRequired: 10,
      category: "",
      rewardType: "immediate",
      value: "",
      maxRedemptions: undefined,
      iconName: "gift",
      color: "#3b82f6"
    },
  });

  const onSubmit = (data: any) => {
    createRewardMutation.mutate(data);
  };

  const handleRedeem = (reward: Reward) => {
    if (!pointsBalance || pointsBalance.availablePoints < reward.pointsRequired) {
      toast({ 
        title: "Not enough points", 
        description: `You need ${reward.pointsRequired} points but only have ${pointsBalance?.availablePoints || 0}.`,
        variant: "destructive" 
      });
      return;
    }

    setSelectedReward(reward);
    setIsRedeemDialogOpen(true);
  };

  const confirmRedeem = () => {
    if (!selectedReward) return;
    
    redeemMutation.mutate({
      rewardId: selectedReward.id,
      pointsSpent: selectedReward.pointsRequired,
      status: "pending"
    });
  };

  if (rewardsLoading || balanceLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Points Balance */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Rewards & Points
          </h1>
          <p className="text-gray-600 mt-2">Earn points and redeem amazing rewards!</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Points Balance Card */}
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Coins className="w-8 h-8" />
                <div>
                  <p className="text-sm opacity-90">Available Points</p>
                  <p className="text-2xl font-bold">{pointsBalance?.availablePoints || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Reward
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" aria-describedby="create-reward-description">
                <DialogHeader>
                  <DialogTitle>Create New Reward</DialogTitle>
                  <p id="create-reward-description" className="text-sm text-gray-600">
                    Set up a new reward for users to earn with their points
                  </p>
                </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reward Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Extra screen time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="30 minutes of extra screen time on weekends" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="pointsRequired"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points Required</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {REWARD_CATEGORIES.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="rewardType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {REWARD_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="$10 or 30 minutes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createRewardMutation.isPending}
                      className="bg-vibrant-green hover:bg-green-600 text-black font-bold border-2 border-green-700 shadow-lg"
                    >
                      {createRewardMutation.isPending ? "Creating..." : "Create Reward"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>

      <Tabs defaultValue="rewards" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rewards">Available Rewards</TabsTrigger>
          <TabsTrigger value="progress">My Progress</TabsTrigger>
          <TabsTrigger value="history">Point History</TabsTrigger>
        </TabsList>

        <TabsContent value="rewards" className="space-y-4">
          {rewards.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No rewards available yet</h3>
                <p className="text-gray-600 mb-4">Ask your caregiver to create some exciting rewards for you!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((reward: Reward) => {
                const categoryInfo = REWARD_CATEGORIES.find(cat => cat.value === reward.category);
                const IconComponent = categoryInfo?.icon || Gift;
                const canAfford = (pointsBalance?.availablePoints || 0) >= reward.pointsRequired;

                return (
                  <Card key={reward.id} className={`relative ${canAfford ? 'ring-2 ring-green-200' : 'opacity-75'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-5 h-5" style={{ color: reward.color }} />
                          <CardTitle className="text-lg">{reward.title}</CardTitle>
                        </div>
                        {categoryInfo && (
                          <Badge variant="secondary" className={categoryInfo.color}>
                            {categoryInfo.label}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-gray-600 text-sm">{reward.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Coins className="w-4 h-4 text-yellow-500" />
                          <span className="font-semibold">{reward.pointsRequired}</span>
                          <span className="text-sm text-gray-500">points</span>
                        </div>
                        {reward.value && (
                          <span className="text-sm text-gray-500">Value: {reward.value}</span>
                        )}
                      </div>

                      <Button 
                        onClick={() => handleRedeem(reward)}
                        disabled={!canAfford || redeemMutation.isPending}
                        className="w-full"
                        variant={canAfford ? "default" : "secondary"}
                      >
                        {!canAfford ? "Not enough points" : "Redeem"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Points Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Earned:</span>
                  <span className="font-semibold">{pointsBalance?.totalEarned || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Spent:</span>
                  <span className="font-semibold">{pointsBalance?.totalSpent || 0}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>Available:</span>
                  <span className="font-bold text-green-600">{pointsBalance?.availablePoints || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  Next Milestone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">100 Points</p>
                  <p className="text-sm text-gray-600">Special Achievement Badge</p>
                </div>
                <Progress value={((pointsBalance?.totalEarned || 0) % 100)} className="w-full" />
                <p className="text-sm text-center text-gray-500">
                  {100 - ((pointsBalance?.totalEarned || 0) % 100)} points to go!
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {transactionsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No point history yet</h3>
                <p className="text-gray-600">Start completing tasks to earn your first points!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction: PointsTransaction) => (
                <Card key={transaction.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(transaction.createdAt).toLocaleDateString()} • Source: {transaction.source}
                        </p>
                      </div>
                      <div className={`text-lg font-bold ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.points > 0 ? '+' : ''}{transaction.points}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Redeem Confirmation Dialog */}
      <Dialog open={isRedeemDialogOpen} onOpenChange={setIsRedeemDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" aria-describedby="redeem-reward-description">
          <DialogHeader>
            <DialogTitle>Confirm Reward Redemption</DialogTitle>
            <p id="redeem-reward-description" className="text-sm text-gray-600">
              Review and confirm your reward redemption details
            </p>
          </DialogHeader>
          {selectedReward && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">{selectedReward.title}</h3>
                <p className="text-gray-600">{selectedReward.description}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Cost:</strong> {selectedReward.pointsRequired} points<br />
                  <strong>Your balance after:</strong> {(pointsBalance?.availablePoints || 0) - selectedReward.pointsRequired} points
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsRedeemDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmRedeem} disabled={redeemMutation.isPending}>
                  {redeemMutation.isPending ? "Redeeming..." : "Confirm Redemption"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}