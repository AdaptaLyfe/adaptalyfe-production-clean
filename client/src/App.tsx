import { Switch, Route, useLocation } from "wouter";
import React from "react";
import SimpleNavigation from "@/components/simple-navigation";
import MobileBottomNavigation from "@/components/mobile-bottom-navigation";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import DailyTasks from "@/pages/daily-tasks";
import Financial from "@/pages/financial";
import MoodTracking from "@/pages/mood-tracking";
import Resources from "@/pages/resources";
import Caregiver from "@/pages/caregiver";
import CaregiverSetup from "@/pages/caregiver-setup";
import AcceptInvitation from "@/pages/accept-invitation";
import MobileAcceptInvitation from "@/pages/mobile-accept-invitation";
import MobileLogin from "@/pages/mobile-login";
import InviteLanding from "@/pages/invite-landing";
import Medical from "@/pages/medical";
import MealShopping from "@/pages/meal-shopping";
import Pharmacy from "@/pages/pharmacy";
import AcademicPlanner from "@/pages/academic-planner";
import SkillsMilestones from "@/pages/skills-milestones";
import AdminDashboard from "@/pages/admin-dashboard";
import CaregiverDashboard from "@/pages/caregiver-dashboard";
import SettingsPage from "@/pages/settings";
import Calendar from "@/pages/calendar";
import Features from "@/pages/features";
import Subscription from "@/pages/subscription";
import DirectPayment from "@/pages/direct-payment";
import LifeSkillsModule from "@/components/life-skills-module";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import AuthCheck from "@/components/AuthCheck";
import AdminCheck from "@/components/AdminCheck";

import { RuntimeErrorHandler } from "@/components/runtime-error-handler";
import { ReactErrorBoundary } from "@/components/error-boundary";
import { useSubscriptionEnforcement } from "@/middleware/subscription-middleware";

// Global error handler for Stripe loading issues
const originalError = console.error;
console.error = (...args) => {
  const message = args.join(' ');
  if (message.includes('Failed to load Stripe') || message.includes('stripe')) {
    console.warn('Stripe error suppressed:', message);
    return;
  }
  originalError.apply(console, args);
};

// Suppress Stripe-related errors from showing in the UI
window.addEventListener('error', (event) => {
  if (event.message?.includes('Failed to load Stripe') || 
      event.message?.includes('stripe') ||
      event.filename?.includes('stripe')) {
    event.stopImmediatePropagation();
    event.preventDefault();
    return false;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (String(event.reason).includes('Stripe') || 
      String(event.reason).includes('stripe')) {
    event.stopImmediatePropagation();
    event.preventDefault();
    return false;
  }
});

// Import components directly for now to avoid lazy loading issues
import PersonalDocuments from "@/pages/personal-documents";
import RewardsPage from "@/pages/rewards";
import SleepTracking from "@/pages/sleep-tracking";

// Simple Route Component - no authentication required
function SimpleRoute({ component: Component }: { component: React.ComponentType }) {
  return <Component />;
}

function App() {
  const [location] = useLocation();
  
  // Initialize subscription enforcement for global use
  useSubscriptionEnforcement();
  
  // Completely disable auto demo for production testing
  const isLoggingIn = false;

  if (isLoggingIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-teal-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AdaptaLyfe Demo...</p>
        </div>
      </div>
    );
  }

  return (
    <ReactErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-teal-50 to-blue-100">
      {/* Only show navigation for authenticated app routes, not for landing/auth pages */}
      {!["", "/", "/login", "/register", "/landing", "/debug-landing.html"].includes(location) && <SimpleNavigation />}
      
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/landing" component={Landing} />
        <Route path="/debug-landing.html" component={Landing} />
        <Route path="/login" component={() => {
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          return isMobile ? <MobileLogin /> : <Login />;
        }} />
        <Route path="/register" component={Register} />
        <Route path="/demo" component={Dashboard} />
        
        <Route path="/dashboard">
          <AuthCheck><Dashboard /></AuthCheck>
        </Route>
        <Route path="/subscription">
          <AuthCheck><Subscription /></AuthCheck>
        </Route>
        <Route path="/direct-payment">
          <AuthCheck><DirectPayment /></AuthCheck>
        </Route>
        <Route path="/daily-tasks">
          <AuthCheck><DailyTasks /></AuthCheck>
        </Route>
        <Route path="/task-reminders" component={() => (
          <AuthCheck>
            <React.Suspense fallback={
              <div className="container mx-auto p-6">
                <div className="max-w-6xl mx-auto">
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
                    <div className="bg-white rounded-lg border p-6">
                      <div className="h-4 bg-gray-300 rounded w-32 mb-4"></div>
                      <div className="h-4 bg-gray-300 rounded w-48 mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-40"></div>
                    </div>
                  </div>
                </div>
              </div>
            }>
              {React.createElement(React.lazy(() => import("@/pages/task-reminders")))}
            </React.Suspense>
          </AuthCheck>
        )} />
        <Route path="/financial">
          <AuthCheck><Financial /></AuthCheck>
        </Route>
        <Route path="/mood-tracking">
          <AuthCheck><MoodTracking /></AuthCheck>
        </Route>
        <Route path="/sleep-tracking">
          <AuthCheck><SleepTracking /></AuthCheck>
        </Route>
        <Route path="/calendar">
          <AuthCheck><Calendar /></AuthCheck>
        </Route>
        <Route path="/medical">
          <AuthCheck><Medical /></AuthCheck>
        </Route>
        <Route path="/meal-shopping">
          <AuthCheck><MealShopping /></AuthCheck>
        </Route>
        <Route path="/pharmacy">
          <AuthCheck><Pharmacy /></AuthCheck>
        </Route>
        <Route path="/academic-planner">
          <AuthCheck><AcademicPlanner /></AuthCheck>
        </Route>
        <Route path="/skills-milestones">
          <AuthCheck><SkillsMilestones /></AuthCheck>
        </Route>
        <Route path="/task-builder" component={() => (
          <AuthCheck>
            <React.Suspense fallback={
              <div className="container mx-auto p-6">
                <div className="max-w-6xl mx-auto">
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
                    <div className="bg-white rounded-lg border p-6">
                      <div className="h-4 bg-gray-300 rounded w-32 mb-4"></div>
                      <div className="h-4 bg-gray-300 rounded w-48 mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-40"></div>
                    </div>
                  </div>
                </div>
              </div>
            }>
              {React.createElement(React.lazy(() => import("@/pages/task-builder")))}
            </React.Suspense>
          </AuthCheck>
        )} />
        <Route path="/rewards" component={() => (
          <AuthCheck>
            <React.Suspense fallback={
              <div className="container mx-auto p-6">
                <div className="max-w-6xl mx-auto">
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
                    <div className="bg-white rounded-lg border p-6">
                      <div className="h-4 bg-gray-300 rounded w-32 mb-4"></div>
                      <div className="h-4 bg-gray-300 rounded w-48 mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-40"></div>
                    </div>
                  </div>
                </div>
              </div>
            }>
              <RewardsPage />
            </React.Suspense>
          </AuthCheck>
        )} />
        <Route path="/resources">
          <AuthCheck><Resources /></AuthCheck>
        </Route>
        <Route path="/caregiver">
          <AuthCheck><Caregiver /></AuthCheck>
        </Route>
        <Route path="/caregiver-setup">
          <AuthCheck><CaregiverSetup /></AuthCheck>
        </Route>
        <Route path="/invite" component={InviteLanding} />
        <Route path="/accept-invitation" component={() => {
          // Mobile device detection for invitation page
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          return isMobile ? <MobileAcceptInvitation /> : <AcceptInvitation />;
        }} />
        <Route path="/caregiver-dashboard">
          <AuthCheck><CaregiverDashboard /></AuthCheck>
        </Route>

        <Route path="/admin">
          <AdminCheck><AdminDashboard /></AdminCheck>
        </Route>
        <Route path="/admin-dashboard">
          <AdminCheck><AdminDashboard /></AdminCheck>
        </Route>
        <Route path="/settings">
          <AuthCheck><SettingsPage /></AuthCheck>
        </Route>
        <Route path="/features">
          <Features />
        </Route>
        <Route path="/subscription">
          <AuthCheck><Subscription /></AuthCheck>
        </Route>
        <Route path="/personal-documents" component={() => (
          <AuthCheck>
            <React.Suspense fallback={
              <div className="container mx-auto p-6">
                <div className="max-w-6xl mx-auto">
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
                    <div className="bg-white rounded-lg border p-6">
                      <div className="h-4 bg-gray-300 rounded w-32 mb-4"></div>
                      <div className="h-4 bg-gray-300 rounded w-48 mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-40"></div>
                    </div>
                  </div>
                </div>
              </div>
            }>
              <PersonalDocuments />
            </React.Suspense>
          </AuthCheck>
        )} />
        
        <Route path="*" component={NotFound} />
      </Switch>
      
      {/* Mobile bottom navigation - only show on authenticated pages */}
      {!["", "/", "/login", "/register", "/landing", "/debug-landing.html"].includes(location) && <MobileBottomNavigation />}
      
      {/* Runtime error handler to prevent Replit modal */}
      <RuntimeErrorHandler />
      </div>
    </ReactErrorBoundary>
  );
}

export default App;
