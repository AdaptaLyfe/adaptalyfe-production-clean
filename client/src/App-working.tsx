import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Brain, Menu, X, Settings, Star, Zap, Volume2, Bell, HelpCircle } from "lucide-react";
import AccessibilitySettingsModule from "@/components/accessibility-settings-module";

// Import all page components
import DailyTasks from "@/pages/daily-tasks";
import Financial from "@/pages/financial";
import Medical from "@/pages/medical";
import MoodTracking from "@/pages/mood-tracking";
import Resources from "@/pages/resources";
import Caregiver from "@/pages/caregiver";
import AdminDashboard from "@/pages/admin-dashboard";
import SettingsPage from "@/pages/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Working Navigation Component
function WorkingNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/' },
    { name: 'Daily Tasks', href: '/daily-tasks' },
    { name: 'Financial', href: '/financial' },
    { name: 'Medical', href: '/medical' },
    { name: 'Mood Tracking', href: '/mood-tracking' },
    { name: 'Resources', href: '/resources' },
    { name: 'Caregiver', href: '/caregiver' },
    { name: 'Admin', href: '/admin' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">AdaptaLyfe</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-4">
            {navigation.map((item) => (
              <Link 
                key={item.name}
                href={item.href} 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {item.name}
              </Link>
            ))}
            <span className="text-sm text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
              Demo Mode
            </span>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            {navigation.map((item) => (
              <Link 
                key={item.name}
                href={item.href} 
                className="block text-gray-600 hover:text-gray-900 px-4 py-2 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="px-4 py-2">
              <span className="text-sm text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                Demo Mode Active
              </span>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Working Dashboard Component
function WorkingDashboard() {
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simplified demo initialization
    const initDemo = async () => {
      try {
        // Always try to get user data first
        const userResponse = await fetch("/api/user");
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
          console.log("User loaded successfully:", userData.name);

          // Fetch tasks if user is loaded
          try {
            const tasksResponse = await fetch("/api/tasks");
            if (tasksResponse.ok) {
              const tasksData = await tasksResponse.json();
              setTasks(tasksData);
              console.log("Tasks loaded:", tasksData.length);
            }
          } catch (taskError) {
            console.log("Tasks loading failed, using fallback");
            setTasks([]);
          }
        } else {
          console.log("User not found, demo mode will proceed with basic data");
          setUser({ name: "Demo User", username: "demo" });
          setTasks([]);
        }
      } catch (error) {
        console.log("Demo loading with fallback data due to:", error.message);
        // Always provide fallback data for demo
        setUser({ name: "Demo User", username: "demo" });
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    initDemo();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AdaptaLyfe Demo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name || "Alex"}!
        </h1>
        <p className="text-gray-600">
          Here's your AdaptaLyfe dashboard with all your daily activities and support tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Daily Tasks Module */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📋 Daily Tasks
            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {tasks.length} tasks
            </span>
          </h3>
          <div className="space-y-2">
            {tasks.slice(0, 3).map((task, index) => (
              <div key={index} className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={task.completed}
                  className="rounded border-gray-300"
                  readOnly
                />
                <span className={task.completed ? "line-through text-gray-500" : "text-gray-700"}>
                  {task.title}
                </span>
              </div>
            ))}
          </div>
          <Link href="/daily-tasks" className="block mt-4 text-blue-600 hover:text-blue-700 font-medium">
            View all tasks →
          </Link>
        </div>

        {/* Financial Management */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">💰 Financial Management</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Upcoming Bills</span>
              <span className="font-semibold">3 due</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Monthly Budget</span>
              <span className="font-semibold text-green-600">On track</span>
            </div>
          </div>
          <Link href="/financial" className="block mt-4 text-blue-600 hover:text-blue-700 font-medium">
            Manage finances →
          </Link>
        </div>

        {/* Medical Management */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">🏥 Medical Management</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Medications</span>
              <span className="font-semibold">5 active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Next Appointment</span>
              <span className="font-semibold">Tomorrow</span>
            </div>
          </div>
          <Link href="/medical" className="block mt-4 text-blue-600 hover:text-blue-700 font-medium">
            View medical info →
          </Link>
        </div>

        {/* Mood Tracking */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">😊 Mood Tracking</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Today's Mood</span>
              <span className="font-semibold">😊 Good</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Weekly Average</span>
              <span className="font-semibold text-green-600">4.2/5</span>
            </div>
          </div>
          <Link href="/mood-tracking" className="block mt-4 text-blue-600 hover:text-blue-700 font-medium">
            Track mood →
          </Link>
        </div>

        {/* Resources */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">📚 Resources</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Coping Strategies</span>
              <span className="font-semibold">15 available</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Emergency Contacts</span>
              <span className="font-semibold">5 saved</span>
            </div>
          </div>
          <Link href="/resources" className="block mt-4 text-blue-600 hover:text-blue-700 font-medium">
            Access resources →
          </Link>
        </div>

        {/* Caregiver Dashboard */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">👥 Caregiver Dashboard</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Active Caregivers</span>
              <span className="font-semibold">2 connected</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Messages</span>
              <span className="font-semibold">3 new</span>
            </div>
          </div>
          <Link href="/caregiver" className="block mt-4 text-blue-600 hover:text-blue-700 font-medium">
            View dashboard →
          </Link>
        </div>
      </div>

      {/* Complete Dashboard Preview */}
      <div className="mt-8">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Complete Dashboard Preview
          </h2>
          <p className="text-gray-600 mb-6">
            View what your personalized dashboard looks like after login with all features active.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Quick Stats Row */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">12</div>
              <div className="text-sm text-blue-600">Day Streak</div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-700">8/10</div>
              <div className="text-sm text-green-600">Tasks Done</div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">😊</div>
              <div className="text-sm text-purple-600">Good Mood</div>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-700">3</div>
              <div className="text-sm text-orange-600">Upcoming Bills</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Today's Tasks Preview */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Today's Tasks (8/10 complete)
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="line-through text-gray-500">Take morning medication</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="line-through text-gray-500">Brush teeth</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                  <span>Evening medication</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                  <span>Review tomorrow's schedule</span>
                </div>
              </div>
            </div>

            {/* Appointments & Reminders */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Upcoming Appointments
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Dr. Johnson (Therapy)</span>
                  <span className="text-blue-600">Tomorrow 2:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Dental Cleaning</span>
                  <span className="text-blue-600">Friday 10:00 AM</span>
                </div>
                <div className="flex justify-between">
                  <span>Job Coach Meeting</span>
                  <span className="text-blue-600">Next Week</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customization Options */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Customization Options:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Link href="/settings" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm">
                <Settings className="w-4 h-4" />
                Layout
              </Link>
              <Link href="/settings" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm">
                <div className="w-4 h-4 text-yellow-300">⭐</div>
                Premium
              </Link>
              <Link href="/settings" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4" />
                Actions
              </Link>
              <Link href="/settings" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm">
                <Volume2 className="w-4 h-4" />
                Voice
              </Link>
              <Link href="/settings" className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm">
                <Bell className="w-4 h-4" />
                Alerts
              </Link>
              <Link href="/settings" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center gap-2 text-sm">
                <HelpCircle className="w-4 h-4" />
                Themes
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Customization Section */}
      <div className="mt-8">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-6 h-6 text-purple-600" />
            Dashboard Customization
          </h2>
          <p className="text-gray-600 mb-6">
            Customize your dashboard layout, enable premium features, and personalize your experience.
          </p>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Customizations:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Reorder dashboard modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Enable/disable features</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Quick action shortcuts</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Accessibility preferences</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Premium AI features</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Advanced voice commands</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Smart insights dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Personalization engine</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility Settings Section */}
      <div className="mt-8">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-6 h-6 text-purple-600" />
            Accessibility Settings
          </h2>
          <p className="text-gray-600 mb-6">
            Test the speech functionality and customize accessibility features. 
            The "Test Voice" button below will demonstrate the text-to-speech feature.
          </p>
          <AccessibilitySettingsModule />
        </div>
      </div>

      <div className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-2">🎯 Demo Mode Active</h3>
        <p className="mb-4">
          You're experiencing the full AdaptaLyfe platform with comprehensive sample data. 
          All features are fully functional and ready for demonstration.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/admin" className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-gray-100">
            Admin Dashboard
          </Link>
          <button 
            onClick={() => window.location.href = '/demo.html'}
            className="bg-purple-700 text-white px-4 py-2 rounded-lg hover:bg-purple-800"
          >
            Static Demo
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100">
          <WorkingNavigation />
          <Switch>
            <Route path="/" component={WorkingDashboard} />
            <Route path="/dashboard" component={WorkingDashboard} />
            <Route path="/daily-tasks" component={DailyTasks} />
            <Route path="/financial" component={Financial} />
            <Route path="/medical" component={Medical} />
            <Route path="/mood-tracking" component={MoodTracking} />
            <Route path="/resources" component={Resources} />
            <Route path="/caregiver" component={Caregiver} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/settings" component={SettingsPage} />
            <Route>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-lg p-8 shadow-lg text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Page Not Found
                  </h2>
                  <p className="text-gray-600 mb-6">
                    The page you're looking for doesn't exist. Return to the dashboard to access all features.
                  </p>
                  <Link href="/" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700">
                    Return to Dashboard
                  </Link>
                </div>
              </div>
            </Route>
          </Switch>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;