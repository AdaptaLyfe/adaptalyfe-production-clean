import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Building2, RefreshCw, MapPin, Phone, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PharmacyModule() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user pharmacies
  const { data: userPharmacies = [] } = useQuery({
    queryKey: ['/api/user-pharmacies'],
    enabled: true
  });

  // Fetch available pharmacies
  const { data: pharmacies = [] } = useQuery({
    queryKey: ['/api/pharmacies'],
    enabled: true
  });

  // Add pharmacy mutation
  const addPharmacyMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = Object.fromEntries(data);
      return apiRequest('POST', '/api/user-pharmacies', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-pharmacies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacies'] });
      setShowAddDialog(false);
      toast({ title: "Pharmacy added successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to add pharmacy", variant: "destructive" });
    }
  });

  // Create custom pharmacy mutation
  const createCustomPharmacyMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = Object.fromEntries(data);
      return apiRequest('POST', '/api/pharmacies', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacies'] });
      setShowCustomDialog(false);
      toast({ title: "Custom pharmacy created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create custom pharmacy", variant: "destructive" });
    }
  });

  const handleAddPharmacy = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addPharmacyMutation.mutate(formData);
  };

  const handleCreateCustomPharmacy = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createCustomPharmacyMutation.mutate(formData);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <Tabs defaultValue="linked">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="linked">My Pharmacies</TabsTrigger>
            <TabsTrigger value="directory">Pharmacy Directory</TabsTrigger>
          </TabsList>

          <TabsContent value="linked">
            <div className="mb-4 flex gap-2">
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Link Existing Pharmacy
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Link Existing Pharmacy</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddPharmacy} className="space-y-4">
                    <div>
                      <Label htmlFor="pharmacyId">Select Pharmacy</Label>
                      <Select name="pharmacyId" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a pharmacy" />
                        </SelectTrigger>
                        <SelectContent>
                          {pharmacies.map((pharmacy: any) => (
                            <SelectItem key={pharmacy.id} value={pharmacy.id.toString()}>
                              {pharmacy.name}
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
                      <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                      <Input name="insuranceProvider" placeholder="e.g., Blue Cross, Medicare" />
                    </div>
                    <Button type="submit" className="w-full" disabled={addPharmacyMutation.isPending}>
                      {addPharmacyMutation.isPending ? "Adding..." : "Link Pharmacy"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Building2 className="w-4 h-4 mr-2" />
                    Create Custom Pharmacy
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Custom Pharmacy</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateCustomPharmacy} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Pharmacy Name</Label>
                      <Input name="name" placeholder="Enter pharmacy name" required />
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input name="address" placeholder="Street address, city, state" />
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
                      <Input name="refillUrl" placeholder="Direct link to refill page" />
                    </div>
                    <div>
                      <Label htmlFor="hours">Operating Hours</Label>
                      <Input name="hours" placeholder="e.g., Mon-Fri 9AM-9PM, Sat 9AM-6PM" />
                    </div>
                    <Button type="submit" className="w-full" disabled={createCustomPharmacyMutation.isPending}>
                      {createCustomPharmacyMutation.isPending ? "Creating..." : "Create Custom Pharmacy"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {userPharmacies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No pharmacies linked yet</p>
                  <p className="text-sm">Add a pharmacy to start ordering refills</p>
                </div>
              ) : (
                userPharmacies.map((userPharmacy: any) => (
                  <Card key={userPharmacy.id}>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">{userPharmacy.pharmacy?.name}</h4>
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
                        <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
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

          <TabsContent value="directory">
            <div className="space-y-3">
              {pharmacies.map((pharmacy: any) => (
                <Card key={pharmacy.id}>
                  <CardContent className="pt-4">
                    <h4 className="font-medium">{pharmacy.name}</h4>
                    {pharmacy.address && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <MapPin className="w-3 h-3" />
                        {pharmacy.address}
                      </div>
                    )}
                    {pharmacy.phoneNumber && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <Phone className="w-3 h-3" />
                        {pharmacy.phoneNumber}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}