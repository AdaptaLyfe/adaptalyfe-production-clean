import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Mail, Users, Settings, Heart, Shield, Clock, QrCode, Copy, Check, ExternalLink, Download, MessageSquare, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSafeRef } from "@/hooks/useSafeRef";
import { insertCaregiverInvitationSchema, type CaregiverInvitation, type CareRelationship } from "@shared/schema";

const caregiverSetupSchema = z.object({
  userName: z.string().min(1, "Person's name is required"),
  userEmail: z.string().optional(),
  userAge: z.number().optional(),
  relationship: z.string().min(1, "Relationship type is required"),
  permissions: z.array(z.string()).default([]),
});

type CaregiverSetupForm = z.infer<typeof caregiverSetupSchema>;

const relationshipTypes = [
  { value: "parent", label: "Parent/Guardian", icon: "👨‍👩‍👧‍👦", description: "Full access to all features and settings" },
  { value: "therapist", label: "Therapist/Counselor", icon: "🩺", description: "Access to mood, goals, and session notes" },
  { value: "case_worker", label: "Case Worker", icon: "🏢", description: "Access to appointments and resources" },
  { value: "teacher", label: "Teacher/Aide", icon: "🎓", description: "Access to academic and daily tasks" },
  { value: "mentor", label: "Life Skills Mentor", icon: "🌟", description: "Access to independence and life skills" },
  { value: "family_friend", label: "Family Friend", icon: "🤝", description: "Limited access to check-ins" },
];

const permissionTypes = [
  { id: "view_progress", label: "View Progress", description: "See completed tasks and achievements" },
  { id: "view_mood", label: "Mood Tracking", description: "Access mood entries and patterns" },
  { id: "view_medical", label: "Medical Information", description: "View medications and appointments" },
  { id: "view_financial", label: "Financial Management", description: "See bills and budget entries" },
  { id: "emergency_access", label: "Emergency Access", description: "Contact in emergencies" },
  { id: "location_tracking", label: "Location Sharing", description: "See location updates" },
  { id: "schedule_appointments", label: "Schedule Appointments", description: "Book medical/therapy appointments" },
  { id: "modify_tasks", label: "Modify Tasks", description: "Add or edit daily tasks" },
];

export default function CaregiverSetup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("create");

  const [showQrModal, setShowQrModal] = useState<string | null>(null);

  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });
  const { data: invitations = [] } = useQuery<CaregiverInvitation[]>({
    queryKey: [`/api/caregiver-invitations/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: careRelationships = [] } = useQuery<CareRelationship[]>({
    queryKey: ["/api/care-relationships/caregiver", user?.id],
    enabled: !!user?.id,
  });

  const setupForm = useForm<CaregiverSetupForm>({
    resolver: zodResolver(caregiverSetupSchema),
    defaultValues: {
      userName: "",
      userEmail: "",
      userAge: undefined,
      relationship: "",
      permissions: [],
    },
  });

  const createInvitationMutation = useMutation({
    mutationFn: (data: CaregiverSetupForm) => 
      apiRequest("POST", "/api/caregiver-invitations", {
        ...data,
        caregiverId: user?.id,
        permissionsGranted: data.permissions,
      }).then(res => res.json()),
    onSuccess: (invitation) => {
      // Invalidate both forms of the query
      queryClient.invalidateQueries({ queryKey: ["/api/caregiver-invitations"] });
      queryClient.invalidateQueries({ queryKey: [`/api/caregiver-invitations/${user?.id}`] });
      
      toast({
        title: "Invitation Created Successfully!",
        description: `Share this code with your caregiver: ${invitation.invitationCode}`,
      });
      
      setupForm.reset();
      setActiveTab("manage"); // Switch to manage tab to see the new invitation
    },
    onError: (error: any) => {
      console.error("Invitation creation error:", error);
      toast({
        title: "Unable to Create Invitation",
        description: "There was a problem saving your invitation. Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  const deleteInvitationMutation = useMutation({
    mutationFn: (invitationId: number) => 
      apiRequest("DELETE", `/api/caregiver-invitations/${invitationId}`).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/caregiver-invitations"] });
      queryClient.invalidateQueries({ queryKey: [`/api/caregiver-invitations/${user?.id}`] });
      
      toast({
        title: "Invitation Deleted",
        description: "The invitation has been removed successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Invitation deletion error:", error);
      toast({
        title: "Unable to Delete Invitation",
        description: "There was a problem deleting the invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please copy the code manually",
        variant: "destructive",
      });
    }
  };

  const showQRCodeModal = async (invitationCode: string) => {
    setShowQrModal(invitationCode);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "expired": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const handleFormSubmit = (data: CaregiverSetupForm) => {
    console.log("=== FORM SUBMISSION DEBUG ===");
    console.log("Form data:", data);
    console.log("Form errors:", setupForm.formState.errors);
    console.log("Form is valid:", setupForm.formState.isValid);
    console.log("Form values:", setupForm.getValues());
    console.log("Current permissions:", setupForm.getValues().permissions);
    
    // Validate each field manually
    const validation = caregiverSetupSchema.safeParse(data);
    console.log("Schema validation result:", validation);
    
    if (!validation.success) {
      console.log("Schema validation failed:", validation.error.issues);
      toast({
        title: "Validation Error",
        description: `Please fix: ${validation.error.issues.map(i => i.message).join(', ')}`,
        variant: "destructive"
      });
      return;
    }
    
    console.log("All validation passed, submitting...");
    createInvitationMutation.mutate(data);
  };

  const getDefaultPermissions = (relationship: string) => {
    const permissionMap: Record<string, string[]> = {
      parent: ["view_progress", "view_mood", "view_medical", "view_financial", "emergency_access", "location_tracking", "schedule_appointments", "modify_tasks"],
      therapist: ["view_progress", "view_mood", "emergency_access", "schedule_appointments"],
      case_worker: ["view_progress", "emergency_access", "schedule_appointments"],
      teacher: ["view_progress", "modify_tasks"],
      mentor: ["view_progress", "modify_tasks"],
      family_friend: ["view_progress", "emergency_access"],
    };
    return permissionMap[relationship] || [];
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
            <Users className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Caregiver Setup Center</h1>
            <p className="text-gray-600">Connect with family, therapists, and support team</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardContent className="p-4 text-center">
              <Heart className="mx-auto text-purple-600 mb-2" size={24} />
              <p className="font-medium text-purple-900">Family-Centered</p>
              <p className="text-sm text-purple-700">Designed for families and care teams</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-4 text-center">
              <Shield className="mx-auto text-blue-600 mb-2" size={24} />
              <p className="font-medium text-blue-900">Secure & Private</p>
              <p className="text-sm text-blue-700">HIPAA-compliant data protection</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <Settings className="mx-auto text-green-600 mb-2" size={24} />
              <p className="font-medium text-green-900">Customizable Access</p>
              <p className="text-sm text-green-700">Control what each caregiver sees</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-1 sm:grid-cols-3 max-w-2xl mx-auto gap-1 sm:gap-0 h-auto sm:h-10 p-1">
          <TabsTrigger value="create" className="flex items-center justify-center space-x-2 py-3 px-4 text-sm">
            <UserPlus size={16} />
            <span className="hidden sm:inline">Create Invitation</span>
            <span className="sm:hidden">Create</span>
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center justify-center space-x-2 py-3 px-4 text-sm">
            <Mail size={16} />
            <span className="hidden sm:inline">Manage Invitations</span>
            <span className="sm:hidden">Manage</span>
          </TabsTrigger>
          <TabsTrigger value="relationships" className="flex items-center justify-center space-x-2 py-3 px-4 text-sm">
            <Users size={16} />
            <span className="hidden sm:inline">Active Relationships</span>
            <span className="sm:hidden">Active</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6 mt-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="text-purple-600" size={24} />
                <span>Invite New Caregiver</span>
              </CardTitle>
              <CardDescription>
                Create a secure invitation for a family member, therapist, or support team member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...setupForm}>
                <form onSubmit={setupForm.handleSubmit(handleFormSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={setupForm.control}
                      name="userName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Person's Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Sarah Johnson" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={setupForm.control}
                      name="userEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="sarah@email.com" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={setupForm.control}
                    name="relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship Type</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            const defaultPerms = getDefaultPermissions(value);
                            setupForm.setValue("permissions", defaultPerms);
                            console.log(`Selected relationship: ${value}, setting permissions:`, defaultPerms);
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select relationship type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {relationshipTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center space-x-2">
                                  <span>{type.icon}</span>
                                  <div>
                                    <div>{type.label}</div>
                                    <div className="text-xs text-gray-500">{type.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={setupForm.control}
                    name="permissions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Access Permissions</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {permissionTypes.map((permission) => (
                            <div
                              key={permission.id}
                              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                field.value.includes(permission.id)
                                  ? "border-purple-300 bg-purple-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                              onClick={() => {
                                const current = field.value;
                                const updated = current.includes(permission.id)
                                  ? current.filter(p => p !== permission.id)
                                  : [...current, permission.id];
                                field.onChange(updated);
                              }}
                            >
                              <div className="flex items-center space-x-2">
                                <div className={`w-4 h-4 border-2 rounded ${
                                  field.value.includes(permission.id)
                                    ? "border-purple-500 bg-purple-500"
                                    : "border-gray-300"
                                }`}>
                                  {field.value.includes(permission.id) && (
                                    <Check className="text-white" size={12} />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{permission.label}</p>
                                  <p className="text-xs text-gray-600">{permission.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={createInvitationMutation.isPending}
                    onClick={() => {
                      console.log("Create Invitation button clicked");
                      console.log("Current form values:", setupForm.getValues());
                      console.log("Form errors:", setupForm.formState.errors);
                    }}
                  >
                    {createInvitationMutation.isPending ? "Creating..." : "Create Invitation"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6 mt-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Management</h2>
            <p className="text-gray-600">Track and manage caregiver invitations</p>
          </div>

          <div className="grid gap-4 max-w-4xl mx-auto">
            {invitations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Mail className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Invitations Yet</h3>
                  <p className="text-gray-600 mb-4">Create your first caregiver invitation to get started</p>
                  <Button 
                    onClick={() => setActiveTab("create")}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Create Invitation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              invitations.map((invitation) => (
                <Card key={invitation.id} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{invitation.userName}</h3>
                          <Badge className={`${getStatusColor(invitation.status)} border-none`}>
                            {invitation.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <p><strong>Relationship:</strong> {invitation.relationship}</p>
                            <p><strong>Email:</strong> {invitation.userEmail || "Not provided"}</p>
                          </div>
                          <div>
                            <p><strong>Created:</strong> {invitation.createdAt ? new Date(invitation.createdAt).toLocaleDateString() : 'N/A'}</p>
                            <p><strong>Expires:</strong> {invitation.expiresAt ? new Date(invitation.expiresAt).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <div>
                            <p><strong>Permissions:</strong> {invitation.permissionsGranted ? (Array.isArray(invitation.permissionsGranted) ? invitation.permissionsGranted.length : JSON.parse(invitation.permissionsGranted as string).length) : 0} granted</p>
                          </div>
                        </div>
                      </div>
                      
                      {invitation.status === "pending" && (
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <code className="px-3 py-1 bg-gray-100 rounded text-sm font-mono">
                              {invitation.invitationCode}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(invitation.invitationCode, "Invitation Code")}
                            >
                              {copied === "Invitation Code" ? (
                                <Check className="text-green-600" size={16} />
                              ) : (
                                <Copy size={16} />
                              )}
                            </Button>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(
                                `Join AdaptaLyfe with invitation code: ${invitation.invitationCode}\n\n` +
                                `Visit: ${window.location.origin}/accept-invitation?code=${invitation.invitationCode}`,
                                "Share Message"
                              )}
                            >
                              <ExternalLink size={14} className="mr-1" />
                              Share Link
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => showQRCodeModal(invitation.invitationCode)}
                              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                            >
                              <MessageSquare size={14} className="mr-1" />
                              Share
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete the invitation for ${invitation.userName}?`)) {
                                  deleteInvitationMutation.mutate(invitation.id);
                                }
                              }}
                              disabled={deleteInvitationMutation.isPending}
                              className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                              data-testid={`button-delete-invitation-${invitation.id}`}
                            >
                              <Trash2 size={14} className="mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="relationships" className="space-y-6 mt-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Active Care Relationships</h2>
            <p className="text-gray-600">Manage connected caregivers and their access levels</p>
          </div>

          <div className="grid gap-4 max-w-4xl mx-auto">
            {careRelationships.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Relationships</h3>
                  <p className="text-gray-600 mb-4">When caregivers accept invitations, they'll appear here</p>
                  <Button 
                    onClick={() => setActiveTab("create")}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Send First Invitation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              careRelationships.map((relationship) => (
                <Card key={relationship.id} className="border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">Care Relationship #{relationship.id}</h3>
                          {relationship.isPrimary && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-none">PRIMARY</Badge>
                          )}
                          <Badge className="bg-green-100 text-green-800 border-none">ACTIVE</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><strong>Relationship:</strong> {relationship.relationship}</p>
                            <p><strong>Established:</strong> {relationship.establishedAt ? new Date(relationship.establishedAt).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <div>
                            <p><strong>Method:</strong> {relationship.establishedVia}</p>
                            <p><strong>User ID:</strong> {relationship.userId}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Settings size={14} className="mr-1" />
                          Manage Access
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Professional Healthcare Positioning</h3>
          <p className="text-gray-600 mb-4">
            SkillBridge is designed to support individuals with neurodevelopmental disorders in building independence 
            while maintaining strong connections with their care team. Perfect for families, therapists, and healthcare providers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center justify-center space-x-2">
              <Shield className="text-blue-600" size={16} />
              <span className="text-gray-700">HIPAA Compliant</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Heart className="text-red-600" size={16} />
              <span className="text-gray-700">Evidence-Based</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Users className="text-green-600" size={16} />
              <span className="text-gray-700">Care Team Focused</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share Invitation Modal */}
      <Dialog open={!!showQrModal} onOpenChange={() => setShowQrModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Share Invitation with Caregiver</DialogTitle>
            <DialogDescription className="text-center">
              Send your caregiver a simple message with the invitation code
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {showQrModal && (
              <>
                <div className="bg-blue-50 p-4 rounded-lg border">
                  <p className="font-medium text-gray-900 mb-2">Invitation Code: <code className="bg-white px-2 py-1 rounded border">{showQrModal}</code></p>
                  <p className="text-sm text-gray-600">
                    Your caregiver can use this code when they sign in at the main login page.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                    onClick={() => {
                      const invitation = invitations?.find((inv: any) => inv.invitationCode === showQrModal);
                      const caregiverName = invitation?.userName || "my caregiver";
                      // Create app deep link that will open in mobile app if installed
                      const appLink = `adaptalyfe://login?code=${showQrModal}`;
                      const webLink = `${window.location.origin}/login?code=${showQrModal}`;
                      const message = `Hi ${caregiverName}! I'd like you to join my Adaptalyfe support network.\n\nIf you have the Adaptalyfe app installed:\n${appLink}\n\nOtherwise, use this web link:\n${webLink}\n\nInvitation code: ${showQrModal}`;
                      window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank');
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Text Message
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold"
                    onClick={() => {
                      const invitation = invitations?.find((inv: any) => inv.invitationCode === showQrModal);
                      const caregiverName = invitation?.userName || "my caregiver";
                      const subject = "Adaptalyfe Caregiver Invitation";
                      // Create both app deep link and web fallback
                      const appLink = `adaptalyfe://login?code=${showQrModal}`;
                      const webLink = `${window.location.origin}/login?code=${showQrModal}`;
                      const body = `Hi ${caregiverName}!\n\nI'd like you to join my support network on Adaptalyfe, an app that helps me manage daily tasks and stay independent.\n\nTo join:\n\nIf you have the Adaptalyfe mobile app installed:\n${appLink}\n\nOtherwise, use this web link:\n${webLink}\n\nYour invitation code is: ${showQrModal}\n\nThanks!`;
                      window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full text-gray-600 hover:bg-gray-50"
                    onClick={() => {
                      const invitationText = `Invitation Code: ${showQrModal}\nLogin at: ${window.location.origin}/login`;
                      navigator.clipboard.writeText(invitationText);
                      toast({
                        title: "Copied!",
                        description: "Invitation details copied to clipboard"
                      });
                      setCopied("invitation");
                      setTimeout(() => setCopied(null), 2000);
                    }}
                  >
                    {copied === "invitation" ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    Copy Invitation Details
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}