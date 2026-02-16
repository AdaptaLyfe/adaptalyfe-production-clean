import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import type { SubscriptionData } from "@/middleware/subscription-middleware";
import {
  initFirebaseAnalytics,
  trackScreenView,
  trackPageNavigation,
  trackSessionStart,
  trackSessionEnd,
  trackDailyActivity,
  trackRetention,
  trackTrialStatus,
  trackChurnRisk,
  setAnalyticsUser,
  setAnalyticsUserProperties,
} from "@/lib/firebase";

export function useFirebaseAnalytics() {
  const [location] = useLocation();
  const prevLocation = useRef(location);
  const sessionStart = useRef(Date.now());
  const initialized = useRef(false);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: subscription } = useQuery<SubscriptionData>({
    queryKey: ["/api/subscription"],
    enabled: !!user,
  });

  useEffect(() => {
    if (!initialized.current) {
      initFirebaseAnalytics().then(() => {
        initialized.current = true;
        trackSessionStart();
        trackDailyActivity("app_open");
      });

      const handleBeforeUnload = () => {
        const duration = Math.floor((Date.now() - sessionStart.current) / 1000);
        trackSessionEnd(duration);
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, []);

  useEffect(() => {
    if (!user || !initialized.current) return;

    const createdAt = user.createdAt ? new Date(user.createdAt as string | Date).getTime() : Date.now();
    const daysSinceSignup = Math.max(0, Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24)));
    if (isNaN(daysSinceSignup)) return;

    setAnalyticsUser(user.id, {
      account_type: user.accountType || "standard",
      subscription_tier: user.subscriptionTier || "free",
      subscription_status: user.subscriptionStatus || "none",
      days_since_signup: String(daysSinceSignup),
    });

    trackRetention(daysSinceSignup, true);

    if (subscription) {
      if (subscription.status === "trialing" && subscription.trialDaysLeft !== null) {
        trackTrialStatus(subscription.trialDaysLeft, "trialing");
        if (subscription.trialDaysLeft <= 2) {
          trackChurnRisk("trial_ending_soon", {
            days_left: String(subscription.trialDaysLeft),
          });
        }
      } else if (subscription.status === "expired") {
        trackChurnRisk("trial_expired", { plan_type: subscription.planType });
      }

      setAnalyticsUserProperties({
        plan_type: subscription.planType,
        subscription_status: subscription.status,
      });
    }
  }, [user, subscription]);

  useEffect(() => {
    if (!initialized.current) return;
    if (prevLocation.current !== location) {
      trackPageNavigation(prevLocation.current, location);
      prevLocation.current = location;
    }

    const screenNameMap: Record<string, string> = {
      "/dashboard": "Dashboard",
      "/mood-tracking": "Mood Tracking",
      "/daily-tasks": "Daily Tasks",
      "/financial": "Financial",
      "/calendar": "Calendar",
      "/resources": "Resources",
      "/settings": "Settings",
      "/subscription": "Subscription",
      "/medical": "Medical Info",
      "/meal-planning": "Meal Planning",
      "/caregiver": "Caregiver",
      "/sleep-tracking": "Sleep Tracking",
      "/academic": "Academic Planner",
    };

    const screenName = screenNameMap[location] || location;
    trackScreenView(screenName);
    trackDailyActivity("page_view");
  }, [location]);
}
