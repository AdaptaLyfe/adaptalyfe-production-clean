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
import { Plus, FileText, Shield, Car, Heart, CreditCard, AlertTriangle, User, Camera, Link, ExternalLink } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

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
  const [documentType, setDocumentType] = useState<"text" | "image" | "link">("text");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading, refetch, error } = useQuery({
    queryKey: ["/api/personal-documents"],
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache
    queryFn: async () => {
      console.log("=== FRONTEND: Fetching documents ===");
      const response = await fetch("/api/personal-documents", {
        credentials: "include",
      });
      
      if (!response.ok) {
        console.error("=== FRONTEND: Fetch error ===", response.status, response.statusText);
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("=== FRONTEND: Raw API response ===", data);
      return data;
    }
  });
  
  console.log("=== FRONTEND: Documents state ===", {
    documents: documents,
    length: documents?.length || 0,
    isLoading,
    error: error?.message
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertPersonalDocument) => {
      console.log("=== FRONTEND: Creating document ===", data);
      try {
        const response = await apiRequest("POST", "/api/personal-documents", data);
        const result = await response.json();
        console.log("=== FRONTEND: API Response ===", result);
        return result;
      } catch (error) {
        console.error("=== FRONTEND: API Error ===", error);
        throw error;
      }
    },
    onSuccess: (result) => {
      console.log("=== FRONTEND: Success callback ===", result);
      // Force refetch the documents list
      queryClient.invalidateQueries({ queryKey: ["/api/personal-documents"] });
      queryClient.removeQueries({ queryKey: ["/api/personal-documents"] });
      setIsAddDialogOpen(false);
      form.reset();
      setDocumentType("text");
      setUploadedImageUrl("");
      toast({ title: "Success", description: "Document saved successfully!" });
      // Force manual refetch
      setTimeout(() => {
        refetch();
      }, 100);
    },
    onError: (error) => {
      console.error("=== FRONTEND: Error callback ===", error);
      toast({ title: "Error", description: `Failed to save document: ${error.message}`, variant: "destructive" });
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
      imageUrl: "",
      linkUrl: "",
      tags: [],
      isImportant: false,
    },
  });

  const onSubmit = (data: InsertPersonalDocument) => {
    console.log("=== FRONTEND: Form submission started ===", data);
    console.log("=== FRONTEND: Form errors ===", form.formState.errors);
    console.log("=== FRONTEND: Form is valid ===", form.formState.isValid);
    
    // Ensure required fields are present and set appropriate document type
    const processedData = {
      ...data,
      description: data.description || "",
      tags: data.tags || [],
      documentType: documentType,
      imageUrl: documentType === "image" ? uploadedImageUrl : "",
      linkUrl: documentType === "link" ? data.linkUrl : "",
      content: documentType === "text" ? data.content : 
               documentType === "image" ? `Image: ${data.title}` :
               documentType === "link" ? `Link: ${data.linkUrl}` : data.content || ""
    };
    
    console.log("=== FRONTEND: Processed data ===", processedData);
    
    // Force submission even if form thinks it's invalid (for debugging)
    createMutation.mutate(processedData);
  };

  // Handle image upload completion
  const handleImageUpload = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    try {
      if (result.successful && result.successful.length > 0) {
        const uploadUrl = result.successful[0].uploadURL;
        setUploadedImageUrl(uploadUrl || "");
        
        // Set the ACL policy for the uploaded image
        await apiRequest("PUT", "/api/personal-documents/set-image", {
          imageURL: uploadUrl
        });
        
        toast({
          title: "Success",
          description: "Image uploaded successfully!",
        });
      }
    } catch (error) {
      console.error("Error handling image upload:", error);
      toast({
        title: "Error", 
        description: "Failed to process image upload",
        variant: "destructive"
      });
    }
  };

  // Handle getting upload parameters for image upload
  const getUploadParameters = async () => {
    try {
      const response = await apiRequest("POST", "/api/personal-documents/upload");
      const data = await response.json();
      return {
        method: "PUT" as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error("Error getting upload parameters:", error);
      throw error;
    }
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

                {/* Document Type Selection */}
                <FormItem>
                  <FormLabel>Document Type *</FormLabel>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant={documentType === "text" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDocumentType("text")}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Text
                    </Button>
                    <Button 
                      type="button" 
                      variant={documentType === "image" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDocumentType("image")}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Image
                    </Button>
                    <Button 
                      type="button" 
                      variant={documentType === "link" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDocumentType("link")}
                    >
                      <Link className="w-4 h-4 mr-2" />
                      Link
                    </Button>
                  </div>
                </FormItem>

                {/* Conditional Content Fields */}
                {documentType === "text" && (
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
                )}

                {documentType === "image" && (
                  <div className="space-y-4">
                    <div>
                      <FormLabel>Upload Image</FormLabel>
                      <div className="mt-2">
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={10485760} // 10MB
                          onGetUploadParameters={getUploadParameters}
                          onComplete={handleImageUpload}
                          buttonClassName="w-full"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          {uploadedImageUrl ? "Change Image" : "Upload Image"}
                        </ObjectUploader>
                        {uploadedImageUrl && (
                          <p className="text-sm text-green-600 mt-2">✓ Image uploaded successfully</p>
                        )}
                      </div>
                    </div>
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Add a description for this image..."
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {documentType === "link" && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="linkUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website URL *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://example.com"
                              type="url"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Add a description for this link..."
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

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
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    className="border-2 border-blue-500 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                    onClick={(e) => {
                      console.log("=== FRONTEND: Save button clicked ===");
                      console.log("=== FRONTEND: Form valid? ===", form.formState.isValid);
                      console.log("=== FRONTEND: Form values ===", form.getValues());
                      console.log("=== FRONTEND: Form errors ===", form.formState.errors);
                      
                      // Force submit regardless of validation for debugging
                      if (!form.formState.isValid) {
                        console.log("=== FRONTEND: Forcing submission despite validation errors ===");
                        const values = form.getValues();
                        onSubmit(values);
                        e.preventDefault();
                      }
                    }}
                  >
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
                  
                  {/* Display content based on document type */}
                  {document.documentType === "image" && document.imageUrl && (
                    <div className="space-y-2">
                      <img 
                        src={document.imageUrl} 
                        alt={document.title}
                        className="max-w-full h-auto rounded border"
                        style={{ maxHeight: "200px" }}
                      />
                      {document.content && (
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm">{document.content}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {document.documentType === "link" && document.linkUrl && (
                    <div className="space-y-2">
                      <a 
                        href={document.linkUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 underline"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Open Link
                      </a>
                      {document.content && (
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm">{document.content}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {document.documentType === "text" && (
                    <div className="bg-gray-50 p-3 rounded">
                      <pre className="text-sm whitespace-pre-wrap">{document.content}</pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}