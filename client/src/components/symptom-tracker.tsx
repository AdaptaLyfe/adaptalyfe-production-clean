import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Clock, MapPin, AlertTriangle, Calendar, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertSymptomEntrySchema, type SymptomEntry, type InsertSymptomEntry } from "@shared/schema";
import { format, formatDistanceToNow } from "date-fns";

const severityColors = {
  1: "bg-green-100 text-green-800",
  2: "bg-green-100 text-green-800", 
  3: "bg-yellow-100 text-yellow-800",
  4: "bg-yellow-100 text-yellow-800",
  5: "bg-orange-100 text-orange-800",
  6: "bg-orange-100 text-orange-800",
  7: "bg-red-100 text-red-800",
  8: "bg-red-100 text-red-800",
  9: "bg-red-100 text-red-800",
  10: "bg-red-100 text-red-800"
};

const severityLabels = {
  1: "Very Mild", 2: "Mild", 3: "Mild-Moderate", 4: "Moderate", 5: "Moderate",
  6: "Moderate-Severe", 7: "Severe", 8: "Severe", 9: "Very Severe", 10: "Extreme"
};

export function SymptomTracker() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SymptomEntry | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: symptomEntries = [], isLoading } = useQuery<SymptomEntry[]>({
    queryKey: ["/api/symptom-entries"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertSymptomEntry) => apiRequest("POST", "/api/symptom-entries", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/symptom-entries"] });
      setIsAddDialogOpen(false);
      toast({ title: "Success", description: "Symptom entry added successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to add symptom entry", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertSymptomEntry> }) =>
      apiRequest("PATCH", `/api/symptom-entries/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/symptom-entries"] });
      setEditingEntry(null);
      toast({ title: "Success", description: "Symptom entry updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to update symptom entry", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/symptom-entries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/symptom-entries"] });
      toast({ title: "Success", description: "Symptom entry deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to delete symptom entry", variant: "destructive" });
    },
  });

  const form = useForm<InsertSymptomEntry>({
    resolver: zodResolver(insertSymptomEntrySchema),
    defaultValues: {
      symptomName: "",
      severity: 1,
      startTime: new Date(),
      endTime: null,
      triggers: "",
      location: "",
      description: "",
      notes: "",
    },
  });

  const editForm = useForm<InsertSymptomEntry>({
    resolver: zodResolver(insertSymptomEntrySchema),
  });

  const onSubmit = (data: InsertSymptomEntry) => {
    createMutation.mutate({
      ...data,
      startTime: new Date(data.startTime),
      endTime: data.endTime ? new Date(data.endTime) : null,
    });
  };

  const onEditSubmit = (data: InsertSymptomEntry) => {
    if (!editingEntry) return;
    updateMutation.mutate({
      id: editingEntry.id,
      data: {
        ...data,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
      },
    });
  };

  const startEdit = (entry: SymptomEntry) => {
    setEditingEntry(entry);
    editForm.reset({
      symptomName: entry.symptomName,
      severity: entry.severity,
      startTime: new Date(entry.startTime),
      endTime: entry.endTime ? new Date(entry.endTime) : null,
      triggers: entry.triggers || "",
      location: entry.location || "",
      description: entry.description || "",
      notes: entry.notes || "",
    });
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6 h-80 overflow-y-scroll">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Symptom Tracker</h3>
          <p className="text-gray-600">Track your symptoms to identify patterns and triggers</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2 border-2 border-blue-300 shadow-md hover:shadow-lg transition-shadow" data-testid="button-log-symptom">
          <Plus className="w-4 h-4" />
          Log Symptom
        </Button>
      </div>

      {/* Add Symptom Dialog */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setIsAddDialogOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Log New Symptom</h2>
                  <p className="text-sm text-gray-600 mt-1">Record details about your symptom to track patterns over time</p>
                </div>
                <button
                  onClick={() => setIsAddDialogOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="symptomName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symptom Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Headache, Nausea, Pain" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity (1-10)</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} - {severityLabels[num as keyof typeof severityLabels]}
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
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ""}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ""}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Head, Stomach, Back" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="triggers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Possible Triggers (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g., Stress, Food, Weather"
                          name={field.name}
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
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
                        <Textarea 
                          placeholder="Describe the symptom in detail"
                          name={field.name}
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={createMutation.isPending} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                      {createMutation.isPending ? "Adding..." : "Add Entry"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      )}

      {!symptomEntries || symptomEntries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Symptoms Logged</h3>
            <p className="text-gray-600 mb-4">Start tracking symptoms to identify patterns and triggers</p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Log Your First Symptom
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {symptomEntries.map((entry: SymptomEntry) => (
            <Card key={entry.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-lg">{entry.symptomName}</h4>
                    <Badge className={severityColors[entry.severity as keyof typeof severityColors]}>
                      Level {entry.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(entry)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(entry.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{format(new Date(entry.startTime), "MMM d, yyyy 'at' h:mm a")}</span>
                  </div>
                  {entry.endTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>Ended {formatDistanceToNow(new Date(entry.endTime))} ago</span>
                    </div>
                  )}
                  {entry.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{entry.location}</span>
                    </div>
                  )}
                </div>

                {(entry.description || entry.triggers) && (
                  <>
                    <Separator className="my-3" />
                    <div className="space-y-2 text-sm">
                      {entry.description && (
                        <div>
                          <span className="font-medium">Description: </span>
                          <span className="text-gray-700">{entry.description}</span>
                        </div>
                      )}
                      {entry.triggers && (
                        <div>
                          <span className="font-medium">Triggers: </span>
                          <span className="text-gray-700">{entry.triggers}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Symptom Dialog */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setEditingEntry(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Edit Symptom Entry</h2>
                  <p className="text-sm text-gray-600 mt-1">Update the details of this symptom entry</p>
                </div>
                <button
                  onClick={() => setEditingEntry(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="symptomName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Symptom Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Headache, Nausea, Pain" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity (1-10)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} - {severityLabels[num as keyof typeof severityLabels]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ""}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Head, Stomach, Back" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="triggers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Possible Triggers (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., Stress, Food, Weather"
                        name={field.name}
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={updateMutation.isPending} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                      {updateMutation.isPending ? "Updating..." : "Update Entry"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setEditingEntry(null)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}