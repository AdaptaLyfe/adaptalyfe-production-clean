import PharmacyModule from "@/components/pharmacy-module";
import PremiumFeaturePrompt from "@/components/premium-feature-prompt";
import { useSubscriptionEnforcement } from "@/middleware/subscription-middleware";

export default function Pharmacy() {
  const { hasFeature } = useSubscriptionEnforcement();
  
  // Check if user has access to medication management features
  if (!hasFeature('medicationManagement')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <PremiumFeaturePrompt
              title="Medication List"
              description="Keep a personal list of medications for reference and reminders. All information is entered by the user for organizational purposes only."
              feature="medicationManagement"
              requiredPlan="premium"
              className="max-w-md mx-auto mt-20"
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Medication List</h1>
            <p className="text-gray-600 mt-2">
              Keep a personal list of medications for reference and reminders. All information is entered by the user for organizational purposes only.
            </p>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Disclaimer:</strong> Medication information is entered by the user and stored for personal reference only. This app does not provide medical advice or prescription services.
              </p>
            </div>
          </div>
          <PharmacyModule />
        </div>
      </main>
    </div>
  );
}