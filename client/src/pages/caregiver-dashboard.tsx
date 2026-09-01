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
  Lock,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, subDays, isAfter } from "date-fns";
import { jsPDF } from "jspdf";
import CaregiverControlPanel from "@/components/caregiver-control-panel";
import { GuideInsight } from "@/components/ai-ready";

interface UserProgress {
  userId: number;
  userName: string;
  streakDays: number;
  lastActive: string;
  completionRate: number;
  moodTrend: 'improving' | 'stable' | 'declining';
  alertsCount: number;
}

function addPdfText(
  doc: jsPDF,
  text: string,
  y: number,
  options: { fontSize?: number; bold?: boolean } = {},
) {
  const fontSize = options.fontSize || 10;
  const lineHeight = fontSize <= 10 ? 5 : 7;
  const lines = doc.splitTextToSize(text, 180) as string[];

  if (y + lines.length * lineHeight > 280) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", options.bold ? "bold" : "normal");
  doc.setFontSize(fontSize);
  doc.text(lines, 15, y);
  return y + lines.length * lineHeight;
}

function addPdfSection(doc: jsPDF, title: string, rows: string[], y: number) {
  let nextY = addPdfText(doc, title, y, { fontSize: 12, bold: true }) + 2;
  const safeRows = rows.length > 0 ? rows : ["No data available for this report period."];

  safeRows.forEach((row) => {
    nextY = addPdfText(doc, `• ${row}`, nextY) + 1;
  });

  return nextY + 4;
}

function formatReportDate(value: unknown) {
  if (!value) return "Date unavailable";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "Date unavailable" : format(date, "MMM dd, yyyy h:mm a");
}

export default function CaregiverDashboard() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [reportType, setReportType] = useState<'medical' | 'progress' | 'comprehensive'>('medical');
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Check if current user is authorized to access caregiver dashboard
  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  const { data: caregiverAccess } = useQuery<{ isCaregiver: boolean } | null>({
    queryKey: ["/api/caregiver-access"],
    enabled: !!currentUser,
  });

  // Fetch real care recipients linked to the logged-in caregiver
  const { data: careRecipients, isLoading: isLoadingRecipients } = useQuery<any[]>({
    queryKey: ["/api/my-care-recipients"],
    enabled: !!currentUser,
  });

  // Build userList from real data; fall back to empty array while loading
  const userList: UserProgress[] = (careRecipients || []).map((r: any) => ({
    userId: r.userId,
    userName: r.userName,
    streakDays: 0,
    lastActive: new Date().toISOString(),
    completionRate: 0,
    moodTrend: 'stable' as const,
    alertsCount: 0,
  }));

  const selectedUser = userList.find(u => u.userId === selectedUserId) || userList[0];

  // Fetch detailed user data when a user is selected
  const { data: userData, isLoading: isLoadingUserData, isError: isUserDataError } = useQuery<any>({
    queryKey: ["/api/user", selectedUser?.userId],
    enabled: !!selectedUser?.userId && isAuthorized === true,
  });

  const { data: dailyTasks, isLoading: isLoadingDailyTasks, isError: isDailyTasksError } = useQuery({
    queryKey: ["/api/daily-tasks", selectedUser?.userId],
    enabled: !!selectedUser?.userId && isAuthorized === true,
  });

  const { data: moodEntries, isLoading: isLoadingMoodEntries, isError: isMoodEntriesError } = useQuery({
    queryKey: ["/api/mood-entries", selectedUser?.userId],
    enabled: !!selectedUser?.userId && isAuthorized === true,
  });

  const { data: appointments, isLoading: isLoadingAppointments, isError: isAppointmentsError } = useQuery({
    queryKey: ["/api/appointments", selectedUser?.userId],
    enabled: !!selectedUser?.userId && isAuthorized === true,
  });

  const { data: medications, isLoading: isLoadingMedications, isError: isMedicationsError } = useQuery({
    queryKey: ["/api/medications", selectedUser?.userId],
    enabled: !!selectedUser?.userId && isAuthorized === true,
  });

  const { data: emergencyContacts, isLoading: isLoadingEmergencyContacts, isError: isEmergencyContactsError } = useQuery({
    queryKey: ["/api/emergency-contacts", selectedUser?.userId],
    enabled: !!selectedUser?.userId && isAuthorized === true,
  });

  const dailyTaskList = Array.isArray(dailyTasks) ? dailyTasks : [];
  const moodEntryList = Array.isArray(moodEntries) ? moodEntries : [];
  const appointmentList = Array.isArray(appointments) ? appointments : [];
  const medicationList = Array.isArray(medications) ? medications : [];
  const emergencyContactList = Array.isArray(emergencyContacts) ? emergencyContacts : [];
  const isReportDataLoading = isLoadingUserData || isLoadingDailyTasks || isLoadingMoodEntries ||
    isLoadingAppointments || isLoadingMedications || isLoadingEmergencyContacts;
  const hasReportDataError = isUserDataError || isDailyTasksError || isMoodEntriesError ||
    isAppointmentsError || isMedicationsError || isEmergencyContactsError;

  // Calculate analytics
  const weeklyTaskCompletion = dailyTaskList.filter((task: any) =>
    task.isCompleted && isAfter(new Date(task.lastCompletedAt || task.createdAt), subDays(new Date(), 7))
  ).length || 0;

  const recentMoods = moodEntryList.slice(-7);
  const averageMood = recentMoods.length > 0 
    ? (recentMoods.reduce((sum: number, entry: any) => sum + entry.mood, 0) / recentMoods.length).toFixed(1)
    : 0;

  const upcomingAppointments = appointmentList.filter((appt: any) =>
    isAfter(new Date(appt.appointmentDate), new Date())
  ).slice(0, 3) || [];

  const activeMedications = medicationList.filter((med: any) => !med.isDiscontinued);
  const medicationsNeedingRefill = medicationList.filter((med: any) =>
    med.pillsRemaining < 7 && !med.isDiscontinued
  );

  // Generate medical report for doctors
  const generateMedicalReport = useMutation({
    mutationFn: async () => {
      if (!selectedUser) {
        throw new Error("Select a care recipient before downloading a report.");
      }
      if (isReportDataLoading) {
        throw new Error("Report data is still loading. Please try again in a moment.");
      }
      if (hasReportDataError) {
        throw new Error("Some report data could not be loaded. Please try again.");
      }

      const reportData = {
        patient: selectedUser.userName,
        dateRange: `${format(subDays(new Date(), 30), 'MMM dd, yyyy')} - ${format(new Date(), 'MMM dd, yyyy')}`,
        moodSummary: {
          averageMood: averageMood,
          entries: recentMoods.length,
          trend: selectedUser.moodTrend
        },
        taskCompletion: {
          weeklyRate: weeklyTaskCompletion,
          totalTasks: dailyTaskList.length,
          completedTasks: dailyTaskList.filter((t: any) => t.isCompleted).length
        },
        medications: activeMedications,
        upcomingAppointments: upcomingAppointments,
        alerts: selectedUser.alertsCount || 0,
        emergencyContacts: emergencyContactList
      };

      const doc = new jsPDF();
      let y = 20;
      const generatedDate = format(new Date(), "MMM dd, yyyy h:mm a");

      doc.setTextColor(30, 41, 59);
      y = addPdfText(doc, "Adaptalyfe Medical Report", y, { fontSize: 18, bold: true }) + 2;
      y = addPdfText(doc, `Patient: ${reportData.patient}`, y, { bold: true });
      y = addPdfText(doc, `Report period: ${reportData.dateRange}`, y);
      y = addPdfText(doc, `Generated: ${generatedDate}`, y) + 6;

      y = addPdfSection(doc, "Mood Summary", [
        `Average mood (last 7 entries): ${reportData.moodSummary.averageMood}/5`,
        `Entries included: ${reportData.moodSummary.entries}`,
        `Trend: ${reportData.moodSummary.trend || "Not available"}`,
      ], y);

      y = addPdfSection(doc, "Task Completion", [
        `Completed tasks: ${reportData.taskCompletion.completedTasks} of ${reportData.taskCompletion.totalTasks}`,
        `Completed in the last 7 days: ${reportData.taskCompletion.weeklyRate}`,
      ], y);

      y = addPdfSection(doc, "Active Medications", reportData.medications.map((med: any) => {
        const details = [med.dosage, med.frequency].filter(Boolean).join(" • ");
        const remaining = med.pillsRemaining !== undefined ? ` • ${med.pillsRemaining} pills remaining` : "";
        return `${med.name || "Unnamed medication"}${details ? ` — ${details}` : ""}${remaining}`;
      }), y);

      y = addPdfSection(doc, "Upcoming Appointments", reportData.upcomingAppointments.map((appt: any) => {
        const details = [appt.provider, appt.location].filter(Boolean).join(" • ");
        return `${formatReportDate(appt.appointmentDate)} — ${appt.title || "Appointment"}${details ? ` (${details})` : ""}`;
      }), y);

      y = addPdfSection(doc, "Alerts", [`Active alerts: ${reportData.alerts}`], y);

      addPdfSection(doc, "Emergency Contacts", reportData.emergencyContacts.map((contact: any) => {
        const details = [contact.relationship, contact.phoneNumber, contact.email].filter(Boolean).join(" • ");
        return `${contact.name || "Unnamed contact"}${details ? ` — ${details}` : ""}`;
      }), y);

      const safePatientName = reportData.patient.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "patient";
      const dateStamp = new Date().toISOString().split("T")[0];
      doc.save(`medical-report-${safePatientName}-${dateStamp}.pdf`);

      return {
        hasReportableData: recentMoods.length > 0 || dailyTaskList.length > 0 ||
          reportData.medications.length > 0 || reportData.upcomingAppointments.length > 0 ||
          reportData.emergencyContacts.length > 0,
      };
    },
    onSuccess: ({ hasReportableData }) => {
      toast({
        title: "Medical Report Generated",
        description: hasReportableData
          ? `Comprehensive medical report for ${selectedUser?.userName} has been downloaded.`
          : "No activity data was available, so a report with empty sections was downloaded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Report Download Failed",
        description: error.message || "The report could not be downloaded. Please try again.",
        variant: "destructive",
      });
    },
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
    if (caregiverAccess) {
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

  if (isLoadingRecipients) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-lg text-gray-600">Loading your care recipients...</p>
        </div>
      </div>
    );
  }

  if (!selectedUser) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-16">
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Users className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Caregiver Dashboard</h1>
          <p className="text-gray-600 mb-2">No care recipients are linked to your account yet.</p>
          <p className="text-sm text-gray-500">
            Ask the person you support to open their app and send you a caregiver invitation code, 
            then enter it on the Accept Invitation page.
          </p>
          <Button
            className="mt-6"
            onClick={() => window.location.href = '/accept-invitation'}
          >
            Enter an Invitation Code
          </Button>
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

      <div className="mb-6">
        <GuideInsight
          sourceLabel="Caregiver insight preview"
          state="contextual"
          message={
            selectedUser.completionRate > 0
              ? `${selectedUser.userName} is completing ${selectedUser.completionRate}% of tracked activities. This presentation is ready for richer Guide insights when real intelligence is connected.`
              : `${selectedUser.userName}'s progress will appear here as routines, completed tasks, and successful transitions build over time.`
          }
          context="Presentation only. Existing caregiver permissions and data access remain unchanged."
        />
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
          disabled={generateMedicalReport.isPending || isReportDataLoading || !selectedUser}
          variant="outline"
          className="text-sm px-3 py-2 min-h-[44px]"
        >
          <Download className="w-4 h-4 mr-2" />
          <span className="truncate">
            {generateMedicalReport.isPending || isReportDataLoading ? 'Generating...' : 'Download Report'}
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
                      {dailyTaskList.filter((t: any) => {
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
                    <Badge variant={moodEntryList.some((m: any) => {
                      try {
                        return format(new Date(m.entryDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                      } catch {
                        return false;
                      }
                    }) ? "default" : "destructive"}>
                      {moodEntryList.some((m: any) => {
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