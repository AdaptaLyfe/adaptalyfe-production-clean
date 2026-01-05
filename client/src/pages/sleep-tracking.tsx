import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Moon, Sun, Clock, TrendingUp, Heart, Brain, Star, Award, Target, BarChart3, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { format, startOfWeek, endOfWeek, subDays, isToday } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SleepSession {
  id: number;
  userId: number;
  sleepDate: string;
  bedtime: string | null;
  sleepTime: string | null;
  wakeTime: string | null;
  totalSleepDuration: number | null;
  deepSleepDuration: number | null;
  lightSleepDuration: number | null;
  remSleepDuration: number | null;
  awakeDuration: number | null;
  sleepEfficiency: number | null;
  sleepScore: number | null;
  quality: string | null;
  notes: string | null;
  heartRateVariability: number | null;
  restingHeartRate: number | null;
}

interface SleepGoal {
  targetSleepDuration: number; // minutes
  targetBedtime: string; // HH:MM format
  targetWakeTime: string; // HH:MM format
}

export default function SleepTracking() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLogging, setIsLogging] = useState(false);
  const [sleepGoals, setSleepGoals] = useState<SleepGoal>({
    targetSleepDuration: 480, // 8 hours
    targetBedtime: '22:00',
    targetWakeTime: '06:00'
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sleep sessions
  const { data: sleepSessions = [], isLoading } = useQuery({
    queryKey: ['/api/sleep-sessions'],
    queryFn: () => apiRequest('GET', '/api/sleep-sessions').then(res => res.json())
  });

  // Fetch sleep session for selected date
  const { data: dailySession } = useQuery({
    queryKey: ['/api/sleep-sessions', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => apiRequest('GET', `/api/sleep-sessions/${format(selectedDate, 'yyyy-MM-dd')}`).then(res => res.json()),
    enabled: !!selectedDate
  });

  // Create/update sleep session mutation
  const createSleepSession = useMutation({
    mutationFn: (data: Partial<SleepSession>) =>
      apiRequest('POST', '/api/sleep-sessions', data).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sleep-sessions'] });
      toast({ title: 'Sleep session saved successfully!' });
      setIsLogging(false);
    },
    onError: () => {
      toast({ title: 'Failed to save sleep session', variant: 'destructive' });
    }
  });

  // Calculate sleep statistics
  const calculateStats = () => {
    if (!sleepSessions.length) return null;
    
    const recentSessions = sleepSessions.slice(-7); // Last 7 days
    const totalSleep = recentSessions.reduce((sum: number, session: SleepSession) => 
      sum + (session.totalSleepDuration || 0), 0);
    const avgSleepDuration = totalSleep / recentSessions.length;
    const avgSleepScore = recentSessions.reduce((sum: number, session: SleepSession) => 
      sum + (session.sleepScore || 0), 0) / recentSessions.length;
    const avgEfficiency = recentSessions.reduce((sum: number, session: SleepSession) => 
      sum + (session.sleepEfficiency || 0), 0) / recentSessions.length;

    return {
      avgSleepDuration: Math.round(avgSleepDuration),
      avgSleepScore: Math.round(avgSleepScore),
      avgEfficiency: Math.round(avgEfficiency),
      totalSessions: recentSessions.length,
      goalProgress: Math.round((avgSleepDuration / sleepGoals.targetSleepDuration) * 100)
    };
  };

  const stats = calculateStats();

  // Format time helpers
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '--';
    return format(new Date(timeString), 'h:mm a');
  };

  const getQualityColor = (quality: string | null) => {
    switch (quality) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSleepScoreColor = (score: number | null) => {
    if (!score) return 'bg-gray-500';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-100 rounded-full">
          <Moon className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sleep Routine</h1>
          <p className="text-gray-600 mt-1">Monitor your sleep patterns and improve your rest quality</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6" value={isLogging ? "log" : undefined} onValueChange={(value) => { if (value !== "log") setIsLogging(false); }}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="log">Log Sleep</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Sleep Duration</CardTitle>
                <Moon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? formatDuration(stats.avgSleepDuration) : '--'}
                </div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sleep Score</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? `${stats.avgSleepScore}/100` : '--'}
                </div>
                <p className="text-xs text-muted-foreground">Average quality</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sleep Efficiency</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? `${stats.avgEfficiency}%` : '--'}
                </div>
                <p className="text-xs text-muted-foreground">Time asleep vs time in bed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Goal Progress</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? `${stats.goalProgress}%` : '--'}
                </div>
                <Progress value={stats?.goalProgress || 0} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Recent Sleep Sessions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Sleep Sessions</CardTitle>
                <div className="p-2 border-2 border-blue-300 rounded-lg bg-blue-50 shadow-sm hover:shadow-md transition-shadow">
                  <Button 
                    onClick={() => {
                      setIsLogging(true);
                      // Force tab switch by updating the component
                      setTimeout(() => {
                        const logTab = document.querySelector('[data-state="active"][value="log"]');
                        if (!logTab) {
                          const logButton = document.querySelector('[value="log"]') as HTMLButtonElement;
                          if (logButton) logButton.click();
                        }
                      }, 100);
                    }} 
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Log Sleep
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sleepSessions.slice(-7).reverse().map((session: SleepSession) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Moon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {format(new Date(session.sleepDate), 'MMM dd, yyyy')}
                          {isToday(new Date(session.sleepDate)) && (
                            <Badge variant="outline" className="ml-2">Today</Badge>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatTime(session.bedtime)} - {formatTime(session.wakeTime)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-medium">{formatDuration(session.totalSleepDuration)}</p>
                        <p className="text-gray-500">Duration</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{session.sleepScore || '--'}/100</p>
                        <p className="text-gray-500">Score</p>
                      </div>
                      {session.quality && (
                        <Badge className={getQualityColor(session.quality)}>
                          {session.quality}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {sleepSessions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Moon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No sleep sessions recorded yet</p>
                    <div className="p-2 border-2 border-blue-300 rounded-lg bg-blue-50 shadow-sm hover:shadow-md transition-shadow mt-4 inline-block">
                      <Button onClick={() => setIsLogging(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                        Log your first sleep session
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Log Sleep Tab */}
        <TabsContent value="log" className="space-y-6">
          <SleepLoggingForm 
            onSubmit={(data) => createSleepSession.mutate(data)}
            isLoading={createSleepSession.isPending}
            selectedDate={selectedDate}
            dailySession={dailySession}
          />
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <SleepTrends sleepSessions={sleepSessions} />
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <SleepGoals 
            goals={sleepGoals}
            onUpdateGoals={setSleepGoals}
            stats={stats}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sleep Logging Form Component
function SleepLoggingForm({ 
  onSubmit, 
  isLoading, 
  selectedDate, 
  dailySession 
}: {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  selectedDate: Date;
  dailySession?: SleepSession;
}) {
  const [formData, setFormData] = useState({
    sleepDate: format(selectedDate, 'yyyy-MM-dd'),
    bedtime: '',
    sleepTime: '',
    wakeTime: '',
    quality: '',
    notes: ''
  });

  useEffect(() => {
    if (dailySession) {
      setFormData({
        sleepDate: dailySession.sleepDate,
        bedtime: dailySession.bedtime ? format(new Date(dailySession.bedtime), 'HH:mm') : '',
        sleepTime: dailySession.sleepTime ? format(new Date(dailySession.sleepTime), 'HH:mm') : '',
        wakeTime: dailySession.wakeTime ? format(new Date(dailySession.wakeTime), 'HH:mm') : '',
        quality: dailySession.quality || '',
        notes: dailySession.notes || ''
      });
    }
  }, [dailySession]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const sleepData = {
      ...formData,
      bedtime: formData.bedtime ? new Date(`${formData.sleepDate}T${formData.bedtime}:00`).toISOString() : null,
      sleepTime: formData.sleepTime ? new Date(`${formData.sleepDate}T${formData.sleepTime}:00`).toISOString() : null,
      wakeTime: formData.wakeTime ? new Date(`${formData.sleepDate}T${formData.wakeTime}:00`).toISOString() : null,
    };
    
    onSubmit(sleepData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Sleep Session</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="sleepDate">Sleep Date</Label>
              <Input
                id="sleepDate"
                type="date"
                value={formData.sleepDate}
                onChange={(e) => setFormData({ ...formData, sleepDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="quality">Sleep Quality</Label>
              <select
                id="quality"
                value={formData.quality}
                onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select quality</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="bedtime">Bedtime</Label>
              <Input
                id="bedtime"
                type="time"
                value={formData.bedtime}
                onChange={(e) => setFormData({ ...formData, bedtime: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="sleepTime">Time Fell Asleep</Label>
              <Input
                id="sleepTime"
                type="time"
                value={formData.sleepTime}
                onChange={(e) => setFormData({ ...formData, sleepTime: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="wakeTime">Wake Time</Label>
              <Input
                id="wakeTime"
                type="time"
                value={formData.wakeTime}
                onChange={(e) => setFormData({ ...formData, wakeTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="How did you feel? What might have affected your sleep?"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="p-3 border-2 border-green-300 rounded-lg bg-green-50 shadow-sm hover:shadow-md transition-shadow">
            <Button type="submit" disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-lg">
              {isLoading ? 'Saving...' : 'Save Sleep Session'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Sleep Trends Component
function SleepTrends({ sleepSessions }: { sleepSessions: SleepSession[] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sleep Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sleepSessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Not enough data to show trends</p>
                <p className="text-sm">Log at least 3 sleep sessions to see trends</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-medium mb-3">Sleep Duration Trend</h3>
                  <div className="space-y-2">
                    {sleepSessions.slice(-7).reverse().map((session, index) => (
                      <div key={session.id} className="flex items-center justify-between">
                        <span className="text-sm">{format(new Date(session.sleepDate), 'MMM dd')}</span>
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-2 bg-blue-500 rounded"
                            style={{ 
                              width: `${Math.min((session.totalSleepDuration || 0) / 600 * 100, 100)}px` 
                            }}
                          />
                          <span className="text-sm font-medium w-12">
                            {session.totalSleepDuration ? `${Math.round(session.totalSleepDuration / 60)}h` : '--'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-3">Sleep Quality Trend</h3>
                  <div className="space-y-2">
                    {sleepSessions.slice(-7).reverse().map((session) => (
                      <div key={session.id} className="flex items-center justify-between">
                        <span className="text-sm">{format(new Date(session.sleepDate), 'MMM dd')}</span>
                        <Badge className={`${session.quality ? getQualityColor(session.quality) : 'bg-gray-100 text-gray-800'}`}>
                          {session.quality || 'Not rated'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Sleep Goals Component
function SleepGoals({ 
  goals, 
  onUpdateGoals, 
  stats 
}: { 
  goals: SleepGoal; 
  onUpdateGoals: (goals: SleepGoal) => void;
  stats: any;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sleep Goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="targetDuration">Target Sleep Duration</Label>
              <select
                id="targetDuration"
                value={goals.targetSleepDuration}
                onChange={(e) => onUpdateGoals({ ...goals, targetSleepDuration: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-md"
              >
                <option value={420}>7 hours</option>
                <option value={450}>7.5 hours</option>
                <option value={480}>8 hours</option>
                <option value={510}>8.5 hours</option>
                <option value={540}>9 hours</option>
              </select>
            </div>
            <div>
              <Label htmlFor="targetBedtime">Target Bedtime</Label>
              <Input
                id="targetBedtime"
                type="time"
                value={goals.targetBedtime}
                onChange={(e) => onUpdateGoals({ ...goals, targetBedtime: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="targetWakeTime">Target Wake Time</Label>
              <Input
                id="targetWakeTime"
                type="time"
                value={goals.targetWakeTime}
                onChange={(e) => onUpdateGoals({ ...goals, targetWakeTime: e.target.value })}
              />
            </div>
          </div>

          {stats && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium mb-2">Progress This Week</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Sleep Duration Goal</span>
                  <span className="font-medium">{stats.goalProgress}%</span>
                </div>
                <Progress value={stats.goalProgress} />
                <p className="text-sm text-gray-600">
                  Average: {formatDuration(stats.avgSleepDuration)} / Target: {formatDuration(goals.targetSleepDuration)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function used in trends
function getQualityColor(quality: string | null) {
  switch (quality) {
    case 'excellent': return 'bg-green-100 text-green-800';
    case 'good': return 'bg-blue-100 text-blue-800';
    case 'fair': return 'bg-yellow-100 text-yellow-800';
    case 'poor': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// Helper function to format duration
function formatDuration(minutes: number | null) {
  if (!minutes) return '--';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}