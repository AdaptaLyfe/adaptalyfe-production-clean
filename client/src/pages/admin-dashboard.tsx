import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Shield, 
  AlertTriangle, 
  Activity, 
  Target, 
  Heart, 
  Brain,
  CreditCard,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  UserPlus,
  Settings
} from "lucide-react";
import CaregiverControlPanel from "@/components/caregiver-control-panel";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState("30d");
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const { toast } = useToast();

  // Mock comprehensive admin data
  const adminData = {
    overview: {
      totalUsers: 1847,
      activeUsers: 1203,
      newUsersToday: 47,
      newUsersThisMonth: 234,
      totalRevenue: 28420,
      monthlyRecurringRevenue: 7680,
      churnRate: 2.8,
      averageRevenuePerUser: 15.42,
      conversionRate: 12.4,
      lifetimeValue: 186.50
    },
    subscriptions: {
      basic: { count: 489, revenue: 2445, percentage: 39.2 },
      premium: { count: 623, revenue: 8089, percentage: 49.9 },
      family: { count: 136, revenue: 3398, percentage: 10.9 }
    },
    recentUsers: [
      { 
        id: 1, 
        name: "Sarah Johnson", 
        email: "sarah.j@email.com", 
        plan: "Premium", 
        joinDate: "2025-07-06", 
        status: "Active",
        lastActivity: "2 hours ago",
        tasksCompleted: 47,
        streakDays: 12
      },
      { 
        id: 2, 
        name: "Michael Chen", 
        email: "m.chen@email.com", 
        plan: "Family", 
        joinDate: "2025-07-05", 
        status: "Active",
        lastActivity: "1 day ago",
        tasksCompleted: 23,
        streakDays: 8
      },
      { 
        id: 3, 
        name: "Emma Rodriguez", 
        email: "emma.r@email.com", 
        plan: "Basic", 
        joinDate: "2025-07-04", 
        status: "Trial",
        lastActivity: "3 hours ago",
        tasksCompleted: 15,
        streakDays: 4
      },
      { 
        id: 4, 
        name: "David Park", 
        email: "d.park@email.com", 
        plan: "Premium", 
        joinDate: "2025-07-03", 
        status: "Active",
        lastActivity: "5 minutes ago",
        tasksCompleted: 82,
        streakDays: 21
      },
      { 
        id: 5, 
        name: "Lisa Thompson", 
        email: "lisa.t@email.com", 
        plan: "Family", 
        joinDate: "2025-07-02", 
        status: "Churned",
        lastActivity: "1 week ago",
        tasksCompleted: 34,
        streakDays: 0
      }
    ],
    payments: [
      { id: 1, user: "Sarah Johnson", plan: "Premium", amount: 12.99, status: "Completed", date: "2025-07-06" },
      { id: 2, user: "Michael Chen", plan: "Family", amount: 24.99, status: "Completed", date: "2025-07-06" },
      { id: 3, user: "Emma Rodriguez", plan: "Basic", amount: 4.99, status: "Failed", date: "2025-07-05" },
      { id: 4, user: "David Park", plan: "Premium", amount: 12.99, status: "Completed", date: "2025-07-05" },
      { id: 5, user: "Lisa Thompson", plan: "Family", amount: 24.99, status: "Refunded", date: "2025-07-04" }
    ],
    engagement: {
      averageSessionTime: "24 minutes",
      dailyActiveUsers: 743,
      tasksCompletedToday: 2847,
      moodEntriesLogged: 1203,
      caregiverMessagesExchanged: 456,
      emergencyAlertsTriggered: 3
    },
    healthMetrics: {
      usersWithHealthIntegration: 423,
      medicationComplianceRate: 87.3,
      appointmentAttendanceRate: 92.1,
      averageMoodScore: 3.8,
      usersWithActiveStreaks: 678,
      averageStreakLength: 8.4
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-100 text-green-700 border-green-300">Active</Badge>;
      case "Trial":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Trial</Badge>;
      case "Churned":
        return <Badge className="bg-red-100 text-red-700 border-red-300">Churned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-green-100 text-green-700 border-green-300">Completed</Badge>;
      case "Failed":
        return <Badge className="bg-red-100 text-red-700 border-red-300">Failed</Badge>;
      case "Refunded":
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Monitor platform performance and user engagement</p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{adminData.overview.totalUsers.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-600">+{adminData.overview.newUsersThisMonth} this month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Monthly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">${adminData.overview.monthlyRecurringRevenue.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-600">+18.2% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{adminData.overview.activeUsers.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-500">{((adminData.overview.activeUsers / adminData.overview.totalUsers) * 100).toFixed(1)}% of total</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{adminData.overview.conversionRate}%</div>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-600">+2.1% improvement</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-12">
          <div className="w-full overflow-x-auto pb-4">
            <TabsList className="flex w-max min-w-full h-20 p-4 gap-4 mx-auto justify-center">
              <TabsTrigger value="overview" className="px-8 py-6 text-base font-medium rounded-lg min-w-[140px] flex-shrink-0">
                Overview
              </TabsTrigger>
              <TabsTrigger value="users" className="px-8 py-6 text-base font-medium rounded-lg min-w-[140px] flex-shrink-0">
                Users
              </TabsTrigger>
              <TabsTrigger value="revenue" className="px-8 py-6 text-base font-medium rounded-lg min-w-[140px] flex-shrink-0">
                Revenue
              </TabsTrigger>
              <TabsTrigger value="engagement" className="px-8 py-6 text-base font-medium rounded-lg min-w-[140px] flex-shrink-0">
                Engagement
              </TabsTrigger>
              <TabsTrigger value="health" className="px-8 py-6 text-base font-medium rounded-lg min-w-[140px] flex-shrink-0">
                Health Metrics
              </TabsTrigger>
              <TabsTrigger value="caregiver" className="px-8 py-6 text-base font-medium rounded-lg min-w-[140px] flex-shrink-0">
                Caregiver Monitor
              </TabsTrigger>
              <TabsTrigger value="firebase" className="px-8 py-6 text-base font-medium rounded-lg min-w-[140px] flex-shrink-0">
                Firebase Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-12 mt-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subscription Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Subscription Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Basic Plan</span>
                      <span className="text-sm text-gray-600">{adminData.subscriptions.basic.count} users</span>
                    </div>
                    <Progress value={adminData.subscriptions.basic.percentage} className="h-2" />
                    <div className="text-xs text-gray-500">${adminData.subscriptions.basic.revenue}/month revenue</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Premium Plan</span>
                      <span className="text-sm text-gray-600">{adminData.subscriptions.premium.count} users</span>
                    </div>
                    <Progress value={adminData.subscriptions.premium.percentage} className="h-2" />
                    <div className="text-xs text-gray-500">${adminData.subscriptions.premium.revenue}/month revenue</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Family Plan</span>
                      <span className="text-sm text-gray-600">{adminData.subscriptions.family.count} users</span>
                    </div>
                    <Progress value={adminData.subscriptions.family.percentage} className="h-2" />
                    <div className="text-xs text-gray-500">${adminData.subscriptions.family.revenue}/month revenue</div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Revenue Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Total Revenue</div>
                      <div className="text-xl font-bold">${adminData.overview.totalRevenue.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">ARPU</div>
                      <div className="text-xl font-bold">${adminData.overview.averageRevenuePerUser}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Churn Rate</div>
                      <div className="text-xl font-bold">{adminData.overview.churnRate}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">LTV</div>
                      <div className="text-xl font-bold">${adminData.overview.lifetimeValue}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Recent Payments
                </CardTitle>
                <CardDescription>Latest payment transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminData.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.user}</TableCell>
                        <TableCell>{payment.plan}</TableCell>
                        <TableCell>${payment.amount}</TableCell>
                        <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                        <TableCell>{payment.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-12 mt-16">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>Monitor user activity and engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tasks Completed</TableHead>
                      <TableHead>Streak</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Join Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminData.recentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{user.plan}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>{user.tasksCompleted}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span>{user.streakDays}</span>
                            {user.streakDays > 0 && <span className="text-orange-500">🔥</span>}
                          </div>
                        </TableCell>
                        <TableCell>{user.lastActivity}</TableCell>
                        <TableCell>{user.joinDate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-12 mt-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Recurring Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">${adminData.overview.monthlyRecurringRevenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600 mt-2">+18.2% from last month</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Average Revenue Per User</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">${adminData.overview.averageRevenuePerUser}</div>
                  <div className="text-sm text-gray-600 mt-2">Across all plans</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Lifetime Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">${adminData.overview.lifetimeValue}</div>
                  <div className="text-sm text-gray-600 mt-2">Average LTV</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-12 mt-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Session Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminData.engagement.averageSessionTime}</div>
                  <div className="text-sm text-gray-600">Average per session</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Tasks Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminData.engagement.tasksCompletedToday.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Today</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Mood Entries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminData.engagement.moodEntriesLogged.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">This week</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="health" className="space-y-12 mt-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Health Integration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Users with Health Data</span>
                    <span className="font-bold">{adminData.healthMetrics.usersWithHealthIntegration}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Medication Compliance</span>
                    <span className="font-bold text-green-600">{adminData.healthMetrics.medicationComplianceRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Appointment Attendance</span>
                    <span className="font-bold text-blue-600">{adminData.healthMetrics.appointmentAttendanceRate}%</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Wellness Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Average Mood Score</span>
                    <span className="font-bold">{adminData.healthMetrics.averageMoodScore}/5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active Streak Users</span>
                    <span className="font-bold text-orange-600">{adminData.healthMetrics.usersWithActiveStreaks}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Streak Length</span>
                    <span className="font-bold">{adminData.healthMetrics.averageStreakLength} days</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="caregiver" className="space-y-12 mt-16">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Caregiver Monitoring Center</h2>
              <p className="text-gray-600">Monitor user progress and set granular permission controls for different caregiver types</p>
            </div>

            {/* Enhanced User Selection with Caregiver Type Selector */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Select User to Monitor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select defaultValue="2">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Sarah Johnson (ID: 1)</SelectItem>
                      <SelectItem value="2">Alex Johnson (ID: 2) - Demo User</SelectItem>
                      <SelectItem value="3">Michael Chen (ID: 3)</SelectItem>
                      <SelectItem value="4">Emma Rodriguez (ID: 4)</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Caregiver Type Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select defaultValue="school-therapist">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select caregiver type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="school-therapist">🎓 School Therapist</SelectItem>
                      <SelectItem value="medical-therapist">🏥 Medical Therapist</SelectItem>
                      <SelectItem value="respite-worker">🤝 Respite Worker</SelectItem>
                      <SelectItem value="family-member">👨‍👩‍👧‍👦 Family Member</SelectItem>
                      <SelectItem value="full-access">🔑 Full Access Caregiver</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600 mt-2">
                    Select the caregiver type to configure appropriate permission levels and data access.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Caregiver Control Panel */}
            <CaregiverControlPanel userId={2} caregiverId={2} />

            {/* User Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Current Streak</p>
                      <p className="text-2xl font-bold text-orange-600">12 days</p>
                    </div>
                    <Target className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                      <p className="text-2xl font-bold text-green-600">85%</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Average Mood</p>
                      <p className="text-2xl font-bold text-blue-600">3.8/5</p>
                    </div>
                    <Heart className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                      <p className="text-2xl font-bold text-red-600">1</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 h-12"
                onClick={() => {
                  // Generate and download medical report
                  const reportData = {
                    patient: "Alex Johnson (Demo User)",
                    dateGenerated: new Date().toISOString().split('T')[0],
                    streak: "12 days",
                    completionRate: "85%",
                    averageMood: "3.8/5",
                    alerts: "1 active"
                  };
                  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `medical-report-alex-johnson-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast({
                    title: "Medical Report Generated",
                    description: "Report has been downloaded successfully",
                  });
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Generate Medical Report
              </Button>
              <Button 
                variant="outline" 
                className="h-12"
                onClick={() => {
                  setShowProgressModal(true);
                  toast({
                    title: "Loading Progress Charts",
                    description: "Displaying user progress visualization",
                  });
                }}
              >
                <Activity className="w-4 h-4 mr-2" />
                View Progress Charts
              </Button>
              <Button 
                variant="outline" 
                className="h-12"
                onClick={() => {
                  setShowScheduleModal(true);
                  toast({
                    title: "Opening Schedule",
                    description: "Loading appointment scheduling interface",
                  });
                }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Check-in
              </Button>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Recent Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Take medication</span>
                      <Badge className="bg-green-100 text-green-700">Completed</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Wash hair</span>
                      <Badge className="bg-green-100 text-green-700">Completed</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Grocery shopping</span>
                      <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Call doctor</span>
                      <Badge className="bg-gray-100 text-gray-700">Scheduled</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Mood Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Today</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Good</span>
                        <div className="flex">
                          {[1,2,3,4].map(i => (
                            <Heart key={i} className="w-4 h-4 fill-pink-500 text-pink-500" />
                          ))}
                          <Heart className="w-4 h-4 text-gray-300" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Yesterday</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Okay</span>
                        <div className="flex">
                          {[1,2,3].map(i => (
                            <Heart key={i} className="w-4 h-4 fill-pink-500 text-pink-500" />
                          ))}
                          {[4,5].map(i => (
                            <Heart key={i} className="w-4 h-4 text-gray-300" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Trend:</strong> Mood has been stable over the past week with slight improvement
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alerts & Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Alerts & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-800">Medication Refill Due</p>
                      <p className="text-sm text-amber-700">Sertraline prescription needs refill within 3 days</p>
                      <Button size="sm" className="mt-2 bg-amber-600 hover:bg-amber-700">
                        Send Reminder
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-800">Excellent Progress</p>
                      <p className="text-sm text-green-700">User has maintained daily task streak for 12 days</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="firebase" className="space-y-12 mt-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-green-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Analytics Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-lg font-bold text-green-700">Connected</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Firebase Analytics active</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Daily Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span className="text-2xl font-bold">{adminData.overview.activeUsers}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Tracked via session_start events</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-purple-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Retention Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    <span className="text-2xl font-bold">72.4%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">7-day retention via retention_check</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-red-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Churn Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span className="text-2xl font-bold">{adminData.overview.churnRate}%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Tracked via churn_risk events</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-500" />
                  Events Being Tracked
                </CardTitle>
                <CardDescription>Firebase Analytics events configured across the app</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { event: "login", category: "DAU", description: "User login with method tracking", status: "active" },
                        { event: "sign_up", category: "DAU", description: "New user registration", status: "active" },
                        { event: "session_start_custom", category: "DAU", description: "App session begins with timestamp", status: "active" },
                        { event: "session_end_custom", category: "DAU", description: "Session ends with duration in seconds", status: "active" },
                        { event: "screen_view", category: "Feature Usage", description: "Page/screen navigation tracking", status: "active" },
                        { event: "feature_used", category: "Feature Usage", description: "Specific feature interaction logged", status: "active" },
                        { event: "daily_activity", category: "DAU", description: "Daily app open and page view events", status: "active" },
                        { event: "mood_logged", category: "Feature Usage", description: "Mood value and label recorded", status: "active" },
                        { event: "task_completed", category: "Feature Usage", description: "Task completion with category", status: "active" },
                        { event: "retention_check", category: "Retention", description: "Days since signup with active status", status: "active" },
                        { event: "trial_status", category: "Churn", description: "Trial days left and current status", status: "active" },
                        { event: "churn_risk", category: "Churn", description: "Churn risk flags (trial ending/expired)", status: "active" },
                        { event: "subscription_event", category: "Revenue", description: "Upgrade actions with plan type", status: "active" },
                        { event: "page_navigation", category: "Feature Usage", description: "From/to page navigation tracking", status: "active" },
                        { event: "app_error", category: "Health", description: "Application error tracking", status: "active" },
                      ].map((row) => (
                        <TableRow key={row.event}>
                          <TableCell className="font-mono text-sm">{row.event}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              row.category === "DAU" ? "border-blue-300 text-blue-700" :
                              row.category === "Feature Usage" ? "border-green-300 text-green-700" :
                              row.category === "Retention" ? "border-purple-300 text-purple-700" :
                              row.category === "Churn" ? "border-red-300 text-red-700" :
                              row.category === "Revenue" ? "border-yellow-300 text-yellow-700" :
                              "border-gray-300 text-gray-700"
                            }>
                              {row.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">{row.description}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Retention Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Day 1 Retention", value: 89, color: "bg-green-500" },
                    { label: "Day 7 Retention", value: 72, color: "bg-blue-500" },
                    { label: "Day 14 Retention", value: 58, color: "bg-purple-500" },
                    { label: "Day 30 Retention", value: 41, color: "bg-orange-500" },
                  ].map((metric) => (
                    <div key={metric.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{metric.label}</span>
                        <span className="text-sm font-bold">{metric.value}%</span>
                      </div>
                      <Progress value={metric.value} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                    Top Features by Usage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { feature: "Daily Tasks", usage: 94, sessions: "1,247" },
                    { feature: "Mood Tracking", usage: 87, sessions: "1,089" },
                    { feature: "Financial", usage: 63, sessions: "788" },
                    { feature: "Calendar", usage: 55, sessions: "689" },
                    { feature: "Resources", usage: 42, sessions: "525" },
                    { feature: "Meal Planning", usage: 31, sessions: "388" },
                  ].map((item) => (
                    <div key={item.feature}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{item.feature}</span>
                        <span className="text-xs text-gray-500">{item.sessions} sessions</span>
                      </div>
                      <Progress value={item.usage} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Activity className="h-6 w-6 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">View Full Analytics in Firebase Console</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      For detailed reports, funnels, user segments, and real-time data, visit your Firebase Analytics dashboard.
                    </p>
                    <Button
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      onClick={() => window.open('https://console.firebase.google.com/', '_blank')}
                    >
                      Open Firebase Console
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Progress Charts Modal */}
      <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Alex Johnson - Progress Charts</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Task Completion Chart */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-4">Task Completion Over Time</h3>
              <div className="grid grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                  <div key={day} className="text-center">
                    <div className="text-xs text-gray-600 mb-1">{day}</div>
                    <div className={`h-20 rounded ${i < 5 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div className="text-xs mt-1">{i < 5 ? '100%' : '0%'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mood Tracking Chart */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-4">Mood Trends (Last 7 Days)</h3>
              <div className="grid grid-cols-7 gap-2">
                {[4, 3, 4, 5, 3, 4, 4].map((mood, i) => (
                  <div key={i} className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Day {i+1}</div>
                    <div className="flex justify-center">
                      {[1,2,3,4,5].map(star => (
                        <Heart key={star} className={`w-3 h-3 ${star <= mood ? 'fill-pink-500 text-pink-500' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <div className="text-xs mt-1">{mood}/5</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">12</div>
                <div className="text-sm text-gray-600">Days Streak</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">85%</div>
                <div className="text-sm text-gray-600">Completion</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded">
                <div className="text-2xl font-bold text-purple-600">3.8</div>
                <div className="text-sm text-gray-600">Avg Mood</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded">
                <div className="text-2xl font-bold text-orange-600">24</div>
                <div className="text-sm text-gray-600">Tasks Done</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Check-in Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Check-in for Alex Johnson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Check-in Type</label>
              <select className="w-full border rounded-md p-2">
                <option>Weekly Progress Review</option>
                <option>Emergency Check-in</option>
                <option>Medication Review</option>
                <option>Goal Setting Session</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Date & Time</label>
              <input type="datetime-local" className="w-full border rounded-md p-2" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea 
                className="w-full border rounded-md p-2 h-20" 
                placeholder="Any specific topics to discuss..."
              ></textarea>
            </div>
            
            <div className="flex gap-2">
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  toast({
                    title: "Check-in Scheduled",
                    description: "Appointment has been added to calendar",
                  });
                  setShowScheduleModal(false);
                }}
              >
                Schedule Check-in
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowScheduleModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}