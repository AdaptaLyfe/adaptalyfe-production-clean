import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertEmergencyResourceSchema, type EmergencyResource, type InsertEmergencyResource } from "@shared/schema";
import { 
  Shield, 
  Phone, 
  MapPin, 
  Globe, 
  Clock, 
  Plus, 
  Edit, 
  Trash2,
  Heart,
  Hospital,
  Users,
  HeadphonesIcon,
  AlertTriangle
} from "lucide-react";

export default function EmergencyResourcesModule() {
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<EmergencyResource | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: resources = [], isLoading } = useQuery<EmergencyResource[]>({
    queryKey: ["/api/emergency-resources"],
  });

  const form = useForm<InsertEmergencyResource>({
    resolver: zodResolver(insertEmergencyResourceSchema),
    defaultValues: {
      name: "",
      type: "crisis",
      phoneNumber: "",
      address: "",
      website: "",
      description: "",
      availabilityHours: "",
      isEmergencyOnly: false,
      caregiverId: 1, // This would come from the caregiver's session
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertEmergencyResource) => {
      return await apiRequest("POST", "/api/emergency-resources", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-resources"] });
      toast({
        title: "Success",
        description: "Emergency resource added successfully",
      });
      form.reset();
      setShowForm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add emergency resource",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertEmergencyResource> }) => {
      return await apiRequest("PUT", `/api/emergency-resources/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-resources"] });
      toast({
        title: "Success",
        description: "Emergency resource updated successfully",
      });
      setEditingResource(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update emergency resource",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/emergency-resources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-resources"] });
      toast({
        title: "Success",
        description: "Emergency resource deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete emergency resource",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InsertEmergencyResource) => {
    if (editingResource) {
      updateMutation.mutate({ id: editingResource.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const startEdit = (resource: EmergencyResource) => {
    setEditingResource(resource);
    setShowForm(true);
    form.reset({
      name: resource.name,
      type: resource.type,
      phoneNumber: resource.phoneNumber || "",
      address: resource.address || "",
      website: resource.website || "",
      description: resource.description || "",
      availabilityHours: resource.availabilityHours || "",
      isEmergencyOnly: resource.isEmergencyOnly || false,
      caregiverId: resource.caregiverId,
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "crisis": return <AlertTriangle className="w-4 h-4" />;
      case "counselor": return <Heart className="w-4 h-4" />;
      case "hospital": return <Hospital className="w-4 h-4" />;
      case "mental_health": return <HeadphonesIcon className="w-4 h-4" />;
      case "support_group": return <Users className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "crisis": return "bg-red-100 text-red-800";
      case "counselor": return "bg-blue-100 text-blue-800";
      case "hospital": return "bg-purple-100 text-purple-800";
      case "mental_health": return "bg-green-100 text-green-800";
      case "support_group": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading emergency resources...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            Local Emergency Resources
          </CardTitle>
          <Button
            onClick={() => {
              setEditingResource(null);
              form.reset();
              setShowForm(!showForm);
            }}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Resource
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {showForm && (
          <Card className="border-2 border-blue-200">
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resource Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Crisis Hotline, Local Counselor, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select resource type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="crisis">Crisis Hotline</SelectItem>
                              <SelectItem value="counselor">Personal Counselor</SelectItem>
                              <SelectItem value="hospital">Hospital/ER</SelectItem>
                              <SelectItem value="mental_health">Mental Health Center</SelectItem>
                              <SelectItem value="support_group">Support Group</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="availabilityHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Availability</FormLabel>
                          <FormControl>
                            <Input placeholder="24/7, Mon-Fri 9-5, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Full address or general location" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Special notes, services offered, when to use this resource..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isEmergencyOnly"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Emergency Only</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Only use this resource during emergencies
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingResource ? "Update Resource" : "Add Resource"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowForm(false);
                        setEditingResource(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {resources.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No emergency resources added yet.</p>
            <p className="text-sm mt-2">Caregivers can add local crisis support and counseling resources.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {resources.map((resource) => (
              <Card key={resource.id} className="border-l-4 border-l-red-500">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeIcon(resource.type)}
                        <h3 className="font-semibold text-lg">{resource.name}</h3>
                        <Badge className={getTypeColor(resource.type)}>
                          {resource.type.replace("_", " ")}
                        </Badge>
                        {resource.isEmergencyOnly && (
                          <Badge variant="destructive" className="text-xs">
                            Emergency Only
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        {resource.phoneNumber && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <a 
                              href={`tel:${resource.phoneNumber}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {resource.phoneNumber}
                            </a>
                          </div>
                        )}

                        {resource.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{resource.address}</span>
                          </div>
                        )}

                        {resource.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            <a 
                              href={resource.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Visit Website
                            </a>
                          </div>
                        )}

                        {resource.availabilityHours && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{resource.availabilityHours}</span>
                          </div>
                        )}

                        {resource.description && (
                          <p className="mt-2 text-gray-700">{resource.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        onClick={() => startEdit(resource)}
                        variant="ghost"
                        size="sm"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => deleteMutation.mutate(resource.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">For Caregivers</h4>
          <p className="text-sm text-blue-800">
            Add local emergency resources, crisis hotlines, personal counselors, and support groups 
            that are specific to your area. This helps ensure your loved one has quick access to 
            appropriate help when needed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}