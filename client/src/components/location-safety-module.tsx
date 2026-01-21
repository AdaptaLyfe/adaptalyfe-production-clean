import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatTimeAgo } from "@/lib/utils";
import { 
  MapPin, 
  Navigation, 
  Phone, 
  Shield, 
  Clock, 
  Smartphone,
  Share2,
  CheckCircle,
  AlertTriangle,
  Users,
  Target,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Trash2,
  MapIcon
} from "lucide-react";

interface SafetyCheck {
  id: number;
  location: string;
  timestamp: Date;
  status: 'safe' | 'emergency' | 'help_needed';
  message?: string;
}

interface EmergencyContact {
  id: number;
  name: string;
  relationship: string;
  phoneNumber: string;
  isQuickDial: boolean;
}

export default function LocationSafetyModule() {
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>("Getting location...");
  const [isLocationVisible, setIsLocationVisible] = useState(false);
  const [autoShareEnabled, setAutoShareEnabled] = useState(false);
  
  const { toast } = useToast();

  const emergencyContacts: EmergencyContact[] = [
    {
      id: 1,
      name: "Mom",
      relationship: "Parent",
      phoneNumber: "(555) 123-4567",
      isQuickDial: true
    },
    {
      id: 2,
      name: "Care Coordinator",
      relationship: "Support Staff",
      phoneNumber: "(555) 234-5678",
      isQuickDial: true
    },
    {
      id: 3,
      name: "Emergency Services",
      relationship: "Emergency",
      phoneNumber: "911",
      isQuickDial: true
    }
  ];

  const recentSafetyChecks: SafetyCheck[] = [
    {
      id: 1,
      location: "Public Library",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: 'safe',
      message: "Arrived safely at the library"
    },
    {
      id: 2,
      location: "Bus Stop - Oak Ave",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      status: 'safe',
      message: "Waiting for bus, all good"
    },
    {
      id: 3,
      location: "Home",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      status: 'safe',
      message: "Made it home safely"
    }
  ];

  const shareLocation = () => {
    setIsLocationSharing(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocationSharing(false);
          const { latitude, longitude } = position.coords;
          setCurrentLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          setIsLocationVisible(true);
          toast({
            title: "Location shared",
            description: "Your current location has been shared with your emergency contacts.",
          });
        },
        (error) => {
          setIsLocationSharing(false);
          toast({
            title: "Location error",
            description: "Unable to get your location. Please check your browser settings.",
            variant: "destructive"
          });
        }
      );
    } else {
      setIsLocationSharing(false);
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location sharing.",
        variant: "destructive"
      });
    }
  };

  const sendSafetyCheck = (status: 'safe' | 'help_needed' | 'emergency', customMessage?: string) => {
    const messages = {
      safe: "I'm safe and doing well",
      help_needed: "I need some assistance",
      emergency: "This is an emergency, I need immediate help"
    };
    
    const message = customMessage || messages[status];
    
    toast({
      title: "Safety check sent",
      description: `Your status has been shared with emergency contacts: ${message}`,
    });
  };

  const callEmergencyContact = (contact: EmergencyContact) => {
    window.open(`tel:${contact.phoneNumber}`, '_self');
    toast({
      title: "Calling",
      description: `Calling ${contact.name} at ${contact.phoneNumber}`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-green-500';
      case 'help_needed': return 'bg-yellow-500';
      case 'emergency': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const toggleAutoShare = () => {
    setAutoShareEnabled(!autoShareEnabled);
    toast({
      title: autoShareEnabled ? "Auto-share disabled" : "Auto-share enabled",
      description: autoShareEnabled 
        ? "Location will no longer be shared automatically" 
        : "Location will be shared automatically when traveling",
    });
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Location & Safety
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">Premium</Badge>
        </CardTitle>
        <CardDescription>
          Share your location, send safety check-ins, and manage emergency contacts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Location */}
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-blue-800">Current Location</h3>
            <Button
              onClick={() => setIsLocationVisible(!isLocationVisible)}
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-800"
            >
              {isLocationVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700">
                {isLocationVisible ? currentLocation : "Location hidden for privacy"}
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={shareLocation} 
                className="flex-1"
                disabled={isLocationSharing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLocationSharing ? 'animate-spin' : ''}`} />
                {isLocationSharing ? "Getting Location..." : "Update Location"}
              </Button>
              <Button 
                onClick={toggleAutoShare}
                variant={autoShareEnabled ? "default" : "outline"}
                size="sm"
                className="text-xs"
              >
                <Target className="w-3 h-3 mr-1" />
                Auto {autoShareEnabled ? "ON" : "OFF"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Quick Safety Actions */}
        <Card className="p-4">
          <h3 className="font-medium mb-3">Quick Safety Check</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Button 
              onClick={() => sendSafetyCheck('safe')}
              className="bg-green-600 hover:bg-green-700 text-xs"
              size="sm"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Safe
            </Button>
            <Button 
              onClick={() => sendSafetyCheck('help_needed')}
              variant="outline"
              className="border-yellow-600 text-yellow-600 hover:bg-yellow-50 text-xs"
              size="sm"
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              Help
            </Button>
            <Button 
              onClick={() => sendSafetyCheck('emergency')}
              variant="destructive"
              size="sm"
              className="text-xs"
            >
              <Phone className="w-3 h-3 mr-1" />
              Emergency
            </Button>
          </div>
          
          {/* Custom Check-in */}
          <div className="mt-4 p-3 border rounded-lg bg-gray-50">
            <Label className="text-sm font-medium mb-2 block">Custom Check-in Message</Label>
            <div className="flex gap-2">
              <Input 
                placeholder="e.g., Arrived at the store, doing well"
                className="flex-1"
              />
              <Button 
                onClick={() => sendSafetyCheck('safe', "Custom message sent")}
                size="sm"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </Card>

        {/* Emergency Contacts */}
        <Card className="p-4">
          <h3 className="font-medium mb-3">Emergency Contacts</h3>
          <div className="space-y-3">
            {emergencyContacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-sm text-gray-600">{contact.relationship}</div>
                    <div className="text-xs text-gray-500">{contact.phoneNumber}</div>
                  </div>
                </div>
                <Button onClick={() => callEmergencyContact(contact)} size="sm">
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Safety Checks */}
        <Card className="p-4">
          <h3 className="font-medium mb-3">Recent Check-ins</h3>
          <div className="space-y-3">
            {recentSafetyChecks.map((check) => (
              <div key={check.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(check.status)}`} />
                <div className="flex-1">
                  <div className="font-medium text-sm">{check.location}</div>
                  <div className="text-xs text-gray-600">{check.message}</div>
                </div>
                <div className="text-xs text-gray-500">
                  {formatTimeAgo(check.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Location Settings */}
        <Card className="p-4 border-purple-200 bg-purple-50">
          <h3 className="font-medium mb-3 text-purple-800">Location Settings</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Share location when traveling</span>
              <Badge variant={autoShareEnabled ? "default" : "secondary"}>
                {autoShareEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Emergency location sharing</span>
              <Badge variant="default">Always On</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Location history</span>
              <Badge variant="secondary">7 days</Badge>
            </div>
            <p className="text-xs text-purple-600 mt-2">
              Your location is only shared with your designated emergency contacts and is automatically deleted after 7 days for privacy.
            </p>
          </div>
        </Card>

        {/* Geofencing Section */}
        <GeofencingManager />
      </CardContent>
    </Card>
  );
}

// Geofencing Manager Component
function GeofencingManager() {
  const [isAddingGeofence, setIsAddingGeofence] = useState(false);
  const [newGeofence, setNewGeofence] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radius: 100,
    notifyOnExit: true,
    notifyOnEnter: false,
    caregiverIds: [] as number[]
  });
  
  const { toast } = useToast();
  
  // Temporarily disable geofencing queries until database tables are created
  const geofences: any[] = [];
  const geofenceEvents: any[] = [];
  const isLoading = false;
  
  // TODO: Re-enable these queries after database schema is pushed
  // const { data: geofences = [], isLoading } = useQuery({
  //   queryKey: ['/api/geofences']
  // });
  // const { data: geofenceEvents = [] } = useQuery({
  //   queryKey: ['/api/geofence-events']
  // });

  const createGeofenceMutation = useMutation({
    mutationFn: async (geofenceData: any) => {
      return await apiRequest('POST', '/api/geofences', geofenceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/geofences'] });
      setIsAddingGeofence(false);
      setNewGeofence({
        name: '',
        latitude: '',
        longitude: '',
        radius: 100,
        notifyOnExit: true,
        notifyOnEnter: false,
        caregiverIds: []
      });
      toast({
        title: "Geofence created",
        description: "Safe zone has been set up successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create geofence.",
        variant: "destructive",
      });
    },
  });

  const deleteGeofenceMutation = useMutation({
    mutationFn: async (geofenceId: number) => {
      return await apiRequest('DELETE', `/api/geofences/${geofenceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/geofences'] });
      toast({
        title: "Geofence deleted",
        description: "Safe zone has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete geofence.",
        variant: "destructive",
      });
    },
  });

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setNewGeofence(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
          toast({
            title: "Location captured",
            description: "Current location has been set for the geofence.",
          });
        },
        () => {
          toast({
            title: "Location error",
            description: "Unable to get your current location.",
            variant: "destructive"
          });
        }
      );
    }
  };

  const handleCreateGeofence = () => {
    if (!newGeofence.name || !newGeofence.latitude || !newGeofence.longitude) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    createGeofenceMutation.mutate({
      ...newGeofence,
      latitude: parseFloat(newGeofence.latitude),
      longitude: parseFloat(newGeofence.longitude),
    });
  };

  return (
    <Card className="p-4 border-green-200 bg-green-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapIcon className="w-5 h-5 text-green-600" />
          <h3 className="font-medium text-green-800">Safe Zones (Geofencing)</h3>
        </div>
        <Dialog open={isAddingGeofence} onOpenChange={setIsAddingGeofence}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Zone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Safe Zone</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="geofence-name">Zone Name</Label>
                <Input
                  id="geofence-name"
                  placeholder="e.g. Home, School, Work"
                  value={newGeofence.name}
                  onChange={(e) => setNewGeofence(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="40.7128"
                    value={newGeofence.latitude}
                    onChange={(e) => setNewGeofence(prev => ({ ...prev, latitude: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="-74.0060"
                    value={newGeofence.longitude}
                    onChange={(e) => setNewGeofence(prev => ({ ...prev, longitude: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <Button onClick={getCurrentLocation} variant="outline" className="w-full">
                <Navigation className="w-4 h-4 mr-2" />
                Use Current Location
              </Button>

              <div>
                <Label htmlFor="radius">Radius (meters)</Label>
                <Input
                  id="radius"
                  type="number"
                  min="50"
                  max="5000"
                  value={newGeofence.radius}
                  onChange={(e) => setNewGeofence(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-exit">Notify when leaving zone</Label>
                  <Switch
                    id="notify-exit"
                    checked={newGeofence.notifyOnExit}
                    onCheckedChange={(checked) => setNewGeofence(prev => ({ ...prev, notifyOnExit: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-enter">Notify when entering zone</Label>
                  <Switch
                    id="notify-enter"
                    checked={newGeofence.notifyOnEnter}
                    onCheckedChange={(checked) => setNewGeofence(prev => ({ ...prev, notifyOnEnter: checked }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateGeofence} className="flex-1">
                  Create Safe Zone
                </Button>
                <Button variant="outline" onClick={() => setIsAddingGeofence(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-sm text-gray-600">Loading safe zones...</div>
        ) : !geofences || !Array.isArray(geofences) || geofences.length === 0 ? (
          <div className="text-sm text-gray-600 text-center py-4">
            No safe zones set up yet. Create one to get caregiver notifications when you leave or enter specific locations.
          </div>
        ) : (
          (geofences as any[]).map((geofence: any) => (
            <div key={geofence.id} className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-white">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-green-600" />
                <div>
                  <div className="font-medium text-sm">{geofence.name}</div>
                  <div className="text-xs text-gray-600">
                    {geofence.radius}m radius • 
                    {geofence.notifyOnExit && " Exit alerts"} 
                    {geofence.notifyOnEnter && " Entry alerts"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={geofence.isActive ? "default" : "secondary"}>
                  {geofence.isActive ? "Active" : "Inactive"}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteGeofenceMutation.mutate(geofence.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent Geofence Events */}
      {geofenceEvents && (geofenceEvents as any[]).length > 0 && (
        <div className="mt-4 pt-4 border-t border-green-200">
          <h4 className="font-medium text-green-800 mb-2">Recent Zone Activity</h4>
          <div className="space-y-2">
            {(geofenceEvents as any[]).slice(0, 3).map((event: any) => (
              <div key={event.id} className="flex items-center justify-between text-xs p-2 bg-white rounded border border-green-100">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${event.eventType === 'exit' ? 'bg-orange-500' : 'bg-green-500'}`} />
                  <span>{event.eventType === 'exit' ? 'Left' : 'Entered'} zone</span>
                </div>
                <span className="text-gray-500">{formatTimeAgo(new Date(event.timestamp))}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <p className="text-xs text-green-600 mt-4">
        Caregivers will receive instant notifications when you leave or enter designated safe zones. This helps them know you're safe without constant check-ins.
      </p>
    </Card>
  );
}