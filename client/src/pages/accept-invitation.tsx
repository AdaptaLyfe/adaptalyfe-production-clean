import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserCheck, AlertTriangle, Clock, Shield, Heart, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { type CaregiverInvitation } from "@shared/schema";

const acceptInvitationSchema = z.object({
  invitationCode: z.string().min(6, "Invitation code must be at least 6 characters"),
  confirmAccept: z.boolean().default(false),
});

type AcceptInvitationForm = z.infer<typeof acceptInvitationSchema>;

export default function AcceptInvitation() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [invitation, setInvitation] = useState<CaregiverInvitation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      console.log("AcceptInvitation: Mobile detected:", mobile);
    };
    checkMobile();
  }, []);

  const { data: user, isLoading: isLoadingUser } = useQuery({ 
    queryKey: ["/api/user"],
    retry: isMobile ? 3 : 1, // More retries on mobile
    retryDelay: isMobile ? 1000 : 500 // Longer delay on mobile
  });

  // Show loading state while checking authentication
  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  const form = useForm<AcceptInvitationForm>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      invitationCode: "",
      confirmAccept: false,
    },
  });

  // Check URL for invitation code
  useEffect(() => {
    try {
      console.log("AcceptInvitation: Checking URL for invitation code");
      const params = new URLSearchParams(window.location.search);
      const codeFromUrl = params.get("code");
      console.log("AcceptInvitation: Code from URL:", codeFromUrl);
      if (codeFromUrl) {
        form.setValue("invitationCode", codeFromUrl);
        validateInvitation(codeFromUrl);
      }
    } catch (error) {
      console.error("AcceptInvitation: Error parsing URL:", error);
    }
  }, []);

  const validateInvitation = async (code: string) => {
    if (!code || code.length < 6) return;
    
    console.log("AcceptInvitation: Validating invitation code:", code);
    setIsValidating(true);
    setValidationError(null);
    
    try {
      const response = await apiRequest("GET", `/api/invitation/${code}`);
      const invitationData = await response.json();
      console.log("AcceptInvitation: Invitation data received:", invitationData);
      setInvitation(invitationData);
    } catch (error: any) {
      console.error("AcceptInvitation: Validation error:", error);
      const errorMessage = error.message.includes("404") 
        ? "Invitation code not found"
        : error.message.includes("410")
        ? "This invitation has expired"
        : "Invalid invitation code";
      setValidationError(errorMessage);
      setInvitation(null);
    } finally {
      setIsValidating(false);
    }
  };

  const acceptInvitationMutation = useMutation({
    mutationFn: (data: { invitationCode: string; userId: number }) =>
      apiRequest("POST", "/api/accept-invitation", data).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Invitation Accepted!",
        description: "You're now connected with your caregiver. Welcome to Adaptalyfe!",
      });
      setTimeout(() => {
        setLocation("/dashboard");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to accept invitation: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleCodeChange = (code: string) => {
    form.setValue("invitationCode", code);
    if (code.length >= 6) {
      validateInvitation(code);
    } else {
      setInvitation(null);
      setValidationError(null);
    }
  };

  const handleAcceptInvitation = () => {
    if (!user || !invitation || typeof user !== 'object' || !('id' in user)) return;
    
    acceptInvitationMutation.mutate({
      invitationCode: invitation.invitationCode,
      userId: (user as any).id,
    });
  };

  const getPermissionDescription = (permissions: string[]) => {
    const permissionMap: Record<string, string> = {
      view_progress: "View your daily tasks and achievements",
      view_mood: "See your mood tracking entries",
      view_medical: "Access medical information and appointments",
      view_financial: "View bills and budget information",
      emergency_access: "Contact you in emergencies",
      location_tracking: "See your location updates",
      schedule_appointments: "Book appointments for you",
      modify_tasks: "Add or edit your daily tasks",
    };

    return permissions.map(p => permissionMap[p] || p);
  };

  const relationshipIcons: Record<string, string> = {
    parent: "👨‍👩‍👧‍👦",
    therapist: "🩺",
    case_worker: "🏢",
    teacher: "🎓",
    mentor: "🌟",
    family_friend: "🤝",
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 flex items-center justify-center ${isMobile ? 'p-2' : 'p-4'}`}>
      <div className={`${isMobile ? 'max-w-sm' : 'max-w-2xl'} w-full space-y-8`}>
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
              <UserCheck className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Join Your Care Team</h1>
              <p className="text-gray-600">Accept invitation to Adaptalyfe</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="text-center">
              <Heart className="mx-auto text-red-500 mb-2" size={20} />
              <p className="text-sm text-gray-700">Support Network</p>
            </div>
            <div className="text-center">
              <Shield className="mx-auto text-blue-500 mb-2" size={20} />
              <p className="text-sm text-gray-700">Secure & Private</p>
            </div>
            <div className="text-center">
              <Users className="mx-auto text-green-500 mb-2" size={20} />
              <p className="text-sm text-gray-700">Care Team</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Card className="border-2 border-purple-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <UserCheck className="text-purple-600" size={24} />
              <span>Caregiver Invitation</span>
            </CardTitle>
            <CardDescription>
              Enter your invitation code to connect with your caregiver
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="invitationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invitation Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter 6-character code"
                          className="text-center text-lg font-mono tracking-wider"
                          onChange={(e) => {
                            field.onChange(e);
                            handleCodeChange(e.target.value.toUpperCase());
                          }}
                          value={field.value.toUpperCase()}
                          maxLength={8}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isValidating && (
                  <div className="flex items-center justify-center space-x-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Validating invitation...</span>
                  </div>
                )}

                {validationError && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="text-red-600" size={16} />
                    <AlertDescription className="text-red-800">
                      {validationError}
                    </AlertDescription>
                  </Alert>
                )}

                {invitation && (
                  <div className="space-y-4">
                    <Alert className="border-green-200 bg-green-50">
                      <UserCheck className="text-green-600" size={16} />
                      <AlertDescription className="text-green-800">
                        Valid invitation found! Review the details below.
                      </AlertDescription>
                    </Alert>

                    <Card className="border-purple-200 bg-purple-50">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="text-3xl">
                            {relationshipIcons[invitation.relationship] || "👤"}
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {invitation.userName}
                            </h3>
                            <p className="text-sm text-gray-600 capitalize">
                              {invitation.relationship.replace("_", " ")}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">
                              <strong>Invitation expires:</strong>
                            </p>
                            <div className="flex items-center space-x-1 text-orange-600">
                              <Clock size={14} />
                              <span>{new Date(invitation.expiresAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600">
                              <strong>Status:</strong>
                            </p>
                            <Badge className="bg-yellow-100 text-yellow-800 border-none">
                              {invitation.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>

                        {invitation.permissionsGranted && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              This caregiver will have access to:
                            </p>
                            <div className="space-y-1">
                              {(() => {
                                try {
                                  const permissions = typeof invitation.permissionsGranted === 'string' 
                                    ? JSON.parse(invitation.permissionsGranted)
                                    : invitation.permissionsGranted;
                                  return Array.isArray(permissions) ? getPermissionDescription(permissions).map((permission, index) => (
                                    <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                                      <div className="w-1 h-1 bg-purple-500 rounded-full"></div>
                                      <span>{String(permission)}</span>
                                    </div>
                                  )) : <span className="text-sm text-gray-500">No permissions specified</span>;
                                } catch (error) {
                                  console.error("Error parsing permissions:", error);
                                  return <span className="text-sm text-gray-500">Permissions information not available</span>;
                                }
                              })()}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <div className="text-center space-y-4">
                      <p className="text-sm text-gray-600">
                        By accepting this invitation, you agree to share the specified information 
                        with your caregiver to support your independence journey.
                      </p>
                      
                      <Button
                        onClick={handleAcceptInvitation}
                        disabled={acceptInvitationMutation.isPending || !user || typeof user !== 'object' || !('id' in user)}
                        className="w-full bg-vibrant-green hover:bg-green-600 text-black font-bold border-2 border-green-700 shadow-lg text-lg py-3"
                      >
                        {acceptInvitationMutation.isPending 
                          ? "Accepting Invitation..." 
                          : "Accept Invitation & Join Care Team"
                        }
                      </Button>

                      {!user && (
                        <div className="space-y-4">
                          <Alert className="border-blue-200 bg-blue-50">
                            <AlertTriangle className="text-blue-600" size={16} />
                            <AlertDescription className="text-blue-800">
                              Please log in or create an account first to accept this invitation.
                            </AlertDescription>
                          </Alert>
                          
                          <div className="flex flex-col space-y-2">
                            <Button
                              onClick={() => {
                                // Store invitation code for after login
                                if (invitation) {
                                  localStorage.setItem('pendingInvitation', invitation.invitationCode);
                                }
                                setLocation('/sign-in');
                              }}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Sign In to Continue
                            </Button>
                            
                            <Button
                              onClick={() => {
                                // Store invitation code for after signup
                                if (invitation) {
                                  localStorage.setItem('pendingInvitation', invitation.invitationCode);
                                }
                                setLocation('/register');
                              }}
                              variant="outline"
                              className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                            >
                              Create New Account
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Form>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <h3 className="font-medium text-gray-900 mb-2">Welcome to Adaptalyfe</h3>
            <p className="text-sm text-gray-600">
              Your bridge to independence with support from those who care about you most.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}