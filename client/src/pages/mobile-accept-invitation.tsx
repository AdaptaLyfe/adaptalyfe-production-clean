import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserCheck, AlertTriangle, Clock, Shield, Heart, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { type CaregiverInvitation } from "@shared/schema";

export default function MobileAcceptInvitation() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [invitation, setInvitation] = useState<CaregiverInvitation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  console.log("MobileAcceptInvitation: Component loaded");

  const { data: user, isLoading: isLoadingUser } = useQuery({ 
    queryKey: ["/api/user"],
    retry: 3,
    retryDelay: 1000
  });

  // Check URL for invitation code
  useEffect(() => {
    try {
      console.log("MobileAcceptInvitation: Checking URL for invitation code");
      const params = new URLSearchParams(window.location.search);
      const codeFromUrl = params.get("code");
      console.log("MobileAcceptInvitation: Code from URL:", codeFromUrl);
      if (codeFromUrl) {
        validateInvitation(codeFromUrl);
      }
    } catch (error) {
      console.error("MobileAcceptInvitation: Error parsing URL:", error);
    }
  }, []);

  const validateInvitation = async (code: string) => {
    if (!code || code.length < 6) return;
    
    console.log("MobileAcceptInvitation: Validating invitation code:", code);
    setIsValidating(true);
    setValidationError(null);
    
    try {
      const response = await apiRequest("GET", `/api/invitation/${code}`);
      const invitationData = await response.json();
      console.log("MobileAcceptInvitation: Invitation data received:", invitationData);
      setInvitation(invitationData);
    } catch (error: any) {
      console.error("MobileAcceptInvitation: Validation error:", error);
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
        description: "You're now connected with your caregiver. Welcome to SkillBridge!",
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

  const handleAcceptInvitation = () => {
    if (!user || !invitation || typeof user !== 'object' || !('id' in user)) return;
    
    acceptInvitationMutation.mutate({
      invitationCode: invitation.invitationCode,
      userId: (user as any).id,
    });
  };

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

  const relationshipIcons: Record<string, string> = {
    parent: "👨‍👩‍👧‍👦",
    therapist: "🩺",
    case_worker: "🏢",
    teacher: "🎓",
    mentor: "🌟",
    family_friend: "🤝",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-2">
      <div className="max-w-sm w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
              <UserCheck className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Join Your Care Team</h1>
              <p className="text-sm text-gray-600">Accept invitation to SkillBridge</p>
            </div>
          </div>
          
          <div className="flex justify-center space-x-6">
            <div className="text-center">
              <Heart className="mx-auto text-red-500 mb-1" size={16} />
              <p className="text-xs text-gray-700">Support</p>
            </div>
            <div className="text-center">
              <Shield className="mx-auto text-blue-500 mb-1" size={16} />
              <p className="text-xs text-gray-700">Secure</p>
            </div>
            <div className="text-center">
              <Users className="mx-auto text-green-500 mb-1" size={16} />
              <p className="text-xs text-gray-700">Care Team</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Card className="border-2 border-purple-200 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center space-x-2 text-lg">
              <UserCheck className="text-purple-600" size={20} />
              <span>Caregiver Invitation</span>
            </CardTitle>
            <CardDescription className="text-sm">
              Connect with your caregiver
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isValidating && (
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Validating invitation...</span>
              </div>
            )}

            {validationError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="text-red-600" size={16} />
                <AlertDescription className="text-red-800 text-sm">
                  {validationError}
                </AlertDescription>
              </Alert>
            )}

            {invitation && (
              <div className="space-y-4">
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="text-2xl">
                        {relationshipIcons[invitation.relationship] || "👤"}
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-gray-900">
                          {invitation.userName}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {invitation.relationship.replace("_", " ")}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-gray-600">
                          <strong>Expires:</strong> {new Date(invitation.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="text-center space-y-4">
                  <p className="text-xs text-gray-600">
                    By accepting this invitation, you agree to share information 
                    with your caregiver to support your independence journey.
                  </p>
                  
                  <Button
                    onClick={handleAcceptInvitation}
                    disabled={acceptInvitationMutation.isPending || !user || typeof user !== 'object' || !('id' in user)}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3"
                  >
                    {acceptInvitationMutation.isPending 
                      ? "Accepting..." 
                      : "Accept Invitation"
                    }
                  </Button>

                  {!user && (
                    <div className="space-y-3">
                      <Alert className="border-blue-200 bg-blue-50">
                        <AlertTriangle className="text-blue-600" size={16} />
                        <AlertDescription className="text-blue-800 text-sm">
                          Please log in or create an account first.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-2">
                        <Button
                          onClick={() => {
                            if (invitation) {
                              localStorage.setItem('pendingInvitation', invitation.invitationCode);
                            }
                            setLocation('/login');
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Sign In to Continue
                        </Button>
                        
                        <Button
                          onClick={() => {
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

            {!invitation && !isValidating && !validationError && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">Loading invitation details...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-3 text-center">
            <h3 className="font-medium text-gray-900 mb-1 text-sm">Welcome to SkillBridge</h3>
            <p className="text-xs text-gray-600">
              Your bridge to independence with support from those who care about you most.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}