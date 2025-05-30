import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { api, type Class, type User, type AttendanceRecord } from "@/lib/api";
import { formatTime, formatDate, formatCurrency } from "@/lib/utils";
import { 
  Calendar, 
  Users, 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  UserCheck,
  Bell,
  Menu,
  Search,
  Plus,
  ChevronRight,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MobileCoachProps {
  user: User;
}

export default function MobileCoach({ user }: MobileCoachProps) {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch coach's classes
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes', { coachId: user.id }],
    queryFn: () => api.getClasses({ coachId: user.id }),
  });

  // Fetch attendance for selected class
  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['/api/attendance', selectedClassId],
    queryFn: () => selectedClassId ? api.getAttendance(selectedClassId) : Promise.resolve([]),
    enabled: !!selectedClassId,
  });

  const markAttendanceMutation = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: number; status: 'present' | 'absent' }) =>
      api.markAttendance({
        classId: selectedClassId!,
        bookingId,
        status,
        markedBy: user.id,
        markedAt: new Date().toISOString()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance', selectedClassId] });
      toast({ title: "Attendance updated", description: "Student attendance has been marked." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update attendance.", variant: "destructive" });
    }
  });

  const upcomingClasses = classes?.filter(cls => new Date(cls.startTime) > new Date()) || [];
  const todayClasses = classes?.filter(cls => {
    const classDate = new Date(cls.startTime);
    const today = new Date();
    return classDate.toDateString() === today.toDateString();
  }) || [];

  const filteredAttendance = attendance?.filter(record =>
    record.booking?.participantName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">Coach Portal</h1>
              <p className="text-sm text-gray-500">Welcome, {user.firstName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 bg-white">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{todayClasses.length}</div>
            <div className="text-xs text-gray-500">Today's Classes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{upcomingClasses.length}</div>
            <div className="text-xs text-gray-500">Upcoming</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {attendance?.filter(a => a.attendance.status === 'present').length || 0}
            </div>
            <div className="text-xs text-gray-500">Present Today</div>
          </div>
        </div>
      </div>

      {/* Mobile Tabs */}
      <Tabs defaultValue="classes" className="w-full">
        <TabsList className="w-full h-12 bg-white border-b border-gray-200 rounded-none p-0">
          <TabsTrigger value="classes" className="flex-1 h-12 rounded-none">
            <Calendar className="h-4 w-4 mr-2" />
            Classes
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex-1 h-12 rounded-none">
            <Activity className="h-4 w-4 mr-2" />
            Attendance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classes" className="mt-0 p-4 space-y-4">
          {/* Today's Classes */}
          {todayClasses.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Today's Classes</h2>
              <div className="space-y-3">
                {todayClasses.map((cls) => (
                  <Card key={cls.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                        <Badge variant={new Date(cls.startTime) < new Date() ? "default" : "secondary"}>
                          {cls.sport?.name}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(cls.startTime)} - {formatTime(cls.endTime)}</span>
                        </div>
                        {cls.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{cls.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{cls.bookingCount} students booked</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setSelectedClassId(cls.id)}
                        >
                          Take Attendance
                        </Button>
                        <Button variant="outline" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Classes */}
          <div>
            <h2 className="text-lg font-semibold mb-3 text-gray-900">Upcoming Classes</h2>
            <div className="space-y-3">
              {upcomingClasses.slice(0, 5).map((cls) => (
                <Card key={cls.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                      <Badge variant="outline">{cls.sport?.name}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(cls.startTime)} at {formatTime(cls.startTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{cls.bookingCount}/{cls.capacity} students</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(cls.bookingCount / cls.capacity) * 100}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="fixed bottom-20 right-4">
            <Button size="lg" className="rounded-full w-14 h-14 shadow-lg">
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-0 p-4">
          {/* Class Selection */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-900">Select Class</h2>
            <div className="space-y-2">
              {todayClasses.map((cls) => (
                <Button
                  key={cls.id}
                  variant={selectedClassId === cls.id ? "default" : "outline"}
                  className="w-full justify-start h-auto p-3"
                  onClick={() => setSelectedClassId(cls.id)}
                >
                  <div className="text-left">
                    <div className="font-semibold">{cls.name}</div>
                    <div className="text-sm opacity-70">{formatTime(cls.startTime)} • {cls.bookingCount} students</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {selectedClassId && (
            <>
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Attendance List */}
              <div className="space-y-3">
                {attendanceLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading attendance...</p>
                  </div>
                ) : filteredAttendance.length > 0 ? (
                  filteredAttendance.map((record) => (
                    <Card key={record.booking?.id} className="border-l-4 border-l-gray-300">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {record.booking?.participantName}
                            </h3>
                            <p className="text-sm text-gray-600">{record.booking?.participantEmail}</p>
                            {record.attendance.status !== 'pending' && (
                              <p className="text-xs text-gray-500 mt-1">
                                Marked at {new Date(record.attendance.markedAt!).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={record.attendance.status === 'present' ? "default" : "outline"}
                              className="px-3"
                              onClick={() => markAttendanceMutation.mutate({
                                bookingId: record.booking!.id,
                                status: 'present'
                              })}
                              disabled={markAttendanceMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={record.attendance.status === 'absent' ? "destructive" : "outline"}
                              className="px-3"
                              onClick={() => markAttendanceMutation.mutate({
                                bookingId: record.booking!.id,
                                status: 'absent'
                              })}
                              disabled={markAttendanceMutation.isPending}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Badge 
                            variant={
                              record.attendance.status === 'present' ? 'default' :
                              record.attendance.status === 'absent' ? 'destructive' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {record.attendance.status.charAt(0).toUpperCase() + record.attendance.status.slice(1)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No students found</p>
                  </div>
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Bottom Navigation Space */}
      <div className="h-16"></div>
    </div>
  );
}