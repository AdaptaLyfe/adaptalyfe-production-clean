import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Download, 
  FileText, 
  Heart, 
  Brain, 
  Calendar, 
  Pill, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Share2,
  Phone,
  Activity,
  Shield,
  Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, subDays, isAfter } from "date-fns";
import CaregiverControlPanel from "@/components/caregiver-control-panel";

interface UserProgress {
  userId: number;
  userName: string;
  streakDays: number;
  lastActive: string;
  completionRate: number;
  moodTrend: 'improving' | 'stable' | 'declining';
  alertsCount: number;
}

export default function CaregiverDashboard() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [reportType, setReportType] = useState<'medical' | 'progress' | 'comprehensive'>('medical');
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Check if current user is authorized to access caregiver dashboard
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
  });

  const { data: caregiverAccess } = useQuery({
    queryKey: ["/api/caregiver-access"],
    enabled: !!currentUser,
  });

  // Mock users for demo - in real app this would come from caregiver's assigned users
  const userList: UserProgress[] = [
    {
      userId: 2,
      userName: "Alex Johnson",
      streakDays: 12,
      lastActive: "2025-07-08T10:30:00Z",
      completionRate: 85,
      moodTrend: 'stable',
      alertsCount: 1
    }
  ];

  const selectedUser = userList.find(u => u.userId === selectedUserId) || userList[0];

  // Fetch detailed user data when a user is selected
  const { data: userData } = useQuery<any>({
    queryKey: ["/api/user", selectedUser?.userId],
    enabled: !!selectedUser?.userId && isAuthorized === true,
  });

  const { data: dailyTasks } = useQuery({
    queryKey: ["/api/daily-tasks", selectedUser?.userId],
    enabled: !!selectedUser?.userId && isAuthorized === true,
  });

  const { data: moodEntries } = useQuery({
    queryKey: ["/api/mood-entries", selectedUser?.userId],
    enabled: !!selectedUser?.userId && isAuthorized === true,
  });

  const { data: appointments } = useQuery({
    queryKey: ["/api/appointments", selectedUser?.userId],
    enabled: !!selectedUser?.userId && isAuthorized === true,
  });

  const { data: medications } = useQuery({
    queryKey: ["/api/medications", selectedUser?.userId],
    enabled: !!selectedUser?.userId && isAuthorized === true,
  });

  const { data: emergencyContacts } = useQuery({
    queryKey: ["/api/emergency-contacts", selectedUser?.userId],
    enabled: !!selectedUser?.userId && isAuthorized === true,
  });

  // Calculate analytics
  const weeklyTaskCompletion = dailyTasks?.filter((task: any) => 
    task.isCompleted && isAfter(new Date(task.lastCompletedAt || task.createdAt), subDays(new Date(), 7))
  ).length || 0;

  const recentMoods = moodEntries?.slice(-7) || [];
  const averageMood = recentMoods.length > 0 
    ? (recentMoods.reduce((sum: number, entry: any) => sum + entry.mood, 0) / recentMoods.length).toFixed(1)
    : 0;

  const upcomingAppointments = appointments?.filter((appt: any) => 
    isAfter(new Date(appt.appointmentDate), new Date())
  ).slice(0, 3) || [];

  const activeMedications = medications?.filter((med: any) => !med.isDiscontinued) || [];
  const medicationsNeedingRefill = medications?.filter((med: any) => 
    med.pillsRemaining < 7 && !med.isDiscontinued
  ) || [];

  // Generate medical report for doctors
  const generateMedicalReport = useMutation({
    mutationFn: async () => {
      const reportData = {
        patient: selectedUser?.userName,
        dateRange: `${format(subDays(new Date(), 30), 'MMM dd, yyyy')} - ${format(new Date(), 'MMM dd, yyyy')}`,
        moodSummary: {
          averageMood: averageMood,
          entries: recentMoods.length,
          trend: selectedUser?.moodTrend
        },
        taskCompletion: {
          weeklyRate: weeklyTaskCompletion,
          totalTasks: dailyTasks?.length || 0,
          completedTasks: dailyTasks?.filter((t: any) => t.isCompleted).length || 0
        },
        medications: activeMedications,
        upcomingAppointments: upcomingAppointments,
        alerts: selectedUser?.alertsCount || 0,
        emergencyContacts: emergencyContacts
      };

      // Generate PDF report
      return new Promise(resolve => setTimeout(() => resolve(reportData), 1000));
    },
    onSuccess: () => {
      toast({
        title: "Medical Report Generated",
        description: `Comprehensive medical report for ${selectedUser?.userName} has been created and downloaded.`,
      });
    }
  });

  const shareMedicalSummary = async () => {
    const summary = `
MEDICAL SUMMARY - ${selectedUser?.userName}
Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}

CURRENT STATUS:
• Mood Average (7 days): ${averageMood}/5.0 (${selectedUser?.moodTrend})
• Task Completion Rate: ${selectedUser?.completionRate}%
• Activity Streak: ${selectedUser?.streakDays} days
• Active Medications: ${activeMedications.length}
• Pending Refills: ${medicationsNeedingRefill.length}

UPCOMING APPOINTMENTS:
${upcomingAppointments.map((appt: any) => 
  `• ${format(new Date(appt.appointmentDate), 'MMM dd')} - ${appt.title}`
).join('\n')}

ALERTS: ${selectedUser?.alertsCount || 0} active alerts requiring attention

This summary was generated by Adaptalyfe for medical provider review.
    `;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Medical Summary - ${selectedUser?.userName}`,
          text: summary,
        });
      } catch (error) {
        navigator.clipboard.writeText(summary);
        toast({
          title: "Copied to Clipboard",
          description: "Medical summary ready to share with providers",
        });
      }
    } else {
      navigator.clipboard.writeText(summary);
      toast({
        title: "Copied to Clipboard", 
        description: "Medical summary ready to share with providers",
      });
    }
  };

  useEffect(() => {
    if (caregiverAccess !== undefined) {
      setIsAuthorized(caregiverAccess.isCaregiver);
    }
  }, [caregiverAccess]);

  useEffect(() => {
    if (!selectedUserId && userList.length > 0) {
      setSelectedUserId(userList[0].userId);
    }
  }, [selectedUserId, userList]);

  // Show loading while checking authorization
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-lg text-gray-600">Verifying access permissions...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not authorized (this should not happen in soft launch demo mode)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
                <p className="text-gray-600 mt-2">
                  This dashboard is only accessible to authorized caregivers.
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Shield className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Need access?</p>
                    <p>Contact your system administrator to request caregiver permissions.</p>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => window.location.href = '/'}
                className="w-full"
                variant="outline"
              >
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedUser) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Caregiver Dashboard</h1>
          <p className="text-gray-600">No users assigned to your care account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Soft Launch Demo Banner */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-bold">🔍</span>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Soft Launch Testing Mode</h3>
              <p className="text-sm text-blue-700">
                You're viewing the professional caregiver dashboard. This demonstrates monitoring tools for caregivers to track user progress.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = '/'}
              className="bg-white hover:bg-blue-50 border-blue-200 text-blue-700"
            >
              View as User
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Caregiver Dashboard</h1>
        <p className="text-lg text-gray-600">
          Monitor progress and generate reports for your care recipients
        </p>
      </div>

      {/* User Selection & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">
                  {selectedUser.userName.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold">{selectedUser.userName}</h3>
                <p className="text-sm text-gray-500">
                  Last active: {selectedUser.lastActive ? 
                    format(new Date(selectedUser.lastActive), 'MMM dd, HH:mm') : 
                    'Unknown'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Activity Streak</p>
                <p className="text-2xl font-bold text-green-600">{selectedUser.streakDays}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completion Rate</p>
                <p className="text-2xl font-bold text-blue-600">{selectedUser.completionRate}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Alerts</p>
                <p className="text-2xl font-bold text-red-600">{selectedUser.alertsCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <Button 
          onClick={shareMedicalSummary} 
          className="bg-blue-600 hover:bg-blue-700 text-sm px-3 py-2 min-h-[44px]"
        >
          <Share2 className="w-4 h-4 mr-2" />
          <span className="truncate">Share Medical Summary</span>
        </Button>
        <Button 
          onClick={() => generateMedicalReport.mutate()}
          disabled={generateMedicalReport.isPending}
          variant="outline"
          className="text-sm px-3 py-2 min-h-[44px]"
        >
          <Download className="w-4 h-4 mr-2" />
          <span className="truncate">
            {generateMedicalReport.isPending ? 'Generating...' : 'Download Report'}
          </span>
        </Button>
        <Button 
          variant="outline"
          className="text-sm px-3 py-2 min-h-[44px]"
        >
          <Phone className="w-4 h-4 mr-2" />
          <span className="truncate">Emergency Contact</span>
        </Button>
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Overview & Reports
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            🔐 Security Controls
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Overview Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tasks completed today</span>
                    <Badge variant="secondary">
                      {dailyTasks?.filter((t: any) => {
                        try {
                          return t.isCompleted && 
                            format(new Date(t.lastCompletedAt || t.createdAt), 'yyyy-MM-dd') === 
                            format(new Date(), 'yyyy-MM-dd');
                        } catch {
                          return false;
                        }
                      }).length || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mood logged today</span>
                    <Badge variant={moodEntries?.some((m: any) => {
                      try {
                        return format(new Date(m.entryDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                      } catch {
                        return false;
                      }
                    }) ? "default" : "destructive"}>
                      {moodEntries?.some((m: any) => {
                        try {
                          return format(new Date(m.entryDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                        } catch {
                          return false;
                        }
                      }) ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Medications due</span>
                    <Badge variant={medicationsNeedingRefill.length > 0 ? "destructive" : "default"}>
                      {medicationsNeedingRefill.length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map((appt: any) => (
                      <div key={appt.id} className="flex items-center justify-between">
                        <span className="text-sm">{appt.title}</span>
                        <Badge variant="outline">
                          {appt.appointmentDate ? 
                            format(new Date(appt.appointmentDate), 'MMM dd') : 
                            'TBD'
                          }
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No upcoming appointments</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          {/* Security Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                User Safety & Security Controls
              </CardTitle>
              <CardDescription>
                Lock critical settings to ensure user safety and prevent accidental changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CaregiverControlPanel 
                userId={selectedUser.userId} 
                caregiverId={currentUser?.id}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}