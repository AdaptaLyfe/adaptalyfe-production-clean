import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CaregiverControlPanel from "@/components/caregiver-control-panel";
import ProtectedUserSettings from "@/components/protected-user-settings";
import { Shield, User, Info, Settings, Lock } from "lucide-react";

export default function CaregiverDemo() {
  // Demo data - in a real app, these would come from authentication
  const [demoUserId] = useState(1);
  const [demoCaregiverId] = useState(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Caregiver Permission System Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how Adaptalyfe protects users with caregiver-controlled safety settings that cannot be disabled by users
          </p>
        </div>

        {/* Feature Overview */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              How the Permission System Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold">Caregiver Control</h3>
                <p className="text-sm text-gray-600">
                  Caregivers can lock critical safety settings like location sharing and emergency contacts
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Lock className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold">Protected Settings</h3>
                <p className="text-sm text-gray-600">
                  Locked settings cannot be changed by users, ensuring safety features stay enabled
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold">User Experience</h3>
                <p className="text-sm text-gray-600">
                  Users see clear indicators when settings are locked and understand why
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Tabs */}
        <Tabs defaultValue="caregiver" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="caregiver" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Caregiver View
            </TabsTrigger>
            <TabsTrigger value="user" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              User View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="caregiver" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Caregiver Dashboard
                  </span>
                  <Badge variant="secondary">Demo Mode</Badge>
                </CardTitle>
                <CardDescription>
                  This is what caregivers see when they want to protect critical safety settings.
                  They can lock settings to prevent users from disabling important safety features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CaregiverControlPanel 
                  userId={demoUserId} 
                  caregiverId={demoCaregiverId} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="user" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    User Settings
                  </span>
                  <Badge variant="secondary">Demo Mode</Badge>
                </CardTitle>
                <CardDescription>
                  This is what users see in their settings. Locked settings are clearly marked and cannot be changed.
                  Users understand that these protections are in place for their safety.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProtectedUserSettings userId={demoUserId} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Key Benefits */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Key Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-green-800">For Caregivers</h3>
                <ul className="space-y-2 text-sm text-green-700">
                  <li>• Ensure critical safety features stay enabled</li>
                  <li>• Prevent accidental disabling of location tracking</li>
                  <li>• Maintain oversight of important health settings</li>
                  <li>• Clear audit trail of what settings are locked and why</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-green-800">For Users</h3>
                <ul className="space-y-2 text-sm text-green-700">
                  <li>• Clear understanding of what settings are protected</li>
                  <li>• Transparency about why settings are locked</li>
                  <li>• Maintains autonomy over unlocked settings</li>
                  <li>• Respectful communication about safety needs</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Instructions */}
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">Try the Demo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-amber-800">
              <p><strong>1. Caregiver Tab:</strong> Lock safety settings like "Location Sharing" or "Emergency Contacts"</p>
              <p><strong>2. User Tab:</strong> See how locked settings appear to users - they cannot be changed</p>
              <p><strong>3. Switch back and forth:</strong> Notice how the system maintains security while being transparent</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}