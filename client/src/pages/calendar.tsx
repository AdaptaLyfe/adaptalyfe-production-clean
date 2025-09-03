import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  DollarSign, 
  Heart, 
  CheckCircle,
  Circle,
  AlertTriangle,
  Plus,
  MapPin
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useSubscriptionEnforcement } from "@/middleware/subscription-middleware";
import PremiumFeaturePrompt from "@/components/premium-feature-prompt";
import type { DailyTask, Bill, Appointment, MoodEntry, CalendarEvent } from "@shared/schema";

export default function Calendar() {
  const { isPremiumUser } = useSubscriptionEnforcement();
  
  // Block access if trial expired and no active subscription
  if (!isPremiumUser) {
    return (
      <div className="container mx-auto p-6">
        <PremiumFeaturePrompt
          title="Calendar & Scheduling"
          description="View and manage all your appointments, tasks, and events in one integrated calendar. Subscribe to continue using Adaptalyfe's scheduling features."
          feature="calendar"
          requiredPlan="premium"
          className="max-w-md mx-auto mt-20"
        />
      </div>
    );
  }
  const [currentDate, setCurrentDate] = useState(new Date('2025-07-08'));
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    allDay: false,
    category: "personal",
    color: "#3b82f6",
    location: "",
    reminderMinutes: 15
  });

  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery<DailyTask[]>({
    queryKey: ["/api/daily-tasks"],
  });

  const { data: bills = [] } = useQuery<Bill[]>({
    queryKey: ["/api/bills"],
  });

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: moodEntries = [] } = useQuery<MoodEntry[]>({
    queryKey: ["/api/mood-entries"],
  });

  const { data: calendarEvents = [] } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar-events"],
  });

  // Calendar event creation mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      let startDateTime;
      
      if (newEvent.allDay) {
        // For all-day events, use the date without time
        startDateTime = `${eventData.startDate}T00:00:00`;
      } else {
        // For timed events, combine date and time in local timezone
        const timeStr = eventData.startTime || '12:00';
        startDateTime = `${eventData.startDate}T${timeStr}:00`;
      }
      
      let endDateTime = null;
      if (eventData.endDate && eventData.endTime) {
        endDateTime = `${eventData.endDate}T${eventData.endTime}:00`;
      }

      const payload = {
        title: eventData.title,
        description: eventData.description || "",
        startDate: startDateTime,
        endDate: endDateTime,
        allDay: eventData.allDay,
        category: eventData.category,
        color: eventData.color,
        location: eventData.location || "",
        reminderMinutes: eventData.reminderMinutes || 15
      };

      console.log("Creating calendar event with payload:", payload);
      return apiRequest("POST", "/api/calendar-events", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      setIsAddEventOpen(false);
      setNewEvent({
        title: "",
        description: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        allDay: false,
        category: "personal",
        color: "#3b82f6",
        location: "",
        reminderMinutes: 15
      });
    },
  });

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentDate(newDate);
  };

  const handleCreateEvent = () => {
    if (!newEvent.title.trim() || !newEvent.startDate) {
      return;
    }
    createEventMutation.mutate(newEvent);
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const events: any[] = [];

    // Add calendar events
    calendarEvents.forEach(event => {
      // Parse the stored date properly considering it's in local timezone
      const eventDate = event.startDate.split('T')[0];
      if (eventDate === dateStr) {
        let displayTime = null;
        if (!event.allDay) {
          // Create a new date object for proper time display
          const eventDateTime = new Date(event.startDate);
          displayTime = eventDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        events.push({
          id: `event-${event.id}`,
          type: 'event',
          title: event.title,
          time: displayTime,
          completed: event.isCompleted,
          category: event.category,
          icon: CalendarIcon,
          color: event.isCompleted ? 'text-green-600' : 'text-blue-600',
          location: event.location
        });
      }
    });

    // Add daily tasks to every day
    tasks.forEach(task => {
      if (task.frequency === 'daily' || !task.frequency) {
        events.push({
          id: `task-${task.id}`,
          type: 'task',
          title: task.title,
          time: null,
          completed: task.isCompleted,
          category: task.category || 'daily',
          icon: task.isCompleted ? CheckCircle : Circle,
          color: task.isCompleted ? 'text-green-600' : 'text-blue-600'
        });
      }
    });

    // Weekly and monthly tasks with due dates
    tasks.forEach(task => {
      if (task.dueDate) {
        const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
        if (taskDate === dateStr) {
          events.push({
            id: `scheduled-task-${task.id}`,
            type: 'task',
            title: task.title,
            time: task.dueDate ? new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
            completed: task.isCompleted,
            category: task.frequency || 'scheduled',
            icon: task.isCompleted ? CheckCircle : AlertTriangle,
            color: task.isCompleted ? 'text-green-600' : 'text-orange-600'
          });
        }
      }
    });

    // Bills - check if bill has due date and matches current date
    bills.forEach(bill => {
      if (bill.dueDate) {
        const billDate = new Date(bill.dueDate).toISOString().split('T')[0];
        if (billDate === dateStr) {
          events.push({
            id: `bill-${bill.id}`,
            type: 'bill',
            title: `${bill.name} - $${bill.amount}`,
            time: null,
            completed: bill.isPaid,
            category: 'financial',
            icon: DollarSign,
            color: bill.isPaid ? 'text-green-600' : 'text-red-600'
          });
        }
      }
    });

    // Appointments
    const dayAppointments = appointments.filter(appointment => {
      const apptDate = new Date(appointment.appointmentDate).toISOString().split('T')[0];
      return apptDate === dateStr;
    });
    dayAppointments.forEach(appointment => {
      events.push({
        id: `appointment-${appointment.id}`,
        type: 'appointment',
        title: appointment.title,
        time: new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        completed: appointment.isCompleted,
        category: appointment.provider || 'appointment',
        icon: CalendarIcon,
        color: appointment.isCompleted ? 'text-green-600' : 'text-purple-600'
      });
    });

    // Mood entries
    const dayMood = moodEntries.find(mood => {
      if (!mood.entryDate) return false;
      const moodDate = new Date(mood.entryDate).toISOString().split('T')[0];
      return moodDate === dateStr;
    });
    if (dayMood) {
      const moodEmojis = ['😢', '😐', '😊', '😃', '🤩'];
      events.push({
        id: `mood-${dayMood.id}`,
        type: 'mood',
        title: `Mood: ${moodEmojis[dayMood.mood - 1]}`,
        time: null,
        completed: true,
        category: 'wellness',
        icon: Heart,
        color: 'text-pink-600'
      });
    }

    return events.sort((a, b) => {
      const timeA = a.time || '';
      const timeB = b.time || '';
      if (typeof timeA === 'string' && typeof timeB === 'string') {
        return timeA.localeCompare(timeB);
      }
      if (timeA && !timeB) return -1;
      if (!timeA && timeB) return 1;
      return 0;
    });
  };

  const renderMonthView = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDay = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dayEvents = getEventsForDate(currentDay);
      const isCurrentMonth = currentDay.getMonth() === currentDate.getMonth();
      const isToday = currentDay.toDateString() === new Date().toDateString();
      
      // Capture the current day date to avoid closure issues
      const clickDate = new Date(currentDay);
      
      days.push(
        <div
          key={i}
          className={`min-h-36 p-3 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
            isCurrentMonth ? 'bg-white' : 'bg-gray-50'
          } ${isToday ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
          onClick={() => {
            setCurrentDate(clickDate);
            setView('day');
          }}
          title={`Click to view ${dayEvents.length} events for ${clickDate.toLocaleDateString()}`}
        >
          <div className={`text-lg font-bold mb-3 ${
            isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
          } ${isToday ? 'text-blue-700' : ''}`}>
            {currentDay.getDate()}
          </div>
          <div className="space-y-1.5">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent day click when clicking event
                  if (event.type === 'event') {
                    setCurrentDate(clickDate);
                    setView('day');
                  }
                }}
                className={`text-xs px-2 py-1 rounded-md font-medium cursor-pointer hover:shadow-sm transition-all duration-200 border-l-2 ${
                  event.type === 'task' ? 'bg-blue-50 text-blue-800 border-blue-400 hover:bg-blue-100' :
                  event.type === 'bill' ? 'bg-red-50 text-red-800 border-red-400 hover:bg-red-100' :
                  event.type === 'appointment' ? 'bg-purple-50 text-purple-800 border-purple-400 hover:bg-purple-100' :
                  event.type === 'event' ? 'bg-indigo-50 text-indigo-800 border-indigo-400 hover:bg-indigo-100' :
                  'bg-pink-50 text-pink-800 border-pink-400 hover:bg-pink-100'
                }`}
                title={`${event.title}${event.time ? ` at ${event.time}` : ''}${event.location ? ` - ${event.location}` : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="truncate flex-1">{event.title}</div>
                  {event.time && (
                    <div className="ml-1 text-xs opacity-70 font-normal">
                      {event.time}
                    </div>
                  )}
                </div>
                {event.completed && (
                  <div className="text-xs opacity-60 mt-0.5">✓ Completed</div>
                )}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500 font-semibold bg-gray-100 px-2 py-1 rounded-md text-center">
                +{dayEvents.length - 3} more events
              </div>
            )}
          </div>
        </div>
      );
      
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-100 p-3 text-center font-semibold text-gray-700 border-b border-gray-200">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }

    return (
      <div className="bg-white rounded-lg border max-w-4xl mx-auto">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Week of {startOfWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
          <p className="text-sm text-gray-600">
            {startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {
              (() => {
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                return endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              })()
            }
          </p>
        </div>
        
        <div className="space-y-1">
          {weekDays.map((day) => {
            const events = getEventsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div 
                key={day.toISOString()} 
                className={`border-b last:border-b-0 ${isToday ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className={`text-center ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>
                        <div className="text-2xl font-bold">{day.getDate()}</div>
                        <div className="text-xs font-medium">
                          {day.toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                      </div>
                      <div>
                        <div className={`text-lg font-bold ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>
                          {day.toLocaleDateString('en-US', { weekday: 'long' })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {events.length} {events.length === 1 ? 'event' : 'events'} scheduled
                        </div>
                      </div>
                    </div>
                    {isToday && (
                      <div className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        Today
                      </div>
                    )}
                  </div>
                  
                  {events.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {events.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => {
                            if (event.type === 'event') {
                              setCurrentDate(day);
                              setView('day');
                            }
                          }}
                          className={`p-4 rounded-lg text-white font-medium cursor-pointer hover:opacity-90 transition-all hover:scale-105 shadow-sm border-l-4 ${
                            event.type === 'task' ? 'bg-blue-600 border-blue-400' :
                            event.type === 'bill' ? 'bg-red-600 border-red-400' :
                            event.type === 'appointment' ? 'bg-purple-600 border-purple-400' :
                            event.type === 'event' ? 'bg-indigo-600 border-indigo-400' :
                            'bg-pink-600 border-pink-400'
                          }`}
                          title={`${event.title}${event.time ? ` at ${event.time}` : ''}${event.location ? ` - ${event.location}` : ''}`}
                        >
                          <div className="font-bold mb-2 leading-tight">{event.title}</div>
                          <div className="space-y-1">
                            {event.time && (
                              <div className="text-sm opacity-90 flex items-center gap-2">
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                <span>{event.time}</span>
                              </div>
                            )}
                            {event.location && (
                              <div className="text-sm opacity-90 flex items-center gap-2">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-xs opacity-75 mt-2 capitalize">
                            {event.type === 'task' ? 'Daily Task' :
                             event.type === 'bill' ? 'Bill Due' :
                             event.type === 'appointment' ? 'Appointment' :
                             event.type === 'event' ? 'Event' : 'Other'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <div className="text-sm font-medium">No events scheduled</div>
                      <div className="text-xs mt-1">Free day to relax!</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const events = getEventsForDate(currentDate);
    const isToday = currentDate.toDateString() === new Date().toDateString();

    return (
      <Card className={isToday ? 'ring-2 ring-blue-500' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {events.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No events scheduled for this day</p>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <event.icon className={`w-5 h-5 ${event.color}`} />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{event.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {event.time && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {event.time}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {event.category}
                    </Badge>
                    {event.completed && (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                        Complete
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    );
  };

  const formatHeaderDate = () => {
    if (view === 'month') {
      return currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    } else if (view === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <CalendarIcon className="w-8 h-8 text-blue-600" />
          Calendar
        </h1>
        
        <div className="flex items-center gap-4">
          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Event title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={newEvent.startDate}
                      onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Start Time</label>
                    <Input
                      type="time"
                      disabled={newEvent.allDay}
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={newEvent.allDay}
                    onCheckedChange={(checked) => setNewEvent({ ...newEvent, allDay: !!checked })}
                  />
                  <label className="text-sm font-medium">All Day Event</label>
                </div>
                <Select value={newEvent.category} onValueChange={(value) => setNewEvent({ ...newEvent, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Location (optional)"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                />
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleCreateEvent} 
                    disabled={createEventMutation.isPending} 
                    className="flex-1 bg-vibrant-green hover:bg-green-600 text-black font-bold border-2 border-green-700 shadow-lg"
                  >
                    {createEventMutation.isPending ? "Creating..." : "Create Event"}
                  </Button>
                  <Button onClick={() => setIsAddEventOpen(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            onClick={() => setCurrentDate(new Date())}
            variant="outline"
          >
            Today
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigateDate('prev')}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <h2 className="text-xl font-semibold text-gray-800">
            {formatHeaderDate()}
          </h2>
          
          <Button
            onClick={() => navigateDate('next')}
            variant="outline"
            size="sm"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-1 border border-gray-300 rounded-lg overflow-hidden min-w-fit">
            <button
              onClick={() => setView('month')}
              className={`px-6 sm:px-8 py-3 font-semibold min-w-[90px] sm:min-w-[100px] whitespace-nowrap transition-all ${
                view === 'month' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-800 hover:bg-gray-50'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-6 sm:px-8 py-3 font-semibold min-w-[90px] sm:min-w-[100px] whitespace-nowrap border-l border-r border-gray-300 transition-all ${
                view === 'week' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-800 hover:bg-gray-50'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-6 sm:px-8 py-3 font-semibold min-w-[90px] sm:min-w-[100px] whitespace-nowrap transition-all ${
                view === 'day' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-800 hover:bg-gray-50'
              }`}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Daily Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-red-600" />
              <span className="text-sm">Bills</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-purple-600" />
              <span className="text-sm">Appointments</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-600" />
              <span className="text-sm">Mood Check-ins</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}