import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertPersonalDocumentSchema, type PersonalDocument } from "@shared/schema";
import { Plus, FileText, Shield, Car, Heart, CreditCard, AlertTriangle, User, ExternalLink, Trash2 } from "lucide-react";
import { z } from "zod";

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
  documentType: z.enum(["text", "link"]),
  content: z.string().optional(),
  linkUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  isImportant: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function PersonalDocuments() {
  const [isOpen, setIsOpen] = useState(false);
  const [docType, setDocType] = useState<"text" | "link">("text");
  const { toast } = useToast();

  const { data: documents = [], isLoading } = useQuery<PersonalDocument[]>({
    queryKey: ["/api/personal-documents"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      category: "personal",
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
        tags: [],
      };
      const res = await apiRequest("POST", "/api/personal-documents", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-documents"] });
      setIsOpen(false);
      form.reset();
      setDocType("text");
      toast({ title: "Success", description: "Document saved!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save document", variant: "destructive" });
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

  const onSubmit = (data: FormData) => {
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

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-document">
              <Plus className="w-4 h-4 mr-2" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Document</DialogTitle>
              <DialogDescription>
                Store important information you need to remember
              </DialogDescription>
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
                        <Input placeholder="Insurance Card" {...field} data-testid="input-title" />
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
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

                <div>
                  <FormLabel>Document Type *</FormLabel>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant={docType === "text" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDocType("text")}
                      data-testid="button-type-text"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Text
                    </Button>
                    <Button
                      type="button"
                      variant={docType === "link" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDocType("link")}
                      data-testid="button-type-link"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Link
                    </Button>
                  </div>
                </div>

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
                            className="min-h-[100px]"
                            {...field}
                            data-testid="textarea-content"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {docType === "link" && (
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
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="isImportant"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-important"
                        />
                      </FormControl>
                      <FormLabel>Mark as Important</FormLabel>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-save-document"
                  >
                    {createMutation.isPending ? "Saving..." : "Save Document"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {documents.length === 0 ? (
        <Card className="bg-gray-50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No documents yet</h3>
            <p className="text-gray-600">Add your first personal document to get started</p>
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
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold">{doc.title}</h3>
                    </div>
                    {doc.isImportant && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                        Important
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{category?.label}</p>

                  {doc.documentType === "text" && doc.content && (
                    <p className="text-sm text-gray-700 line-clamp-3">{doc.content}</p>
                  )}

                  {doc.documentType === "link" && doc.linkUrl && (
                    <a
                      href={doc.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open Link
                    </a>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => deleteMutation.mutate(doc.id)}
                    data-testid={`button-delete-${doc.id}`}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
