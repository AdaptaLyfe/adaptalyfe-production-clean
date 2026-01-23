import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Shield, 
  Users, 
  CreditCard, 
  Search,
  Crown,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  TrendingUp
} from "lucide-react";

const TIER_PRICES = {
  free: 0,
  basic: 4.99,
  premium: 12.99,
  family: 24.99
};

interface SubscriptionUser {
  id: number;
  username: string;
  name: string;
  email: string | null;
  accountType: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  subscriptionExpiresAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  streakDays: number;
  isActive: boolean;
  createdAt: string;
}

export default function SuperAdminSubscriptions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: users = [], isLoading, error } = useQuery<SubscriptionUser[]>({
    queryKey: ['/api/super-admin/subscription-users'],
    retry: false
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTier = tierFilter === "all" || user.subscriptionTier === tierFilter;
    const matchesStatus = statusFilter === "all" || user.subscriptionStatus === statusFilter;
    
    return matchesSearch && matchesTier && matchesStatus;
  });

  const activeBasic = users.filter(u => u.subscriptionTier === 'basic' && u.subscriptionStatus === 'active').length;
  const activePremium = users.filter(u => u.subscriptionTier === 'premium' && u.subscriptionStatus === 'active').length;
  const activeFamily = users.filter(u => u.subscriptionTier === 'family' && u.subscriptionStatus === 'active').length;

  const stats = {
    total: users.length,
    free: users.filter(u => u.subscriptionTier === 'free').length,
    basic: users.filter(u => u.subscriptionTier === 'basic').length,
    premium: users.filter(u => u.subscriptionTier === 'premium').length,
    family: users.filter(u => u.subscriptionTier === 'family').length,
    active: users.filter(u => u.subscriptionStatus === 'active').length,
    inactive: users.filter(u => u.subscriptionStatus === 'inactive').length
  };

  const revenue = {
    basicMRR: activeBasic * TIER_PRICES.basic,
    premiumMRR: activePremium * TIER_PRICES.premium,
    familyMRR: activeFamily * TIER_PRICES.family,
    totalMRR: (activeBasic * TIER_PRICES.basic) + (activePremium * TIER_PRICES.premium) + (activeFamily * TIER_PRICES.family),
    annualProjected: ((activeBasic * TIER_PRICES.basic) + (activePremium * TIER_PRICES.premium) + (activeFamily * TIER_PRICES.family)) * 12
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-500 text-white"><Clock className="w-3 h-3 mr-1" />Trial</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-500 text-white"><AlertTriangle className="w-3 h-3 mr-1" />Past Due</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500 text-white"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'premium':
        return <Badge className="bg-purple-500 text-white"><Crown className="w-3 h-3 mr-1" />Premium</Badge>;
      case 'family':
        return <Badge className="bg-gradient-to-r from-purple-600 to-pink-500 text-white"><Crown className="w-3 h-3 mr-1" />Family</Badge>;
      case 'basic':
        return <Badge className="bg-blue-500 text-white">Basic</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (error) {
    return (
      <div className="container mx-auto p-6 pb-24">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600">
              <Shield className="w-6 h-6" />
              <p className="font-medium">Access Denied - Super Admin Only</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-red-100 rounded-full">
          <Shield className="w-8 h-8 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Panel</h1>
          <p className="text-gray-500">Subscription Management Dashboard</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">${revenue.totalMRR.toFixed(2)}</p>
                <p className="text-sm text-green-600">Monthly Revenue (MRR)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">${revenue.annualProjected.toFixed(2)}</p>
                <p className="text-sm text-blue-600">Annual Projected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-gray-500">Paying Subscribers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Revenue Breakdown by Tier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-blue-800">Basic (${TIER_PRICES.basic}/mo)</p>
                <p className="text-sm text-blue-600">{activeBasic} active subscribers</p>
              </div>
              <p className="text-xl font-bold text-blue-700">${revenue.basicMRR.toFixed(2)}</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <p className="font-medium text-purple-800">Premium (${TIER_PRICES.premium}/mo)</p>
                <p className="text-sm text-purple-600">{activePremium} active subscribers</p>
              </div>
              <p className="text-xl font-bold text-purple-700">${revenue.premiumMRR.toFixed(2)}</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
              <div>
                <p className="font-medium text-pink-800">Family (${TIER_PRICES.family}/mo)</p>
                <p className="text-sm text-pink-600">{activeFamily} active subscribers</p>
              </div>
              <p className="text-xl font-bold text-pink-700">${revenue.familyMRR.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-gray-500">Active Subs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.premium + stats.family}</p>
                <p className="text-sm text-gray-500">Premium/Family</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-teal-500" />
              <div>
                <p className="text-2xl font-bold">{stats.basic}</p>
                <p className="text-sm text-gray-500">Basic Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>All Subscription Users</CardTitle>
          <CardDescription>View and manage all user subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="family">Family</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="trialing">Trial</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Stripe ID</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No users found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono text-sm">{user.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">@{user.username}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{user.email || '-'}</TableCell>
                        <TableCell>{getTierBadge(user.subscriptionTier)}</TableCell>
                        <TableCell>{getStatusBadge(user.subscriptionStatus)}</TableCell>
                        <TableCell className="text-sm">{formatDate(user.subscriptionExpiresAt)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {user.stripeCustomerId ? user.stripeCustomerId.slice(0, 12) + '...' : '-'}
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(user.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          
          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
