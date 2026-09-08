import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  AlertTriangle, 
  Heart, 
  Shield, 
  Phone, 
  UserPlus,
  Stethoscope,
  Edit,
  Trash2,
  Plus
} from "lucide-react";
import { SymptomTracker } from "./symptom-tracker";

interface Allergy {
  id: number;
  allergen: string;
  severity: string;
  reaction?: string;
  notes?: string;
}

interface MedicalCondition {
  id: number;
  condition: string;
  status: string;
  diagnosedDate?: string;
  notes?: string;
}

interface AdverseMedication {
  id: number;
  medicationName: string;
  reaction: string;
  severity: string;
  reactionDate?: string;
  notes?: string;
}

interface EmergencyContact {
  id: number;
  name: string;
  relationship?: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
  notes?: string;
}

interface PrimaryCareProvider {
  id: number;
  name: string;
  specialty: string;
  practiceName?: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
  notes?: string;
}

const severityColors = {
  mild: "bg-yellow-100 text-yellow-800",
  moderate: "bg-orange-100 text-orange-800", 
  severe: "bg-red-100 text-red-800",
  "life-threatening": "bg-red-200 text-red-900"
};

const statusColors = {
  active: "bg-red-100 text-red-800",
  inactive: "bg-gray-100 text-gray-800",
  resolved: "bg-green-100 text-green-800"
};

export default function MedicalInformationModule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingAllergy, setEditingAllergy] = useState<Allergy | null>(null);
  const [editingCondition, setEditingCondition] = useState<MedicalCondition | null>(null);
  const [editingAdverseMed, setEditingAdverseMed] = useState<AdverseMedication | null>(null);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [editingProvider, setEditingProvider] = useState<PrimaryCareProvider | null>(null);
  const [showConditionDialog, setShowConditionDialog] = useState(false);
  const [showAllergyDialog, setShowAllergyDialog] = useState(false);
  const [showAdverseMedDialog, setShowAdverseMedDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  
  // Select field states for forms
  const [conditionStatus, setConditionStatus] = useState("");
  const [allergySeverity, setAllergySeverity] = useState("");
  const [adverseMedSeverity, setAdverseMedSeverity] = useState("");

  // Fetch data
  const { data: allergies = [] } = useQuery<Allergy[]>({
    queryKey: ["/api/allergies"],
  });

  const { data: conditions = [] } = useQuery<MedicalCondition[]>({
    queryKey: ["/api/medical-conditions"],
  });

  const { data: adverseMeds = [] } = useQuery<AdverseMedication[]>({
    queryKey: ["/api/adverse-medications"],
  });

  const { data: emergencyContacts = [] } = useQuery<EmergencyContact[]>({
    queryKey: ["/api/emergency-contacts"],
  });

  const { data: providers = [] } = useQuery<PrimaryCareProvider[]>({
    queryKey: ["/api/primary-care-providers"],
  });

  // Mutation functions
  const createAllergy = useMutation({
    mutationFn: (data: Partial<Allergy>) => apiRequest("POST", "/api/allergies", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allergies"] });
      toast({ title: "Success", description: "Sensitivity added successfully" });
    }
  });

  const updateAllergy = useMutation({
    mutationFn: ({ id, ...data }: Partial<Allergy> & { id: number }) => 
      apiRequest("PUT", `/api/allergies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allergies"] });
      toast({ title: "Success", description: "Sensitivity updated successfully" });
      setEditingAllergy(null);
    }
  });

  const deleteAllergy = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/allergies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allergies"] });
      toast({ title: "Success", description: "Sensitivity deleted successfully" });
    }
  });

  const createCondition = useMutation({
    mutationFn: async (data: Partial<MedicalCondition>) => {
      const response = await apiRequest("POST", "/api/medical-conditions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-conditions"] });
      toast({ title: "Success", description: "Note added successfully" });
    },
    onError: (error: any) => {
      console.error("Failed to create medical condition:", error);
      toast({ 
        title: "Error", 
        description: "Failed to add note. Please try again.",
        variant: "destructive"
      });
    }
  });

  const updateCondition = useMutation({
    mutationFn: ({ id, ...data }: Partial<MedicalCondition> & { id: number }) => 
      apiRequest("PUT", `/api/medical-conditions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-conditions"] });
      toast({ title: "Success", description: "Note updated successfully" });
      setEditingCondition(null);
    }
  });

  const deleteCondition = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/medical-conditions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-conditions"] });
      toast({ title: "Success", description: "Note deleted successfully" });
    }
  });

  const createAdverseMed = useMutation({
    mutationFn: async (data: Partial<AdverseMedication>) => {
      const response = await apiRequest("POST", "/api/adverse-medications", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adverse-medications"] });
      toast({ title: "Success", description: "Reaction added successfully" });
    }
  });

  const updateAdverseMed = useMutation({
    mutationFn: ({ id, ...data }: Partial<AdverseMedication> & { id: number }) => 
      apiRequest("PUT", `/api/adverse-medications/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adverse-medications"] });
      toast({ title: "Success", description: "Reaction updated successfully" });
      setEditingAdverseMed(null);
    }
  });

  const deleteAdverseMed = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/adverse-medications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adverse-medications"] });
      toast({ title: "Success", description: "Reaction deleted successfully" });
    }
  });

  const createContact = useMutation({
    mutationFn: (data: Partial<EmergencyContact>) => apiRequest("POST", "/api/emergency-contacts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-contacts"] });
      toast({ title: "Success", description: "Trusted contact added successfully" });
    }
  });

  const updateContact = useMutation({
    mutationFn: ({ id, ...data }: Partial<EmergencyContact> & { id: number }) => 
      apiRequest("PUT", `/api/emergency-contacts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-contacts"] });
      toast({ title: "Success", description: "Trusted contact updated successfully" });
      setEditingContact(null);
    }
  });

  const deleteContact = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/emergency-contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-contacts"] });
      toast({ title: "Success", description: "Trusted contact deleted successfully" });
    }
  });

  const createProvider = useMutation({
    mutationFn: (data: Partial<PrimaryCareProvider>) => apiRequest("POST", "/api/primary-care-providers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/primary-care-providers"] });
      toast({ title: "Success", description: "Healthcare contact added successfully" });
    }
  });

  const updateProvider = useMutation({
    mutationFn: ({ id, ...data }: Partial<PrimaryCareProvider> & { id: number }) => 
      apiRequest("PUT", `/api/primary-care-providers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/primary-care-providers"] });
      toast({ title: "Success", description: "Healthcare contact updated successfully" });
      setEditingProvider(null);
    }
  });

  const deleteProvider = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/primary-care-providers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/primary-care-providers"] });
      toast({ title: "Success", description: "Healthcare contact deleted successfully" });
    }
  });

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Health Records</h2>
        <p className="text-gray-600">Store personal health-related details such as sensitivities and trusted contacts for reference.</p>
      </div>

      <Tabs defaultValue="allergies" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-16 md:h-12 p-1 gap-1">
          <TabsTrigger value="allergies" className="text-xs md:text-sm px-2 py-2 whitespace-nowrap">
            Sensitivities
          </TabsTrigger>
          <TabsTrigger value="conditions" className="text-xs md:text-sm px-2 py-2 whitespace-nowrap">
            Notes
          </TabsTrigger>
          <TabsTrigger value="adverse" className="text-xs md:text-sm px-2 py-2 whitespace-nowrap">
            Reactions
          </TabsTrigger>
          <TabsTrigger value="contacts" className="text-xs md:text-sm px-2 py-2 whitespace-nowrap">
            Trusted Contacts
          </TabsTrigger>
          <TabsTrigger value="providers" className="text-xs md:text-sm px-2 py-2 whitespace-nowrap">
            Healthcare Contacts
          </TabsTrigger>
          <TabsTrigger value="symptoms" className="text-xs md:text-sm px-2 py-2 whitespace-nowrap">
            Personal Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="allergies" className="space-y-4 mt-6 h-96 overflow-y-scroll">
          <p className="text-xs text-gray-500 italic mb-2">Sensitivity information is entered by the user and stored for personal reference only.</p>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Sensitivities</h3>
            <Button onClick={() => setShowAllergyDialog(true)} data-testid="button-add-sensitivity">
              <Plus className="w-4 h-4 mr-2" />
              Add Sensitivity
            </Button>
          </div>

          <div className="grid gap-4">
            {!allergies || allergies.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  No sensitivities recorded. Click "Add Sensitivity" to get started.
                </CardContent>
              </Card>
            ) : (
              allergies.map((allergy) => (
                <Card key={allergy.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{allergy.allergen}</h4>
                          <Badge className={severityColors[allergy.severity as keyof typeof severityColors]}>
                            {allergy.severity}
                          </Badge>
                        </div>
                        {allergy.reaction && (
                          <p className="text-sm text-gray-600">Reaction: {allergy.reaction}</p>
                        )}
                        {allergy.notes && (
                          <p className="text-sm text-gray-500">{allergy.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingAllergy(allergy)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteAllergy.mutate(allergy.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="conditions" className="space-y-4 mt-6 h-96 overflow-y-scroll">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Notes</h3>
            <Button onClick={() => setShowConditionDialog(true)} data-testid="button-add-note">
              <Plus className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </div>

          <div className="grid gap-4">
            {!conditions || conditions.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  No notes recorded. Click "Add Note" to get started.
                </CardContent>
              </Card>
            ) : (
              conditions.map((condition) => (
                <Card key={condition.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{condition.condition}</h4>
                          <Badge className={statusColors[condition.status as keyof typeof statusColors]}>
                            {condition.status}
                          </Badge>
                        </div>
                        {condition.diagnosedDate && (
                          <p className="text-sm text-gray-600">
                            Diagnosed: {new Date(condition.diagnosedDate).toLocaleDateString()}
                          </p>
                        )}
                        {condition.notes && (
                          <p className="text-sm text-gray-500">{condition.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingCondition(condition)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteCondition.mutate(condition.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="adverse" className="space-y-4 mt-6 h-96 overflow-y-scroll">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Reactions</h3>
            <Button onClick={() => setShowAdverseMedDialog(true)} data-testid="button-add-reaction">
              <Plus className="w-4 h-4 mr-2" />
              Add Reaction
            </Button>
          </div>

          <div className="grid gap-4">
            {!adverseMeds || adverseMeds.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  No reactions recorded. Click "Add Reaction" to get started.
                </CardContent>
              </Card>
            ) : (
              adverseMeds.map((adverseMed) => (
                <Card key={adverseMed.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{adverseMed.medicationName}</h4>
                          <Badge className={severityColors[adverseMed.severity as keyof typeof severityColors]}>
                            {adverseMed.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">Reaction: {adverseMed.reaction}</p>
                        {adverseMed.reactionDate && (
                          <p className="text-sm text-gray-600">
                            Date: {new Date(adverseMed.reactionDate).toLocaleDateString()}
                          </p>
                        )}
                        {adverseMed.notes && (
                          <p className="text-sm text-gray-500">{adverseMed.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingAdverseMed(adverseMed)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteAdverseMed.mutate(adverseMed.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4 mt-6 h-96 overflow-y-scroll">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Trusted Contacts</h3>
            <Button onClick={() => setShowContactDialog(true)} data-testid="button-add-trusted-contact">
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>

          <div className="grid gap-4">
            {!emergencyContacts || emergencyContacts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  No trusted contacts recorded. Click "Add Contact" to get started.
                </CardContent>
              </Card>
            ) : (
              emergencyContacts.map((contact) => (
                <Card key={contact.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{contact.name}</h4>
                          {contact.isPrimary && (
                            <Badge className="bg-blue-100 text-blue-800">Primary</Badge>
                          )}
                        </div>
                        {contact.relationship && (
                          <p className="text-sm text-gray-600">{contact.relationship}</p>
                        )}
                        <p className="text-sm text-gray-600">Phone: {contact.phoneNumber}</p>
                        {contact.email && (
                          <p className="text-sm text-gray-600">Email: {contact.email}</p>
                        )}
                        {contact.address && (
                          <p className="text-sm text-gray-500">{contact.address}</p>
                        )}
                        {contact.notes && (
                          <p className="text-sm text-gray-500">{contact.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingContact(contact)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteContact.mutate(contact.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4 mt-6 h-96 overflow-y-scroll">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Healthcare Contacts</h3>
            <Button onClick={() => setShowProviderDialog(true)} data-testid="button-add-healthcare-contact">
              <Plus className="w-4 h-4 mr-2" />
              Add Healthcare Contact
            </Button>
          </div>

          <div className="grid gap-4">
            {!providers || providers.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  No healthcare contacts recorded. Click "Add Healthcare Contact" to get started.
                </CardContent>
              </Card>
            ) : (
              providers.map((provider) => (
                <Card key={provider.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{provider.name}</h4>
                          {provider.isPrimary && (
                            <Badge className="bg-green-100 text-green-800">Primary</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{provider.specialty}</p>
                        {provider.practiceName && (
                          <p className="text-sm text-gray-600">{provider.practiceName}</p>
                        )}
                        <p className="text-sm text-gray-600">Phone: {provider.phoneNumber}</p>
                        {provider.email && (
                          <p className="text-sm text-gray-600">Email: {provider.email}</p>
                        )}
                        {provider.address && (
                          <p className="text-sm text-gray-500">{provider.address}</p>
                        )}
                        {provider.notes && (
                          <p className="text-sm text-gray-500">{provider.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingProvider(provider)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteProvider.mutate(provider.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="symptoms" className="space-y-4 mt-6 h-96 overflow-y-scroll">
          <SymptomTracker />
        </TabsContent>
      </Tabs>

      {/* All Custom Dialogs - Rendered Outside Tabs to avoid React portal conflicts */}
      
      {/* Condition Dialog */}
      {showConditionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowConditionDialog(false)} data-testid="dialog-backdrop-condition">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} data-testid="dialog-content-condition">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add Medical Condition</h2>
                <button
                  onClick={() => setShowConditionDialog(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  data-testid="button-close-condition-dialog"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const diagnosedDateStr = formData.get("diagnosedDate") as string;
                createCondition.mutate({
                  condition: formData.get("condition") as string,
                  status: conditionStatus,
                  diagnosedDate: diagnosedDateStr ? diagnosedDateStr : undefined,
                  notes: formData.get("notes") as string,
                });
                e.currentTarget.reset();
                setConditionStatus("");
                setShowConditionDialog(false);
              }} className="space-y-4">
                <div>
                  <Label htmlFor="condition">Condition</Label>
                  <Input name="condition" required placeholder="e.g., Diabetes, Asthma" />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select 
                    value={conditionStatus} 
                    onChange={(e) => setConditionStatus(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="diagnosedDate">Diagnosed Date</Label>
                  <Input name="diagnosedDate" type="date" />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea name="notes" placeholder="Additional information" />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createCondition.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {createCondition.isPending ? "Adding..." : "Add Condition"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowConditionDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Allergy Dialog */}
      {showAllergyDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowAllergyDialog(false)} data-testid="dialog-backdrop-allergy">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} data-testid="dialog-content-allergy">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add New Allergy</h2>
                <button
                  onClick={() => setShowAllergyDialog(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  data-testid="button-close-allergy-dialog"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createAllergy.mutate({
                  allergen: formData.get("allergen") as string,
                  severity: allergySeverity,
                  reaction: formData.get("reaction") as string,
                  notes: formData.get("notes") as string,
                });
                e.currentTarget.reset();
                setAllergySeverity("");
                setShowAllergyDialog(false);
              }} className="space-y-4">
                <div>
                  <Label htmlFor="allergen">Allergen</Label>
                  <Input name="allergen" required placeholder="e.g., Peanuts, Penicillin" />
                </div>
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <select 
                    value={allergySeverity} 
                    onChange={(e) => setAllergySeverity(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select severity</option>
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                    <option value="life-threatening">Life-threatening</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="reaction">Reaction</Label>
                  <Input name="reaction" placeholder="e.g., Hives, difficulty breathing" />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea name="notes" placeholder="Additional information" />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createAllergy.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {createAllergy.isPending ? "Adding..." : "Add Allergy"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAllergyDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Adverse Medication Dialog */}
      {showAdverseMedDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowAdverseMedDialog(false)} data-testid="dialog-backdrop-adverse">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} data-testid="dialog-content-adverse">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add Adverse Medication</h2>
                <button
                  onClick={() => setShowAdverseMedDialog(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  data-testid="button-close-adverse-dialog"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const reactionDateStr = formData.get("reactionDate") as string;
                createAdverseMed.mutate({
                  medicationName: formData.get("medicationName") as string,
                  reaction: formData.get("reaction") as string,
                  severity: adverseMedSeverity,
                  reactionDate: reactionDateStr ? reactionDateStr : undefined,
                  notes: formData.get("notes") as string,
                });
                e.currentTarget.reset();
                setAdverseMedSeverity("");
                setShowAdverseMedDialog(false);
              }} className="space-y-4">
                <div>
                  <Label htmlFor="medicationName">Medication Name</Label>
                  <Input name="medicationName" required placeholder="e.g., Amoxicillin, Aspirin" />
                </div>
                <div>
                  <Label htmlFor="reaction">Reaction</Label>
                  <Input name="reaction" required placeholder="e.g., Rash, nausea, dizziness" />
                </div>
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <select 
                    value={adverseMedSeverity} 
                    onChange={(e) => setAdverseMedSeverity(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select severity</option>
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                    <option value="life-threatening">Life-threatening</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="reactionDate">Reaction Date</Label>
                  <Input name="reactionDate" type="date" />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea name="notes" placeholder="Additional information" />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createAdverseMed.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {createAdverseMed.isPending ? "Adding..." : "Add Adverse Medication"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAdverseMedDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Contact Dialog */}
      {showContactDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowContactDialog(false)} data-testid="dialog-backdrop-contact">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} data-testid="dialog-content-contact">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add Emergency Contact</h2>
                <button
                  onClick={() => setShowContactDialog(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  data-testid="button-close-contact-dialog"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createContact.mutate({
                  name: formData.get("name") as string,
                  relationship: formData.get("relationship") as string,
                  phoneNumber: formData.get("phoneNumber") as string,
                  email: formData.get("email") as string,
                  address: formData.get("address") as string,
                  isPrimary: formData.get("isPrimary") === "on",
                  notes: formData.get("notes") as string,
                });
                e.currentTarget.reset();
                setShowContactDialog(false);
              }} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input name="name" required placeholder="Contact name" />
                </div>
                <div>
                  <Label htmlFor="relationship">Relationship</Label>
                  <Input name="relationship" placeholder="e.g., Parent, Sibling, Friend" />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input 
                    name="phoneNumber" 
                    required 
                    placeholder="Phone number" 
                    type="tel"
                    pattern="[0-9+\-\s\(\)]*"
                    onKeyPress={(e) => {
                      if (!/[0-9+\-\s\(\)]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input name="email" type="email" placeholder="Email address" />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea name="address" placeholder="Home address" />
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" name="isPrimary" className="rounded" />
                  <Label htmlFor="isPrimary">Primary contact</Label>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea name="notes" placeholder="Additional information" />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createContact.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {createContact.isPending ? "Adding..." : "Add Contact"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowContactDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Provider Dialog */}
      {showProviderDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowProviderDialog(false)} data-testid="dialog-backdrop-provider">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} data-testid="dialog-content-provider">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add Primary Care Provider</h2>
                <button
                  onClick={() => setShowProviderDialog(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  data-testid="button-close-provider-dialog"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createProvider.mutate({
                  name: formData.get("name") as string,
                  specialty: formData.get("specialty") as string,
                  practiceName: formData.get("practiceName") as string,
                  phoneNumber: formData.get("phoneNumber") as string,
                  email: formData.get("email") as string,
                  address: formData.get("address") as string,
                  isPrimary: formData.get("isPrimary") === "on",
                  notes: formData.get("notes") as string,
                });
                e.currentTarget.reset();
                setShowProviderDialog(false);
              }} className="space-y-4">
                <div>
                  <Label htmlFor="name">Provider Name</Label>
                  <Input name="name" required placeholder="Dr. Smith" />
                </div>
                <div>
                  <Label htmlFor="specialty">Specialty</Label>
                  <Input name="specialty" required placeholder="e.g., Family Medicine, Cardiology" />
                </div>
                <div>
                  <Label htmlFor="practiceName">Practice Name</Label>
                  <Input name="practiceName" placeholder="Medical center or clinic name" />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input 
                    name="phoneNumber" 
                    required 
                    placeholder="Office phone number" 
                    type="tel"
                    pattern="[0-9+\-\s\(\)]*"
                    onKeyPress={(e) => {
                      if (!/[0-9+\-\s\(\)]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input name="email" type="email" placeholder="Office email" />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea name="address" placeholder="Office address" />
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" name="isPrimary" className="rounded" />
                  <Label htmlFor="isPrimary">Primary care provider</Label>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea name="notes" placeholder="Additional information" />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createProvider.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {createProvider.isPending ? "Adding..." : "Add Provider"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowProviderDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT DIALOGS */}
      
      {/* Edit Condition Dialog */}
      {editingCondition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setEditingCondition(null)} data-testid="dialog-backdrop-edit-condition">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} data-testid="dialog-content-edit-condition">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Edit Medical Condition</h2>
                <button
                  onClick={() => setEditingCondition(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const diagnosedDateStr = formData.get("diagnosedDate") as string;
                updateCondition.mutate({
                  id: editingCondition.id,
                  condition: formData.get("condition") as string,
                  status: conditionStatus,
                  diagnosedDate: diagnosedDateStr ? diagnosedDateStr : undefined,
                  notes: formData.get("notes") as string,
                });
                e.currentTarget.reset();
                setConditionStatus("");
                setEditingCondition(null);
              }} className="space-y-4">
                <div>
                  <Label htmlFor="condition">Condition</Label>
                  <Input name="condition" required placeholder="e.g., Diabetes, Asthma" defaultValue={editingCondition.condition} />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select 
                    value={conditionStatus || editingCondition.status} 
                    onChange={(e) => setConditionStatus(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="diagnosedDate">Diagnosed Date</Label>
                  <Input name="diagnosedDate" type="date" defaultValue={editingCondition.diagnosedDate} />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea name="notes" placeholder="Additional information" defaultValue={editingCondition.notes || ""} />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={updateCondition.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {updateCondition.isPending ? "Updating..." : "Update Condition"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingCondition(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Allergy Dialog */}
      {editingAllergy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setEditingAllergy(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Edit Allergy</h2>
                <button
                  onClick={() => setEditingAllergy(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateAllergy.mutate({
                  id: editingAllergy.id,
                  allergen: formData.get("allergen") as string,
                  severity: allergySeverity || editingAllergy.severity,
                  reaction: formData.get("reaction") as string,
                  notes: formData.get("notes") as string,
                });
                e.currentTarget.reset();
                setAllergySeverity("");
                setEditingAllergy(null);
              }} className="space-y-4">
                <div>
                  <Label htmlFor="allergen">Allergen</Label>
                  <Input name="allergen" required placeholder="e.g., Peanuts, Penicillin" defaultValue={editingAllergy.allergen} />
                </div>
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <select 
                    value={allergySeverity || editingAllergy.severity} 
                    onChange={(e) => setAllergySeverity(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select severity</option>
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                    <option value="life-threatening">Life-threatening</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="reaction">Reaction</Label>
                  <Input name="reaction" placeholder="e.g., Hives, difficulty breathing" defaultValue={editingAllergy.reaction || ""} />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea name="notes" placeholder="Additional information" defaultValue={editingAllergy.notes || ""} />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={updateAllergy.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {updateAllergy.isPending ? "Updating..." : "Update Allergy"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingAllergy(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Adverse Medication Dialog */}
      {editingAdverseMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setEditingAdverseMed(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Edit Adverse Medication</h2>
                <button
                  onClick={() => setEditingAdverseMed(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const reactionDateStr = formData.get("reactionDate") as string;
                updateAdverseMed.mutate({
                  id: editingAdverseMed.id,
                  medicationName: formData.get("medicationName") as string,
                  reaction: formData.get("reaction") as string,
                  severity: adverseMedSeverity || editingAdverseMed.severity,
                  reactionDate: reactionDateStr ? reactionDateStr : undefined,
                  notes: formData.get("notes") as string,
                });
                e.currentTarget.reset();
                setAdverseMedSeverity("");
                setEditingAdverseMed(null);
              }} className="space-y-4">
                <div>
                  <Label htmlFor="medicationName">Medication Name</Label>
                  <Input name="medicationName" required placeholder="e.g., Amoxicillin, Aspirin" defaultValue={editingAdverseMed.medicationName} />
                </div>
                <div>
                  <Label htmlFor="reaction">Reaction</Label>
                  <Input name="reaction" required placeholder="e.g., Rash, nausea, dizziness" defaultValue={editingAdverseMed.reaction} />
                </div>
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <select 
                    value={adverseMedSeverity || editingAdverseMed.severity} 
                    onChange={(e) => setAdverseMedSeverity(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select severity</option>
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                    <option value="life-threatening">Life-threatening</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="reactionDate">Reaction Date</Label>
                  <Input name="reactionDate" type="date" defaultValue={editingAdverseMed.reactionDate || ""} />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea name="notes" placeholder="Additional information" defaultValue={editingAdverseMed.notes || ""} />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={updateAdverseMed.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {updateAdverseMed.isPending ? "Updating..." : "Update Adverse Medication"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingAdverseMed(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Emergency Contact Dialog */}
      {editingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setEditingContact(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Edit Emergency Contact</h2>
                <button
                  onClick={() => setEditingContact(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateContact.mutate({
                  id: editingContact.id,
                  name: formData.get("name") as string,
                  relationship: formData.get("relationship") as string,
                  phoneNumber: formData.get("phoneNumber") as string,
                  email: formData.get("email") as string,
                  address: formData.get("address") as string,
                  isPrimary: formData.get("isPrimary") === "on",
                  notes: formData.get("notes") as string,
                });
                e.currentTarget.reset();
                setEditingContact(null);
              }} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input name="name" required placeholder="Contact name" defaultValue={editingContact.name} />
                </div>
                <div>
                  <Label htmlFor="relationship">Relationship</Label>
                  <Input name="relationship" placeholder="e.g., Parent, Sibling, Friend" defaultValue={editingContact.relationship || ""} />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input 
                    name="phoneNumber" 
                    required 
                    placeholder="Phone number" 
                    defaultValue={editingContact.phoneNumber}
                    type="tel"
                    pattern="[0-9+\-\s\(\)]*"
                    onKeyPress={(e) => {
                      if (!/[0-9+\-\s\(\)]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input name="email" type="email" placeholder="Email address" defaultValue={editingContact.email || ""} />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea name="address" placeholder="Home address" defaultValue={editingContact.address || ""} />
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" name="isPrimary" className="rounded" defaultChecked={editingContact.isPrimary} />
                  <Label htmlFor="isPrimary">Primary contact</Label>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea name="notes" placeholder="Additional information" defaultValue={editingContact.notes || ""} />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={updateContact.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {updateContact.isPending ? "Updating..." : "Update Contact"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingContact(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Provider Dialog */}
      {editingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setEditingProvider(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Edit Primary Care Provider</h2>
                <button
                  onClick={() => setEditingProvider(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateProvider.mutate({
                  id: editingProvider.id,
                  name: formData.get("name") as string,
                  specialty: formData.get("specialty") as string,
                  practiceName: formData.get("practiceName") as string,
                  phoneNumber: formData.get("phoneNumber") as string,
                  email: formData.get("email") as string,
                  address: formData.get("address") as string,
                  isPrimary: formData.get("isPrimary") === "on",
                  notes: formData.get("notes") as string,
                });
                e.currentTarget.reset();
                setEditingProvider(null);
              }} className="space-y-4">
                <div>
                  <Label htmlFor="name">Provider Name</Label>
                  <Input name="name" required placeholder="Dr. Smith" defaultValue={editingProvider.name} />
                </div>
                <div>
                  <Label htmlFor="specialty">Specialty</Label>
                  <Input name="specialty" required placeholder="e.g., Family Medicine, Cardiology" defaultValue={editingProvider.specialty} />
                </div>
                <div>
                  <Label htmlFor="practiceName">Practice Name</Label>
                  <Input name="practiceName" placeholder="Medical center or clinic name" defaultValue={editingProvider.practiceName || ""} />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input 
                    name="phoneNumber" 
                    required 
                    placeholder="Office phone number" 
                    defaultValue={editingProvider.phoneNumber}
                    type="tel"
                    pattern="[0-9+\-\s\(\)]*"
                    onKeyPress={(e) => {
                      if (!/[0-9+\-\s\(\)]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input name="email" type="email" placeholder="Office email" defaultValue={editingProvider.email || ""} />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea name="address" placeholder="Office address" defaultValue={editingProvider.address || ""} />
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" name="isPrimary" className="rounded" defaultChecked={editingProvider.isPrimary} />
                  <Label htmlFor="isPrimary">Primary care provider</Label>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea name="notes" placeholder="Additional information" defaultValue={editingProvider.notes || ""} />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={updateProvider.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {updateProvider.isPending ? "Updating..." : "Update Provider"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingProvider(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}