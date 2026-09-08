import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarSimple() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

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
        
        <Button
          onClick={() => setCurrentDate(new Date())}
          variant="outline"
        >
          Today
        </Button>
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

        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setView('month')}
            className={`px-6 py-3 font-semibold border-r border-gray-300 last:border-r-0 transition-all ${
              view === 'month' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-800 hover:bg-gray-50'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-6 py-3 font-semibold border-r border-gray-300 last:border-r-0 transition-all ${
              view === 'week' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-800 hover:bg-gray-50'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setView('day')}
            className={`px-6 py-3 font-semibold border-r border-gray-300 last:border-r-0 transition-all ${
              view === 'day' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-800 hover:bg-gray-50'
            }`}
          >
            Day
          </button>
        </div>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Calendar View: {view}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {view === 'month' && "Monthly calendar view - showing all events for the month"}
              {view === 'week' && "Weekly calendar view - showing events for the week"}
              {view === 'day' && "Daily calendar view - showing detailed events for the day"}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Current date: {currentDate.toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}