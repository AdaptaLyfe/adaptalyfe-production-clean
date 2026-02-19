import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Plus, Users, Building2, Copy, Trash2, Eye, UserX, ToggleLeft, ToggleRight } from "lucide-react";
import { Link } from "wouter";

interface OrgCode {
  id: number;
  orgName: string;
  code: string;
  maxUsers: number | null;
  isActive: boolean;
  createdBy: number | null;
  createdAt: string;
  expiresAt: string | null;
  activeMembers: number;
  totalMembers: number;
}

interface OrgMember {
  id: number;
  userId: number;
  orgCodeId: number;
  status: string;
  joinedAt: string;
  revokedAt: string | null;
  revokedBy: number | null;
  userName: string;
  userEmail: string;
  userUsername: string;
}

interface OrgCodeDetail extends OrgCode {
  members: OrgMember[];
}

export default function AdminOrgCodes() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedCodeId, setSelectedCodeId] = useState<number | null>(null);
  const [newOrgName, setNewOrgName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newMaxUsers, setNewMaxUsers] = useState("");
  const [newExpiresAt, setNewExpiresAt] = useState("");
  const { toast } = useToast();

  const { data: orgCodes = [], isLoading } = useQuery<OrgCode[]>({
    queryKey: ["/api/admin/org-codes"],
  });

  const { data: codeDetail } = useQuery<OrgCodeDetail>({
    queryKey: ["/api/admin/org-codes", selectedCodeId],
    enabled: !!selectedCodeId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { orgName: string; code: string; maxUsers?: number; expiresAt?: string }) => {
      const res = await apiRequest("POST", "/api/admin/org-codes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/org-codes"] });
      setShowCreateDialog(false);
      setNewOrgName("");
      setNewCode("");
      setNewMaxUsers("");
      setNewExpiresAt("");
      toast({ title: "Organization code created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/org-codes/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/org-codes"] });
      toast({ title: "Organization code updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/org-codes/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/org-codes"] });
      toast({ title: "Organization code deleted" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (membershipId: number) => {
      const res = await apiRequest("POST", `/api/admin/org-memberships/${membershipId}/revoke`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/org-codes"] });
      if (selectedCodeId) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/org-codes", selectedCodeId] });
      }
      toast({ title: "User access revoked", description: "User will need a paid subscription to continue." });
    },
  });

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(code);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code copied to clipboard" });
  };

  const handleCreate = () => {
    if (!newOrgName || !newCode) return;
    createMutation.mutate({
      orgName: newOrgName,
      code: newCode,
      maxUsers: newMaxUsers ? parseInt(newMaxUsers) : undefined,
      expiresAt: newExpiresAt || undefined,
    });
  };

  const viewDetails = (id: number) => {
    setSelectedCodeId(id);
    setShowDetailDialog(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-7 h-7 text-blue-600" />
              Organization Codes
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create codes for organizations to give their users free access
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-gray-500">Total Codes</div>
              <div className="text-2xl font-bold">{orgCodes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-gray-500">Active Codes</div>
              <div className="text-2xl font-bold text-green-600">
                {orgCodes.filter(c => c.isActive).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-gray-500">Total Active Members</div>
              <div className="text-2xl font-bold text-blue-600">
                {orgCodes.reduce((sum, c) => sum + c.activeMembers, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Organization Codes</CardTitle>
            <Button onClick={() => { generateCode(); setShowCreateDialog(true); }} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-1" /> Create Code
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : orgCodes.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No organization codes yet</p>
                <p className="text-sm text-gray-400 mt-1">Create a code to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgCodes.map((orgCode) => (
                      <TableRow key={orgCode.id}>
                        <TableCell className="font-medium">{orgCode.orgName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-sm font-mono">
                              {orgCode.code}
                            </code>
                            <Button variant="ghost" size="sm" onClick={() => copyCode(orgCode.code)} className="h-6 w-6 p-0">
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span>{orgCode.activeMembers}</span>
                            {orgCode.maxUsers && (
                              <span className="text-gray-400">/ {orgCode.maxUsers}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={orgCode.isActive ? "default" : "secondary"} className={orgCode.isActive ? "bg-green-100 text-green-700" : ""}>
                            {orgCode.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {orgCode.expiresAt ? new Date(orgCode.expiresAt).toLocaleDateString() : "Never"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => viewDetails(orgCode.id)} title="View Members">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleMutation.mutate({ id: orgCode.id, isActive: !orgCode.isActive })}
                              title={orgCode.isActive ? "Deactivate" : "Activate"}
                            >
                              {orgCode.isActive ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { if (confirm("Delete this organization code? Members will lose access.")) deleteMutation.mutate(orgCode.id); }}
                              className="text-red-500 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Organization Name</Label>
              <Input value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} placeholder="e.g., Sunrise Care Center" />
            </div>
            <div>
              <Label>Access Code</Label>
              <div className="flex gap-2">
                <Input value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} placeholder="e.g., SUNRISE2025" className="font-mono" />
                <Button variant="outline" onClick={generateCode}>Generate</Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Share this code with the organization for their users to enter</p>
            </div>
            <div>
              <Label>Max Users (optional)</Label>
              <Input type="number" value={newMaxUsers} onChange={(e) => setNewMaxUsers(e.target.value)} placeholder="Leave blank for unlimited" />
            </div>
            <div>
              <Label>Expiration Date (optional)</Label>
              <Input type="date" value={newExpiresAt} onChange={(e) => setNewExpiresAt(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newOrgName || !newCode || createMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
              {createMutation.isPending ? "Creating..." : "Create Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailDialog} onOpenChange={(open) => { setShowDetailDialog(open); if (!open) setSelectedCodeId(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              {codeDetail?.orgName || "Organization"} - Members
            </DialogTitle>
          </DialogHeader>
          {codeDetail ? (
            <div>
              <div className="flex items-center gap-3 mb-4 text-sm text-gray-500">
                <span>Code: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded font-mono">{codeDetail.code}</code></span>
                <span>Active: {codeDetail.activeMembers}</span>
                <span>Total: {codeDetail.totalMembers}</span>
              </div>
              {codeDetail.members.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p>No members have redeemed this code yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {codeDetail.members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.userName}</TableCell>
                        <TableCell>{member.userUsername}</TableCell>
                        <TableCell className="text-sm text-gray-500">{member.userEmail}</TableCell>
                        <TableCell>
                          <Badge variant={member.status === 'active' ? "default" : "secondary"} className={member.status === 'active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {member.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { if (confirm(`Revoke access for ${member.userName}?`)) revokeMutation.mutate(member.id); }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <UserX className="w-4 h-4 mr-1" /> Revoke
                            </Button>
                          )}
                          {member.status === 'revoked' && (
                            <span className="text-xs text-gray-400">
                              Revoked {member.revokedAt ? new Date(member.revokedAt).toLocaleDateString() : ""}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
