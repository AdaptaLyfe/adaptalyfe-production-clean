import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Phone, UserPlus, Shield, Heart, AlertTriangle, Star, Edit, Trash2 } from "lucide-react";

interface EmergencyContact {
  id: number;
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  isPrimary: boolean;
  isEmergencyContact: boolean;
  notes?: string;
}

export default function EmergencyContacts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    relationship: "",
    phoneNumber: "",
    email: "",
    isPrimary: false,
    isEmergencyContact: true,
    notes: ""
  });

  // Fetch emergency contacts
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["/api/emergency-contacts"],
    queryFn: () => apiRequest("GET", "/api/emergency-contacts").then(res => res.json())
  });

  // Add/Update contact mutation
  const saveMutation = useMutation({
    mutationFn: async (contactData: any) => {
      const method = editingContact ? "PUT" : "POST";
      const url = editingContact ? `/api/emergency-contacts/${editingContact.id}` : "/api/emergency-contacts";
      return apiRequest(method, url, contactData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-contacts"] });
      setIsDialogOpen(false);
      setEditingContact(null);
      resetForm();
      toast({
        title: "Success",
        description: editingContact ? "Contact updated successfully" : "Emergency contact added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save contact. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete contact mutation
  const deleteMutation = useMutation({
    mutationFn: async (contactId: number) => {
      return apiRequest("DELETE", `/api/emergency-contacts/${contactId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-contacts"] });
      toast({
        title: "Success",
        description: "Emergency contact deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete contact. Please try again.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      relationship: "",
      phoneNumber: "",
      email: "",
      isPrimary: false,
      isEmergencyContact: true,
      notes: ""
    });
  };

  const handleEdit = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      relationship: contact.relationship,
      phoneNumber: contact.phoneNumber,
      email: contact.email || "",
      isPrimary: contact.isPrimary,
      isEmergencyContact: contact.isEmergencyContact,
      notes: contact.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleCall = (phoneNumber: string, name: string) => {
    // In a real app, this would integrate with device calling
    // For web, we can open the tel: link
    window.location.href = `tel:${phoneNumber}`;
    toast({
      title: "Calling...",
      description: `Calling ${name} at ${phoneNumber}`,
    });
  };

  const getRelationshipIcon = (relationship: string) => {
    switch (relationship?.toLowerCase()) {
      case "parent":
      case "guardian":
        return <Heart className="w-4 h-4 text-red-500" />;
      case "sibling":
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case "doctor":
      case "therapist":
        return <Shield className="w-4 h-4 text-green-500" />;
      case "crisis_hotline":
      case "emergency":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Phone className="w-4 h-4 text-gray-500" />;
    }
  };

  const primaryContacts = contacts.filter((c: EmergencyContact) => c.isPrimary);
  const emergencyContacts = contacts.filter((c: EmergencyContact) => c.isEmergencyContact && !c.isPrimary);
  const otherContacts = contacts.filter((c: EmergencyContact) => !c.isEmergencyContact && !c.isPrimary);

  return (
    <div className="space-y-6">
      {/* Emergency Quick Dial */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-red-800 text-lg">
              <AlertTriangle className="w-4 h-4" />
              Emergency Quick Dial
            </CardTitle>
            <Badge variant="destructive" className="text-xs">Emergency</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {emergencyContacts.length > 0 ? (
            <div className="grid gap-2 md:grid-cols-2">
              {emergencyContacts.slice(0, 4).map((contact: EmergencyContact) => (
                <Button
                  key={contact.id}
                  onClick={() => handleCall(contact.phoneNumber, contact.name)}
                  className="h-12 bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <div className="text-left">
                      <div className="font-medium text-sm">{contact.name}</div>
                      <div className="text-xs opacity-90">{contact.phoneNumber}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-700 mb-4">No emergency contacts set up yet</p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Emergency Contact
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Emergency Contact</DialogTitle>
                    <DialogDescription>
                      Add a contact for emergency situations
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="relationship">Relationship *</Label>
                      <Select
                        value={formData.relationship}
                        onValueChange={(value) => setFormData({ ...formData, relationship: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="guardian">Guardian</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="caregiver">Caregiver</SelectItem>
                          <SelectItem value="doctor">Doctor</SelectItem>
                          <SelectItem value="therapist">Therapist</SelectItem>
                          <SelectItem value="crisis_hotline">Crisis Hotline</SelectItem>
                          <SelectItem value="friend">Friend</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber">Phone Number *</Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Special instructions or notes"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? "Saving..." : "Save Contact"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Primary Contacts */}
      {primaryContacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Primary Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {primaryContacts.map((contact: EmergencyContact) => (
                <div key={contact.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getRelationshipIcon(contact.relationship)}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">{contact.name}</h3>
                      <p className="text-sm text-gray-600 truncate">
                        {contact.relationship} • {contact.phoneNumber}
                      </p>
                      {contact.notes && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{contact.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      onClick={() => handleCall(contact.phoneNumber, contact.name)}
                      className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none min-h-[44px] sm:min-h-0"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(contact)}
                      className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(contact.id)}
                      disabled={deleteMutation.isPending}
                      className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Contacts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              All Contacts
            </CardTitle>
            <Dialog 
              open={isDialogOpen} 
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setEditingContact(null);
                  resetForm();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingContact ? "Edit Contact" : "Add Contact"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingContact ? "Update contact information" : "Add a new emergency contact"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="relationship">Relationship *</Label>
                    <Select
                      value={formData.relationship}
                      onValueChange={(value) => setFormData({ ...formData, relationship: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="guardian">Guardian</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="caregiver">Caregiver</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="therapist">Therapist</SelectItem>
                        <SelectItem value="crisis_hotline">Crisis Hotline</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPrimary"
                      checked={formData.isPrimary}
                      onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                    />
                    <Label htmlFor="isPrimary">Primary contact</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isEmergencyContact"
                      checked={formData.isEmergencyContact}
                      onChange={(e) => setFormData({ ...formData, isEmergencyContact: e.target.checked })}
                    />
                    <Label htmlFor="isEmergencyContact">Emergency contact</Label>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Special instructions or notes"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={saveMutation.isPending}
                      className="border-2 border-blue-500 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                    >
                      {saveMutation.isPending ? "Saving..." : editingContact ? "Update" : "Save Contact"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {contacts.length > 0 ? (
            <div className="space-y-3">
              {contacts.map((contact: EmergencyContact) => (
                <div key={contact.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getRelationshipIcon(contact.relationship)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{contact.name}</h3>
                        {contact.isPrimary && <Badge variant="secondary">Primary</Badge>}
                        {contact.isEmergencyContact && <Badge variant="destructive">Emergency</Badge>}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {contact.relationship} • {contact.phoneNumber}
                      </p>
                      {contact.email && (
                        <p className="text-sm text-gray-500 truncate">{contact.email}</p>
                      )}
                      {contact.notes && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{contact.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      onClick={() => handleCall(contact.phoneNumber, contact.name)}
                      className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none min-h-[44px] sm:min-h-0"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(contact)}
                      className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(contact.id)}
                      disabled={deleteMutation.isPending}
                      className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No contacts added yet</p>
              <p className="text-sm text-gray-500">Add emergency contacts for quick access during urgent situations</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}