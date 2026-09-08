import React from "react";
import WearableDevicesModule from "@/components/wearable-devices-module";
import PremiumFeaturePrompt from "@/components/premium-feature-prompt";
import { useSubscriptionEnforcement } from "@/middleware/subscription-middleware";

export default function WearableDevicesPage() {
  const { hasFeature } = useSubscriptionEnforcement();
  
  // Check if user has access to wearable device features
  if (!hasFeature('wearableDevices')) {
    return (
      <div className="container mx-auto p-6">
        <PremiumFeaturePrompt
          title="Wearable Device Integration"
          description="Connect smartwatches and fitness trackers to automatically sync health data, track activity, and monitor vital signs. This premium feature provides comprehensive health insights."
          feature="wearableDevices"
          requiredPlan="premium"
          className="max-w-md mx-auto mt-20"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Wearable Devices</h1>
        <p className="text-gray-600 mt-2">
          Connect and monitor your health data from smartwatches and fitness trackers
        </p>
      </div>
      <WearableDevicesModule />
    </div>
  );
}