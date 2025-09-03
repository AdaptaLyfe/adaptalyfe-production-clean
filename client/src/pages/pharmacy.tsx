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
              title="Pharmacy & Medication Management"
              description="Track medications, set reminders, manage pharmacy information, and order refills. This premium feature ensures you never miss a dose and stay on top of your health."
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
            <h1 className="text-3xl font-bold text-gray-900">Pharmacy & Medications</h1>
            <p className="text-gray-600 mt-2">
              Manage your pharmacies, track medications, and order refills easily
            </p>
          </div>
          <PharmacyModule />
        </div>
      </main>
    </div>
  );
}