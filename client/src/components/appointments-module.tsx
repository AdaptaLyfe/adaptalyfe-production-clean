import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, User, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAppointmentSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatTimeAgo } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Appointment, InsertAppointment } from "@shared/schema";

export default function AppointmentsModule() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: upcomingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/upcoming"],
  });

  // Create a form-specific type to handle string date input
  type AppointmentFormData = Omit<InsertAppointment, 'appointmentDate'> & {
    appointmentDate: string;
  };

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(insertAppointmentSchema.omit({ userId: true })),
    defaultValues: {
      title: "",
      description: "",
      appointmentDate: "",
      location: "",
      provider: "",
      isCompleted: false,
      reminderSet: false,
    },
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      return apiRequest("POST", "/api/appointments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/upcoming"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success!",
        description: "Appointment scheduled successfully",
      });
    },
    onError: (error) => {
      console.error("Failed to create appointment:", error);
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const completeAppointmentMutation = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: number; isCompleted: boolean }) => {
      return apiRequest("PATCH", `/api/appointments/${id}/complete`, { isCompleted });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/upcoming"] });
    },
  });

  const handleSubmit = (data: AppointmentFormData) => {
    if (!data.title || !data.appointmentDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    createAppointmentMutation.mutate(data);
  };

  const formatAppointmentDate = (date: Date | string) => {
    const appointmentDate = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const appointmentDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
    
    const daysDiff = Math.floor((appointmentDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let dayLabel = "";
    if (daysDiff === 0) dayLabel = "Today";
    else if (daysDiff === 1) dayLabel = "Tomorrow";
    else if (daysDiff === -1) dayLabel = "Yesterday";
    else if (daysDiff > 1) dayLabel = `In ${daysDiff} days`;
    else dayLabel = `${Math.abs(daysDiff)} days ago`;
    
    const timeStr = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = appointmentDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    
    return { dayLabel, timeStr, dateStr };
  };

  const getAppointmentStatus = (appointment: Appointment) => {
    if (appointment.isCompleted) return "completed";
    const appointmentDate = new Date(appointment.appointmentDate);
    const now = new Date();
    
    if (appointmentDate < now) return "missed";
    
    const hoursUntil = Math.floor((appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    if (hoursUntil <= 24) return "upcoming";
    
    return "scheduled";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "missed": return "bg-red-100 text-red-800";
      case "upcoming": return "bg-yellow-100 text-yellow-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed": return "Completed";
      case "missed": return "Missed";
      case "upcoming": return "Soon";
      default: return "Scheduled";
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <span>Appointments</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <span>Appointments</span>
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Schedule New Appointment</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto max-h-[calc(90vh-8rem)] px-1">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pb-4">
                    <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Appointment Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Doctor visit, dentist checkup..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provider Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select provider type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="doctor">Doctor</SelectItem>
                            <SelectItem value="dentist">Dentist</SelectItem>
                            <SelectItem value="therapist">Therapist</SelectItem>
                            <SelectItem value="specialist">Specialist</SelectItem>
                            <SelectItem value="counselor">Counselor</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="appointmentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date & Time</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
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
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Clinic name, address..." {...field} value={field.value || ""} />
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
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any additional notes..." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex space-x-2">
                    <Button 
                      type="submit" 
                      disabled={createAppointmentMutation.isPending}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      {createAppointmentMutation.isPending ? "Scheduling..." : "Schedule Appointment"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upcoming Appointments Alert */}
        {upcomingAppointments && upcomingAppointments.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                {upcomingAppointments.length} upcoming appointment{upcomingAppointments.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Appointments List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {appointments && appointments.length > 0 ? (
            appointments
              .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
              .map((appointment) => {
                const { dayLabel, timeStr, dateStr } = formatAppointmentDate(appointment.appointmentDate);
                const status = getAppointmentStatus(appointment);
                
                return (
                  <div
                    key={appointment.id}
                    className="border rounded-lg p-3 space-y-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{appointment.title}</h4>
                          <Badge className={getStatusColor(status)}>
                            {getStatusLabel(status)}
                          </Badge>
                        </div>
                        
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{dayLabel} • {dateStr}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{timeStr}</span>
                            </span>
                          </div>
                          
                          {appointment.provider && (
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <User className="w-3 h-3" />
                              <span className="capitalize">{appointment.provider}</span>
                            </div>
                          )}
                          
                          {appointment.location && (
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <MapPin className="w-3 h-3" />
                              <span>{appointment.location}</span>
                            </div>
                          )}
                          
                          {appointment.description && (
                            <p className="text-sm text-gray-600 mt-1">{appointment.description}</p>
                          )}
                        </div>
                      </div>
                      
                      {!appointment.isCompleted && status !== "missed" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => completeAppointmentMutation.mutate({ id: appointment.id, isCompleted: true })}
                          disabled={completeAppointmentMutation.isPending}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No appointments scheduled yet</p>
              <p className="text-xs text-gray-400 mt-1">Click "Add" to schedule your first appointment</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}