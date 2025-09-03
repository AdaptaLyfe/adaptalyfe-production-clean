import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";

// Basic Navigation Component
function Navigation() {
  const [location, navigate] = useLocation();
  
  const menuItems = [
    { path: "/", label: "Dashboard", icon: "🏠" },
    { path: "/daily-tasks", label: "Daily Tasks", icon: "✅" },
    { path: "/financial", label: "Financial", icon: "💰" },
    { path: "/mood", label: "Mood", icon: "😊" },
    { path: "/resources", label: "Resources", icon: "📚" },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-purple-600">AdaptaLyfe</h1>
          <div className="hidden md:flex space-x-4">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-3 py-2 rounded-md text-sm ${
                  location === item.path
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

// Dashboard Component
function Dashboard() {
  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Welcome to AdaptaLyfe</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">✅ Daily Tasks</h3>
          <p className="text-gray-600">Manage your daily activities with ease</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">💰 Financial</h3>
          <p className="text-gray-600">Track expenses and manage budget</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">😊 Mood Tracking</h3>
          <p className="text-gray-600">Monitor your emotional wellbeing</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">📚 Resources</h3>
          <p className="text-gray-600">Access helpful guides and support</p>
        </div>
      </div>
    </div>
  );
}

// Simple Page Components
function DailyTasks() {
  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Daily Tasks</h2>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p>Your daily task management system</p>
      </div>
    </div>
  );
}

function Financial() {
  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Financial Management</h2>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p>Your financial tracking and budget management</p>
      </div>
    </div>
  );
}

function Mood() {
  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Mood Tracking</h2>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p>Track your emotional wellbeing</p>
      </div>
    </div>
  );
}

function Resources() {
  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Resources</h2>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p>Helpful guides and support resources</p>
      </div>
    </div>
  );
}

// Main App Component
export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/daily-tasks" component={DailyTasks} />
          <Route path="/financial" component={Financial} />
          <Route path="/mood" component={Mood} />
          <Route path="/resources" component={Resources} />
        </Switch>
      </main>
    </div>
  );
}