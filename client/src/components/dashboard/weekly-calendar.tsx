import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { formatTime, getSportColor } from "@/lib/utils";
import { useState } from "react";

export default function WeeklyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: todayClasses = [] } = useQuery({
    queryKey: ["/api/classes", { date: currentDate.toISOString().split('T')[0] }],
    queryFn: () => api.getClasses({ date: currentDate.toISOString().split('T')[0] }),
  });

  const getWeekDays = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Start from Monday

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }

    return week;
  };

  const weekDays = getWeekDays(currentDate);
  const today = new Date();

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const formatWeekRange = (days: Date[]) => {
    const start = days[0];
    const end = days[6];
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${end.getFullYear()}`;
  };

  return (
    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Weekly Schedule</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground min-w-[180px] text-center">
              {formatWeekRange(weekDays)}
            </span>
            <Button variant="ghost" size="sm" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-4 mb-4">
          {weekDays.map((day, index) => {
            const isToday = day.toDateString() === today.toDateString();
            const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            
            return (
              <div key={index} className={`text-center ${isToday ? 'bg-primary/10 rounded-lg p-2' : ''}`}>
                <p className={`text-sm font-medium mb-2 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {dayNames[index]}
                </p>
                <p className={`text-lg font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                  {day.getDate()}
                </p>
              </div>
            );
          })}
        </div>
        
        {/* Today's Classes */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">
            {currentDate.toDateString() === today.toDateString() ? "Today's Classes" : "Classes for " + currentDate.toLocaleDateString()}
          </h4>
          
          {todayClasses.length > 0 ? (
            todayClasses.map((classItem) => {
              const sportColor = getSportColor(classItem.sport?.name || '');
              
              return (
                <div
                  key={classItem.id}
                  className={`flex items-center space-x-4 p-4 bg-${sportColor}/5 rounded-lg border-l-4 border-${sportColor}`}
                >
                  <div className={`w-3 h-3 bg-${sportColor} rounded-full`}></div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{classItem.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">
                      {classItem.bookingCount}/{classItem.capacity}
                    </p>
                    <p className="text-xs text-muted-foreground">participants</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No classes scheduled for this day</p>
            </div>
          )}
        </div>
      </CardContent>
    </div>
  );
}
