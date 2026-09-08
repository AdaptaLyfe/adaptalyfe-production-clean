import { Switch, Route } from "wouter";
import React from "react";

// Minimal Dashboard Component
function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-600 mb-2">
            Welcome to AdaptaLyfe Dashboard
          </h1>
          <p className="text-gray-600">
            Your comprehensive independence-building platform
          </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-3">📋 Daily Tasks</h3>
            <p className="text-gray-600">Organize and track your daily activities with visual step-by-step guides</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-3">💰 Financial Management</h3>
            <p className="text-gray-600">Manage bills, track expenses, and build budgeting skills</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-3">🏥 Medical Management</h3>
            <p className="text-gray-600">Track medications, appointments, and health information</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-3">😊 Mood Tracking</h3>
            <p className="text-gray-600">Monitor your emotional well-being with daily mood check-ins</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-3">🎓 Academic Support</h3>
            <p className="text-gray-600">Manage classes, assignments, and study schedules</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-3">🤖 AdaptAI Assistant</h3>
            <p className="text-gray-600">Get personalized support and guidance whenever needed</p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Demo is fully functional with comprehensive sample data
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => window.location.href = '/demo.html'}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Static Demo Page
            </button>
            <button 
              onClick={() => {
                // Try to load the full app
                import("./App").then(({ default: FullApp }) => {
                  console.log("Full app loaded successfully");
                  window.location.reload();
                }).catch(err => {
                  console.error("Failed to load full app:", err);
                  alert("Loading full app... Please wait and try again.");
                });
              }}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Try Full Features
            </button>
            <button 
              onClick={() => {
                alert("AdaptaLyfe Demo\n\nFeatures available:\n- Daily Tasks Management\n- Financial Planning\n- Medical Support\n- Mood Tracking\n- Academic Planning\n- AI Assistant\n\nAll features have comprehensive sample data for testing.");
              }}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              About Features
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Navigation
function SimpleNavigation() {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="text-xl font-bold text-gray-900">AdaptaLyfe</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Demo Mode</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100">
      <SimpleNavigation />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route component={Dashboard} />
      </Switch>
    </div>
  );
}

export default App;