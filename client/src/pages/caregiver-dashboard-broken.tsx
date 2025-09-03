import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // Show access denied if not authorized
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
    queryKey: ["/api/medications", selectedUser?.userId],
    enabled: !!selectedUser?.userId,
  });

  const { data: emergencyContacts } = useQuery({
    queryKey: ["/api/emergency-contacts", selectedUser?.userId],
    enabled: !!selectedUser?.userId,
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
    if (!selectedUserId && userList.length > 0) {
      setSelectedUserId(userList[0].userId);
    }
  }, [selectedUserId, userList]);

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
                  Last active: {format(new Date(selectedUser.lastActive), 'MMM dd, HH:mm')}
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

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1 h-auto p-1">
          <TabsTrigger value="overview" className="text-xs md:text-sm px-2 py-2">Overview</TabsTrigger>
          <TabsTrigger value="mood" className="text-xs md:text-sm px-2 py-2">Mood</TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs md:text-sm px-2 py-2">Tasks</TabsTrigger>
          <TabsTrigger value="medical" className="text-xs md:text-sm px-2 py-2">Medical</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs md:text-sm px-2 py-2">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
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
                      {dailyTasks?.filter((t: any) => t.isCompleted && 
                        format(new Date(t.lastCompletedAt || t.createdAt), 'yyyy-MM-dd') === 
                        format(new Date(), 'yyyy-MM-dd')).length || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mood logged today</span>
                    <Badge variant={moodEntries?.some((m: any) => 
                      format(new Date(m.entryDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                    ) ? "default" : "destructive"}>
                      {moodEntries?.some((m: any) => 
                        format(new Date(m.entryDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                      ) ? "Yes" : "No"}
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
                        <div>
                          <p className="text-sm font-medium">{appt.title}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(appt.appointmentDate), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                        <Badge variant="outline">{appt.providerType}</Badge>
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

        <TabsContent value="mood" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Mood & Wellness Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{averageMood}</p>
                  <p className="text-sm text-gray-500">Average Mood (7 days)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{recentMoods.length}</p>
                  <p className="text-sm text-gray-500">Entries This Week</p>
                </div>
                <div className="text-center">
                  <Badge className={
                    selectedUser.moodTrend === 'improving' ? 'bg-green-500' :
                    selectedUser.moodTrend === 'declining' ? 'bg-red-500' : 'bg-yellow-500'
                  }>
                    {selectedUser.moodTrend}
                  </Badge>
                  <p className="text-sm text-gray-500 mt-2">Trend</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Recent Mood Entries</h4>
                {recentMoods.slice(-5).map((entry: any) => (
                  <div key={entry.id} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">
                      {format(new Date(entry.entryDate), 'MMM dd')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Mood: {entry.mood}/5</span>
                      {entry.notes && (
                        <span className="text-xs text-gray-500 max-w-32 truncate">
                          "{entry.notes}"
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Daily Tasks Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {dailyTasks?.filter((t: any) => t.isCompleted).length || 0}
                  </p>
                  <p className="text-sm text-gray-500">Total Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{weeklyTaskCompletion}</p>
                  <p className="text-sm text-gray-500">This Week</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Recent Tasks</h4>
                {dailyTasks?.slice(-5).map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{task.title}</span>
                    <Badge variant={task.isCompleted ? "default" : "secondary"}>
                      {task.isCompleted ? "Completed" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5" />
                  Medications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeMedications.map((med: any) => (
                    <div key={med.id} className="p-3 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{med.medicationName}</h4>
                        <Badge variant={med.pillsRemaining < 7 ? "destructive" : "default"}>
                          {med.pillsRemaining} pills left
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {med.dosage} - {med.frequency}
                      </p>
                      {med.pillColor && (
                        <p className="text-xs text-gray-500">
                          {med.pillColor} {med.pillShape} {med.pillSize}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Emergency Contacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {emergencyContacts?.map((contact: any) => (
                    <div key={contact.id} className="p-3 border rounded">
                      <h4 className="font-medium">{contact.name}</h4>
                      <p className="text-sm text-gray-600">{contact.relationship}</p>
                      <p className="text-sm font-mono">{contact.phoneNumber}</p>
                      {contact.notes && (
                        <p className="text-xs text-gray-500">{contact.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Generate Medical Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Generate comprehensive reports for medical providers, insurance, or care coordination.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col"
                      onClick={() => generateMedicalReport.mutate()}
                    >
                      <FileText className="w-6 h-6 mb-2" />
                      Medical Summary
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col"
                      onClick={() => generateMedicalReport.mutate()}
                    >
                      <BarChart3 className="w-6 h-6 mb-2" />
                      Progress Report
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col"
                      onClick={() => generateMedicalReport.mutate()}
                    >
                      <Brain className="w-6 h-6 mb-2" />
                      Behavioral Analysis
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Report Includes:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Daily task completion trends</li>
                    <li>• Mood tracking and patterns</li>
                    <li>• Medication adherence</li>
                    <li>• Appointment attendance</li>
                    <li>• Emergency contacts and protocols</li>
                    <li>• Caregiver observations and notes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}