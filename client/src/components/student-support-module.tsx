import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Target, 
  MapPin, 
  Users, 
  Bus,
  CheckCircle,
  AlertCircle,
  Plus,
  GraduationCap,
  Lightbulb,
  Trophy
} from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";

export default function StudentSupportModule() {
  // Mock data for demo - in real app this would come from API
  const upcomingAssignments = [
    { 
      id: 1, 
      title: "Math Homework Chapter 5", 
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      priority: "high", 
      class: "Algebra II",
      estimatedHours: 2 
    },
    { 
      id: 2, 
      title: "History Essay Draft", 
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      priority: "medium", 
      class: "US History",
      estimatedHours: 3 
    }
  ];

  const todayClasses = [
    { id: 1, name: "English Literature", time: "9:00 AM", room: "A-205", instructor: "Ms. Johnson" },
    { id: 2, name: "Biology", time: "11:30 AM", room: "C-101", instructor: "Mr. Smith" },
    { id: 3, name: "Algebra II", time: "2:00 PM", room: "B-304", instructor: "Mrs. Davis" }
  ];

  const studyTips = [
    "Break large assignments into smaller tasks",
    "Use the Pomodoro Technique: 25 min focus, 5 min break",
    "Create a quiet, organized study space",
    "Take notes by hand to improve memory",
    "Review material within 24 hours of learning it"
  ];

  const transitionSkills = [
    { name: "Time Management", current: 3, target: 5, category: "Academic" },
    { name: "Note Taking", current: 4, target: 5, category: "Academic" },
    { name: "Social Communication", current: 2, target: 4, category: "Social" },
    { name: "Self-Advocacy", current: 3, target: 5, category: "Independence" }
  ];

  const formatDueDate = (dueDate: Date) => {
    if (isToday(dueDate)) return "Today";
    if (isTomorrow(dueDate)) return "Tomorrow";
    return format(dueDate, "MMM d");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Academic Support</h2>
          <p className="text-gray-600">Tools and resources for student success</p>
        </div>
        <Link href="/academic-planner">
          <Button className="bg-purple-600 hover:bg-purple-700">
            <GraduationCap className="w-4 h-4 mr-2" />
            Full Academic Planner
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Today's Classes
            </CardTitle>
            <CardDescription>Your class schedule for today</CardDescription>
          </CardHeader>
          <CardContent>
            {todayClasses.length > 0 ? (
              <div className="space-y-3">
                {todayClasses.map((classItem) => (
                  <div key={classItem.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div>
                      <h4 className="font-semibold text-gray-900">{classItem.name}</h4>
                      <p className="text-sm text-gray-600">{classItem.instructor} • {classItem.room}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-blue-700">{classItem.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No classes today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Due Soon
            </CardTitle>
            <CardDescription>Assignments and deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAssignments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
                      <p className="text-sm text-gray-600">{assignment.class} • {assignment.estimatedHours}h estimated</p>
                    </div>
                    <div className="text-right">
                      <Badge className={getPriorityColor(assignment.priority)}>
                        {formatDueDate(assignment.dueDate)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No assignments due soon</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Study Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              Study Tips
            </CardTitle>
            <CardDescription>Strategies for academic success</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {studyTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">{tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Campus Quick Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              Campus Navigation
            </CardTitle>
            <CardDescription>Quick access to important locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <BookOpen className="w-4 h-4 mr-2" />
                Library
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Student Center
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Bus className="w-4 h-4 mr-2" />
                Bus Schedule
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Independence Skills Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-600" />
              Skill Building
            </CardTitle>
            <CardDescription>Track your independence progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transitionSkills.slice(0, 3).map((skill, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{skill.name}</span>
                    <span className="text-xs text-gray-500">{skill.current}/{skill.target}</span>
                  </div>
                  <Progress 
                    value={(skill.current / skill.target) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
              <Link href="/academic-planner">
                <Button variant="outline" size="sm" className="w-full mt-2">
                  View All Skills
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/academic-planner">
          <Button variant="outline" className="h-20 flex-col space-y-2 w-full">
            <Clock className="w-6 h-6 text-blue-600" />
            <span className="text-sm">Study Sessions</span>
          </Button>
        </Link>
        
        <Link href="/academic-planner">
          <Button variant="outline" className="h-20 flex-col space-y-2 w-full">
            <Target className="w-6 h-6 text-green-600" />
            <span className="text-sm">Set Goals</span>
          </Button>
        </Link>
        
        <Link href="/academic-planner">
          <Button variant="outline" className="h-20 flex-col space-y-2 w-full">
            <Users className="w-6 h-6 text-orange-600" />
            <span className="text-sm">Study Groups</span>
          </Button>
        </Link>
        
        <Link href="/academic-planner">
          <Button variant="outline" className="h-20 flex-col space-y-2 w-full">
            <Plus className="w-6 h-6 text-purple-600" />
            <span className="text-sm">Add Class</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}