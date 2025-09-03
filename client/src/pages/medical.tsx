import MedicalInformationModule from "@/components/medical-information-module";
import PremiumFeaturePrompt from "@/components/premium-feature-prompt";
import { useSubscriptionEnforcement } from "@/middleware/subscription-middleware";

export default function Medical() {
  const { isPremiumUser } = useSubscriptionEnforcement();
  
  // Block access if trial expired and no active subscription
  if (!isPremiumUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <PremiumFeaturePrompt
              title="Medical Information Management"
              description="Securely store and manage your medical history, allergies, medications, and healthcare contacts. Subscribe to continue using Adaptalyfe's medical features."
              feature="medical"
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
            <h1 className="text-3xl font-bold text-gray-900">Medical Information</h1>
            <p className="text-gray-600 mt-2">
              Manage your medical history, allergies, healthcare contacts, and track symptoms
            </p>
          </div>
          <MedicalInformationModule />
        </div>
      </main>
    </div>
  );
}