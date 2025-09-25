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
import { createPortal } from "react-dom";
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
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  console.log("🔥 BEFORE: showStoreDialog =", showStoreDialog);
                  alert("Button clicked! Dialog should open now...");
                  setShowStoreDialog(true);
                  console.log("🔥 AFTER: setShowStoreDialog(true) called");
                  // Force re-render check
                  setTimeout(() => {
                    console.log("🔥 STATE CHECK: showStoreDialog should be true now");
                  }, 100);
                }}
                data-testid="button-manage-stores"
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage Stores
              </Button>
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

      {/* Store Management Dialog - Rendered via Portal to bypass CSS conflicts */}
      {(() => {console.log("🔥 RENDER: showStoreDialog =", showStoreDialog); return null;})()}
      {showStoreDialog && createPortal(
        <div 
          id="store-dialog-overlay"
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0', 
            bottom: '0',
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(255, 0, 0, 0.8)',
            zIndex: '99999',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          ref={(el) => {
            if (el) {
              console.log("🔥 PORTAL DIALOG CREATED:", el);
              console.log("🔥 PORTAL DIALOG STYLES:", window.getComputedStyle(el));
            }
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowStoreDialog(false);
            }
          }}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 'bold' }}>
              🔥 Portal Test - Manage Stores
            </h2>
            <p style={{ margin: '0 0 16px 0' }}>
              This dialog is rendered via React Portal to bypass CSS conflicts!
            </p>
            <button 
              onClick={() => setShowStoreDialog(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Close Dialog
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
