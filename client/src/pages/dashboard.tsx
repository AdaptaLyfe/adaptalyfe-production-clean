import SubscriptionBanner from "@/components/subscription-banner";
import DashboardGreeting from "@/components/dashboard-greeting";
import DashboardHomeLayout from "@/components/dashboard-home-layout";
import DashboardExtras from "@/components/dashboard-extras";
import QuickActions from "@/components/quick-actions/QuickActions";

export default function Dashboard() {
  return (
    <>
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 pt-1 pb-24 md:pb-8 space-y-5">
        {/* Row 1: greeting + Today's Progress + Current Streak */}
        <DashboardGreeting />

        {/* Row 2: trial / subscription notice (only when needed) */}
        <SubscriptionBanner />

        {/* Routine, schedule, mood check-in and quick resources */}
        <DashboardHomeLayout />

        {/* Quick Actions (keeps Reorder + Customize) */}
        <QuickActions />

        {/* Bills & weekly tasks due soon, motivational quote */}
        <DashboardExtras />
      </div>
    </>
  );
}
