import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { formatTime, getSportColor } from "@/lib/utils";
import { useOrganization } from "@/contexts/organization-context";
import { useState } from "react";

export default function WeeklyCalendar() {
  const { organization } = useOrganization();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  if (!organization) return null;

  const { data: allClasses = [] } = useQuery({
    queryKey: ["/api/classes", { organizationId: organization?.id }],
    queryFn: () => api.getClasses({ organizationId: organization.id }),
    enabled: !!organization?.id,
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

  // Filter classes for the current week
  const weekClasses = allClasses.filter(classItem => {
    if (!classItem.startTime) return false;
    
    const classDate = new Date(classItem.startTime);
    const startOfWeek = new Date(weekDays[0]);
    const endOfWeek = new Date(weekDays[6]);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return classDate >= startOfWeek && classDate <= endOfWeek;
  });

  // Group classes by day
  const classesByDay = weekDays.map(day => {
    const dayClasses = weekClasses.filter(classItem => {
      const classDate = new Date(classItem.startTime);
      return classDate.toDateString() === day.toDateString();
    });
    return { day, classes: dayClasses };
  });

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
    <Card className="lg:col-span-2 rounded-xl">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Weekly Schedule</CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigateWeek('prev')}
              className="focus:outline-none"
              style={{
                '--hover-bg': `${organization.secondaryColor}10`,
                '--hover-color': organization.secondaryColor,
                '--focus-bg': `${organization.secondaryColor}10`,
                '--focus-color': organization.secondaryColor
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${organization.secondaryColor}10`;
                e.currentTarget.style.color = organization.secondaryColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '';
                e.currentTarget.style.color = '';
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-slate-700 min-w-[180px] text-center">
              {formatWeekRange(weekDays)}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigateWeek('next')}
              className="focus:outline-none"
              style={{
                '--hover-bg': `${organization.secondaryColor}10`,
                '--hover-color': organization.secondaryColor,
                '--focus-bg': `${organization.secondaryColor}10`,
                '--focus-color': organization.secondaryColor
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${organization.secondaryColor}10`;
                e.currentTarget.style.color = organization.secondaryColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '';
                e.currentTarget.style.color = '';
              }}
            >
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
              <div 
                key={index} 
                className={`text-center ${isToday ? 'rounded-lg p-2 border' : ''}`}
                style={isToday ? { 
                  backgroundColor: `${organization.secondaryColor}10`, 
                  borderColor: `${organization.secondaryColor}20` 
                } : {}}
              >
                <p 
                  className={`text-sm font-medium mb-2 ${isToday ? 'font-semibold' : 'text-slate-600'}`}
                  style={isToday ? { color: organization.primaryColor } : {}}
                >
                  {dayNames[index]}
                </p>
                <p 
                  className={`text-lg font-bold ${isToday ? '' : 'text-slate-800'}`}
                  style={isToday ? { color: organization.secondaryColor } : {}}
                >
                  {day.getDate()}
                </p>
              </div>
            );
          })}
        </div>
        
        {/* Week Summary */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700">
            Classes This Week ({weekClasses.length})
          </h4>
          
          {weekClasses.length > 0 ? (
            weekClasses.map((classItem) => {
              const startTime = new Date(classItem.startTime);
              const endTime = new Date(classItem.endTime);
              const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              
              return (
                <div
                  key={classItem.id}
                  className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg border-l-4"
                  style={{ borderLeftColor: organization.secondaryColor }}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: organization.secondaryColor }}
                  ></div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{classItem.name}</p>
                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      <span>{dayNames[startTime.getDay()]}</span>
                      <span>{startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - {endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                      <span>{classItem.sport?.name || 'Sport'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">
                      0/{classItem.capacity}
                    </p>
                    <p className="text-xs text-slate-600">participants</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-600">
              <p>No classes scheduled for this week</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
