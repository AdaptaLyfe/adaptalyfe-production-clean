import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertPersonalDocumentSchema, type PersonalDocument, type InsertPersonalDocument } from "@shared/schema";
import { Plus, FileText, Shield, Car, Heart, CreditCard, AlertTriangle, User } from "lucide-react";

const DOCUMENT_CATEGORIES = [
  { value: "insurance", label: "Insurance", icon: Shield },
  { value: "medical", label: "Medical", icon: Heart },
  { value: "vehicle", label: "Vehicle", icon: Car },
  { value: "financial", label: "Financial", icon: CreditCard },
  { value: "personal", label: "Personal", icon: User },
  { value: "emergency", label: "Emergency", icon: AlertTriangle },
];

export default function PersonalDocuments() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["/api/personal-documents"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertPersonalDocument) => {
      console.log("Creating document:", data);
      return apiRequest("POST", "/api/personal-documents", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-documents"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({ title: "Success", description: "Document saved successfully!" });
    },
    onError: (error) => {
      console.error("Create error:", error);
      toast({ title: "Error", description: "Failed to save document", variant: "destructive" });
    },
  });

  const form = useForm<InsertPersonalDocument>({
    resolver: zodResolver(insertPersonalDocumentSchema),
    defaultValues: {
      title: "",
      category: "personal",
      description: "",
      documentType: "text",
      content: "",
      tags: [],
      isImportant: false,
    },
  });

  const onSubmit = (data: InsertPersonalDocument) => {
    console.log("Form submission:", data);
    createMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Personal Documents</h1>
          <p className="text-gray-600">Store important information you need to remember</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Document</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Document title..." {...field} />
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
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DOCUMENT_CATEGORIES.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Information *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter the information you want to save..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isImportant"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <input 
                          type="checkbox" 
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4"
                        />
                      </FormControl>
                      <FormLabel>Mark as Important</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Saving..." : "Save Document"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Documents List */}
      <div className="grid gap-4">
        {documents.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No documents yet</h3>
              <p className="text-gray-600 mb-4">Add your first personal document to get started</p>
            </CardContent>
          </Card>
        ) : (
          documents.map((document: PersonalDocument) => {
            const categoryInfo = DOCUMENT_CATEGORIES.find(cat => cat.value === document.category);
            const IconComponent = categoryInfo?.icon || FileText;
            
            return (
              <Card key={document.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <IconComponent className="w-5 h-5 mr-2" />
                      {document.title}
                      {document.isImportant && (
                        <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                          Important
                        </span>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-2">Category: {categoryInfo?.label || document.category}</p>
                  <div className="bg-gray-50 p-3 rounded">
                    <pre className="text-sm whitespace-pre-wrap">{document.content}</pre>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}