import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PremiumFeaturePrompt from "@/components/premium-feature-prompt";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  GraduationCap, 
  MapPin, 
  Users, 
  Target,
  Plus,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Bus,
  Library,
  Coffee
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, isToday, isTomorrow, addDays, startOfWeek, endOfWeek } from "date-fns";
import { useSubscriptionEnforcement } from "@/middleware/subscription-middleware";
import type { 
  AcademicClass, 
  Assignment, 
  StudySession, 
  CampusLocation,
  CampusTransport,
  StudyGroup,
  TransitionSkill
} from "@shared/schema";

export default function AcademicPlanner() {
  const { hasFeature } = useSubscriptionEnforcement();
  
  // Check if user has access to academic planner features
  if (!hasFeature('advancedAnalytics')) {
    return (
      <div className="container mx-auto p-6">
        <PremiumFeaturePrompt
          title="Academic Planner"
          description="Manage classes, assignments, study sessions, and campus navigation. This comprehensive academic tool helps students with developmental disabilities succeed in their educational journey."
          feature="advancedAnalytics"
          requiredPlan="family"
          className="max-w-md mx-auto mt-20"
        />
      </div>
    );
  }
  const [activeTab, setActiveTab] = useState("schedule");
  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState(false);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddStudySessionOpen, setIsAddStudySessionOpen] = useState(false);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [isAddTransportOpen, setIsAddTransportOpen] = useState(false);
  const [isAddStudyGroupOpen, setIsAddStudyGroupOpen] = useState(false);

  
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    type: "homework",
    dueDate: "",
    priority: "medium",
    estimatedHours: 2
  });

  const [newClass, setNewClass] = useState({
    className: "",
    instructor: "",
    building: "",
    room: "",
    startTime: "",
    endTime: "",
    dayOfWeek: 1,
    credits: 3,
    semester: "Fall 2025"
  });

  const [newStudySession, setNewStudySession] = useState({
    subject: "",
    topic: "",
    technique: "",
    duration: 60,
    notes: ""
  });

  const [newLocation, setNewLocation] = useState({
    name: "",
    building: "",
    floor: "",
    description: "",
    category: "academic"
  });

  const [newTransport, setNewTransport] = useState({
    routeName: "",
    fromStop: "",
    toStop: "",
    departureTime: "",
    estimatedDuration: 15
  });

  const [newStudyGroup, setNewStudyGroup] = useState({
    groupName: "",
    subject: "",
    description: "",
    meetingDay: "",
    meetingTime: "",
    maxMembers: 6
  });


  const queryClient = useQueryClient();

  // Fetch academic data with custom queryFn to bypass caching issues
  const { data: classes = [], isLoading: classesLoading, refetch: refetchClasses } = useQuery({
    queryKey: ["/api/academic-classes"],
    queryFn: async () => {
      const response = await fetch('/api/academic-classes');
      if (!response.ok) throw new Error('Failed to fetch classes');
      return response.json();
    },
    staleTime: 0, // Always refetch
    cacheTime: 0, // Don't cache
  });

  const { data: assignments = [], isLoading: assignmentsLoading, refetch: refetchAssignments } = useQuery({
    queryKey: ["/api/assignments"],
    queryFn: async () => {
      const response = await fetch('/api/assignments');
      if (!response.ok) throw new Error('Failed to fetch assignments');
      return response.json();
    },
    staleTime: 0, // Always refetch
    cacheTime: 0, // Don't cache
  });

  const { data: studySessions = [], isLoading: studyLoading, refetch: refetchSessions } = useQuery({
    queryKey: ["/api/study-sessions"],
    queryFn: async () => {
      const response = await fetch('/api/study-sessions');
      if (!response.ok) throw new Error('Failed to fetch study sessions');
      return response.json();
    },
    staleTime: 0,
    cacheTime: 0,
  });

  const { data: campusLocations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ["/api/campus-locations"],
    queryFn: async () => {
      const response = await fetch('/api/campus-locations');
      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    },
    staleTime: 0,
    cacheTime: 0,
  });

  const { data: campusTransport = [], isLoading: transportLoading } = useQuery({
    queryKey: ["/api/campus-transport"],
    queryFn: async () => {
      const response = await fetch('/api/campus-transport');
      if (!response.ok) throw new Error('Failed to fetch transport');
      return response.json();
    },
    staleTime: 0,
    cacheTime: 0,
  });

  const { data: studyGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/study-groups"],
    queryFn: async () => {
      const response = await fetch('/api/study-groups');
      if (!response.ok) throw new Error('Failed to fetch study groups');
      return response.json();
    },
    staleTime: 0,
    cacheTime: 0,
  });



  // Assignment creation mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (assignmentData: any) => {
      return apiRequest("POST", "/api/assignments", assignmentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      refetchAssignments(); // Force refetch
      setIsAddAssignmentOpen(false);
      setNewAssignment({ title: "", description: "", type: "homework", dueDate: "", priority: "medium", estimatedHours: 2 });
    },
  });

  // Class creation mutation
  const createClassMutation = useMutation({
    mutationFn: async (classData: any) => {
      return apiRequest("POST", "/api/academic-classes", classData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic-classes"] });
      refetchClasses(); // Force refetch
      setIsAddClassOpen(false);
      setNewClass({ className: "", instructor: "", building: "", room: "", startTime: "", endTime: "", dayOfWeek: 1, credits: 3, semester: "Fall 2025" });
    },
  });

  // Study session creation mutation
  const createStudySessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      console.log("Creating study session with data:", sessionData);
      try {
        const response = await apiRequest("POST", "/api/study-sessions", sessionData);
        console.log("API response:", response);
        return response;
      } catch (error) {
        console.error("API request failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Study session created successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/study-sessions"] });
      refetchSessions(); // Force refetch
      setIsAddStudySessionOpen(false);
      setNewStudySession({ subject: "", topic: "", technique: "", duration: 60, notes: "" });
    },
    onError: (error) => {
      console.error("Failed to create study session:", error);
      // Prevent the error from bubbling up and causing the black error overlay
      if (error?.message?.includes('cross-origin')) {
        console.log("Cross-origin error detected, but session may have been created successfully");
        // Refresh the data to see if it actually worked
        queryClient.invalidateQueries({ queryKey: ["/api/study-sessions"] });
        refetchSessions();
        setIsAddStudySessionOpen(false);
        setNewStudySession({ subject: "", topic: "", technique: "", duration: 60, notes: "" });
      }
    },
  });



  // Study group creation mutation
  const createStudyGroupMutation = useMutation({
    mutationFn: async (groupData: any) => {
      return apiRequest("POST", "/api/study-groups", groupData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-groups"] });
      setIsAddStudyGroupOpen(false);
      setNewStudyGroup({ groupName: "", subject: "", description: "", meetingDay: "", meetingTime: "", maxMembers: 6 });
    },
  });

  // Campus location creation mutation
  const createLocationMutation = useMutation({
    mutationFn: async (locationData: any) => {
      return await apiRequest("POST", "/api/campus-locations", locationData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campus-locations"] });
      setIsAddLocationOpen(false);
      setNewLocation({ name: "", building: "", floor: "", description: "", category: "academic" });
    },
  });

  // Campus transport creation mutation
  const createTransportMutation = useMutation({
    mutationFn: async (transportData: any) => {
      return await apiRequest("POST", "/api/campus-transport", transportData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campus-transport"] });
      setIsAddTransportOpen(false);
      setNewTransport({ routeName: "", fromStop: "", toStop: "", departureTime: "", estimatedDuration: 15 });
    },
  });



  const handleCreateAssignment = () => {
    if (!newAssignment.title.trim() || !newAssignment.dueDate) {
      return;
    }
    createAssignmentMutation.mutate({
      ...newAssignment,
      dueDate: new Date(newAssignment.dueDate).toISOString()
    });
  };

  const handleCreateClass = () => {
    if (!newClass.className.trim() || !newClass.instructor.trim()) {
      return;
    }
    createClassMutation.mutate({ ...newClass, isActive: true });
  };

  const handleCreateStudySession = async () => {
    console.log("=== handleCreateStudySession CALLED ===");
    console.log("Current newStudySession:", newStudySession);
    
    if (!newStudySession.subject.trim()) {
      console.log("Subject is empty, returning early");
      return;
    }
    
    try {
      // Add userId to the session data
      const sessionData = { 
        ...newStudySession, 
        startedAt: new Date().toISOString(),
        completedAt: null, // Don't mark as completed initially
        effectiveness: null // No effectiveness rating until completed
      };
      
      console.log("About to create session with data:", sessionData);
      console.log("Mutation object:", createStudySessionMutation);
      console.log("Calling mutation...");
      await createStudySessionMutation.mutateAsync(sessionData);
      console.log("Mutation completed successfully");
    } catch (error) {
      console.error("Error in handleCreateStudySession:", error);
    }
  };



  const handleCreateLocation = () => {
    if (!newLocation.name.trim() || !newLocation.building.trim()) {
      return;
    }
    createLocationMutation.mutate(newLocation);
  };

  const handleCreateTransport = () => {
    if (!newTransport.routeName.trim() || !newTransport.fromStop.trim()) {
      return;
    }
    createTransportMutation.mutate(newTransport);
  };

  const handleCreateStudyGroup = () => {
    if (!newStudyGroup.groupName.trim() || !newStudyGroup.subject.trim()) {
      return;
    }
    createStudyGroupMutation.mutate({ ...newStudyGroup, isActive: true, currentMembers: 1 });
  };



  // Helper functions with error handling
  const getUpcomingAssignments = () => {
    try {
      if (!Array.isArray(assignments)) return [];
      const now = new Date();
      const upcoming = assignments
        .filter((a: Assignment) => a && a.dueDate && new Date(a.dueDate) > now && a.status !== "completed")
        .sort((a: Assignment, b: Assignment) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5);
      return upcoming;
    } catch (error) {
      console.error("Error in getUpcomingAssignments:", error);
      return [];
    }
  };

  const getTodayClasses = () => {
    try {
      if (!Array.isArray(classes)) return [];
      const today = new Date().getDay();
      return classes.filter((c: AcademicClass) => c && c.dayOfWeek === today && c.isActive);
    } catch (error) {
      console.error("Error in getTodayClasses:", error);
      return [];
    }
  };

  const getClassProgress = () => {
    try {
      if (!Array.isArray(classes) || !Array.isArray(studySessions)) return 0;
      const totalClasses = classes.length;
      const attendedClasses = studySessions.filter((s: StudySession) => s && s.classId).length;
      return totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
    } catch (error) {
      console.error("Error in getClassProgress:", error);
      return 0;
    }
  };

  const getAssignmentStats = () => {
    try {
      if (!Array.isArray(assignments)) return { total: 0, completed: 0, inProgress: 0, overdue: 0 };
      const total = assignments.length;
      const completed = assignments.filter((a: Assignment) => a && a.status === "completed").length;
      const inProgress = assignments.filter((a: Assignment) => a && a.status === "in_progress").length;
      const overdue = assignments.filter((a: Assignment) => 
        a && a.dueDate && new Date(a.dueDate) < new Date() && a.status !== "completed"
      ).length;
      
      return { total, completed, inProgress, overdue };
    } catch (error) {
      console.error("Error in getAssignmentStats:", error);
      return { total: 0, completed: 0, inProgress: 0, overdue: 0 };
    }
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (classesLoading || assignmentsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Add safety checks for helper functions
  let todayClasses: AcademicClass[] = [];
  let upcomingAssignments: Assignment[] = [];
  let classProgress = 0;
  let assignmentStats = { total: 0, completed: 0, inProgress: 0, overdue: 0 };

  try {
    todayClasses = getTodayClasses();
    upcomingAssignments = getUpcomingAssignments();
    classProgress = getClassProgress();
    assignmentStats = getAssignmentStats();
  } catch (error) {
    console.error("Error in helper functions:", error);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic Planner</h1>
        <p className="text-gray-600">
          Manage your classes, assignments, study sessions, and campus navigation
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Classes</p>
                <p className="text-2xl font-bold text-gray-900">{todayClasses.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Due This Week</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingAssignments.length}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assignment Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignmentStats.completed}/{assignmentStats.total}
                </p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Study Hours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(studySessions.reduce((total: number, session: StudySession) => 
                    total + (session.duration || 0), 0) / 60)}h
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 w-full gap-1 h-auto p-1 mb-6">
          <TabsTrigger value="schedule" className="text-xs md:text-sm px-2 md:px-4 py-2">Schedule</TabsTrigger>
          <TabsTrigger value="assignments" className="text-xs md:text-sm px-2 md:px-4 py-2">Assignments</TabsTrigger>
          <TabsTrigger value="study" className="text-xs md:text-sm px-2 md:px-4 py-2">Study</TabsTrigger>
          <TabsTrigger value="campus" className="text-xs md:text-sm px-2 md:px-4 py-2">Campus</TabsTrigger>
          <TabsTrigger value="social" className="text-xs md:text-sm px-2 md:px-4 py-2">Social</TabsTrigger>
        </TabsList>

        {/* Today's Schedule */}
        <TabsContent value="schedule" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Today's Schedule
              </CardTitle>
              <CardDescription>
                Your classes and study sessions for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todayClasses.length > 0 ? (
                <div className="space-y-4">
                  {todayClasses.map((classItem: AcademicClass) => (
                    <div key={classItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div>
                          <h3 className="font-semibold">{classItem.className}</h3>
                          <p className="text-sm text-gray-600">
                            {classItem.instructor} • {classItem.building} {classItem.room}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{classItem.startTime} - {classItem.endTime}</p>
                        <p className="text-sm text-gray-600">{classItem.credits} credits</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No classes scheduled for today</p>
                  <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
                    <DialogTrigger asChild>
                      <Button className="mt-4" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Class
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Class</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        <Input
                          placeholder="Class name"
                          value={newClass.className}
                          onChange={(e) => setNewClass({ ...newClass, className: e.target.value })}
                        />
                        <Input
                          placeholder="Instructor"
                          value={newClass.instructor}
                          onChange={(e) => setNewClass({ ...newClass, instructor: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Building"
                            value={newClass.building}
                            onChange={(e) => setNewClass({ ...newClass, building: e.target.value })}
                          />
                          <Input
                            placeholder="Room"
                            value={newClass.room}
                            onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="time"
                            value={newClass.startTime}
                            onChange={(e) => setNewClass({ ...newClass, startTime: e.target.value })}
                          />
                          <Input
                            type="time"
                            value={newClass.endTime}
                            onChange={(e) => setNewClass({ ...newClass, endTime: e.target.value })}
                          />
                        </div>
                        <Select value={newClass.dayOfWeek.toString()} onValueChange={(value) => setNewClass({ ...newClass, dayOfWeek: parseInt(value) })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Day of week" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Monday</SelectItem>
                            <SelectItem value="2">Tuesday</SelectItem>
                            <SelectItem value="3">Wednesday</SelectItem>
                            <SelectItem value="4">Thursday</SelectItem>
                            <SelectItem value="5">Friday</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          placeholder="Credits"
                          value={newClass.credits}
                          onChange={(e) => setNewClass({ ...newClass, credits: parseInt(e.target.value) || 3 })}
                          min="1"
                          max="6"
                        />
                        <Select value={newClass.semester} onValueChange={(value) => setNewClass({ ...newClass, semester: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Semester" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Fall 2025">Fall 2025</SelectItem>
                            <SelectItem value="Spring 2026">Spring 2026</SelectItem>
                            <SelectItem value="Summer 2025">Summer 2025</SelectItem>
                            <SelectItem value="Winter 2025">Winter 2025</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex space-x-2">
                          <Button 
                            onClick={handleCreateClass} 
                            disabled={createClassMutation.isPending} 
                            className="flex-1"
                          >
                            {createClassMutation.isPending ? "Creating..." : "Create Class"}
                          </Button>
                          <Button onClick={() => setIsAddClassOpen(false)} variant="outline" className="flex-1">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments */}
        <TabsContent value="assignments" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Upcoming Assignments
              </CardTitle>
              <CardDescription>
                Track your homework, projects, and deadlines
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length > 0 ? (
                <div className="space-y-4">
                  {assignments.map((assignment: Assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          assignment.priority === "urgent" ? "bg-red-500" :
                          assignment.priority === "high" ? "bg-orange-500" :
                          assignment.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                        }`}></div>
                        <div>
                          <h3 className="font-semibold">{assignment.title}</h3>
                          <p className="text-sm text-gray-600">{assignment.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getPriorityColor(assignment.priority)}>
                          {formatDueDate(assignment.dueDate)}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">
                          {assignment.estimatedHours}h estimated
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No assignments yet</p>
                  <Dialog open={isAddAssignmentOpen} onOpenChange={setIsAddAssignmentOpen}>
                    <DialogTrigger asChild>
                      <Button className="mt-4" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Assignment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Assignment</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        <Input
                          placeholder="Assignment title"
                          value={newAssignment.title}
                          onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                        />
                        <Textarea
                          placeholder="Description (optional)"
                          value={newAssignment.description}
                          onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                        />
                        <Select 
                          value={newAssignment.type} 
                          onValueChange={(value) => setNewAssignment({ ...newAssignment, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Assignment type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="homework">Homework</SelectItem>
                            <SelectItem value="project">Project</SelectItem>
                            <SelectItem value="exam">Exam</SelectItem>
                            <SelectItem value="quiz">Quiz</SelectItem>
                            <SelectItem value="paper">Paper</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          placeholder="Due date"
                          value={newAssignment.dueDate}
                          onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                        />
                        <Select 
                          value={newAssignment.priority} 
                          onValueChange={(value) => setNewAssignment({ ...newAssignment, priority: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          placeholder="Estimated hours"
                          value={newAssignment.estimatedHours}
                          onChange={(e) => setNewAssignment({ ...newAssignment, estimatedHours: parseInt(e.target.value) || 2 })}
                          min="1"
                          max="100"
                        />
                        <div className="flex space-x-2">
                          <Button 
                            onClick={handleCreateAssignment} 
                            disabled={createAssignmentMutation.isPending}
                            className="flex-1"
                          >
                            {createAssignmentMutation.isPending ? "Creating..." : "Create Assignment"}
                          </Button>
                          <Button 
                            onClick={() => setIsAddAssignmentOpen(false)} 
                            variant="outline"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Study Sessions */}
        <TabsContent value="study" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Study Tracker
              </CardTitle>
              <CardDescription>
                Track your study sessions and techniques
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("=== HEADER BUTTON CLICKED ===");
                    console.log("isAddStudySessionOpen before:", isAddStudySessionOpen);
                    setIsAddStudySessionOpen(true);
                    console.log("setIsAddStudySessionOpen(true) called");
                    console.log("Dialog should be opening now...");
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Study Session
                </Button>
              </div>
              {studySessions.length > 0 ? (
                <div className="space-y-4">
                  {studySessions.slice(0, 5).map((session: StudySession) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{session.subject}</h4>
                        <p className="text-sm text-gray-600">
                          {session.technique} • {session.duration} minutes
                        </p>
                        {session.location && (
                          <p className="text-xs text-gray-500">{session.location}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {session.completedAt ? "Completed" : "In Progress"}
                        </p>
                        {session.effectiveness && (
                          <p className="text-xs text-gray-500">
                            {session.effectiveness}/5 stars
                          </p>
                        )}
                        {!session.completedAt && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-1"
                            onClick={(e) => {
                              e.preventDefault();
                              console.log("Complete button clicked for session:", session.id);
                              // Complete the session via API
                              fetch(`/api/study-sessions/${session.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  completedAt: new Date().toISOString(),
                                  effectiveness: 4
                                })
                              }).then(response => {
                                if (response.ok) {
                                  console.log("Session completed successfully");
                                  queryClient.invalidateQueries({ queryKey: ["/api/study-sessions"] });
                                } else {
                                  console.error("Failed to complete session:", response.status);
                                }
                              }).catch(err => console.error("Failed to complete session:", err));
                            }}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Start tracking your study sessions</p>
                </div>
              )}
              
              <Dialog open={isAddStudySessionOpen} onOpenChange={setIsAddStudySessionOpen}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Start Study Session</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        <Input
                          placeholder="Subject (required)"
                          value={newStudySession.subject}
                          onChange={(e) => setNewStudySession({ ...newStudySession, subject: e.target.value })}
                        />
                        <Input
                          placeholder="Topic"
                          value={newStudySession.topic}
                          onChange={(e) => setNewStudySession({ ...newStudySession, topic: e.target.value })}
                        />
                        <Select value={newStudySession.technique} onValueChange={(value) => setNewStudySession({ ...newStudySession, technique: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Study technique" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reading">Reading</SelectItem>
                            <SelectItem value="flashcards">Flashcards</SelectItem>
                            <SelectItem value="practice-problems">Practice Problems</SelectItem>
                            <SelectItem value="note-taking">Note Taking</SelectItem>
                            <SelectItem value="group-study">Group Study</SelectItem>
                            <SelectItem value="online-resources">Online Resources</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          placeholder="Duration (minutes)"
                          value={newStudySession.duration}
                          onChange={(e) => setNewStudySession({ ...newStudySession, duration: parseInt(e.target.value) || 60 })}
                          min="5"
                          max="300"
                        />
                        <Textarea
                          placeholder="Notes (optional)"
                          value={newStudySession.notes}
                          onChange={(e) => setNewStudySession({ ...newStudySession, notes: e.target.value })}
                        />
                        <div className="flex space-x-2">
                          <Button 
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log("=== START SESSION BUTTON CLICKED ===");
                              console.log("newStudySession data:", newStudySession);
                              console.log("Subject value:", newStudySession.subject);
                              console.log("Subject trimmed:", newStudySession.subject.trim());
                              console.log("Is subject empty?", !newStudySession.subject.trim());
                              console.log("Mutation pending:", createStudySessionMutation.isPending);
                              try {
                                await handleCreateStudySession();
                                console.log("handleCreateStudySession completed");
                              } catch (error) {
                                console.error("Button click error handled:", error);
                              }
                            }} 
                            disabled={createStudySessionMutation.isPending} 
                            className="flex-1"
                          >
                            {createStudySessionMutation.isPending ? "Starting..." : "Start Session"}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsAddStudySessionOpen(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campus Navigation */}
        <TabsContent value="campus" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Campus Locations
                </CardTitle>
                <CardDescription>
                  Your saved places and favorite spots
                </CardDescription>
              </CardHeader>
              <CardContent>
                {locationsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="text-gray-600 mt-2">Loading locations...</p>
                  </div>
                ) : campusLocations.length > 0 ? (
                  <div className="space-y-3">
                    {campusLocations.map((location: any) => (
                      <div key={location.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium">{location.name}</p>
                          <p className="text-sm text-gray-600">
                            {location.building}
                            {location.floor && `, Floor ${location.floor}`}
                          </p>
                          {location.description && (
                            <p className="text-xs text-gray-500 mt-1">{location.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No campus locations saved</p>
                  </div>
                )}
                
                <Dialog open={isAddLocationOpen} onOpenChange={setIsAddLocationOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full mt-4" variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Location
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Campus Location</DialogTitle>
                      <DialogDescription>
                        Save important campus locations for quick reference
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Location name (required)"
                        value={newLocation.name}
                        onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      />
                      <Input
                        placeholder="Building (required)"
                        value={newLocation.building}
                        onChange={(e) => setNewLocation({ ...newLocation, building: e.target.value })}
                      />
                      <Input
                        placeholder="Floor (optional)"
                        value={newLocation.floor}
                        onChange={(e) => setNewLocation({ ...newLocation, floor: e.target.value })}
                      />
                      <Select value={newLocation.category} onValueChange={(value) => setNewLocation({ ...newLocation, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="academic">Academic</SelectItem>
                          <SelectItem value="dining">Dining</SelectItem>
                          <SelectItem value="recreation">Recreation</SelectItem>
                          <SelectItem value="services">Services</SelectItem>
                          <SelectItem value="transportation">Transportation</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea
                        placeholder="Description (optional)"
                        value={newLocation.description}
                        onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                      />
                      <div className="flex space-x-2">
                        <Button 
                          onClick={handleCreateLocation} 
                          disabled={createLocationMutation.isPending}
                          className="flex-1"
                        >
                          {createLocationMutation.isPending ? "Adding..." : "Add Location"}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsAddLocationOpen(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="w-5 h-5" />
                  Campus Transportation
                </CardTitle>
                <CardDescription>
                  Bus schedules and routes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transportLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="text-gray-600 mt-2">Loading routes...</p>
                  </div>
                ) : campusTransport.length > 0 ? (
                  <div className="space-y-3">
                    {campusTransport.map((route: any) => (
                      <div key={route.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Bus className="w-5 h-5 text-green-600" />
                        <div className="flex-1">
                          <p className="font-medium">{route.routeName}</p>
                          <p className="text-sm text-gray-600">
                            {route.fromStop} → {route.toStop}
                          </p>
                          <p className="text-xs text-gray-500">
                            Departs: {route.departureTime} • ~{route.estimatedDuration} min
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No transportation routes saved</p>
                  </div>
                )}
                
                <Dialog open={isAddTransportOpen} onOpenChange={setIsAddTransportOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-4 w-full" size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Route
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Transportation Route</DialogTitle>
                      <DialogDescription>
                        Save bus routes and schedules for easy access
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Route name (required)"
                        value={newTransport.routeName}
                        onChange={(e) => setNewTransport({ ...newTransport, routeName: e.target.value })}
                      />
                      <Input
                        placeholder="From stop (required)"
                        value={newTransport.fromStop}
                        onChange={(e) => setNewTransport({ ...newTransport, fromStop: e.target.value })}
                      />
                      <Input
                        placeholder="To stop"
                        value={newTransport.toStop}
                        onChange={(e) => setNewTransport({ ...newTransport, toStop: e.target.value })}
                      />
                      <Input
                        type="time"
                        placeholder="Departure time"
                        value={newTransport.departureTime}
                        onChange={(e) => setNewTransport({ ...newTransport, departureTime: e.target.value })}
                      />
                      <Input
                        type="number"
                        placeholder="Estimated duration (minutes)"
                        value={newTransport.estimatedDuration}
                        onChange={(e) => setNewTransport({ ...newTransport, estimatedDuration: parseInt(e.target.value) || 15 })}
                        min="5"
                        max="120"
                      />
                      <div className="flex space-x-2">
                        <Button 
                          onClick={handleCreateTransport} 
                          disabled={createTransportMutation.isPending}
                          className="flex-1"
                        >
                          {createTransportMutation.isPending ? "Adding..." : "Add Route"}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsAddTransportOpen(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Study Groups */}
        <TabsContent value="social" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Study Groups
              </CardTitle>
              <CardDescription>
                Collaborate and learn with classmates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {groupsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="text-gray-600 mt-2">Loading study groups...</p>
                </div>
              ) : studyGroups.length > 0 ? (
                <div className="space-y-3">
                  {studyGroups.map((group: any) => (
                    <div key={group.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Users className="w-5 h-5 text-purple-600" />
                      <div className="flex-1">
                        <p className="font-medium">{group.groupName}</p>
                        <p className="text-sm text-gray-600">{group.subject}</p>
                        {group.meetingDay && group.meetingTime && (
                          <p className="text-xs text-gray-500">
                            {group.meetingDay}s at {group.meetingTime}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">{group.currentMembers || 1} member{(group.currentMembers || 1) !== 1 ? 's' : ''}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No study groups yet</p>
                </div>
              )}
              
              <Dialog open={isAddStudyGroupOpen} onOpenChange={setIsAddStudyGroupOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full mt-4" size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Study Group
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Study Group</DialogTitle>
                    <DialogDescription>
                      Start a study group to collaborate with classmates
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Group name (required)"
                      value={newStudyGroup.groupName}
                      onChange={(e) => setNewStudyGroup({ ...newStudyGroup, groupName: e.target.value })}
                    />
                    <Input
                      placeholder="Subject (required)"
                      value={newStudyGroup.subject}
                      onChange={(e) => setNewStudyGroup({ ...newStudyGroup, subject: e.target.value })}
                    />
                    <Textarea
                      placeholder="Description (optional)"
                      value={newStudyGroup.description}
                      onChange={(e) => setNewStudyGroup({ ...newStudyGroup, description: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Select value={newStudyGroup.meetingDay} onValueChange={(value) => setNewStudyGroup({ ...newStudyGroup, meetingDay: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Meeting day" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monday">Monday</SelectItem>
                          <SelectItem value="Tuesday">Tuesday</SelectItem>
                          <SelectItem value="Wednesday">Wednesday</SelectItem>
                          <SelectItem value="Thursday">Thursday</SelectItem>
                          <SelectItem value="Friday">Friday</SelectItem>
                          <SelectItem value="Saturday">Saturday</SelectItem>
                          <SelectItem value="Sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="time"
                        placeholder="Meeting time"
                        value={newStudyGroup.meetingTime}
                        onChange={(e) => setNewStudyGroup({ ...newStudyGroup, meetingTime: e.target.value })}
                      />
                    </div>
                    <Input
                      type="number"
                      placeholder="Max members (default: 6)"
                      value={newStudyGroup.maxMembers}
                      onChange={(e) => setNewStudyGroup({ ...newStudyGroup, maxMembers: parseInt(e.target.value) || 6 })}
                      min="2"
                      max="20"
                    />
                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleCreateStudyGroup} 
                        disabled={createStudyGroupMutation.isPending}
                        className="flex-1"
                      >
                        {createStudyGroupMutation.isPending ? "Creating..." : "Create Group"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsAddStudyGroupOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
