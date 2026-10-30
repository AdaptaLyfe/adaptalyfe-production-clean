import MedicalInformationModule from "@/components/medical-information-module";
import PremiumFeaturePrompt from "@/components/premium-feature-prompt";
import { useSubscriptionEnforcement } from "@/middleware/subscription-middleware";

export default function Medical() {
  const { hasFeature } = useSubscriptionEnforcement();
  
  // Health Records are part of Personal Records (Premium and Family plans).
  if (!hasFeature('personalRecords')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <PremiumFeaturePrompt
              title="Health Records"
              description="Keep your sensitivities, conditions, medication reactions and healthcare contacts in one safe place."
              feature="personalRecords"
              requiredPlan="premium"
              className="max-w-md mx-auto mt-6 sm:mt-10"
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
            <h1 className="text-3xl font-bold text-gray-900">Health Records</h1>
            <p className="text-gray-600 mt-2">
              Store personal health-related details such as sensitivities and trusted contacts for reference.
            </p>
          </div>
          <MedicalInformationModule />
        </div>
      </main>
    </div>
  );
}