import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pill, Plus, MapPin, Phone, Clock, Truck, CheckCircle, AlertCircle, RefreshCw, Building2 } from "lucide-react";
import type { Pharmacy, UserPharmacy, Medication, RefillOrder } from "@shared/schema";

interface PharmacyWithUserData extends UserPharmacy {
  pharmacy: Pharmacy;
}

export default function PharmacyModule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPharmacy, setSelectedPharmacy] = useState<number | null>(null);
  const [showAddPharmacy, setShowAddPharmacy] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [showCreatePharmacy, setShowCreatePharmacy] = useState(false);

  // Fetch available pharmacies
  const { data: pharmacies = [], isLoading: pharmaciesLoading } = useQuery<Pharmacy[]>({
    queryKey: ["/api/pharmacies"],
  });

  // Fetch user's linked pharmacies
  const { data: userPharmacies = [], isLoading: userPharmaciesLoading } = useQuery<PharmacyWithUserData[]>({
    queryKey: ["/api/user-pharmacies"],
  });

  // Fetch user's medications
  const { data: medications = [], isLoading: medicationsLoading } = useQuery<Medication[]>({
    queryKey: ["/api/medications"],
  });

  // Fetch medications due for refill
  const { data: medicationsDue = [] } = useQuery<Medication[]>({
    queryKey: ["/api/medications/due-for-refill"],
  });

  // Fetch refill orders
  const { data: refillOrders = [], isLoading: refillOrdersLoading } = useQuery<any[]>({
    queryKey: ["/api/refill-orders"],
  });

  // Create custom pharmacy
  const createPharmacyMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      address?: string;
      phoneNumber?: string;
      website?: string;
      refillUrl?: string;
      hours?: string;
    }) => {
      return await apiRequest("POST", "/api/pharmacies", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pharmacies"] });
      toast({
        title: "Success",
        description: "Custom pharmacy created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create pharmacy",
        variant: "destructive",
      });
    },
  });

  // Add pharmacy to user account
  const addPharmacyMutation = useMutation({
    mutationFn: async (data: { 
      pharmacyId: number; 
      isPrimary: boolean; 
      accountNumber?: string;
      membershipId?: string;
      insuranceProvider?: string;
      autoRefillEnabled?: boolean;
    }) => {
      return await apiRequest("POST", "/api/user-pharmacies", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-pharmacies"] });
      setShowAddPharmacy(false);
      toast({
        title: "Success",
        description: "Pharmacy added to your account",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add pharmacy",
        variant: "destructive",
      });
    },
  });

  // Add medication
  const addMedicationMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/medications", { 
        userId: 1, 
        ...data 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medications/due-for-refill"] });
      setShowAddMedication(false);
      toast({
        title: "Success",
        description: "Medication added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add medication",
        variant: "destructive",
      });
    },
  });

  // Order refill
  const orderRefillMutation = useMutation({
    mutationFn: async (data: { medicationId: number; pharmacyId: number; pickupMethod: string }) => {
      return await apiRequest("POST", "/api/refill-orders", {
        userId: 1,
        ...data,
        status: "pending"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/refill-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      toast({
        title: "Success",
        description: "Refill order placed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to place refill order",
        variant: "destructive",
      });
    },
  });

  const handleCreatePharmacy = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const pharmacyData = {
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      website: formData.get("website") as string,
      refillUrl: formData.get("refillUrl") as string,
      hours: formData.get("hours") as string,
    };

    createPharmacyMutation.mutate(pharmacyData);
    setShowCreatePharmacy(false);
  };

  const handleAddPharmacy = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const pharmacyId = parseInt(formData.get("pharmacyId") as string);
    const accountNumber = formData.get("accountNumber") as string;
    const membershipId = formData.get("membershipId") as string;
    const insuranceProvider = formData.get("insuranceProvider") as string;
    const isPrimary = formData.get("isPrimary") === "on";
    const autoRefillEnabled = formData.get("autoRefillEnabled") === "on";

    addPharmacyMutation.mutate({ 
      pharmacyId, 
      accountNumber, 
      membershipId,
      insuranceProvider,
      isPrimary,
      autoRefillEnabled
    });
  };

  const handleAddMedication = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const medicationData = {
      medicationName: formData.get("medicationName") as string,
      dosage: formData.get("dosage") as string,
      prescriptionNumber: formData.get("prescriptionNumber") as string,
      quantity: parseInt(formData.get("quantity") as string),
      refillsRemaining: parseInt(formData.get("refillsRemaining") as string),
      prescribedBy: formData.get("prescribedBy") as string,
      pharmacyId: parseInt(formData.get("pharmacyId") as string),
      nextRefillDate: formData.get("nextRefillDate") as string,
      instructions: formData.get("instructions") as string,
      // Pill appearance fields
      pillColor: formData.get("pillColor") as string,
      pillShape: formData.get("pillShape") as string,
      pillSize: formData.get("pillSize") as string,
      pillMarkings: formData.get("pillMarkings") as string,
      pillDescription: formData.get("pillDescription") as string,
    };

    addMedicationMutation.mutate(medicationData);
  };

  const handleOrderRefill = (medication: Medication) => {
    const primaryPharmacy = userPharmacies.find((up) => up.isPrimary);
    const pharmacyId = primaryPharmacy?.pharmacyId || medication.pharmacyId || userPharmacies[0]?.pharmacyId;
    
    if (!pharmacyId) {
      toast({
        title: "Error",
        description: "Please add a pharmacy to your account first",
        variant: "destructive",
      });
      return;
    }

    orderRefillMutation.mutate({
      medicationId: medication.id,
      pharmacyId,
      pickupMethod: "in_store"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "ready": return "bg-green-100 text-green-800";
      case "picked_up": return "bg-gray-100 text-gray-800";
      case "delivered": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-3 h-3" />;
      case "processing": return <RefreshCw className="w-3 h-3" />;
      case "ready": return <CheckCircle className="w-3 h-3" />;
      case "picked_up": return <CheckCircle className="w-3 h-3" />;
      case "delivered": return <Truck className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  if (pharmaciesLoading || userPharmaciesLoading || medicationsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5" />
            Pharmacy & Medications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="w-5 h-5" />
          Pharmacy & Medications
        </CardTitle>
        <CardDescription>
          Manage your pharmacies and medications, order refills
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="medications" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-10">
            <TabsTrigger value="medications" className="text-sm px-3">Medications</TabsTrigger>
            <TabsTrigger value="refills" className="text-sm px-3">Refills</TabsTrigger>
            <TabsTrigger value="orders" className="text-sm px-3">Orders</TabsTrigger>
            <TabsTrigger value="pharmacies" className="text-sm px-3">Pharmacies</TabsTrigger>
          </TabsList>

          <TabsContent value="medications" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Your Medications</h3>
              <Dialog open={showAddMedication} onOpenChange={setShowAddMedication}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Medication
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Medication</DialogTitle>
                    <DialogDescription>
                      Add a medication to track refills and reminders
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddMedication} className="space-y-4">
                    <div>
                      <Label htmlFor="medicationName">Medication Name</Label>
                      <Input name="medicationName" required />
                    </div>
                    <div>
                      <Label htmlFor="dosage">Dosage</Label>
                      <Input name="dosage" placeholder="e.g., 10mg" />
                    </div>
                    <div>
                      <Label htmlFor="prescriptionNumber">Prescription Number</Label>
                      <Input name="prescriptionNumber" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input name="quantity" type="number" placeholder="30" />
                      </div>
                      <div>
                        <Label htmlFor="refillsRemaining">Refills Left</Label>
                        <Input name="refillsRemaining" type="number" placeholder="3" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="prescribedBy">Prescribed By</Label>
                      <Input name="prescribedBy" placeholder="Dr. Smith" />
                    </div>
                    <div>
                      <Label htmlFor="pharmacyId">Pharmacy</Label>
                      <Select name="pharmacyId">
                        <SelectTrigger>
                          <SelectValue placeholder="Select pharmacy" />
                        </SelectTrigger>
                        <SelectContent>
                          {userPharmacies.map((up) => (
                            <SelectItem key={up.id} value={up.pharmacyId.toString()}>
                              {up.pharmacy?.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="nextRefillDate">Next Refill Date</Label>
                      <Input name="nextRefillDate" type="date" />
                    </div>
                    <div>
                      <Label htmlFor="instructions">Instructions</Label>
                      <Input name="instructions" placeholder="Take with food" />
                    </div>
                    
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Pill Appearance (Optional)</h4>
                      <p className="text-xs text-gray-500">Help identify your medication by describing how it looks</p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="pillColor">Color</Label>
                          <Input name="pillColor" placeholder="e.g., White, Blue" />
                        </div>
                        <div>
                          <Label htmlFor="pillShape">Shape</Label>
                          <Select name="pillShape">
                            <SelectTrigger>
                              <SelectValue placeholder="Select shape" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="round">Round</SelectItem>
                              <SelectItem value="oval">Oval</SelectItem>
                              <SelectItem value="oblong">Oblong</SelectItem>
                              <SelectItem value="capsule">Capsule</SelectItem>
                              <SelectItem value="square">Square</SelectItem>
                              <SelectItem value="triangle">Triangle</SelectItem>
                              <SelectItem value="diamond">Diamond</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="pillSize">Size</Label>
                        <Select name="pillSize">
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                            <SelectItem value="extra-large">Extra Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="pillMarkings">Markings/Imprint</Label>
                        <Input name="pillMarkings" placeholder="e.g., 'TYLENOL 500', 'L484'" />
                      </div>
                      
                      <div>
                        <Label htmlFor="pillDescription">Additional Description</Label>
                        <Input name="pillDescription" placeholder="e.g., Scored tablet, film-coated" />
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={addMedicationMutation.isPending}>
                      {addMedicationMutation.isPending ? "Adding..." : "Add Medication"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {medications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No medications added yet</p>
                  <p className="text-sm">Add your medications to track refills</p>
                </div>
              ) : (
                medications.map((medication) => (
                  <Card key={medication.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="font-medium">{medication.medicationName}</h4>
                          {medication.dosage && (
                            <p className="text-sm text-gray-600">{medication.dosage}</p>
                          )}
                          {medication.prescribedBy && (
                            <p className="text-xs text-gray-500">Prescribed by {medication.prescribedBy}</p>
                          )}
                          
                          {/* Pill Appearance */}
                          {(medication.pillColor || medication.pillShape || medication.pillSize || medication.pillMarkings) && (
                            <div className="mt-2 p-2 bg-blue-50 rounded-md">
                              <p className="text-xs font-medium text-blue-800 mb-1">Pill Appearance:</p>
                              <div className="flex flex-wrap gap-1 text-xs text-blue-700">
                                {medication.pillColor && <span className="bg-blue-100 px-2 py-0.5 rounded">{medication.pillColor}</span>}
                                {medication.pillShape && <span className="bg-blue-100 px-2 py-0.5 rounded">{medication.pillShape}</span>}
                                {medication.pillSize && <span className="bg-blue-100 px-2 py-0.5 rounded">{medication.pillSize}</span>}
                                {medication.pillMarkings && <span className="bg-blue-100 px-2 py-0.5 rounded">"{medication.pillMarkings}"</span>}
                              </div>
                              {medication.pillDescription && (
                                <p className="text-xs text-blue-600 mt-1">{medication.pillDescription}</p>
                              )}
                            </div>
                          )}
                          
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">
                              {medication.refillsRemaining} refills left
                            </Badge>
                            {medication.nextRefillDate && (
                              <Badge variant="outline">
                                Next: {new Date(medication.nextRefillDate).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleOrderRefill(medication)}
                            disabled={orderRefillMutation.isPending || medication.refillsRemaining === 0}
                            variant={medication.refillsRemaining === 0 ? "outline" : "default"}
                          >
                            {medication.refillsRemaining === 0 ? "No Refills" : "Order Refill"}
                          </Button>
                          {(() => {
                            const linkedPharmacy = userPharmacies.find(up => up.pharmacyId === medication.pharmacyId);
                            return linkedPharmacy?.pharmacy?.refillUrl ? (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open(linkedPharmacy.pharmacy?.refillUrl, '_blank')}
                                className="border-blue-500 text-blue-600 hover:bg-blue-50"
                              >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Online
                              </Button>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="refills" className="space-y-4">
            <h3 className="text-lg font-medium">Medications Due for Refill</h3>
            <div className="space-y-3">
              {medicationsDue.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No refills needed right now</p>
                  <p className="text-sm">Check back when medications are running low</p>
                </div>
              ) : (
                medicationsDue.map((medication) => (
                  <Card key={medication.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="font-medium">{medication.medicationName}</h4>
                          <p className="text-sm text-orange-600">
                            Due: {medication.nextRefillDate ? new Date(medication.nextRefillDate).toLocaleDateString() : 'Soon'}
                          </p>
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            {medication.refillsRemaining} refills left
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-orange-500 text-orange-600 hover:bg-orange-50"
                          onClick={() => handleOrderRefill(medication)}
                          disabled={orderRefillMutation.isPending}
                        >
                          Order Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <h3 className="text-lg font-medium">Refill Order History</h3>
            <div className="space-y-3">
              {refillOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No refill orders yet</p>
                  <p className="text-sm">Your refill history will appear here</p>
                </div>
              ) : (
                refillOrders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h4 className="font-medium">{order.medication?.medicationName}</h4>
                          <p className="text-sm text-gray-600">{order.pharmacy?.name}</p>
                          <p className="text-xs text-gray-500">
                            Ordered: {new Date(order.orderDate).toLocaleDateString()}
                          </p>
                          {order.orderNumber && (
                            <p className="text-xs text-gray-500">Order #{order.orderNumber}</p>
                          )}
                        </div>
                        <div className="text-right space-y-2">
                          <Badge className={getStatusColor(order.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </div>
                          </Badge>
                          {order.readyDate && (
                            <p className="text-xs text-gray-500">
                              Ready: {new Date(order.readyDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="pharmacies" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Your Pharmacies</h3>
              <div className="flex gap-2">
                <Dialog open={showCreatePharmacy} onOpenChange={setShowCreatePharmacy}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Custom
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Custom Pharmacy</DialogTitle>
                      <DialogDescription>
                        Add a pharmacy that's not in our database
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreatePharmacy} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Pharmacy Name</Label>
                        <Input name="name" required placeholder="e.g., Local Community Pharmacy" />
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input name="address" placeholder="Street address" />
                      </div>
                      <div>
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input name="phoneNumber" placeholder="(555) 123-4567" />
                      </div>
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input name="website" placeholder="https://pharmacy-website.com" />
                      </div>
                      <div>
                        <Label htmlFor="refillUrl">Online Refill URL</Label>
                        <Input name="refillUrl" placeholder="Direct link to online refill page" />
                      </div>
                      <div>
                        <Label htmlFor="hours">Hours</Label>
                        <Input name="hours" placeholder="e.g., Mon-Fri 9AM-8PM, Sat 9AM-6PM" />
                      </div>
                      <Button type="submit" className="w-full" disabled={createPharmacyMutation.isPending}>
                        {createPharmacyMutation.isPending ? "Creating..." : "Create Pharmacy"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
                <Dialog open={showAddPharmacy} onOpenChange={setShowAddPharmacy}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Link Pharmacy
                    </Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Pharmacy to Your Account</DialogTitle>
                    <DialogDescription>
                      Link a pharmacy to enable prescription refills
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddPharmacy} className="space-y-4">
                    <div>
                      <Label htmlFor="pharmacyId">Select Pharmacy</Label>
                      <Select name="pharmacyId" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a pharmacy" />
                        </SelectTrigger>
                        <SelectContent>
                          {pharmacies.map((pharmacy) => (
                            <SelectItem key={pharmacy.id} value={pharmacy.id.toString()}>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                {pharmacy.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input name="accountNumber" placeholder="Your pharmacy account number" />
                    </div>
                    <div>
                      <Label htmlFor="membershipId">Membership/Insurance ID</Label>
                      <Input name="membershipId" placeholder="Insurance or member ID" />
                    </div>
                    <div>
                      <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                      <Input name="insuranceProvider" placeholder="e.g., Blue Cross, Medicare" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" name="isPrimary" id="isPrimary" />
                      <Label htmlFor="isPrimary">Set as primary pharmacy</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" name="autoRefillEnabled" id="autoRefillEnabled" />
                      <Label htmlFor="autoRefillEnabled">Enable automatic refills</Label>
                    </div>
                    <Button type="submit" className="w-full" disabled={addPharmacyMutation.isPending}>
                      {addPharmacyMutation.isPending ? "Adding..." : "Add Pharmacy"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

            <div className="space-y-3">
              {userPharmacies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No pharmacies linked yet</p>
                  <p className="text-sm">Add a pharmacy to start ordering refills</p>
                </div>
              ) : (
                userPharmacies.map((userPharmacy) => (
                  <Card key={userPharmacy.id} className={userPharmacy.isPrimary ? "border-l-4 border-l-green-500" : ""}>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{userPharmacy.pharmacy?.name}</h4>
                          {userPharmacy.isPrimary && (
                            <Badge className="bg-green-100 text-green-800">Primary</Badge>
                          )}
                        </div>
                        {userPharmacy.pharmacy?.address && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="w-3 h-3" />
                            {userPharmacy.pharmacy.address}
                          </div>
                        )}
                        {userPharmacy.pharmacy?.phoneNumber && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="w-3 h-3" />
                            {userPharmacy.pharmacy.phoneNumber}
                          </div>
                        )}
                        {userPharmacy.pharmacy?.hours && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="w-3 h-3" />
                            {userPharmacy.pharmacy.hours}
                          </div>
                        )}
                        {userPharmacy.accountNumber && (
                          <p className="text-xs text-gray-500">
                            Account: {userPharmacy.accountNumber}
                          </p>
                        )}
                        {userPharmacy.insuranceProvider && (
                          <p className="text-xs text-gray-500">
                            Insurance: {userPharmacy.insuranceProvider}
                          </p>
                        )}
                        
                        <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
                          {userPharmacy.pharmacy?.website && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => window.open(userPharmacy.pharmacy?.website, '_blank')}
                              className="flex-1"
                            >
                              <Building2 className="w-3 h-3 mr-1" />
                              Visit Website
                            </Button>
                          )}
                          {userPharmacy.pharmacy?.refillUrl && (
                            <Button 
                              size="sm" 
                              onClick={() => window.open(userPharmacy.pharmacy?.refillUrl, '_blank')}
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Order Refills
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  );
}