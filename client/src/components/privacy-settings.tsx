import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Download, 
  Trash2, 
  Eye, 
  Share2,
  Clock,
  FileText,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function PrivacySettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingRequest, setPendingRequest] = useState<string | null>(null);

  // Fetch current privacy settings
  const { data: privacySettings, isLoading } = useQuery({
    queryKey: ['/api/privacy-settings'],
  });

  // Update privacy settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      return await apiRequest('PUT', '/api/privacy-settings', settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/privacy-settings'] });
      toast({
        title: "Privacy Settings Updated",
        description: "Your preferences have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update privacy settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Data request mutations
  const dataRequestMutation = useMutation({
    mutationFn: async (requestType: string) => {
      return await apiRequest('POST', '/api/data-requests', { requestType });
    },
    onSuccess: (_, requestType) => {
      setPendingRequest(null);
      toast({
        title: "Request Submitted",
        description: `Your ${requestType} request has been submitted and will be processed within 30 days.`,
      });
    },
    onError: () => {
      setPendingRequest(null);
      toast({
        title: "Request Failed",
        description: "Failed to submit your request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (setting: string, value: boolean) => {
    if (!privacySettings) return;
    
    const updatedSettings = {
      ...privacySettings,
      [setting]: value,
      lastUpdated: new Date().toISOString(),
    };
    
    updateSettingsMutation.mutate(updatedSettings);
  };

  const handleDataRequest = (requestType: string) => {
    setPendingRequest(requestType);
    dataRequestMutation.mutate(requestType);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Privacy & Data Rights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Privacy Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Privacy & Data Controls
          </CardTitle>
          <p className="text-sm text-gray-600">
            Control how your personal information is used and shared
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Data Processing Consent */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium">Data Processing</h3>
              <p className="text-sm text-gray-600">
                Allow Adaptalyfe to process your personal data to provide services
              </p>
              <Badge variant="destructive" className="mt-1">Required</Badge>
            </div>
            <Switch
              checked={privacySettings?.dataProcessingConsent || false}
              onCheckedChange={(value) => handleSettingChange('dataProcessingConsent', value)}
              disabled={true} // Required for app functionality
            />
          </div>

          {/* Analytics Consent */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium">Analytics & Improvements</h3>
              <p className="text-sm text-gray-600">
                Help us improve SkillBridge by sharing anonymous usage data
              </p>
            </div>
            <Switch
              checked={privacySettings?.analyticsConsent || false}
              onCheckedChange={(value) => handleSettingChange('analyticsConsent', value)}
            />
          </div>

          {/* Caregiver Data Sharing */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium">Caregiver Data Sharing</h3>
              <p className="text-sm text-gray-600">
                Allow your caregivers to access your progress and daily information
              </p>
            </div>
            <Switch
              checked={privacySettings?.caregiverDataSharing || false}
              onCheckedChange={(value) => handleSettingChange('caregiverDataSharing', value)}
            />
          </div>

          {/* Health Data Sharing */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium">Health Data Sharing</h3>
              <p className="text-sm text-gray-600">
                Share mood tracking and health information with healthcare providers
              </p>
            </div>
            <Switch
              checked={privacySettings?.healthDataSharing || false}
              onCheckedChange={(value) => handleSettingChange('healthDataSharing', value)}
            />
          </div>

          {/* Data Retention */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Data Retention Period</h3>
            <p className="text-sm text-gray-600 mb-3">
              Your data will be automatically deleted after {privacySettings?.dataRetentionPeriod || 365} days of inactivity
            </p>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                Last updated: {privacySettings?.lastUpdated ? 
                  new Date(privacySettings.lastUpdated).toLocaleDateString() : 
                  'Never'
                }
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HIPAA User Rights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Your Data Rights
          </CardTitle>
          <p className="text-sm text-gray-600">
            Request access, corrections, or deletion of your personal information
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Access Your Data */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-blue-500" />
              <div>
                <h3 className="font-medium">Access Your Data</h3>
                <p className="text-sm text-gray-600">
                  Download a copy of all your personal information
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleDataRequest('access')}
              disabled={pendingRequest === 'access' || dataRequestMutation.isPending}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Request Access
            </Button>
          </div>

          {/* Export Your Data */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Share2 className="w-5 h-5 text-purple-500" />
              <div>
                <h3 className="font-medium">Export Your Data</h3>
                <p className="text-sm text-gray-600">
                  Get your data in a portable format to transfer to another service
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleDataRequest('export')}
              disabled={pendingRequest === 'export' || dataRequestMutation.isPending}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>

          {/* Delete Your Data */}
          <div className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="font-medium text-red-900">Delete Your Data</h3>
                <p className="text-sm text-red-700">
                  Permanently delete your account and all associated data
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleDataRequest('delete')}
              disabled={pendingRequest === 'delete' || dataRequestMutation.isPending}
              variant="destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Request Deletion
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> All your data is encrypted and protected according to HIPAA compliance standards. 
          Data requests are processed within 30 days as required by law. For immediate assistance, contact our support team.
        </AlertDescription>
      </Alert>
    </div>
  );
}