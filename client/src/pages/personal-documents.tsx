import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type PersonalDocument } from "@shared/schema";
import { Plus, FileText, Shield, Car, Heart, CreditCard, AlertTriangle, User, ExternalLink, Trash2, Edit, Image as ImageIcon, Link as LinkIcon, Camera, Clock } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";

const CATEGORIES = [
  { value: "insurance", label: "Insurance", icon: Shield },
  { value: "medical", label: "Medical", icon: Heart },
  { value: "vehicle", label: "Vehicle", icon: Car },
  { value: "financial", label: "Financial", icon: CreditCard },
  { value: "personal", label: "Personal", icon: User },
  { value: "emergency", label: "Emergency", icon: AlertTriangle },
];

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  documentType: z.enum(["text", "image", "link"]),
  content: z.string().optional(),
  linkUrl: z.string().optional(),
  isImportant: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function PersonalDocuments() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [docType, setDocType] = useState<"text" | "image" | "link">("text");
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const { toast } = useToast();

  const { data: documents = [], isLoading } = useQuery<PersonalDocument[]>({
    queryKey: ["/api/personal-documents"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      category: "medical",
      documentType: "text",
      content: "",
      linkUrl: "",
      isImportant: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        documentType: docType,
        content: data.content || "",
        linkUrl: docType === "link" ? data.linkUrl : "",
        imageUrl: docType === "image" ? uploadedImageUrl : "",
        tags: [],
      };
      
      if (editingDoc) {
        const res = await apiRequest("PATCH", `/api/personal-documents/${editingDoc.id}`, payload);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/personal-documents", payload);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-documents"] });
      setIsOpen(false);
      setEditingDoc(null);
      form.reset();
      setDocType("text");
      setUploadedImageUrl("");
      toast({ 
        title: "Success", 
        description: editingDoc ? "Document updated successfully!" : "Document saved successfully!" 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || `Failed to ${editingDoc ? "update" : "save"} document`, 
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/personal-documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-documents"] });
      toast({ title: "Success", description: "Document deleted!" });
    },
  });

  const handleImageUpload = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    try {
      if (result.successful && result.successful.length > 0) {
        const uploadUrl = result.successful[0].uploadURL;
        setUploadedImageUrl(uploadUrl || "");
        
        // Set public ACL so image can be displayed
        try {
          await apiRequest("POST", "/api/personal-documents/set-public-acl", {
            imageUrl: uploadUrl
          });
        } catch (aclError) {
          console.error("Error setting public ACL:", aclError);
        }
        
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

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="p-4 md:p-6">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Personal Documents</h1>
          <p className="text-sm md:text-base text-gray-600">Store important information you need to remember</p>
        </div>

        <Button 
          className="w-full sm:w-auto" 
          data-testid="button-add-document"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Document
        </Button>

        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingDoc(null);
            form.reset();
            setDocType("text");
            setUploadedImageUrl("");
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>{editingDoc ? "Edit Document" : "Add New Document"}</DialogTitle>
              <DialogDescription>
                Store important information you need to remember
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Title Field */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Insurance Card" 
                          {...field} 
                          data-testid="input-title"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category Field */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Document Type Selection */}
                <div>
                  <FormLabel className="text-sm font-medium">Document Type *</FormLabel>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDocType("text");
                        form.setValue("documentType", "text");
                      }}
                      data-testid="button-type-text"
                      className={`w-full justify-center transition-all ${
                        docType === "text" 
                          ? "border-2 border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow-md" 
                          : "border border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      <FileText className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">Text</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDocType("image");
                        form.setValue("documentType", "image");
                      }}
                      data-testid="button-type-image"
                      className={`w-full justify-center transition-all ${
                        docType === "image" 
                          ? "border-2 border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow-md" 
                          : "border border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      <ImageIcon className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">Image</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDocType("link");
                        form.setValue("documentType", "link");
                      }}
                      data-testid="button-type-link"
                      className={`w-full justify-center transition-all ${
                        docType === "link" 
                          ? "border-2 border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow-md" 
                          : "border border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      <LinkIcon className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">Link</span>
                    </Button>
                  </div>
                </div>

                {/* Conditional Content Fields */}
                {docType === "text" && (
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Information *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter the information you want to save..."
                            className="min-h-[100px] w-full resize-none"
                            {...field}
                            data-testid="textarea-content"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {docType === "image" && (
                  <div className="space-y-4">
                    <div>
                      <FormLabel>Upload Image</FormLabel>
                      <div className="mt-2">
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={10485760}
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
                              className="min-h-[80px] w-full resize-none"
                              {...field}
                              data-testid="textarea-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {docType === "link" && (
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
                              data-testid="input-link-url"
                              className="w-full"
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
                              className="min-h-[80px] w-full resize-none"
                              {...field}
                              data-testid="textarea-link-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Mark as Important Checkbox */}
                <FormField
                  control={form.control}
                  name="isImportant"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 py-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-important"
                          className="mt-0"
                        />
                      </FormControl>
                      <FormLabel className="cursor-pointer text-sm sm:text-base font-normal mb-0">
                        Mark as Important
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsOpen(false);
                      form.reset();
                      setUploadedImageUrl("");
                    }}
                    data-testid="button-cancel"
                    className="w-full sm:w-auto min-w-[100px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-save-document"
                    className="w-full sm:w-auto min-w-[120px] bg-blue-600 hover:bg-blue-700"
                  >
                    {createMutation.isPending 
                      ? (editingDoc ? "Updating..." : "Saving...") 
                      : (editingDoc ? "Update Document" : "Save Document")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <Card className="bg-gray-50">
          <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
            <FileText className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mb-4" />
            <h3 className="text-lg md:text-xl font-semibold mb-2">No documents yet</h3>
            <p className="text-sm md:text-base text-gray-600 text-center px-4">Add your first personal document to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const category = CATEGORIES.find((c) => c.value === doc.category);
            const Icon = category?.icon || FileText;

            return (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Icon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <h3 className="font-semibold truncate">{doc.title}</h3>
                    </div>
                    {doc.isImportant && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded flex-shrink-0 ml-2">
                        Important
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{category?.label}</p>

                  <div className="flex flex-col gap-1 mb-3 text-xs text-gray-500">
                    {doc.createdAt && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Created {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}</span>
                      </div>
                    )}
                    {doc.updatedAt && doc.createdAt && new Date(doc.updatedAt).getTime() !== new Date(doc.createdAt).getTime() && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Updated {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}</span>
                      </div>
                    )}
                  </div>

                  {doc.documentType === "text" && doc.content && (
                    <p className="text-sm text-gray-700 line-clamp-3 mb-3">{doc.content}</p>
                  )}

                  {doc.documentType === "image" && doc.imageUrl && (
                    <div className="mb-3">
                      <img 
                        src={doc.imageUrl} 
                        alt={doc.title}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      {doc.content && (
                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">{doc.content}</p>
                      )}
                    </div>
                  )}

                  {doc.documentType === "link" && doc.linkUrl && (
                    <div className="mb-3">
                      <a
                        href={doc.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1 break-all"
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{doc.linkUrl}</span>
                      </a>
                      {doc.content && (
                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">{doc.content}</p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex-1 sm:flex-none"
                      onClick={() => {
                        setEditingDoc(doc);
                        setDocType(doc.documentType as "text" | "image" | "link");
                        setUploadedImageUrl(doc.imageUrl || "");
                        form.reset({
                          title: doc.title,
                          category: doc.category,
                          documentType: doc.documentType as "text" | "image" | "link",
                          content: doc.content || "",
                          linkUrl: doc.linkUrl || "",
                          isImportant: doc.isImportant || false,
                        });
                        setIsOpen(true);
                      }}
                      data-testid={`button-edit-${doc.id}`}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-none"
                      onClick={() => deleteMutation.mutate(doc.id)}
                      data-testid={`button-delete-${doc.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
