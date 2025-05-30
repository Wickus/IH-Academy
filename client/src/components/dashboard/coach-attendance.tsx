import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  MonitorSmartphone, 
  Download, 
  Mail, 
  CreditCard, 
  PieChart, 
  Check, 
  X,
  Clock,
  User,
  Users,
  Shield
} from "lucide-react";
import { api } from "@/lib/api";
import { formatTime, formatCurrency, getAttendanceStatusColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function CoachAttendance() {
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const { toast } = useToast();

  // Get today's classes
  const today = new Date().toISOString().split('T')[0];
  const { data: todayClasses = [] } = useQuery({
    queryKey: ["/api/classes", { date: today }],
    queryFn: () => api.getClasses({ date: today }),
  });

  // Get attendance for selected class
  const { data: attendance = [] } = useQuery({
    queryKey: ["/api/attendance", selectedClass],
    queryFn: () => selectedClass ? api.getAttendance(selectedClass) : Promise.resolve([]),
    enabled: !!selectedClass,
  });

  // Get payment stats
  const { data: bookings = [] } = useQuery({
    queryKey: ["/api/bookings", { recent: 100 }],
    queryFn: () => api.getBookings({ recent: 100 }),
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: (data: { classId: number; bookingId: number; status: 'present' | 'absent' }) =>
      api.markAttendance({ ...data, markedBy: 1 }), // Using admin user ID
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({
        title: "Attendance marked",
        description: "Participant attendance has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark attendance. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update attendance mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: (data: { id: number; status: 'present' | 'absent' }) =>
      api.updateAttendance(data.id, data.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({
        title: "Attendance updated",
        description: "Participant attendance has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update attendance. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleMarkAttendance = (bookingId: number, status: 'present' | 'absent') => {
    if (!selectedClass) return;
    
    markAttendanceMutation.mutate({
      classId: selectedClass,
      bookingId,
      status,
    });
  };

  const handleUpdateAttendance = (attendanceId: number, status: 'present' | 'absent') => {
    updateAttendanceMutation.mutate({
      id: attendanceId,
      status,
    });
  };

  const handleDownloadIcal = async (bookingId: number) => {
    try {
      await api.downloadIcal(bookingId);
      toast({
        title: "Download started",
        description: "iCal file download has been initiated.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download iCal file. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate payment stats
  const totalCollected = bookings
    .filter(b => b.paymentStatus === 'confirmed')
    .reduce((sum, b) => sum + Number(b.amount), 0);
  
  const pendingPayments = bookings
    .filter(b => b.paymentStatus === 'pending')
    .reduce((sum, b) => sum + Number(b.amount), 0);

  const processingFee = totalCollected * 0.035; // 3.5% processing fee

  // Find current class (first one in progress or next upcoming)
  const currentClass = todayClasses.find(cls => {
    const now = new Date();
    const startTime = new Date(cls.startTime);
    const endTime = new Date(cls.endTime);
    return now >= startTime && now <= endTime;
  }) || todayClasses[0];

  // Auto-select current class
  if (currentClass && selectedClass !== currentClass.id) {
    setSelectedClass(currentClass.id);
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Coach Attendance Register</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-secondary hover:bg-secondary/90 text-white">
                <MonitorSmartphone className="mr-2 h-4 w-4" />
                Mobile View
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Mobile Attendance Interface</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Access the mobile-optimized attendance interface for coaches to mark attendance on-the-go.
                </p>
                <Button className="w-full bg-secondary hover:bg-secondary/90 text-white">
                  Open Mobile Interface
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Current Class Attendance */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-800">
                {currentClass?.name || 'No active class'}
              </h4>
              {currentClass && (
                <Badge 
                  variant="default"
                  className="bg-blue-sport/10 text-blue-sport border-blue-sport/20"
                >
                  In Progress
                </Badge>
              )}
            </div>
            
            {currentClass && (
              <>
                <div className="text-sm text-slate-600 space-y-1">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    {formatTime(currentClass.startTime)} - {formatTime(currentClass.endTime)}
                  </div>
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Coach: {currentClass.coach?.user?.name || 'Unknown'}
                  </div>
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    {currentClass.bookingCount}/{currentClass.capacity} Participants
                  </div>
                </div>
                
                {/* Participant List */}
                <div className="space-y-2">
                  {attendance.map((record) => {
                    const initials = record.booking.participantName
                      .split(' ')
                      .map(name => name[0])
                      .join('')
                      .toUpperCase();

                    const statusColor = getAttendanceStatusColor(record.attendance.status);

                    return (
                      <div
                        key={record.booking.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          record.attendance.status === 'present'
                            ? 'bg-success/5 border-success/20'
                            : record.attendance.status === 'absent'
                            ? 'bg-error/5 border-error/20'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">
                            {record.booking.participantName}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {record.attendance.status === 'pending' ? (
                            <>
                              <Button
                                size="sm"
                                className="w-8 h-8 bg-success hover:bg-success/90 text-white rounded-full p-0"
                                onClick={() => handleMarkAttendance(record.booking.id, 'present')}
                                disabled={markAttendanceMutation.isPending}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                className="w-8 h-8 bg-error hover:bg-error/90 text-white rounded-full p-0"
                                onClick={() => handleMarkAttendance(record.booking.id, 'absent')}
                                disabled={markAttendanceMutation.isPending}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <span className={`text-sm font-medium text-${statusColor}`}>
                                {record.attendance.status.charAt(0).toUpperCase() + record.attendance.status.slice(1)}
                              </span>
                              <div className={`w-8 h-8 bg-${statusColor} text-white rounded-full flex items-center justify-center text-sm`}>
                                {record.attendance.status === 'present' ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {attendance.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="mx-auto h-8 w-8 mb-2" />
                      <p>No participants registered for this class</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {!currentClass && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="mx-auto h-8 w-8 mb-2" />
                <p>No classes scheduled for today</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-800">Quick Actions</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="p-4 h-auto flex-col bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                onClick={() => {
                  if (attendance.length > 0) {
                    handleDownloadIcal(attendance[0].booking.id);
                  }
                }}
                disabled={attendance.length === 0}
              >
                <Download className="h-5 w-5 mb-2" />
                <span className="text-sm font-medium">Download iCal</span>
              </Button>
              
              <Button
                variant="outline"
                className="p-4 h-auto flex-col bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20"
              >
                <Mail className="h-5 w-5 mb-2" />
                <span className="text-sm font-medium">Send Reminders</span>
              </Button>
              
              <Button
                variant="outline"
                className="p-4 h-auto flex-col bg-accent/10 text-accent border-accent/20 hover:bg-accent/20"
              >
                <CreditCard className="h-5 w-5 mb-2" />
                <span className="text-sm font-medium">Payment Status</span>
              </Button>
              
              <Button
                variant="outline"
                className="p-4 h-auto flex-col bg-gradient-to-br from-[#24D3BF] to-[#22C4B0] text-white border-[#24D3BF] hover:from-[#22C4B0] hover:to-[#1FA396]"
              >
                <PieChart className="h-5 w-5 mb-2" />
                <span className="text-sm font-medium">Generate Report</span>
              </Button>
            </div>

            {/* Payment Integration Panel */}
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-slate-800">Payfast Integration</h5>
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                  <Shield className="mr-1 h-3 w-3" />
                  Secure
                </Badge>
              </div>
              <div className="text-sm text-slate-600 space-y-2">
                <div className="flex justify-between">
                  <span>Total Collected:</span>
                  <span className="font-medium text-slate-800">
                    {formatCurrency(totalCollected)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pending Payments:</span>
                  <span className="font-medium text-orange-600">
                    {formatCurrency(pendingPayments)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Fee:</span>
                  <span className="font-medium text-slate-600">
                    {formatCurrency(processingFee)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
