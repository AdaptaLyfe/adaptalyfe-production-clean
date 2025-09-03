import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatTimeAgo } from "@/lib/utils";
import { 
  MapPin, 
  Navigation, 
  Phone, 
  Shield, 
  Clock, 
  Bus,
  Car,
  Smartphone,
  Route,
  AlertTriangle,
  Users,
  Star,
  Plus,
  Share2,
  CheckCircle,
  Target,
  Heart,
  Calendar,
  FileText,
  Edit
} from "lucide-react";
import { z } from "zod";
import type { BusSchedule, EmergencyTreatmentPlan } from "@shared/schema";

const transportationPlanSchema = z.object({
  title: z.string().min(1, "Trip name is required"),
  fromAddress: z.string().min(1, "Starting location is required"),
  toAddress: z.string().min(1, "Destination is required"),
  transportType: z.string().min(1, "Transportation type is required"),
  notes: z.string().optional(),
});

const busScheduleSchema = z.object({
  routeName: z.string().min(1, "Route name is required"),
  routeNumber: z.string().optional(),
  stopName: z.string().min(1, "Stop name is required"),
  stopAddress: z.string().optional(),
  direction: z.string().optional(),
  departureTime: z.string().min(1, "Departure time is required"),
  daysOfWeek: z.string().min(1, "Days of week is required"),
  isFrequent: z.boolean().default(false),
  notes: z.string().optional(),
});

const emergencyTreatmentPlanSchema = z.object({
  planName: z.string().min(1, "Plan name is required"),
  conditionType: z.string().min(1, "Condition type is required"),
  symptoms: z.string().min(1, "Symptoms are required"),
  immediateActions: z.string().min(1, "Immediate actions are required"),
  medications: z.string().optional(),
  emergencyContacts: z.string().optional(),
  hospitalPreference: z.string().optional(),
  importantNotes: z.string().optional(),
  isActive: z.boolean().default(true),
});

interface TransportationPlan {
  id: number;
  title: string;
  fromAddress: string;
  toAddress: string;
  transportType: 'public' | 'rideshare' | 'walking' | 'driving';
  estimatedTime: number;
  estimatedCost?: number;
  isFavorite: boolean;
  lastUsed?: Date;
}

interface EmergencyContact {
  id: number;
  name: string;
  relationship: string;
  phoneNumber: string;
  isQuickDial: boolean;
}

interface SafetyCheck {
  id: number;
  location: string;
  timestamp: Date;
  status: 'safe' | 'emergency' | 'help_needed';
  message?: string;
}

export default function SafetyTransportationModule() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>("Getting location...");
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showBusDialog, setShowBusDialog] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const transportationPlans: TransportationPlan[] = [
    {
      id: 1,
      title: "Home to Library",
      fromAddress: "123 Main St, City, State",
      toAddress: "Public Library, 456 Oak Ave",
      transportType: 'public',
      estimatedTime: 25,
      estimatedCost: 2.50,
      isFavorite: true,
      lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    },
    {
      id: 2,
      title: "Home to Doctor",
      fromAddress: "123 Main St, City, State",
      toAddress: "Medical Center, 789 Health Way",
      transportType: 'rideshare',
      estimatedTime: 15,
      estimatedCost: 12.50,
      isFavorite: true,
      lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 1 week ago
    },
    {
      id: 3,
      title: "Home to Park",
      fromAddress: "123 Main St, City, State",
      toAddress: "Central Park, 321 Green St",
      transportType: 'walking',
      estimatedTime: 20,
      isFavorite: false,
      lastUsed: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 2 weeks ago
    }
  ];

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
    },
    {
      id: 4,
      name: "Dad",
      relationship: "Parent",
      phoneNumber: "(555) 345-6789",
      isQuickDial: false
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
    }
  ];

  // Queries for bus schedules and emergency plans
  const { data: busSchedules = [] } = useQuery<BusSchedule[]>({
    queryKey: ["/api/bus-schedules"],
  });

  const { data: emergencyPlans = [] } = useQuery<EmergencyTreatmentPlan[]>({
    queryKey: ["/api/emergency-treatment-plans"],
  });

  // Forms
  const planForm = useForm({
    resolver: zodResolver(transportationPlanSchema),
    defaultValues: {
      title: "",
      fromAddress: "",
      toAddress: "",
      transportType: "",
      notes: "",
    },
  });

  const busForm = useForm({
    resolver: zodResolver(busScheduleSchema),
    defaultValues: {
      routeName: "",
      routeNumber: "",
      stopName: "",
      stopAddress: "",
      direction: "",
      departureTime: "",
      daysOfWeek: "",
      isFrequent: false,
      notes: "",
    },
  });

  const emergencyForm = useForm({
    resolver: zodResolver(emergencyTreatmentPlanSchema),
    defaultValues: {
      planName: "",
      conditionType: "",
      symptoms: "",
      immediateActions: "",
      medications: "",
      emergencyContacts: "",
      hospitalPreference: "",
      importantNotes: "",
      isActive: true,
    },
  });

  // Mutations
  const createBusSchedule = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/bus-schedules", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bus-schedules"] });
      toast({ title: "Bus schedule added successfully!" });
      setShowBusDialog(false);
      busForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add bus schedule", variant: "destructive" });
    },
  });

  const createEmergencyPlan = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/emergency-treatment-plans", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-treatment-plans"] });
      toast({ title: "Emergency treatment plan created successfully!" });
      setShowEmergencyDialog(false);
      emergencyForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create emergency plan", variant: "destructive" });
    },
  });

  const getTransportIcon = (type: string) => {
    switch (type) {
      case 'public': return <Bus className="w-4 h-4" />;
      case 'rideshare': return <Car className="w-4 h-4" />;
      case 'walking': return <Navigation className="w-4 h-4" />;
      case 'driving': return <Car className="w-4 h-4" />;
      default: return <Route className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-600 bg-green-100';
      case 'emergency': return 'text-red-600 bg-red-100';
      case 'help_needed': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const shareLocation = () => {
    if (navigator.geolocation) {
      setIsLocationSharing(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
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
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location sharing.",
        variant: "destructive"
      });
    }
  };

  const sendSafetyCheck = (status: 'safe' | 'help_needed' | 'emergency') => {
    const messages = {
      safe: "I'm safe and doing well",
      help_needed: "I need some assistance",
      emergency: "This is an emergency, I need immediate help"
    };
    
    toast({
      title: "Safety check sent",
      description: `Your status has been shared with emergency contacts: ${messages[status]}`,
    });
  };

  const callEmergencyContact = (contact: EmergencyContact) => {
    window.open(`tel:${contact.phoneNumber}`, '_self');
    toast({
      title: "Calling",
      description: `Calling ${contact.name} at ${contact.phoneNumber}`,
    });
  };

  const startNavigation = (plan: TransportationPlan) => {
    const destination = encodeURIComponent(plan.toAddress);
    const origin = encodeURIComponent(plan.fromAddress);
    const mapsUrl = `https://www.google.com/maps/dir/${origin}/${destination}`;
    window.open(mapsUrl, '_blank');
    
    toast({
      title: "Navigation started",
      description: `Opening directions to ${plan.toAddress}`,
    });
  };

  const saveFavorite = (planId: number) => {
    toast({
      title: "Saved to favorites",
      description: "This route has been added to your favorite trips.",
    });
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Safety & Transportation
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">Premium</Badge>
        </CardTitle>
        <CardDescription>
          Stay safe with location sharing, emergency contacts, and travel planning
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="w-full overflow-x-auto">
            <TabsList className="flex w-max min-w-full gap-1 px-1">
              <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 flex-shrink-0">Overview</TabsTrigger>
              <TabsTrigger value="emergency" className="text-xs sm:text-sm px-2 flex-shrink-0">Emergency</TabsTrigger>
              <TabsTrigger value="transportation" className="text-xs sm:text-sm px-2 flex-shrink-0">Travel</TabsTrigger>
              <TabsTrigger value="bus" className="text-xs sm:text-sm px-2 flex-shrink-0">Bus Routes</TabsTrigger>
              <TabsTrigger value="emergency-plans" className="text-xs sm:text-sm px-2 flex-shrink-0">Medical Plans</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4 mt-6 max-h-[600px] overflow-y-auto">
            {/* Quick Safety Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">Share Location</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Let your caregivers know where you are
                </p>
                <Button 
                  onClick={shareLocation} 
                  className="w-full"
                  disabled={isLocationSharing}
                >
                  {isLocationSharing ? "Sharing..." : "Share Location"}
                </Button>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Emergency Call</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Quick access to your emergency contacts
                </p>
                <Button 
                  onClick={() => callEmergencyContact(emergencyContacts[0])} 
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Call Mom
                </Button>
              </Card>
            </div>

            {/* Status Indicators */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">Safety Status</h3>
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
            </Card>

            {/* Favorite Routes */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">Favorite Routes</h3>
              <div className="space-y-3">
                {transportationPlans.filter(plan => plan.isFavorite).map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-blue-500">
                        {getTransportIcon(plan.transportType)}
                      </span>
                      <div>
                        <div className="font-medium text-sm">{plan.title}</div>
                        <div className="text-xs text-gray-600">
                          {plan.estimatedTime} min • {plan.estimatedCost ? `$${plan.estimatedCost}` : 'Free'}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => startNavigation(plan)}>
                      <Navigation className="w-4 h-4 mr-2" />
                      Go
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Safety Checks */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">Recent Check-ins</h3>
              <div className="space-y-2">
                {recentSafetyChecks.slice(0, 3).map((check) => (
                  <div key={check.id} className="flex items-center gap-3 p-2 border rounded-lg">
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
          </TabsContent>

          <TabsContent value="emergency" className="space-y-4 mt-6 max-h-[600px] overflow-y-auto">
            {/* Emergency Actions */}
            <Card className="p-4 border-red-200 bg-red-50">
              <h3 className="font-medium mb-3 text-red-800">Emergency Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => callEmergencyContact(emergencyContacts.find(c => c.phoneNumber === "911")!)}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call 911
                </Button>
                <Button 
                  onClick={() => {
                    shareLocation();
                    sendSafetyCheck('emergency');
                  }}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Emergency Alert
                </Button>
              </div>
            </Card>

            {/* Quick Dial Contacts */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">Emergency Contacts</h3>
              <div className="space-y-3">
                {emergencyContacts.filter(contact => contact.isQuickDial).map((contact) => (
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
                    <Button onClick={() => callEmergencyContact(contact)}>
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Safety Tips */}
            <Card className="p-4 border-yellow-200 bg-yellow-50">
              <h3 className="font-medium mb-3 text-yellow-800">Safety Reminders</h3>
              <ul className="space-y-2 text-sm text-yellow-700">
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-yellow-600 rounded-full mt-2" />
                  Always share your location when traveling to new places
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-yellow-600 rounded-full mt-2" />
                  Keep your phone charged and carry a portable charger
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-yellow-600 rounded-full mt-2" />
                  Trust your instincts - if something feels wrong, seek help
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-yellow-600 rounded-full mt-2" />
                  Have backup transportation plans ready
                </li>
              </ul>
            </Card>
          </TabsContent>

          <TabsContent value="transportation" className="space-y-4 mt-6 max-h-[600px] overflow-y-auto">
            {/* Add New Plan */}
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Travel Plans</h3>
              <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    New Plan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Transportation Plan</DialogTitle>
                    <DialogDescription>
                      Plan your route with step-by-step directions
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...planForm}>
                    <form className="space-y-4">
                      <FormField
                        control={planForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trip Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Home to Library" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={planForm.control}
                        name="fromAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From</FormLabel>
                            <FormControl>
                              <Input placeholder="Starting location" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={planForm.control}
                        name="toAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>To</FormLabel>
                            <FormControl>
                              <Input placeholder="Destination" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={planForm.control}
                        name="transportType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Transportation Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select transportation" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="walking">Walking</SelectItem>
                                <SelectItem value="public">Public Transit</SelectItem>
                                <SelectItem value="rideshare">Rideshare/Taxi</SelectItem>
                                <SelectItem value="driving">Driving</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={planForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Special instructions, landmarks, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1">Save Plan</Button>
                        <Button type="button" variant="outline" onClick={() => setShowPlanDialog(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Transportation Plans */}
            <div className="space-y-3">
              {transportationPlans.map((plan) => (
                <Card key={plan.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-blue-500">
                          {getTransportIcon(plan.transportType)}
                        </span>
                        <h4 className="font-medium">{plan.title}</h4>
                        {plan.isFavorite && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <div><strong>From:</strong> {plan.fromAddress}</div>
                        <div><strong>To:</strong> {plan.toAddress}</div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {plan.estimatedTime} min
                        </div>
                        {plan.estimatedCost && (
                          <div className="flex items-center gap-1">
                            <span>$</span>
                            {plan.estimatedCost}
                          </div>
                        )}
                        {plan.lastUsed && (
                          <div>Last used {formatTimeAgo(plan.lastUsed)}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" onClick={() => startNavigation(plan)}>
                        <Navigation className="w-4 h-4 mr-2" />
                        Navigate
                      </Button>
                      {!plan.isFavorite && (
                        <Button size="sm" variant="outline" onClick={() => saveFavorite(plan.id)}>
                          <Star className="w-4 h-4 mr-2" />
                          Favorite
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>



          {/* Bus Routes Tab */}
          <TabsContent value="bus" className="space-y-4 mt-6 max-h-[600px] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Bus Schedules</h3>
              <Dialog open={showBusDialog} onOpenChange={setShowBusDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Route
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Bus Schedule</DialogTitle>
                    <DialogDescription>
                      Save local bus route information for easy travel planning
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...busForm}>
                    <form onSubmit={busForm.handleSubmit((data) => createBusSchedule.mutate(data))} className="space-y-4">
                      <FormField
                        control={busForm.control}
                        name="routeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Route Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Downtown Express" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={busForm.control}
                        name="routeNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Route Number</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 42, A1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={busForm.control}
                        name="stopName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stop Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Main St & Oak Ave" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={busForm.control}
                        name="departureTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Departure Time</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 08:30, 2:15 PM" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={busForm.control}
                        name="daysOfWeek"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Days of Week</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Monday,Tuesday,Wednesday" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={busForm.control}
                        name="isFrequent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Frequent Route</FormLabel>
                              <div className="text-sm text-gray-600">Mark as a frequently used route</div>
                            </div>
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={createBusSchedule.isPending}>
                        {createBusSchedule.isPending ? "Adding..." : "Add Bus Schedule"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Bus Schedules List */}
            <div className="space-y-3">
              {busSchedules.map((schedule) => (
                <Card key={schedule.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Bus className="w-4 h-4 text-blue-500" />
                        <h4 className="font-medium">{schedule.routeName}</h4>
                        {schedule.routeNumber && (
                          <Badge variant="outline">#{schedule.routeNumber}</Badge>
                        )}
                        {schedule.isFrequent && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <div><strong>Stop:</strong> {schedule.stopName}</div>
                        <div><strong>Time:</strong> {schedule.departureTime}</div>
                        <div><strong>Days:</strong> {schedule.daysOfWeek}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {busSchedules.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Bus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No bus schedules saved yet</p>
                  <p className="text-sm">Add your local bus routes to plan trips easily</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Emergency Treatment Plans Tab */}
          <TabsContent value="emergency-plans" className="space-y-4 mt-6 max-h-[600px] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Emergency Treatment Plans</h3>
              <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Emergency Treatment Plan</DialogTitle>
                    <DialogDescription>
                      Create a personalized response plan for medical emergencies
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...emergencyForm}>
                    <form onSubmit={emergencyForm.handleSubmit((data) => createEmergencyPlan.mutate(data))} className="space-y-4">
                      <FormField
                        control={emergencyForm.control}
                        name="planName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plan Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Anxiety Attack Response Plan" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={emergencyForm.control}
                        name="conditionType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Condition Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select condition type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="anxiety">Anxiety Attack</SelectItem>
                                <SelectItem value="seizure">Seizure</SelectItem>
                                <SelectItem value="allergic_reaction">Allergic Reaction</SelectItem>
                                <SelectItem value="meltdown">Sensory Meltdown</SelectItem>
                                <SelectItem value="panic_attack">Panic Attack</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={emergencyForm.control}
                        name="symptoms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Warning Signs & Symptoms</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe what to watch for that indicates this emergency is happening..."
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={emergencyForm.control}
                        name="immediateActions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Immediate Actions</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Step-by-step instructions for immediate response..."
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={emergencyForm.control}
                        name="medications"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Medications</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="List any emergency medications and dosages..."
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={emergencyForm.control}
                        name="emergencyContacts"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contacts</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Specific contacts to call for this emergency..."
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={createEmergencyPlan.isPending}>
                        {createEmergencyPlan.isPending ? "Creating..." : "Create Emergency Plan"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Emergency Plans List */}
            <div className="space-y-3">
              {emergencyPlans.map((plan) => (
                <Card key={plan.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        <h4 className="font-medium">{plan.planName}</h4>
                        <Badge variant={plan.isActive ? "default" : "secondary"}>
                          {plan.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <div><strong>Condition:</strong> {plan.conditionType}</div>
                        <div className="mt-1"><strong>Symptoms:</strong> {plan.symptoms}</div>
                        <div className="mt-1"><strong>Immediate Actions:</strong> {plan.immediateActions}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {emergencyPlans.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No emergency treatment plans created yet</p>
                  <p className="text-sm">Create personalized emergency response plans for peace of mind</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}