import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent, setUserId, setUserProperties, isSupported } from "firebase/analytics";
import type { Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let analytics: Analytics | null = null;
let initPromise: Promise<Analytics | null> | null = null;
let initAttempted = false;

export async function initFirebaseAnalytics(): Promise<Analytics | null> {
  if (analytics) return analytics;
  if (initAttempted) return null;
  initAttempted = true;
  try {
    const supported = await isSupported();
    if (!supported) {
      console.log("Firebase Analytics not supported in this environment");
      return null;
    }
    const app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
    console.log("Firebase Analytics initialized");
    return analytics;
  } catch (error) {
    console.error("Firebase Analytics init error:", error);
    return null;
  }
}

function ensureInit(): Promise<Analytics | null> {
  if (analytics) return Promise.resolve(analytics);
  if (!initPromise) {
    initPromise = initFirebaseAnalytics();
  }
  return initPromise;
}

async function getOrInitAnalytics(): Promise<Analytics | null> {
  if (analytics) return analytics;
  return ensureInit();
}

export function trackLogin(method: string) {
  getOrInitAnalytics().then(a => { if (a) logEvent(a, "login", { method }); });
}

export function trackSignUp(method: string) {
  getOrInitAnalytics().then(a => { if (a) logEvent(a, "sign_up", { method }); });
}

export function trackScreenView(screenName: string) {
  getOrInitAnalytics().then(a => { if (a) logEvent(a, "screen_view", { firebase_screen: screenName, firebase_screen_class: screenName }); });
}

export function trackFeatureUsage(featureName: string, details?: Record<string, string>) {
  getOrInitAnalytics().then(a => { if (a) logEvent(a, "feature_used", { feature_name: featureName, ...details }); });
}

export function trackDailyActivity(activityType: string) {
  getOrInitAnalytics().then(a => { if (a) logEvent(a, "daily_activity", { activity_type: activityType, timestamp: new Date().toISOString() }); });
}

export function trackMoodEntry(moodValue: number, moodLabel: string) {
  getOrInitAnalytics().then(a => { if (a) logEvent(a, "mood_logged", { mood_value: String(moodValue), mood_label: moodLabel }); });
}

export function trackTaskCompletion(taskCategory: string) {
  getOrInitAnalytics().then(a => { if (a) logEvent(a, "task_completed", { task_category: taskCategory }); });
}

export function trackSubscriptionEvent(action: string, planType: string) {
  getOrInitAnalytics().then(a => { if (a) logEvent(a, "subscription_event", { action, plan_type: planType }); });
}

export function trackTrialStatus(daysLeft: number, status: string) {
  getOrInitAnalytics().then(a => { if (a) logEvent(a, "trial_status", { days_left: String(daysLeft), status }); });
}

export function trackChurnRisk(reason: string, details?: Record<string, string>) {
  getOrInitAnalytics().then(a => { if (a) logEvent(a, "churn_risk", { reason, ...details }); });
}

export function trackRetention(daysSinceSignup: number, isActive: boolean) {
  getOrInitAnalytics().then(a => { if (a) logEvent(a, "retention_check", { days_since_signup: String(daysSinceSignup), is_active: String(isActive) }); });
}

export function trackSessionStart() {
  getOrInitAnalytics().then(a => { if (a) logEvent(a, "session_start_custom", { timestamp: new Date().toISOString() }); });
}

export function trackSessionEnd(durationSeconds: number) {
  if (analytics) logEvent(analytics, "session_end_custom", { duration_seconds: String(durationSeconds) });
}

export function trackPageNavigation(from: string, to: string) {
  getOrInitAnalytics().then(a => { if (a) logEvent(a, "page_navigation", { from_page: from, to_page: to }); });
}

export function trackError(errorType: string, errorMessage: string) {
  getOrInitAnalytics().then(a => { if (a) logEvent(a, "app_error", { error_type: errorType, error_message: errorMessage.substring(0, 100) }); });
}

export function setAnalyticsUser(userId: number, properties?: Record<string, string>) {
  getOrInitAnalytics().then(a => {
    if (a) {
      setUserId(a, String(userId));
      if (properties) {
        setUserProperties(a, properties);
      }
    }
  });
}

export function setAnalyticsUserProperties(properties: Record<string, string>) {
  getOrInitAnalytics().then(a => { if (a) setUserProperties(a, properties); });
}
