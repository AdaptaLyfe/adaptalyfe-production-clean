import { AlertCircle, X } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ProductionBannerProps {
  isDemoMode?: boolean;
}

export default function ProductionBanner({ isDemoMode = false }: ProductionBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (isDemoMode) {
    return (
      <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800 rounded-none">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between w-full">
          <span>
            <strong>Demo Mode:</strong> You're viewing sample data. Sign up to create your personal account.
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-yellow-800 hover:text-yellow-900 p-0 h-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}