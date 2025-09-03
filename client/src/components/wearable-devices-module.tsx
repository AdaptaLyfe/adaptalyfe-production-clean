import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Watch, 
  Heart, 
  Activity, 
  Moon, 
  Battery, 
  Smartphone, 
  Plus, 
  Settings, 
  Wifi, 
  WifiOff,
  Calendar,
  BarChart3,
  Target
} from "lucide-react";

interface WearableDevice {
  id: number;
  name: string;
  type: string;
  brand: string;
  model: string;
  isConnected: boolean;
  batteryLevel?: number;
  lastSync?: string;
  features: string[];
}

interface HealthMetric {
  id: number;
  metricType: string;
  value: number;
  unit: string;
  recordedAt: string;
  context?: string;
}

interface ActivitySession {
  id: number;
  activityType: string;
  duration: number;
  caloriesBurned?: number;
  steps?: number;
  startedAt: string;
}

interface SleepSession {
  id: number;
  sleepDate: string;
  totalSleepDuration?: number;
  sleepScore?: number;
  quality?: string;
}

function WearableDevicesModule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);

  // Fetch user's wearable devices
  const { data: devices = [], isLoading: devicesLoading } = useQuery({
    queryKey: ["/api/wearable-devices"],
    retry: false,
  });

  // Fetch health metrics
  const { data: healthMetrics = [], isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/health-metrics"],
    retry: false,
  });

  // Fetch recent activity sessions
  const { data: activitySessions = [], isLoading: activityLoading } = useQuery({
    queryKey: ["/api/activity-sessions"],
    retry: false,
  });

  // Fetch sleep data
  const { data: sleepSessions = [], isLoading: sleepLoading } = useQuery({
    queryKey: ["/api/sleep-sessions"],
    retry: false,
  });

  // Sync device mutation
  const syncDeviceMutation = useMutation({
    mutationFn: async (deviceId: number) => {
      return await apiRequest("POST", `/api/wearable-devices/${deviceId}/sync`);
    },
    onSuccess: () => {
      toast({
        title: "Device Synced",
        description: "Your wearable device has been synced successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sleep-sessions"] });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync your device. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Get device icon based on brand and type
  const getDeviceIcon = (type: string, brand: string) => {
    if (brand?.toLowerCase() === "samsung") {
      return <Watch className="w-6 h-6 text-blue-600" />;
    }
    if (brand?.toLowerCase() === "apple") {
      return <Watch className="w-6 h-6 text-gray-800" />;
    }
    if (brand?.toLowerCase() === "fitbit") {
      return <Activity className="w-6 h-6 text-green-600" />;
    }
    
    switch (type) {
      case "smartwatch":
        return <Watch className="w-6 h-6" />;
      case "fitness_tracker":
        return <Activity className="w-6 h-6" />;
      default:
        return <Smartphone className="w-6 h-6" />;
    }
  };

  // Get latest metric value
  const getLatestMetric = (type: string) => {
    if (!healthMetrics || !Array.isArray(healthMetrics)) return "No data";
    const metric = healthMetrics.find((m: any) => m.metricType === type);
    return metric ? `${metric.value} ${metric.unit}` : "No data";
  };

  // Get today's activity summary
  const getTodayActivity = () => {
    if (!activitySessions || !Array.isArray(activitySessions)) return { count: 0, calories: 0 };
    const today = new Date().toDateString();
    const todayActivities = activitySessions.filter((session: any) => 
      new Date(session.startedAt).toDateString() === today
    );
    
    const totalMinutes = todayActivities.reduce((sum: number, session: ActivitySession) => 
      sum + session.duration, 0
    );
    const totalCalories = todayActivities.reduce((sum: number, session: ActivitySession) => 
      sum + (session.caloriesBurned || 0), 0
    );

    return { totalMinutes, totalCalories, sessions: todayActivities.length };
  };

  // Get recent sleep data
  const getRecentSleep = () => {
    if (sleepSessions.length === 0) return null;
    const recent = sleepSessions[0] as SleepSession;
    return {
      duration: recent.totalSleepDuration ? Math.round(recent.totalSleepDuration / 60) : 0,
      score: recent.sleepScore || 0,
      quality: recent.quality || "Unknown"
    };
  };

  const todayActivity = getTodayActivity();
  const recentSleep = getRecentSleep();

  if (devicesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Watch className="w-5 h-5" />
            Wearable Devices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Devices Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Watch className="w-5 h-5" />
            Wearable Devices
          </CardTitle>
          <CardDescription>
            Connect and manage your health and fitness devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-8">
              <Watch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Devices Connected</h3>
              <p className="text-gray-500 mb-4">
                Connect your smartwatch or fitness tracker to start tracking your health metrics.
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Device
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {devices.map((device: WearableDevice) => (
                <Card key={device.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedDevice(device.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getDeviceIcon(device.type, device.brand)}
                        <div>
                          <h4 className="font-medium">{device.name}</h4>
                          <p className="text-sm text-gray-500">{device.brand} {device.model}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {device.isConnected ? (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                            <Wifi className="w-3 h-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500 border-gray-200">
                            <WifiOff className="w-3 h-3 mr-1" />
                            Offline
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {device.batteryLevel && (
                      <div className="flex items-center gap-2 mb-3">
                        <Battery className="w-4 h-4 text-gray-500" />
                        <Progress value={device.batteryLevel} className="flex-1" />
                        <span className="text-sm text-gray-500">{device.batteryLevel}%</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {device.lastSync ? `Synced ${new Date(device.lastSync).toLocaleDateString()}` : "Never synced"}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          syncDeviceMutation.mutate(device.id);
                        }}
                        disabled={syncDeviceMutation.isPending}
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        Sync
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Metrics Dashboard */}
      {devices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Health Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="sleep">Sleep</TabsTrigger>
                <TabsTrigger value="goals">Goals</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Heart className="w-8 h-8 text-red-500" />
                        <div>
                          <p className="text-sm text-gray-500">Heart Rate</p>
                          <p className="text-2xl font-bold">{getLatestMetric("heart_rate")}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Activity className="w-8 h-8 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-500">Steps Today</p>
                          <p className="text-2xl font-bold">{getLatestMetric("steps")}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Moon className="w-8 h-8 text-purple-500" />
                        <div>
                          <p className="text-sm text-gray-500">Sleep Last Night</p>
                          <p className="text-2xl font-bold">
                            {recentSleep ? `${recentSleep.duration}h` : "No data"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Today's Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Workout Sessions</span>
                          <span className="font-medium">{todayActivity.sessions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Total Minutes</span>
                          <span className="font-medium">{todayActivity.totalMinutes} min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Calories Burned</span>
                          <span className="font-medium">{todayActivity.totalCalories} cal</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Workouts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {activitySessions.slice(0, 3).map((session: ActivitySession) => (
                          <div key={session.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div>
                              <p className="font-medium capitalize">{session.activityType}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(session.startedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{session.duration} min</p>
                              <p className="text-sm text-gray-500">{session.caloriesBurned || 0} cal</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="sleep" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Sleep Quality</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {recentSleep ? (
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Duration</span>
                            <span className="font-medium">{recentSleep.duration} hours</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Sleep Score</span>
                            <span className="font-medium">{recentSleep.score}/100</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Quality</span>
                            <Badge variant="outline" className="capitalize">{recentSleep.quality}</Badge>
                          </div>
                          <Progress value={recentSleep.score} className="mt-3" />
                        </div>
                      ) : (
                        <p className="text-gray-500">No sleep data available</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Sleep Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {sleepSessions.slice(0, 3).map((session: SleepSession) => (
                          <div key={session.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div>
                              <p className="font-medium">
                                {new Date(session.sleepDate).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-gray-500 capitalize">{session.quality || "Unknown"}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {session.totalSleepDuration ? Math.round(session.totalSleepDuration / 60) : 0}h
                              </p>
                              <p className="text-sm text-gray-500">{session.sleepScore || 0}/100</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="goals" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Daily Goals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-gray-500">Steps</span>
                            <span className="font-medium">7,500 / 10,000</span>
                          </div>
                          <Progress value={75} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-gray-500">Active Minutes</span>
                            <span className="font-medium">20 / 30</span>
                          </div>
                          <Progress value={67} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-gray-500">Sleep</span>
                            <span className="font-medium">7h / 8h</span>
                          </div>
                          <Progress value={87} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Weekly Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Days Active</span>
                          <span className="font-medium">5 / 7 days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Average Sleep</span>
                          <span className="font-medium">7.2 hours</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Total Workouts</span>
                          <span className="font-medium">4 sessions</span>
                        </div>
                        <Badge className="w-full justify-center mt-3" variant="outline">
                          Great week! Keep it up 🎯
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default WearableDevicesModule;