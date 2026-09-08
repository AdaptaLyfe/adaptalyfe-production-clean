import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Lock, 
  Unlock, 
  Shield, 
  MapPin, 
  AlertTriangle, 
  Heart, 
  Phone,
  User,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SettingLockInfo {
  settingKey: string;
  isLocked: boolean;
  lockedBy?: string;
  reason?: string;
  lockedAt?: string;
}

interface CaregiverSettingsManagerProps {
  userId: number;
  userName: string;
}

export default function CaregiverSettingsManager({ userId, userName }: CaregiverSettingsManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSetting, setSelectedSetting] = useState<string | null>(null);
  const [lockReason, setLockReason] = useState("");

  // Get current caregiver info
  const { data: currentUser } = useQuery<any>({ queryKey: ["/api/user"] });

  // Get locked settings for this user
  const { data: lockedSettings = [] } = useQuery<SettingLockInfo[]>({
    queryKey: [`/api/locked-settings/${userId}`],
    enabled: !!userId,
  });

  // Safety-critical settings that can be locked
  const availableSettings = [
    {
      key: "locationTracking",
      label: "Location Tracking",
      icon: <MapPin className="w-4 h-4" />,
      description: "GPS tracking for safety and location monitoring",
      criticalFor: ["Elopement risk", "Wandering behavior", "Emergency location"],
      color: "red"
    },
    {
      key: "emergencyAlerts",
      label: "Emergency Alerts",
      icon: <AlertTriangle className="w-4 h-4" />,
      description: "Automatic emergency notifications to care team",
      criticalFor: ["Medical emergencies", "Safety incidents", "Crisis intervention"],
      color: "red"
    },
    {
      key: "automaticCheckIns",
      label: "Automatic Check-ins",
      icon: <Heart className="w-4 h-4" />,
      description: "Regular automated wellness and safety check-ins",
      criticalFor: ["Daily monitoring", "Medication compliance", "Routine adherence"],
      color: "orange"
    },
    {
      key: "medicalDataSharing",
      label: "Medical Data Sharing",
      icon: <Heart className="w-4 h-4" />,
      description: "Sharing medical information with healthcare providers",
      criticalFor: ["Treatment coordination", "Medication management", "Emergency care"],
      color: "purple"
    },
    {
      key: "caregiverAccess",
      label: "Caregiver Dashboard Access",
      icon: <Phone className="w-4 h-4" />,
      description: "Caregiver ability to view progress and data",
      criticalFor: ["Care coordination", "Progress monitoring", "Support planning"],
      color: "blue"
    }
  ];

  // Lock a setting
  const lockSettingMutation = useMutation({
    mutationFn: async (data: { settingKey: string; reason: string }) => {
      return apiRequest("POST", "/api/locked-settings", {
        userId,
        settingKey: data.settingKey,
        lockedBy: currentUser?.id,
        reason: data.reason,
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/locked-settings/${userId}`] });
      toast({
        title: "Setting Locked",
        description: `${selectedSetting} has been locked for ${userName}'s safety.`,
      });
      setSelectedSetting(null);
      setLockReason("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to lock setting. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Unlock a setting
  const unlockSettingMutation = useMutation({
    mutationFn: async (settingKey: string) => {
      return apiRequest("DELETE", `/api/locked-settings/${userId}/${settingKey}`, {
        caregiverId: currentUser?.id
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/locked-settings/${userId}`] });
      toast({
        title: "Setting Unlocked",
        description: `${userName} can now modify this setting.`,
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to unlock setting. You may not have permission.",
        variant: "destructive"
      });
    }
  });

  const isSettingLocked = (settingKey: string) => {
    return lockedSettings.find(s => s.settingKey === settingKey)?.isLocked || false;
  };

  const getSettingLockInfo = (settingKey: string) => {
    return lockedSettings.find(s => s.settingKey === settingKey);
  };

  const handleLockSetting = () => {
    if (!selectedSetting || !lockReason.trim()) return;
    lockSettingMutation.mutate({ settingKey: selectedSetting, reason: lockReason });
  };

  const handleUnlockSetting = (settingKey: string) => {
    unlockSettingMutation.mutate(settingKey);
  };

  return (
    <div className="space-y-6">
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-yellow-600" />
            Safety Settings Management for {userName}
          </CardTitle>
          <CardDescription>
            Lock critical safety settings to protect individuals at risk. Locked settings cannot be disabled by the user.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-yellow-600" />
              <span className="font-medium text-sm">Caregiver Authority Required</span>
            </div>
            <p className="text-xs text-gray-600">
              Only caregivers with "Emergency Access" permission can lock safety-critical settings. 
              This ensures proper oversight while maintaining the individual's autonomy where safe.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {availableSettings.map((setting) => {
          const isLocked = isSettingLocked(setting.key);
          const lockInfo = getSettingLockInfo(setting.key);
          
          return (
            <Card key={setting.key} className={`border-${setting.color}-200 ${isLocked ? 'bg-red-50' : 'bg-gray-50'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`text-${setting.color}-600`}>
                        {setting.icon}
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">{setting.label}</h3>
                      {isLocked ? (
                        <Badge className="bg-red-100 text-red-800 border-red-300">
                          <Lock className="w-3 h-3 mr-1" />
                          LOCKED
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          <Unlock className="w-3 h-3 mr-1" />
                          UNLOCKED
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{setting.description}</p>
                    
                    <div className="text-xs text-gray-500">
                      <strong>Critical for:</strong> {setting.criticalFor.join(", ")}
                    </div>

                    {isLocked && lockInfo && (
                      <div className="mt-3 p-3 bg-white rounded border border-red-200">
                        <div className="text-xs">
                          <div className="font-semibold text-red-800">Locked by: {lockInfo.lockedBy}</div>
                          <div className="text-gray-600 mt-1">Reason: {lockInfo.reason}</div>
                          {lockInfo.lockedAt && (
                            <div className="text-gray-500 mt-1">
                              Locked: {new Date(lockInfo.lockedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-6">
                    {isLocked ? (
                      <Button
                        onClick={() => handleUnlockSetting(setting.key)}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        disabled={unlockSettingMutation.isPending}
                      >
                        <Unlock className="w-4 h-4 mr-1" />
                        Unlock
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setSelectedSetting(setting.key)}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        disabled={lockSettingMutation.isPending}
                      >
                        <Lock className="w-4 h-4 mr-1" />
                        Lock Setting
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Lock Setting Modal/Dialog */}
      {selectedSetting && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Lock Safety Setting</CardTitle>
            <CardDescription>
              You are about to lock "{availableSettings.find(s => s.key === selectedSetting)?.label}" for {userName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="lock-reason" className="text-sm font-medium">
                  Reason for Locking (Required)
                </Label>
                <Textarea
                  id="lock-reason"
                  placeholder="e.g., History of elopement behavior requires continuous location monitoring for safety"
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={handleLockSetting}
                  disabled={!lockReason.trim() || lockSettingMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Lock className="w-4 h-4 mr-1" />
                  Lock Setting
                </Button>
                <Button
                  onClick={() => {
                    setSelectedSetting(null);
                    setLockReason("");
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}