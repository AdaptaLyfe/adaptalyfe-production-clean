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
import { FieldLabel } from "@/components/ui/field-label";
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
import {
  getCalendarEventDateKey,
  formatLocalCalendarDate,
} from "@/lib/calendar-date";
import { getCalendarEventDisplayFields } from "@/lib/calendar-event-display";
import { buildCalendarEventPayload } from "@/lib/calendar-event-payload";
import { isDailyTaskScheduledForDate } from "@/lib/daily-task-schedule";
import { isDailyTaskCompletedForDate } from "@/lib/daily-task-completion";
import { formatCategoryLabel } from "@/lib/display-labels";
import { useSubscriptionEnforcement } from "@/middleware/subscription-middleware";
import PremiumFeaturePrompt from "@/components/premium-feature-prompt";
import type { DailyTask, Bill, Appointment, MoodEntry, CalendarEvent } from "@shared/schema";
import { EventPreparationCard } from "@/components/ai-ready";

// Some records (e.g. appointments) store dates as free text. Never let one
// unparseable value crash the whole calendar: invalid dates are skipped.
function parseCalendarValue(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value as string | number);
  return Number.isNaN(date.getTime()) ? null : date;
}

function safeDateKey(value: unknown): string | null {
  const date = parseCalendarValue(value);
  return date ? formatLocalCalendarDate(date) : null;
}

function safeTimeLabel(value: unknown): string | null {
  const date = parseCalendarValue(value);
  return date ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;
}

function asList<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

type CalendarDailyTask = DailyTask & {
  completionDates?: string[];
};

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
  const [currentDate, setCurrentDate] = useState(new Date());
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

  const { data: tasksData } = useQuery<CalendarDailyTask[]>({
    queryKey: ["/api/daily-tasks"],
  });
  const tasks = asList<CalendarDailyTask>(tasksData);

  const { data: billsData } = useQuery<Bill[]>({
    queryKey: ["/api/bills"],
  });
  const bills = asList<Bill>(billsData);

  const { data: appointmentsData } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });
  const appointments = asList<Appointment>(appointmentsData);

  const { data: moodEntriesData } = useQuery<MoodEntry[]>({
    queryKey: ["/api/mood-entries"],
  });
  const moodEntries = asList<MoodEntry>(moodEntriesData);

  const { data: calendarEventsData } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar-events"],
  });
  const calendarEvents = asList<CalendarEvent>(calendarEventsData);

  // Calendar event creation mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const payload = buildCalendarEventPayload(eventData);

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
    const dateStr = formatLocalCalendarDate(date);
    const events: any[] = [];

    // Add calendar events
    calendarEvents.forEach(event => {
      if (!parseCalendarValue(event.startDate)) return;
      const display = getCalendarEventDisplayFields(event);
      if (display.dateKey === dateStr) {
        events.push({
          id: `event-${event.id}`,
          type: 'event',
          title: event.title,
          time: display.time,
          allDay: display.allDay,
          completed: event.isCompleted,
          category: event.category,
          icon: CalendarIcon,
          color: event.isCompleted ? 'text-green-600' : 'text-blue-600',
          location: event.location
        });
      }
    });

    // Add daily task occurrences only on dates where the task is scheduled.
    tasks.forEach(task => {
      if (isDailyTaskScheduledForDate(task, dateStr) && (task.frequency === 'daily' || !task.frequency)) {
        const completedForDate = isDailyTaskCompletedForDate(task, dateStr);
        events.push({
          id: `task-${task.id}`,
          type: 'task',
          title: task.title,
          time: null,
          completed: completedForDate,
          category: formatCategoryLabel(task.category || 'daily'),
          icon: completedForDate ? CheckCircle : Circle,
          color: completedForDate ? 'text-green-600' : 'text-blue-600'
        });
      }
    });

    // Weekly and monthly tasks with due dates
    tasks.forEach(task => {
      if (task.frequency !== 'daily' && parseCalendarValue(task.dueDate)) {
        const taskDate = getCalendarEventDateKey(task.dueDate as Date | string);
        if (taskDate === dateStr && isDailyTaskScheduledForDate(task, dateStr)) {
          events.push({
            id: `scheduled-task-${task.id}`,
            type: 'task',
            title: task.title,
            time: safeTimeLabel(task.dueDate),
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
      // Bill dueDate is a day of the month (1-31); show it on that day each month.
      const dueDay = Number(bill.dueDate);
      if (Number.isInteger(dueDay) && dueDay >= 1 && dueDay <= 31) {
        const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        if (date.getDate() === Math.min(dueDay, lastDayOfMonth)) {
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
      return safeDateKey(appointment.appointmentDate) === dateStr;
    });
    dayAppointments.forEach(appointment => {
      events.push({
        id: `appointment-${appointment.id}`,
        type: 'appointment',
        title: appointment.title,
        time: safeTimeLabel(appointment.appointmentDate),
        completed: appointment.isCompleted,
        category: appointment.provider || 'appointment',
        icon: CalendarIcon,
        color: appointment.isCompleted ? 'text-green-600' : 'text-purple-600'
      });
    });

    // Mood entries
    const dayMood = moodEntries.find(mood => {
      return safeDateKey(mood.entryDate) === dateStr;
    });
    if (dayMood) {
      const moodEmojis = ['😢', '😐', '😊', '😃', '🤩'];
      events.push({
        id: `mood-${dayMood.id}`,
        type: 'mood',
        title: `Mood: ${moodEmojis[dayMood.mood - 1] ?? '🙂'}`,
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
          className={`min-h-36 p-3 border border-slate-100 cursor-pointer hover:bg-violet-50/40 transition-colors ${
            isCurrentMonth ? 'bg-white' : 'bg-slate-50/70'
          } ${isToday ? 'ring-2 ring-inset ring-violet-400 bg-violet-50/60' : ''}`}
          onClick={() => {
            setCurrentDate(clickDate);
            setView('day');
          }}
          title={`Click to view ${dayEvents.length} events for ${clickDate.toLocaleDateString()}`}
        >
          <div className={`mb-3 inline-flex h-8 min-w-8 items-center justify-center rounded-full px-1.5 text-base font-bold ${
            isCurrentMonth ? 'text-slate-900' : 'text-slate-400'
          } ${isToday ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white' : ''}`}>
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
                  event.type === 'task' ? 'bg-indigo-50 text-indigo-800 border-indigo-400 hover:bg-indigo-100' :
                  event.type === 'bill' ? 'bg-red-50 text-red-800 border-red-400 hover:bg-red-100' :
                  event.type === 'appointment' ? 'bg-purple-50 text-purple-800 border-purple-400 hover:bg-purple-100' :
                  event.type === 'event' ? 'bg-sky-50 text-sky-800 border-sky-400 hover:bg-sky-100' :
                  'bg-pink-50 text-pink-800 border-pink-400 hover:bg-pink-100'
                }`}
                title={`${event.title}${event.time ? ` at ${event.time}` : ''}${event.location ? ` - ${event.location}` : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="truncate flex-1">{event.title}</div>
                  {event.allDay ? (
                    <div className="ml-1 text-xs opacity-70 font-normal">All day</div>
                  ) : event.time && (
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
              <div className="text-xs text-violet-700 font-semibold bg-violet-50 px-2 py-1 rounded-md text-center">
                +{dayEvents.length - 3} more events
              </div>
            )}
          </div>
        </div>
      );
      
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return (
      <div className="grid min-w-[760px] grid-cols-7 gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-slate-50 p-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-4xl mx-auto">
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-violet-50 to-fuchsia-50">
          <h3 className="text-lg font-bold text-slate-900 mb-1">
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
                className={`border-b border-slate-100 last:border-b-0 ${isToday ? 'bg-violet-50/60' : 'hover:bg-slate-50'} transition-colors`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className={`text-center ${isToday ? 'text-violet-700' : 'text-slate-900'}`}>
                        <div className="text-2xl font-bold">{day.getDate()}</div>
                        <div className="text-xs font-medium">
                          {day.toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                      </div>
                      <div>
                        <div className={`text-lg font-bold ${isToday ? 'text-violet-700' : 'text-slate-900'}`}>
                          {day.toLocaleDateString('en-US', { weekday: 'long' })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {events.length} {events.length === 1 ? 'event' : 'events'} scheduled
                        </div>
                      </div>
                    </div>
                    {isToday && (
                      <div className="px-3 py-1 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-semibold rounded-full">
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
                          className={`p-4 rounded-xl text-white font-medium cursor-pointer hover:opacity-90 transition-all hover:-translate-y-0.5 shadow-sm border-l-4 ${
                            event.type === 'task' ? 'bg-indigo-600 border-indigo-300' :
                            event.type === 'bill' ? 'bg-red-600 border-red-400' :
                            event.type === 'appointment' ? 'bg-purple-600 border-purple-400' :
                            event.type === 'event' ? 'bg-sky-600 border-sky-300' :
                            'bg-pink-600 border-pink-400'
                          }`}
                          title={`${event.title}${event.time ? ` at ${event.time}` : ''}${event.location ? ` - ${event.location}` : ''}`}
                        >
                          <div className="font-bold mb-2 leading-tight">{event.title}</div>
                          <div className="space-y-1">
                            {event.allDay ? (
                              <div className="text-sm opacity-90">All day</div>
                            ) : event.time && (
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
      <Card className={`rounded-2xl border border-slate-200 shadow-sm ${isToday ? 'ring-2 ring-violet-400' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {events.length > 0 && (
            <EventPreparationCard
              title={events[0].title}
              time={events[0].time || undefined}
              detail="See the day's related steps before moving into the next activity."
              steps={events.slice(0, 4).map((event) => ({
                id: event.id,
                label: event.title,
                completed: Boolean(event.completed),
                detail: event.time || undefined,
              }))}
            />
          )}
          {events.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No events scheduled for this day</p>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl bg-white hover:border-violet-200 hover:bg-violet-50/40 transition-colors"
              >
                <event.icon className={`w-5 h-5 ${event.color}`} />
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{event.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {event.allDay ? (
                      <Badge variant="outline" className="text-xs">All day</Badge>
                    ) : event.time && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {event.time}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {event.category}
                    </Badge>
                    {event.completed && (
                      <Badge variant="default" className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <CalendarIcon className="w-6 h-6" />
          </span>
          Calendar
        </h1>
        
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-4">
          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 rounded-xl px-5 font-semibold border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 hover:brightness-110">
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent
              overlayClassName="z-[110]"
              className="z-[120] max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain"
            >
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
                    <FieldLabel required className="text-sm font-medium">Start Date</FieldLabel>
                    <Input
                      type="date"
                      value={newEvent.startDate}
                      onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <FieldLabel optional className="text-sm font-medium">Start Time</FieldLabel>
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
                  <FieldLabel optional className="text-sm font-medium">All Day Event</FieldLabel>
                </div>
                <Select value={newEvent.category} onValueChange={(value) => setNewEvent({ ...newEvent, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="z-[130]">
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
                    className="flex-1 h-11 rounded-xl font-semibold border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 hover:brightness-110"
                  >
                    {createEventMutation.isPending ? "Creating..." : "Create Event"}
                  </Button>
                  <Button onClick={() => setIsAddEventOpen(false)} variant="outline" className="flex-1 h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            onClick={() => setCurrentDate(new Date())}
            variant="outline"
            className="h-10 rounded-xl border-slate-200 bg-white px-5 font-semibold text-slate-700 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
          >
            Today
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start sm:gap-4">
          <Button
            onClick={() => navigateDate('prev')}
            variant="outline"
            size="sm"
            className="h-9 w-9 rounded-full border-slate-200 p-0 text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <h2 className="text-xl font-bold text-slate-900">
            {formatHeaderDate()}
          </h2>
          
          <Button
            onClick={() => navigateDate('next')}
            variant="outline"
            size="sm"
            className="h-9 w-9 rounded-full border-slate-200 p-0 text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1.5 shadow-sm min-w-fit">
            <button
              onClick={() => setView('month')}
              className={`rounded-full px-5 sm:px-6 py-2 text-sm font-semibold min-w-[80px] whitespace-nowrap transition-all ${
                view === 'month' 
                  ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`rounded-full px-5 sm:px-6 py-2 text-sm font-semibold min-w-[80px] whitespace-nowrap transition-all ${
                view === 'week' 
                  ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`rounded-full px-5 sm:px-6 py-2 text-sm font-semibold min-w-[80px] whitespace-nowrap transition-all ${
                view === 'day' 
                  ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 overflow-x-auto pb-1">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>

      {/* Legend */}
      <Card className="rounded-2xl border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-indigo-600" />
              <span className="text-sm text-slate-700">Daily Tasks</span>
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