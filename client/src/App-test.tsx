import { Switch, Route, Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu, X, Home, CheckSquare, Heart, DollarSign, Calendar, Users, Pill, Stethoscope } from "lucide-react";

function SimpleNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-purple-600">AdaptaLyfe</h1>
          </div>
          
          <div className="hidden md:flex space-x-4">
            <Link href="/dashboard"><Button variant="ghost">Dashboard</Button></Link>
            <Link href="/daily-tasks"><Button variant="ghost">Tasks</Button></Link>
            <Link href="/mood-tracking"><Button variant="ghost">Mood</Button></Link>
            <Link href="/financial"><Button variant="ghost">Finance</Button></Link>
            <Link href="/medical"><Button variant="ghost">Medical</Button></Link>
          </div>
          
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        {isOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link href="/dashboard" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900">Dashboard</Link>
              <Link href="/daily-tasks" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900">Tasks</Link>
              <Link href="/mood-tracking" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900">Mood</Link>
              <Link href="/financial" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900">Finance</Link>
              <Link href="/medical" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900">Medical</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-purple-800">
          AdaptaLyfe Dashboard
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-green-600" />
                Daily Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Track your daily activities and build independence</p>
              <Link href="/daily-tasks">
                <Button className="mt-4 w-full">View Tasks</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-600" />
                Mood Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Monitor your emotional wellness daily</p>
              <Link href="/mood-tracking">
                <Button className="mt-4 w-full">Track Mood</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Financial Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Manage bills and budget effectively</p>
              <Link href="/financial">
                <Button className="mt-4 w-full">View Finance</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Schedule and track appointments</p>
              <Link href="/calendar">
                <Button className="mt-4 w-full">View Calendar</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-red-600" />
                Medical Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Store important medical information</p>
              <Link href="/medical">
                <Button className="mt-4 w-full">View Medical</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Support Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Connect with your caregivers</p>
              <Link href="/caregiver">
                <Button className="mt-4 w-full">View Support</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SimplePage({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-purple-800">{title}</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600 text-center">{description}</p>
            <div className="mt-6 text-center">
              <Link href="/dashboard">
                <Button>Back to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div>
      <SimpleNavigation />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/daily-tasks" component={() => <SimplePage title="Daily Tasks" description="Manage your daily activities and build independence skills" />} />
        <Route path="/mood-tracking" component={() => <SimplePage title="Mood Tracking" description="Monitor your emotional wellness and track patterns" />} />
        <Route path="/financial" component={() => <SimplePage title="Financial Management" description="Track bills, budget, and manage your money" />} />
        <Route path="/calendar" component={() => <SimplePage title="Calendar" description="Schedule and track your appointments and events" />} />
        <Route path="/medical" component={() => <SimplePage title="Medical Information" description="Store important medical information and medication details" />} />
        <Route path="/caregiver" component={() => <SimplePage title="Support Network" description="Connect with your caregivers and support team" />} />
        <Route component={() => <SimplePage title="Page Not Found" description="The page you're looking for doesn't exist" />} />
      </Switch>
    </div>
  );
}