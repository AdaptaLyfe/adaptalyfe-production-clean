import { useState } from "react";
import type { ReactNode } from "react";
import { getThemePref, setThemePref, type ThemePref } from "@/lib/theme";
import {
  DEFAULT_DISPLAY_SETTINGS,
  getDisplaySettings,
  setDisplaySettings,
  type DisplaySettings,
  type TextSize,
} from "@/lib/display-settings";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertTriangle, Bell, BookOpen, Building2, CheckCircle, CreditCard, Crown, Eye, HelpCircle, LifeBuoy,
  Lock, Mail, Palette, RotateCcw, Settings, Shield, Trash2, Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ApiError, apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { FieldLabel } from "@/components/ui/field-label";
import { getSubscriptionManagementMessage } from "@/lib/subscription-management";
import { hasActivePaidSubscription } from "@/lib/subscription-state";
import { usePrivacyMode } from "@/components/privacy-mode-provider";

const INVALID_INVITATION_CODE_MESSAGE =
  "Invalid invitation code. Please check and try again.";
const GENERIC_INVITATION_CODE_ERROR =
  "Unable to redeem invitation code. Please try again.";

function getInvitationCodeErrorMessage(error: unknown): string {
  const apiError = error instanceof ApiError ? error : undefined;
  const rawMessage = error instanceof Error ? error.message : "";

  if (
    apiError?.status === 404 ||
    rawMessage.toLowerCase().includes("invalid organization code")
  ) {
    return INVALID_INVITATION_CODE_MESSAGE;
  }

  return GENERIC_INVITATION_CODE_ERROR;
}

/** Friendly names for settings a caregiver can lock (keys from the caregiver control panel). */
const LOCKED_SETTING_LABELS: Record<string, string> = {
  location_sharing: "Location sharing",
  locationTracking: "Location sharing",
  safety_alerts: "Safety alerts",
  emergencyAlerts: "Safety alerts",
  emergency_contacts: "Emergency contacts",
  medication_reminders: "Medication reminders",
  appointment_notifications: "Appointment notifications",
  financial_monitoring: "Financial monitoring",
  medicalDataSharing: "Medical data sharing",
  caregiverAccess: "Caregiver dashboard access",
  automaticCheckIns: "Automatic check-ins",
};

function lockedSettingLabel(key: string): string {
  return LOCKED_SETTING_LABELS[key] ?? key.replace(/[_-]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

interface LockedSetting {
  id: number;
  settingKey: string;
  isLocked: boolean | null;
  lockReason?: string | null;
  canUserView?: boolean | null;
  lockedByName?: string;
}

interface UserPreferences {
  notificationSettings?: Record<string, unknown> | null;
  reminderTiming?: Record<string, unknown> | null;
}

function SettingRow({ icon, title, description, children }: {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{title}</p>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { enabled: privacyMode, setEnabled: setPrivacyMode } = usePrivacyMode();
  const [, setLocation] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [theme, setTheme] = useState<ThemePref>(getThemePref());
  const [display, setDisplay] = useState<DisplaySettings>(getDisplaySettings());
  const [orgCodeInput, setOrgCodeInput] = useState("");

  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });
  const { data: subscription } = useQuery<any>({ queryKey: ["/api/subscription"] });
  const { data: orgMembership } = useQuery<any>({ queryKey: ["/api/org-codes/my"] });
  const { data: preferences } = useQuery<UserPreferences>({ queryKey: ["/api/user-preferences"] });
  const { data: lockedSettingsData } = useQuery<LockedSetting[]>({
    queryKey: [`/api/locked-settings/${user?.id}`],
    enabled: Boolean(user?.id),
  });
  const lockedSettings = Array.isArray(lockedSettingsData)
    ? lockedSettingsData.filter((s) => s.isLocked !== false && s.canUserView !== false)
    : [];

  const isSubscribed = hasActivePaidSubscription(user, subscription);
  const subscriptionManagementMessage = getSubscriptionManagementMessage(
    subscription?.subscriptionPlatform ?? user?.subscriptionPlatform
  );

  // ---- Display (saved on this device, applied straight away) ----
  const saveDisplay = (next: DisplaySettings) => {
    setDisplay(next);
    if (!setDisplaySettings(next)) {
      toast({
        title: "Applied for now",
        description: "This browser couldn't save the setting, so it may reset when you reload.",
        variant: "destructive",
      });
    }
  };
  const changeTheme = (value: string) => {
    if (value === "light" || value === "dark" || value === "auto") {
      setTheme(value);
      setThemePref(value);
    }
  };
  const resetDisplay = () => {
    changeTheme("light");
    saveDisplay({ ...DEFAULT_DISPLAY_SETTINGS });
    toast({ title: "Display reset", description: "Theme, text size and contrast are back to normal." });
  };

  // ---- Reminders (saved to the account; the same settings as Task Reminders) ----
  const pushEnabled = preferences?.notificationSettings?.pushEnabled !== false;
  const reminderMinutes = typeof preferences?.reminderTiming?.taskReminders === "number"
    ? String(preferences.reminderTiming.taskReminders)
    : preferences?.reminderTiming?.taskReminders === false ? "off" : "5";

  const savePreferencesMutation = useMutation({
    mutationFn: async (update: UserPreferences) => {
      const res = await apiRequest("PUT", "/api/user-preferences", update);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-preferences"] });
      toast({ title: "Saved", description: "Your reminder settings were updated." });
    },
    onError: () => {
      toast({ title: "Not saved", description: "Your reminder settings couldn't be saved. Please try again.", variant: "destructive" });
    },
  });
  const setPushEnabled = (checked: boolean) => {
    savePreferencesMutation.mutate({
      notificationSettings: { ...(preferences?.notificationSettings ?? {}), pushEnabled: checked },
    });
  };
  const setReminderMinutes = (value: string) => {
    savePreferencesMutation.mutate({
      reminderTiming: {
        ...(preferences?.reminderTiming ?? {}),
        taskReminders: value === "off" ? false : Number(value),
      },
    });
  };

  const redeemOrgCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/org-codes/redeem", { code });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Code Redeemed!", description: `You now have free access through ${data.orgName}.` });
      setOrgCodeInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/org-codes/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Invalid Code",
        description: getInvitationCodeErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/user/delete-account");
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account and all data have been permanently deleted.",
      });
      setDeleteDialogOpen(false);
      setLocation("/login");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleDeleteAccount = () => {
    if (deleteConfirmText.toLowerCase() === "delete my account") {
      deleteAccountMutation.mutate();
    } else {
      toast({
        title: "Confirmation Required",
        description: "Please type 'delete my account' to confirm.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <Settings className="w-8 h-8 text-indigo-600" />
          Settings
        </h1>
        <p className="text-slate-600">
          Changes are saved as soon as you make them.
        </p>
      </div>

      {/* Subscription */}
      {isSubscribed ? (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white shadow-md flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-semibold capitalize">{subscription?.planType ?? user?.subscriptionTier} plan — active</p>
              <p className="text-sm text-white/80">
                {(subscription?.subscriptionPlatform ?? user?.subscriptionPlatform) === "web"
                  ? subscription?.autoRenew === false
                    ? "Cancelled — your access continues until the end date."
                    : "Renews automatically. You can change or cancel it any time."
                  : subscriptionManagementMessage}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setLocation("/subscription")}
            className="bg-white text-emerald-700 hover:bg-white/90 font-semibold rounded-xl flex-shrink-0"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Manage subscription
          </Button>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-lg leading-tight">
                  {subscription?.isAccountTrial && subscription?.trialDaysLeft
                    ? `Free trial — ${subscription.trialDaysLeft} day${subscription.trialDaysLeft === 1 ? "" : "s"} left`
                    : "Choose a plan"}
                </p>
                <p className="text-sm text-white/80 mt-0.5">
                  Keep your tasks, money, mood and appointments in one place.
                </p>
                <p className="text-xs text-white/70 mt-1">Plans from $4.99/month · Cancel anytime</p>
              </div>
            </div>
            <Button
              onClick={() => setLocation('/subscription')}
              className="bg-white text-indigo-700 hover:bg-white/90 font-semibold px-6 py-2 rounded-xl flex-shrink-0 flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              View plans
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-600" />
              Appearance
            </CardTitle>
            <CardDescription>Saved on this device</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={changeTheme}>
                <SelectTrigger id="theme"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">Match my device</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="text-size">Text size</Label>
              <Select
                value={display.textSize}
                onValueChange={(value) => saveDisplay({ ...display, textSize: value as TextSize })}
              >
                <SelectTrigger id="text-size"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="default">Normal</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="x-large">Extra large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SettingRow icon={<Eye className="w-4 h-4" />} title="High contrast" description="Stronger text and borders">
              <Switch
                id="high-contrast"
                aria-label="High contrast"
                checked={display.highContrast}
                onCheckedChange={(checked) => saveDisplay({ ...display, highContrast: checked })}
              />
            </SettingRow>
            <Button variant="outline" className="w-full" onClick={resetDisplay}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset display
            </Button>
          </CardContent>
        </Card>

        {/* Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              Reminders
            </CardTitle>
            <CardDescription>Saved to your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <SettingRow icon={<Bell className="w-4 h-4" />} title="Notifications" description="Reminders and check-ins from Adaptalyfe">
              <Switch
                id="notifications"
                aria-label="Notifications"
                checked={pushEnabled}
                disabled={!preferences || savePreferencesMutation.isPending}
                onCheckedChange={setPushEnabled}
              />
            </SettingRow>
            <div className="space-y-2">
              <Label htmlFor="reminder-timing">Remind me about tasks</Label>
              <Select
                value={reminderMinutes}
                onValueChange={setReminderMinutes}
                disabled={!preferences || savePreferencesMutation.isPending}
              >
                <SelectTrigger id="reminder-timing"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">No task reminders</SelectItem>
                  <SelectItem value="5">5 minutes before</SelectItem>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="30">30 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setLocation("/task-reminders")}>
              More reminder options
            </Button>
          </CardContent>
        </Card>

        {/* Caregiver controls (real locks only) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Caregiver controls
            </CardTitle>
            <CardDescription>Settings your caregivers manage for your safety</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {lockedSettings.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                None of your settings are locked by a caregiver.
              </p>
            ) : (
              lockedSettings.map((setting) => (
                <div key={setting.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
                  <div className="text-sm">
                    <p className="font-medium text-slate-900">{lockedSettingLabel(setting.settingKey)}</p>
                    <p className="text-slate-500">
                      Locked by {setting.lockedByName ?? "your caregiver"}
                      {setting.lockReason ? ` · ${setting.lockReason}` : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
            <Button variant="outline" className="w-full" onClick={() => setLocation("/caregiver")}>
              Manage my support team
            </Button>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              Privacy
            </CardTitle>
            <CardDescription>Saved on this device</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow
              icon={<Shield className="w-4 h-4" />}
              title="Privacy mode"
              description="Hides personal, health and money details on screen"
            >
              <Switch
                id="privacy-mode"
                aria-label="Privacy mode"
                checked={privacyMode}
                onCheckedChange={(checked) => {
                  if (!setPrivacyMode(checked)) {
                    toast({
                      title: `Privacy Mode is ${checked ? "on" : "off"} for this session`,
                      description:
                        "This browser could not save the setting. It may reset when you reload.",
                      variant: "destructive",
                    });
                  }
                }}
              />
            </SettingRow>
            <p className="text-xs text-slate-500">
              Useful for screenshots and screen sharing. It doesn't change your saved data or what caregivers can see.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setLocation("/privacy-policy")}>
              View privacy policy
            </Button>
          </CardContent>
        </Card>

        {/* Help & Support */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              Help & support
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Button variant="outline" className="justify-start" onClick={() => setLocation("/features")}>
              <BookOpen className="w-4 h-4 mr-2" />
              Feature guide
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => setLocation("/resources")}>
              <LifeBuoy className="w-4 h-4 mr-2" />
              Help & resources
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="mailto:support@adaptalyfe.com?subject=Adaptalyfe%20help">
                <Mail className="w-4 h-4 mr-2" />
                Email support
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Organization Code Redemption */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Organization Access
          </CardTitle>
          <CardDescription>
            If your organization provided an access code, enter it here for free access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orgMembership && orgMembership.status === 'active' ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">Active Organization Access</p>
                <p className="text-sm text-green-600">
                  Free access provided by {orgMembership.orgName}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={orgCodeInput}
                onChange={(e) => setOrgCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter organization code"
                className="font-mono max-w-xs"
              />
              <Button
                onClick={() => orgCodeInput && redeemOrgCodeMutation.mutate(orgCodeInput)}
                disabled={!orgCodeInput || redeemOrgCodeMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {redeemOrgCodeMutation.isPending ? "Redeeming..." : "Redeem Code"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50 mt-8 mb-24">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-red-500">
            Irreversible actions that permanently affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 p-4 bg-white rounded-lg border border-red-200 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Delete Account</h4>
              <p className="text-sm text-gray-500">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2 shrink-0">
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    Delete Your Account?
                  </DialogTitle>
                  <DialogDescription className="text-left pt-2">
                    <div className="space-y-3">
                      <p className="font-medium text-red-600">
                        Warning: This action is permanent and cannot be undone!
                      </p>
                      <p>Deleting your account will:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Remove all your personal data</li>
                        <li>Delete all tasks, appointments, and history</li>
                        <li>Cancel any active subscriptions</li>
                        <li>Remove all caregiver connections</li>
                      </ul>
                      <div className="pt-3">
                        <FieldLabel htmlFor="confirm-delete" required className="text-sm font-medium">
                          Type "delete my account" to confirm:
                        </FieldLabel>
                        <Input
                          id="confirm-delete"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="delete my account"
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeleteDialogOpen(false);
                      setDeleteConfirmText("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText.toLowerCase() !== "delete my account" || deleteAccountMutation.isPending}
                  >
                    {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account Forever"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
