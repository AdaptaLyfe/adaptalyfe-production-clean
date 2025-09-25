import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Plus, DollarSign, Package, CheckCircle2, Trash2, ExternalLink, Store, Settings, Globe, Phone, MapPin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { insertShoppingListSchema, type ShoppingList, type InsertShoppingList, type GroceryStore } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ShoppingListModule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showStoreDialog, setShowStoreDialog] = useState(false);
  const [selectedStore, setSelectedStore] = useState<GroceryStore | null>(null);

  const { data: shoppingItems, isLoading } = useQuery<ShoppingList[]>({
    queryKey: ["/api/shopping-lists"],
  });

  const { data: activeItems } = useQuery<ShoppingList[]>({
    queryKey: ["/api/shopping-lists/active"],
  });

  const { data: groceryStores = [], error: storesError } = useQuery<GroceryStore[]>({
    queryKey: ["/api/grocery-stores"],
    retry: 2,
    staleTime: 30000,
  });

  // Log any errors for debugging
  if (storesError) {
    console.error("Error fetching grocery stores:", storesError);
  }

  const createItemMutation = useMutation({
    mutationFn: async (data: InsertShoppingList) => {
      const response = await apiRequest("POST", "/api/shopping-lists", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-lists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-lists/active"] });
      form.reset();
      toast({
        title: "Success",
        description: "Shopping item added successfully!",
      });
    },
    onError: (error) => {
      console.error("Failed to create shopping item:", error);
      toast({
        title: "Error", 
        description: "Failed to save shopping item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePurchasedMutation = useMutation({
    mutationFn: async ({ id, isPurchased, actualCost }: { id: number; isPurchased: boolean; actualCost?: number }) => {
      const response = await apiRequest("PATCH", `/api/shopping-lists/${id}/purchased`, { isPurchased, actualCost });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-lists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-lists/active"] });
    },
  });

  const form = useForm<Omit<InsertShoppingList, 'userId'>>({
    resolver: zodResolver(insertShoppingListSchema.omit({ userId: true })),
    defaultValues: {
      itemName: "",
      category: "produce", 
      quantity: "",
      isPurchased: false,
      estimatedCost: undefined,
      actualCost: undefined,
    },
  });

  const handleSubmit = (data: Omit<InsertShoppingList, 'userId'>) => {
    console.log("Submitting shopping list data:", data);
    createItemMutation.mutate(data as InsertShoppingList);
  };

  const togglePurchased = (item: ShoppingList, actualCost?: number) => {
    updatePurchasedMutation.mutate({
      id: item.id,
      isPurchased: !item.isPurchased,
      actualCost: actualCost,
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "produce": return "bg-green-600 text-white";
      case "dairy": return "bg-blue-600 text-white";
      case "meat": return "bg-pink-600 text-white";
      case "pantry": return "bg-orange-500 text-white";
      case "frozen": return "bg-teal-600 text-white";
      case "household": return "bg-purple-600 text-white";
      default: return "bg-gray-600 text-white";
    }
  };

  const groupedItems = activeItems?.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ShoppingList[]>);

  const totalEstimated = activeItems?.reduce((sum, item) => sum + (item.estimatedCost || 0), 0) || 0;
  const totalActual = shoppingItems?.filter(item => item.isPurchased).reduce((sum, item) => sum + (item.actualCost || 0), 0) || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="text-bright-blue" />
            <span>Shopping List</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Package className="text-sunny-orange" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Items</p>
                <p className="text-2xl font-bold">{activeItems?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="text-vibrant-green" />
              <div>
                <p className="text-sm font-medium text-gray-600">Estimated Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totalEstimated)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="text-bright-blue" />
              <div>
                <p className="text-sm font-medium text-gray-600">Spent This Month</p>
                <p className="text-2xl font-bold">{formatCurrency(totalActual)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Store Management and Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Store className="text-blue-600" />
              <span>Your Grocery Stores</span>
            </div>
            <div>
              <Dialog open={showStoreDialog} onOpenChange={(open) => {
                console.log("🎯 Dialog state changing from", showStoreDialog, "to", open);
                setShowStoreDialog(open);
              }}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      console.log("🔘 Manage Stores button clicked! Current state:", showStoreDialog);
                      console.log("🔍 Setting dialog state to true");
                    }}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Stores
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-full max-w-4xl max-h-[80vh] overflow-y-auto"
                  onOpenAutoFocus={() => console.log("✅ DialogContent is rendering! Dialog is open:", showStoreDialog)}>
                  <DialogHeader>
                    <DialogTitle>Manage Grocery Stores</DialogTitle>
                    <DialogDescription>
                      Add your favorite grocery stores for easy online ordering and shopping list management
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    <StoreManagementContent 
                      stores={groceryStores}
                      onClose={() => {
                        console.log("🔒 StoreManagementContent onClose called, closing dialog");
                        setShowStoreDialog(false);
                      }}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {groceryStores.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Store className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No grocery stores added yet</p>
              <p className="text-sm">Add your favorite stores to enable online ordering</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groceryStores.map((store) => (
                <div
                  key={store.id}
                  className={`p-4 rounded-lg border ${
                    store.isPreferred ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{store.name}</h4>
                      {store.isPreferred && (
                        <Badge variant="secondary" className="mt-1">Preferred</Badge>
                      )}
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        {store.address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{store.address}</span>
                          </div>
                        )}
                        {store.phoneNumber && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{store.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex gap-2">
                        {store.deliveryAvailable && (
                          <Badge variant="outline" className="text-xs">Delivery</Badge>
                        )}
                        {store.pickupAvailable && (
                          <Badge variant="outline" className="text-xs">Pickup</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {store.onlineOrderingUrl && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => store.onlineOrderingUrl && window.open(store.onlineOrderingUrl, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Order Online
                      </Button>
                    )}
                    {store.website && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => store.website && window.open(store.website, '_blank')}
                      >
                        <Globe className="w-3 h-3 mr-1" />
                        Website
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="text-vibrant-green" />
            <span>Add Shopping Item</span>
          </CardTitle>
          <CardDescription>
            Build your shopping list and track your grocery spending
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit, (errors) => {
              console.error("Form validation errors:", errors);
              toast({
                title: "Form Error", 
                description: "Please fill in all required fields correctly.",
                variant: "destructive",
              });
            })} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="itemName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Bananas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <select 
                          {...field}
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select category</option>
                          <option value="produce">Produce</option>
                          <option value="dairy">Dairy</option>
                          <option value="meat">Meat & Seafood</option>
                          <option value="pantry">Pantry</option>
                          <option value="frozen">Frozen</option>
                          <option value="household">Household</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 2 lbs, 1 gallon" 
                          value={field.value || ""} 
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Est. Cost ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="5.99"
                          value={field.value?.toString() || ""}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                disabled={createItemMutation.isPending} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => console.log("Button clicked, form values:", form.getValues())}
              >
                <Plus className="w-4 h-4 mr-2" />
                {createItemMutation.isPending ? "Adding..." : "Add to Shopping List"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="text-bright-blue" />
            <span>Shopping List</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!groupedItems || Object.keys(groupedItems).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Your shopping list is empty. Add some items above!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Badge className={getCategoryColor(category)}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Badge>
                    <span className="text-sm text-gray-500">({items.length} items)</span>
                  </div>
                  <div className="grid gap-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          item.isPurchased
                            ? "border-vibrant-green bg-green-50"
                            : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={item.isPurchased || false}
                              onCheckedChange={() => togglePurchased(item)}
                              disabled={updatePurchasedMutation.isPending}
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium">{item.itemName}</h4>
                                {item.quantity && (
                                  <span className="text-sm text-gray-500">({item.quantity})</span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                {item.estimatedCost && (
                                  <span>Est: {formatCurrency(item.estimatedCost)}</span>
                                )}
                                {item.actualCost && (
                                  <span className="text-vibrant-green font-medium">
                                    Actual: {formatCurrency(item.actualCost)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {item.isPurchased && (
                            <CheckCircle2 className="w-5 h-5 text-vibrant-green" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StoreManagementDialogProps {
  stores: GroceryStore[];
  onClose: () => void;
}

function StoreManagementContent({ stores, onClose }: StoreManagementDialogProps) {
  const queryClient = useQueryClient();
  const [editingStore, setEditingStore] = useState<GroceryStore | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const createStoreMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/grocery-stores", data);
      // Safely parse JSON, return null if empty
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grocery-stores"] });
      setShowAddForm(false);
    },
  });

  const updateStoreMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<GroceryStore>) => {
      const response = await apiRequest("PUT", `/api/grocery-stores/${id}`, data);
      // Safely parse JSON, return null if empty
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grocery-stores"] });
      setEditingStore(null);
    },
  });

  const deleteStoreMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log("Attempting to delete store with ID:", id);
      const response = await apiRequest("DELETE", `/api/grocery-stores/${id}`, null);
      // DELETE operations often return empty responses, don't try to parse JSON
      return { success: true };
    },
    onSuccess: () => {
      console.log("Store deleted successfully, invalidating cache");
      queryClient.invalidateQueries({ queryKey: ["/api/grocery-stores"] });
    },
    onError: (error) => {
      console.error("Failed to delete store:", error);
    },
  });

  return (
    <>
      <Tabs defaultValue="stores" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stores">Your Stores</TabsTrigger>
          <TabsTrigger value="add">Add New Store</TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="space-y-4">
          {stores.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Store className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No stores added yet</p>
              <p className="text-sm">Switch to "Add New Store" tab to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stores.map((store) => (
                <div key={store.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{store.name}</h4>
                        {store.isPreferred && (
                          <Badge variant="secondary">Preferred</Badge>
                        )}
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        {store.address && <p><MapPin className="w-3 h-3 inline mr-1" />{store.address}</p>}
                        {store.phoneNumber && <p><Phone className="w-3 h-3 inline mr-1" />{store.phoneNumber}</p>}
                        {store.website && <p><Globe className="w-3 h-3 inline mr-1" />{store.website}</p>}
                      </div>
                      <div className="mt-2 flex gap-2">
                        {store.deliveryAvailable && <Badge variant="outline" className="text-xs">Delivery</Badge>}
                        {store.pickupAvailable && <Badge variant="outline" className="text-xs">Pickup</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingStore(store)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteStoreMutation.mutate(store.id)}
                        disabled={deleteStoreMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="add">
          <StoreForm
            store={null}
            onSubmit={(data) => createStoreMutation.mutate(data)}
            onCancel={() => setShowAddForm(false)}
            isLoading={createStoreMutation.isPending}
          />
        </TabsContent>
      </Tabs>
      
      {editingStore && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Edit Store</h3>
            <Button variant="ghost" size="sm" onClick={() => setEditingStore(null)}>
              <span className="text-xl">×</span>
            </Button>
          </div>
          <StoreForm
            store={editingStore}
            onSubmit={(data) => updateStoreMutation.mutate({ id: editingStore!.id, ...data })}
            onCancel={() => setEditingStore(null)}
            isLoading={updateStoreMutation.isPending}
          />
        </div>
      )}
    </>
  );
}

interface StoreFormProps {
  store: GroceryStore | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function StoreForm({ store, onSubmit, onCancel, isLoading }: StoreFormProps) {
  const form = useForm({
    defaultValues: {
      name: store?.name || "",
      address: store?.address || "",
      phoneNumber: store?.phoneNumber || "",
      website: store?.website || "",
      onlineOrderingUrl: store?.onlineOrderingUrl || "",
      deliveryAvailable: store?.deliveryAvailable || false,
      pickupAvailable: store?.pickupAvailable || true,
      isPreferred: store?.isPreferred || false,
    },
  });

  const handleSubmit = (data: any) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Store Name *</FormLabel>
              <FormControl>
                <Input placeholder="Walmart Supercenter" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St, City, State 12345" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
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
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://walmart.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="onlineOrderingUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Online Ordering URL</FormLabel>
              <FormControl>
                <Input placeholder="https://grocery.walmart.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="deliveryAvailable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Delivery Available</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pickupAvailable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Pickup Available</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isPreferred"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Preferred Store</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>



        <div className="flex gap-2">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? "Saving..." : store ? "Update Store" : "Add Store"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}