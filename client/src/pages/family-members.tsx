import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useSubscription } from "@/hooks/useSubscription";
import { useLocation } from "wouter";
import {
  Users, UserPlus, Mail, Trash2, Crown, CheckCircle,
  Clock, ShieldCheck, ArrowLeft, Lock
} from "lucide-react";

const RELATIONSHIPS = [
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "spouse", label: "Spouse / Partner" },
  { value: "caregiver", label: "Caregiver" },
  { value: "guardian", label: "Guardian" },
  { value: "therapist", label: "Therapist" },
  { value: "other", label: "Other" },
];

export default function FamilyMembersPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isFamily, tier } = useSubscription();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [memberName, setMemberName] = useState("");
  const [relationship, setRelationship] = useState("member");

  const { data: members = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/family-members"],
    enabled: isFamily,
  });

  const inviteMutation = useMutation({
    mutationFn: (data: { inviteEmail: string; memberName: string; relationship: string }) =>
      apiRequest("POST", "/api/family-members/invite", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family-members"] });
      setInviteOpen(false);
      setInviteEmail("");
      setMemberName("");
      setRelationship("member");
      toast({ title: "Invite sent!", description: "The family member has been added." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to invite member", variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: number) => apiRequest("DELETE", `/api/family-members/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family-members"] });
      toast({ title: "Removed", description: "Family member removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove member", variant: "destructive" });
    },
  });

  const handleInvite = () => {
    if (!inviteEmail.trim() || !memberName.trim()) {
      toast({ title: "Missing info", description: "Please fill in name and email.", variant: "destructive" });
      return;
    }
    inviteMutation.mutate({ inviteEmail: inviteEmail.trim(), memberName: memberName.trim(), relationship });
  };

  if (!isFamily) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-10 pb-10 space-y-5">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Family Plan Required</h2>
              <p className="text-gray-500 text-sm">
                Adding family members is exclusive to the Family plan ($24.99/month). Upgrade to manage up to 5 additional member accounts.
              </p>
            </div>
            <div className="space-y-2 text-left bg-purple-50 rounded-lg p-4 text-sm text-purple-800">
              <p className="font-semibold">Family plan includes:</p>
              <p>✓ Up to 5 additional member accounts</p>
              <p>✓ Unlimited caregiver connections</p>
              <p>✓ Family dashboard & shared progress</p>
              <p>✓ Emergency protocols & location safety</p>
              <p>✓ Custom reporting</p>
              <p>✓ Phone support</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setLocation("/")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button
                className="bg-gradient-to-r from-purple-500 to-blue-600 text-white"
                onClick={() => setLocation("/subscription")}
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Family
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Family Members</h1>
          <p className="text-sm text-gray-500">Manage your family plan accounts</p>
        </div>
        <Badge className="ml-auto bg-purple-100 text-purple-700 border-purple-200">
          <Crown className="w-3 h-3 mr-1" />
          Family Plan
        </Badge>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-5">

        {/* Usage bar */}
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-800">Members used</span>
              <span className="text-sm font-bold text-purple-900">{members.length} / 5</span>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((members.length / 5) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {5 - members.length} slot{5 - members.length !== 1 ? "s" : ""} remaining
            </p>
          </CardContent>
        </Card>

        {/* Add member button */}
        {members.length < 5 && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Family Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a Family Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="e.g. Sarah Johnson"
                    value={memberName}
                    onChange={e => setMemberName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="e.g. sarah@email.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Relationship</Label>
                  <Select value={relationship} onValueChange={setRelationship}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIPS.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-gray-500">
                  They will receive an invite link to create their account under your family plan — at no extra cost.
                </p>
                <Button
                  className="w-full"
                  onClick={handleInvite}
                  disabled={inviteMutation.isPending}
                >
                  {inviteMutation.isPending ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Members list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-4 pb-4 h-20" />
              </Card>
            ))}
          </div>
        ) : members.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-10 pb-10 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="font-medium text-gray-600">No family members yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Add up to 5 members. Each gets their own account at no extra charge.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {members.map((member: any) => (
              <Card key={member.id} className="border border-gray-200">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                      {member.memberName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{member.memberName}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{member.inviteEmail}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge
                        variant="outline"
                        className={
                          member.status === "active"
                            ? "border-green-300 text-green-700 bg-green-50"
                            : "border-yellow-300 text-yellow-700 bg-yellow-50"
                        }
                      >
                        {member.status === "active" ? (
                          <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
                        ) : (
                          <><Clock className="w-3 h-3 mr-1" /> Pending</>
                        )}
                      </Badge>
                      <span className="text-xs text-gray-400 capitalize">{member.relationship}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => removeMutation.mutate(member.id)}
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* What's included */}
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              What each member gets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>✓ Their own separate login and profile</p>
            <p>✓ Full access to all app features (tasks, mood, finances, medical)</p>
            <p>✓ Caregiver connections and support network</p>
            <p>✓ Covered under your Family plan — no extra charge</p>
            <p>✓ You can remove their access at any time</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
