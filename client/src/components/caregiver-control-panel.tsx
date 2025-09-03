import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Lock, Unlock, AlertTriangle, Settings, Eye, EyeOff } from "lucide-react";

interface CaregiverControlPanelProps {
  userId: number;
  caregiverId?: number;
}

const criticalSettings = [
  {
    key: "location_sharing",
    name: "Location Sharing",
    description: "Allows caregivers to see user's current location",
    category: "safety"
  },
  {
    key: "emergency_contacts",
    name: "Emergency Contacts",
    description: "Access to view and modify emergency contact information",
    category: "safety"
  },
  {
    key: "medication_reminders",
    name: "Medication Reminders",
    description: "Automatic reminders for medication schedules",
    category: "health"
  },
  {
    key: "appointment_notifications",
    name: "Appointment Notifications",
    description: "Notifications for upcoming medical appointments",
    category: "health"
  },
  {
    key: "safety_alerts",
    name: "Safety Alerts",
    description: "Alerts for unusual activity or missed check-ins",
    category: "safety"
  },
  {
    key: "financial_monitoring",
    name: "Financial Monitoring",
    description: "Oversight of budgets and bill payment tracking",
    category: "financial"
  }
];

// Define caregiver types
const caregiverTypes = [
  { id: 1, name: "Primary Caregiver", type: "primary", description: "Full access - parent or guardian", color: "bg-green-100 text-green-800" },
  { id: 2, name: "School Therapist", type: "secondary", description: "Academic and emotional support only", color: "bg-blue-100 text-blue-800" },
  { id: 3, name: "Medical Therapist", type: "secondary", description: "Health and safety management", color: "bg-purple-100 text-purple-800" },
  { id: 4, name: "Respite Worker", type: "temporary", description: "Emergency contacts and basic supervision", color: "bg-orange-100 text-orange-800" },
  { id: 5, name: "Extended Family", type: "secondary", description: "Limited monitoring access", color: "bg-gray-100 text-gray-800" }
];

export default function CaregiverControlPanel({ userId, caregiverId: initialCaregiverId }: CaregiverControlPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCaregiverId, setSelectedCaregiverId] = useState(initialCaregiverId || 1);
  const [activeTab, setActiveTab] = useState<'user_locks' | 'caregiver_permissions'>('user_locks');
  const [newLockSetting, setNewLockSetting] = useState({
    settingKey: "",
    settingValue: "",
    lockReason: "",
    canUserView: true
  });

  // Fetch locked settings for this user
  const { data: lockedSettings = [], isLoading } = useQuery({
    queryKey: ["/api/locked-settings", userId],
    queryFn: () => apiRequest("GET", `/api/locked-settings/${userId}`).then(res => res.json())
  });

  // Fetch caregiver permissions for selected caregiver
  const { data: permissions = [] } = useQuery({
    queryKey: ["/api/caregiver-permissions", userId, selectedCaregiverId],
    queryFn: () => apiRequest("GET", `/api/caregiver-permissions/${userId}/${selectedCaregiverId}`).then(res => res.json()),
    enabled: !!selectedCaregiverId
  });

  // Get selected caregiver info
  const selectedCaregiver = caregiverTypes.find(c => c.id === selectedCaregiverId) || caregiverTypes[0];

  // Lock setting mutation
  const lockSettingMutation = useMutation({
    mutationFn: (settingData: any) => 
      apiRequest("POST", "/api/locked-settings", settingData).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locked-settings", userId] });
      toast({
        title: "Setting Locked",
        description: "User setting has been successfully locked.",
      });
      setNewLockSetting({
        settingKey: "",
        settingValue: "",
        lockReason: "",
        canUserView: true
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to lock setting: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Unlock setting mutation
  const unlockSettingMutation = useMutation({
    mutationFn: ({ settingKey }: { settingKey: string }) => 
      apiRequest("DELETE", `/api/locked-settings/${userId}/${settingKey}`, { caregiverId }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locked-settings", userId] });
      toast({
        title: "Setting Unlocked",
        description: "User setting has been successfully unlocked.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to unlock setting: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Set caregiver permission mutation
  const setPermissionMutation = useMutation({
    mutationFn: (permissionData: any) => 
      apiRequest("POST", "/api/caregiver-permissions", permissionData).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/caregiver-permissions", userId, selectedCaregiverId] });
      toast({
        title: "Permission Updated",
        description: "Caregiver permission has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update permission: " + error.message,
        variant: "destructive",
      });
    }
  });

  const handleLockSetting = () => {
    if (!newLockSetting.settingKey || !newLockSetting.settingValue) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    lockSettingMutation.mutate({
      userId,
      settingKey: newLockSetting.settingKey,
      settingValue: newLockSetting.settingValue,
      isLocked: true,
      lockedBy: selectedCaregiverId,
      lockReason: newLockSetting.lockReason,
      canUserView: newLockSetting.canUserView
    });
  };

  const handleQuickLockUserSetting = (settingKey: string, description: string) => {
    lockSettingMutation.mutate({
      userId,
      settingKey: settingKey,
      settingValue: "locked",
      isLocked: true,
      lockedBy: initialCaregiverId || 1,
      lockReason: `User safety protection: ${description}`,
      canUserView: false
    });
  };

  const handleUnlockSetting = (settingKey: string) => {
    unlockSettingMutation.mutate({ settingKey });
  };

  const handlePermissionChange = (permissionType: string, isGranted: boolean) => {
    setPermissionMutation.mutate({
      userId,
      caregiverId: selectedCaregiverId,
      permissionType,
      isGranted,
      isLocked: true // Lock the permission so user can't change it
    });
  };

  const getSettingBadgeColor = (category: string) => {
    switch (category) {
      case "safety": return "destructive";
      case "health": return "default";
      case "financial": return "secondary";
      default: return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('user_locks')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'user_locks' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🔒 User Lock Controls
        </button>
        <button
          onClick={() => setActiveTab('caregiver_permissions')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'caregiver_permissions' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          👥 Caregiver Permissions
        </button>
      </div>

      {activeTab === 'user_locks' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              User Safety Lock Controls
            </CardTitle>
            <CardDescription>
              Lock critical features to prevent the user from accidentally changing important safety settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Lock Controls */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Lock User Settings</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {criticalSettings.map((setting) => {
                  const isLocked = lockedSettings.some(
                    (locked: any) => locked.settingKey === setting.key && locked.isLocked
                  );
                  
                  return (
                    <Card key={setting.key} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-sm">{setting.name}</h4>
                            <Badge variant={getSettingBadgeColor(setting.category)} className="text-xs">
                              {setting.category}
                            </Badge>
                            {isLocked && (
                              <Badge variant="destructive" className="text-xs">
                                <Lock className="w-3 h-3 mr-1" />
                                Locked
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">
                            {setting.description}
                          </p>
                          <div className="flex flex-col gap-2">
                            {isLocked ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnlockSetting(setting.key)}
                                disabled={unlockSettingMutation.isPending}
                              >
                                <Unlock className="h-4 w-4 mr-1" />
                                Unlock from User
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleQuickLockUserSetting(setting.key, setting.description)}
                                disabled={lockSettingMutation.isPending}
                              >
                                <Lock className="h-4 w-4 mr-1" />
                                Lock from User
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'caregiver_permissions' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Caregiver Permission Controls
            </CardTitle>
            <CardDescription>
              Manage what other caregivers can see and access for this user.
            </CardDescription>
          </CardHeader>
        <CardContent>
          {/* Caregiver Selector */}
          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="caregiver-select" className="text-sm font-medium">
                Select Caregiver Type
              </Label>
              <Select
                value={selectedCaregiverId?.toString()}
                onValueChange={(value) => setSelectedCaregiverId(parseInt(value))}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Choose caregiver type..." />
                </SelectTrigger>
                <SelectContent>
                  {caregiverTypes.map((caregiver) => (
                    <SelectItem key={caregiver.id} value={caregiver.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Badge className={caregiver.color} variant="secondary">
                          {caregiver.type}
                        </Badge>
                        <span className="font-medium">{caregiver.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Selected Caregiver Info */}
            <Card className="p-3 bg-gray-50">
              <div className="flex items-center gap-3">
                <Badge className={selectedCaregiver.color} variant="secondary">
                  {selectedCaregiver.type}
                </Badge>
                <div>
                  <h4 className="font-medium text-sm">{selectedCaregiver.name}</h4>
                  <p className="text-xs text-muted-foreground">{selectedCaregiver.description}</p>
                </div>
              </div>
            </Card>
          </div>
        </CardContent>
        <CardContent className="space-y-6">
          
          {/* Critical Settings Quick Actions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Critical Safety Settings</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {criticalSettings.map((setting) => {
                const isLocked = lockedSettings.some((ls: any) => ls.settingKey === setting.key);
                const lockedSetting = lockedSettings.find((ls: any) => ls.settingKey === setting.key);
                
                return (
                  <Card key={setting.key} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{setting.name}</h4>
                          <Badge variant={getSettingBadgeColor(setting.category)}>
                            {setting.category}
                          </Badge>
                          {isLocked && <Lock className="h-4 w-4 text-red-500" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                        {isLocked && (
                          <div className="text-xs text-red-600">
                            <strong>Locked:</strong> {lockedSetting?.lockReason || "Safety requirement"}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {isLocked ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnlockSetting(setting.key)}
                            disabled={unlockSettingMutation.isPending}
                          >
                            <Unlock className="h-4 w-4 mr-1" />
                            Unlock
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setNewLockSetting({
                                settingKey: setting.key,
                                settingValue: "enabled",
                                lockReason: `Critical safety setting: ${setting.description}`,
                                canUserView: true
                              });
                              handleLockSetting();
                            }}
                            disabled={lockSettingMutation.isPending}
                          >
                            <Lock className="h-4 w-4 mr-1" />
                            Lock
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Custom Setting Lock */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Lock Custom Setting</h3>
            <Card className="p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="settingKey">Setting Key</Label>
                  <Input
                    id="settingKey"
                    placeholder="e.g., location_sharing"
                    value={newLockSetting.settingKey}
                    onChange={(e) => setNewLockSetting(prev => ({ ...prev, settingKey: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="settingValue">Setting Value</Label>
                  <Input
                    id="settingValue"
                    placeholder="e.g., enabled"
                    value={newLockSetting.settingValue}
                    onChange={(e) => setNewLockSetting(prev => ({ ...prev, settingValue: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="lockReason">Lock Reason</Label>
                <Textarea
                  id="lockReason"
                  placeholder="Why is this setting being locked?"
                  value={newLockSetting.lockReason}
                  onChange={(e) => setNewLockSetting(prev => ({ ...prev, lockReason: e.target.value }))}
                />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newLockSetting.canUserView}
                    onCheckedChange={(checked) => setNewLockSetting(prev => ({ ...prev, canUserView: checked }))}
                  />
                  <Label>User can view this setting</Label>
                  {newLockSetting.canUserView ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </div>
                <Button 
                  onClick={handleLockSetting}
                  disabled={lockSettingMutation.isPending}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Lock Setting
                </Button>
              </div>
            </Card>
          </div>

          {/* Locked Settings List */}
          {lockedSettings.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Currently Locked Settings</h3>
              <div className="space-y-3">
                {lockedSettings.map((setting: any) => (
                  <Card key={setting.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{setting.settingKey}</h4>
                          <Badge variant="destructive">LOCKED</Badge>
                          {!setting.canUserView && <EyeOff className="h-4 w-4 text-gray-500" />}
                        </div>
                        <p className="text-sm text-muted-foreground">Value: {setting.settingValue}</p>
                        {setting.lockReason && (
                          <p className="text-sm text-red-600 mt-1">Reason: {setting.lockReason}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnlockSetting(setting.settingKey)}
                        disabled={unlockSettingMutation.isPending}
                      >
                        <Unlock className="h-4 w-4 mr-1" />
                        Unlock
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        </Card>
      )}
    </div>
  );
}