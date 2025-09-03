import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPersonalResourceSchema } from "@shared/schema";
import type { PersonalResource, InsertPersonalResource } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, ExternalLink, Trash2, Star, StarOff, Music, Video, Globe, Book, Heart, Smile } from "lucide-react";

const categoryIcons = {
  music: Music,
  videos: Video,
  websites: Globe,
  apps: Book,
  relaxation: Heart,
  entertainment: Smile,
  other: Globe
};

const categoryColors = {
  music: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  videos: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  websites: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  apps: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  relaxation: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  entertainment: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
};

export default function PersonalResourcesModule() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertPersonalResource>({
    resolver: zodResolver(insertPersonalResourceSchema),
    defaultValues: {
      title: "",
      url: "",
      description: "",
      category: "websites",
      tags: "",
      isFavorite: false,
    },
  });

  const { data: resources = [], isLoading } = useQuery<PersonalResource[]>({
    queryKey: selectedCategory === "all" ? ["/api/personal-resources"] : ["/api/personal-resources", { category: selectedCategory }],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertPersonalResource) => {
      return await apiRequest("POST", "/api/personal-resources", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-resources"] });
      setShowAddDialog(false);
      form.reset();
      toast({
        title: "Success",
        description: "Personal resource added successfully!",
      });
    },
    onError: (error) => {
      console.error("Error creating resource:", error);
      toast({
        title: "Error",
        description: "Failed to add personal resource",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/personal-resources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-resources"] });
      toast({
        title: "Success",
        description: "Personal resource deleted successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete personal resource",
        variant: "destructive",
      });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: number; isFavorite: boolean }) => {
      return await apiRequest("PATCH", `/api/personal-resources/${id}`, { isFavorite });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-resources"] });
    },
  });

  const accessMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("PATCH", `/api/personal-resources/${id}/access`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-resources"] });
    },
  });

  const onSubmit = (data: InsertPersonalResource) => {
    createMutation.mutate(data);
  };

  const handleResourceClick = (resource: PersonalResource) => {
    accessMutation.mutate(resource.id);
    window.open(resource.url, '_blank');
  };

  const categories = [
    { value: "all", label: "All Resources" },
    { value: "music", label: "Music" },
    { value: "videos", label: "Videos" },
    { value: "websites", label: "Websites" },
    { value: "apps", label: "Apps" },
    { value: "relaxation", label: "Relaxation" },
    { value: "entertainment", label: "Entertainment" },
    { value: "other", label: "Other" }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Personal Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl font-semibold">My Personal Resources</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Save and access your favorite links for relaxation, music, videos, and more
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Personal Resource</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Resource name" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="videos">Videos</SelectItem>
                          <SelectItem value="websites">Websites</SelectItem>
                          <SelectItem value="apps">Apps</SelectItem>
                          <SelectItem value="relaxation">Relaxation</SelectItem>
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="What makes this resource helpful?" {...field} value={field.value || ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="calming, motivation, focus (comma-separated)" {...field} value={field.value || ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={createMutation.isPending} className="flex-1">
                    {createMutation.isPending ? "Adding..." : "Add Resource"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
            >
              {category.label}
            </Button>
          ))}
        </div>

        {resources.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg mb-2">No resources saved yet</p>
            <p className="text-sm">Add your favorite websites, music, videos, and apps to access them quickly.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {resources.map((resource) => {
              const IconComponent = categoryIcons[resource.category as keyof typeof categoryIcons] || Globe;
              return (
                <div
                  key={resource.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <IconComponent className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{resource.title}</h4>
                      <Badge variant="secondary" className={categoryColors[resource.category as keyof typeof categoryColors]}>
                        {resource.category}
                      </Badge>
                      {resource.isFavorite && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    {resource.description && (
                      <p className="text-sm text-muted-foreground truncate">{resource.description}</p>
                    )}
                    {resource.tags && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {resource.tags.split(',').map((tag, index) => (
                          <span key={index} className="text-xs px-1.5 py-0.5 bg-muted rounded">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    {(resource.accessCount || 0) > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Accessed {resource.accessCount || 0} times
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavoriteMutation.mutate({ id: resource.id, isFavorite: !resource.isFavorite })}
                    >
                      {resource.isFavorite ? (
                        <StarOff className="h-4 w-4" />
                      ) : (
                        <Star className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResourceClick(resource)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(resource.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}