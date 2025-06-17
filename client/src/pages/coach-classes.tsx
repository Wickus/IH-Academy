import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Users, MapPin, CheckCircle, XCircle, UserPlus, DollarSign } from "lucide-react";
import { api, type AttendanceRecord } from "@/lib/api";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function CoachClasses() {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [walkInData, setWalkInData] = useState({
    name: '',
    email: '',
    phone: '',
    paymentMethod: 'cash',
    amountPaid: ''
  });
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => api.getCurrentUser(),
    retry: false
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['/api/coaches'],
    queryFn: () => api.getCoaches(),
    enabled: !!user?.id,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes'],
    queryFn: () => api.getClasses(),
  });

  const { data: userOrganizations } = useQuery({
    queryKey: ["/api/organizations/my"],
    queryFn: api.getUserOrganizations,
    enabled: !!user,
  });

  // Find the coach record for the current user
  const coachRecord = coaches.find(c => c.userId === user?.id);
  
  // Filter classes that this coach is assigned to
  const coachClasses = classes.filter(c => c.coachId === coachRecord?.id);
  
  // Group classes by organization
  const classesByOrg = coachClasses.reduce((acc, classItem) => {
    const orgId = classItem.organizationId;
    if (!acc[orgId]) {
      acc[orgId] = [];
    }
    acc[orgId].push(classItem);
    return acc;
  }, {} as Record<number, typeof classes>);

  // Get attendance for selected class
  const { data: attendance = [] } = useQuery({
    queryKey: ["/api/attendance", selectedClassId],
    queryFn: () => selectedClassId ? api.getAttendance(selectedClassId) : Promise.resolve([]),
    enabled: !!selectedClassId,
  });

  // Get bookings for selected class
  const { data: classBookings = [] } = useQuery({
    queryKey: ["/api/bookings", "class", selectedClassId],
    queryFn: () => selectedClassId ? api.getBookings({ classId: selectedClassId }) : Promise.resolve([]),
    enabled: !!selectedClassId,
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: (data: { bookingId?: number; status: 'present' | 'absent'; walkInData?: any }) =>
      api.markAttendance({
        classId: selectedClassId!,
        bookingId: data.bookingId,
        status: data.status,
        walkInData: data.walkInData,
        markedBy: user?.id || 0
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance", selectedClassId] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings", "class", selectedClassId] });
      toast({
        title: "Attendance marked",
        description: "Participant attendance has been recorded successfully.",
      });
      // Reset walk-in form
      setWalkInData({
        name: '',
        email: '',
        phone: '',
        paymentMethod: 'cash',
        amountPaid: ''
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

  const openClassAttendance = (classId: number) => {
    setSelectedClassId(classId);
    setIsAttendanceOpen(true);
  };

  const handleMarkAttendance = (bookingId: number, status: 'present' | 'absent') => {
    markAttendanceMutation.mutate({ bookingId, status });
  };

  const handleWalkInSubmit = () => {
    if (!walkInData.name || !walkInData.email) {
      toast({
        title: "Missing Information",
        description: "Please provide at least name and email for walk-in client.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedClass) return;
    
    markAttendanceMutation.mutate({
      classId: selectedClass.id,
      status: 'present',
      walkInData: {
        ...walkInData,
        amountPaid: walkInData.amountPaid ? parseFloat(walkInData.amountPaid) : 0
      },
      notes: null
    });
  };

  const selectedClass = selectedClassId ? coachClasses.find(c => c.id === selectedClassId) : null;
  const selectedOrg = selectedClass ? userOrganizations?.find(org => org.id === selectedClass.organizationId) : null;

  return (
    <div className="p-6 lg:p-10 space-y-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-[#20366B]">My Classes</h1>
        <p className="text-slate-600">Classes you're assigned to coach across all organizations.</p>
      </div>

      {coachClasses.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Calendar className="mx-auto h-16 w-16 text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No Classes Assigned</h3>
            <p className="text-slate-500">
              You haven't been assigned to any classes yet. Contact your organization admin to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {userOrganizations?.map((org) => {
            const orgClasses = classesByOrg[org.id] || [];
            if (orgClasses.length === 0) return null;

            return (
              <Card key={org.id} className="border-0 shadow-lg">
                <CardHeader style={{ backgroundColor: `${org.primaryColor}10` }}>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: org.primaryColor }}
                      >
                        {org.name.charAt(0)}
                      </div>
                      <span style={{ color: org.primaryColor }}>
                        {org.name} ({orgClasses.length} {orgClasses.length === 1 ? 'class' : 'classes'})
                      </span>
                    </div>
                    <Badge 
                      style={{
                        backgroundColor: `${org.accentColor}20`,
                        color: org.primaryColor,
                        borderColor: `${org.accentColor}30`
                      }}
                    >
                      {org.businessModel} model
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead style={{ color: org.primaryColor }}>Class</TableHead>
                          <TableHead style={{ color: org.primaryColor }}>Sport</TableHead>
                          <TableHead style={{ color: org.primaryColor }}>Schedule</TableHead>
                          <TableHead style={{ color: org.primaryColor }}>Capacity</TableHead>
                          <TableHead style={{ color: org.primaryColor }}>Price</TableHead>
                          <TableHead style={{ color: org.primaryColor }}>Location</TableHead>
                          <TableHead style={{ color: org.primaryColor }}>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orgClasses.map((classItem) => (
                          <TableRow key={classItem.id}>
                            <TableCell>
                              <div className="font-semibold">{classItem.name}</div>
                              <div className="text-sm text-slate-600">{classItem.description}</div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                style={{
                                  backgroundColor: `${org.accentColor}20`,
                                  color: org.primaryColor,
                                  borderColor: `${org.accentColor}30`
                                }}
                              >
                                {classItem.sport?.name}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-slate-500" />
                                <div className="text-sm">
                                  <div>{formatDateTime(classItem.startTime)}</div>
                                  <div className="text-slate-500">Class scheduled</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4 text-slate-500" />
                                <span className="font-semibold">{classItem.capacity}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold" style={{ color: org.accentColor }}>
                                {formatCurrency(Number(classItem.price))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-slate-500" />
                                <span className="text-sm">{classItem.location || 'TBA'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                style={{
                                  backgroundColor: org.primaryColor,
                                  color: 'white'
                                }}
                                className="hover:opacity-90"
                                onClick={() => openClassAttendance(classItem.id)}
                              >
                                Open Class
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Attendance Modal */}
      <Dialog open={isAttendanceOpen} onOpenChange={setIsAttendanceOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: selectedOrg?.primaryColor }}>
              Take Attendance - {selectedClass?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedClass && (
            <div className="space-y-6">
              {/* Class Info */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Time:</span> {formatDateTime(selectedClass.startTime)}
                  </div>
                  <div>
                    <span className="font-semibold">Location:</span> {selectedClass.location || 'TBA'}
                  </div>
                  <div>
                    <span className="font-semibold">Capacity:</span> {selectedClass.capacity}
                  </div>
                  <div>
                    <span className="font-semibold">Price:</span> {formatCurrency(Number(selectedClass.price))}
                  </div>
                </div>
              </div>

              {/* Registered Participants */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: selectedOrg?.primaryColor }}>
                  Registered Participants ({classBookings.length})
                </h3>
                {classBookings.length > 0 ? (
                  <div className="space-y-2">
                    {classBookings.map((booking) => {
                      const attendanceRecord = attendance.find(att => att.bookingId === booking.id);
                      const isMarked = !!attendanceRecord;
                      
                      return (
                        <div key={booking.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                              <Users className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium">{booking.participantName}</div>
                              <div className="text-sm text-slate-600">{booking.participantEmail}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!isMarked ? (
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  style={{ backgroundColor: selectedOrg?.primaryColor, color: 'white' }}
                                  className="hover:opacity-90"
                                  onClick={() => handleMarkAttendance(booking.id, 'present')}
                                  disabled={markAttendanceMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Present
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  style={{ 
                                    borderColor: selectedOrg?.secondaryColor,
                                    color: selectedOrg?.secondaryColor
                                  }}
                                  className="hover:opacity-90"
                                  onClick={() => handleMarkAttendance(booking.id, 'absent')}
                                  disabled={markAttendanceMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Absent
                                </Button>
                              </div>
                            ) : (
                              <Badge
                                variant={attendanceRecord?.status === 'present' ? 'default' : 'destructive'}
                                style={{
                                  backgroundColor: attendanceRecord?.status === 'present' ? selectedOrg?.primaryColor : '#dc2626',
                                  color: 'white'
                                }}
                              >
                                {attendanceRecord?.status === 'present' ? 'Present' : 'Absent'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No registered participants for this class
                  </div>
                )}
              </div>

              {/* Walk-in Client Form */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: selectedOrg?.primaryColor }}>
                  Add Walk-in Client
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="walkInName" style={{ color: selectedOrg?.primaryColor }}>Full Name *</Label>
                    <Input
                      id="walkInName"
                      value={walkInData.name}
                      onChange={(e) => setWalkInData({ ...walkInData, name: e.target.value })}
                      placeholder="Enter client's full name"
                      style={{ 
                        borderColor: selectedOrg?.secondaryColor,
                        '--focus-ring-color': selectedOrg?.primaryColor
                      } as any}
                      className="focus:ring-2 focus:ring-opacity-50"
                      onFocus={(e) => {
                        e.target.style.borderColor = selectedOrg?.primaryColor || '';
                        e.target.style.outline = `2px solid ${selectedOrg?.primaryColor}40`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = selectedOrg?.secondaryColor || '';
                        e.target.style.outline = 'none';
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="walkInEmail" style={{ color: selectedOrg?.primaryColor }}>Email Address *</Label>
                    <Input
                      id="walkInEmail"
                      type="email"
                      value={walkInData.email}
                      onChange={(e) => setWalkInData({ ...walkInData, email: e.target.value })}
                      placeholder="Enter email address"
                      style={{ 
                        borderColor: selectedOrg?.secondaryColor
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = selectedOrg?.primaryColor || '';
                        e.target.style.outline = `2px solid ${selectedOrg?.primaryColor}40`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = selectedOrg?.secondaryColor || '';
                        e.target.style.outline = 'none';
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="walkInPhone" style={{ color: selectedOrg?.primaryColor }}>Phone Number</Label>
                    <Input
                      id="walkInPhone"
                      value={walkInData.phone}
                      onChange={(e) => setWalkInData({ ...walkInData, phone: e.target.value })}
                      placeholder="Enter phone number"
                      style={{ 
                        borderColor: selectedOrg?.secondaryColor
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = selectedOrg?.primaryColor || '';
                        e.target.style.outline = `2px solid ${selectedOrg?.primaryColor}40`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = selectedOrg?.secondaryColor || '';
                        e.target.style.outline = 'none';
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentMethod" style={{ color: selectedOrg?.primaryColor }}>Payment Method</Label>
                    <Select value={walkInData.paymentMethod} onValueChange={(value) => setWalkInData({ ...walkInData, paymentMethod: value })}>
                      <SelectTrigger
                        style={{ 
                          borderColor: selectedOrg?.secondaryColor
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = selectedOrg?.primaryColor || '';
                          e.currentTarget.style.outline = `2px solid ${selectedOrg?.primaryColor}40`;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = selectedOrg?.secondaryColor || '';
                          e.currentTarget.style.outline = 'none';
                        }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem 
                          value="cash"
                          style={{ backgroundColor: `${selectedOrg?.secondaryColor}20` }}
                          className="hover:bg-opacity-30"
                        >
                          Cash
                        </SelectItem>
                        <SelectItem 
                          value="card"
                          style={{ backgroundColor: `${selectedOrg?.secondaryColor}20` }}
                          className="hover:bg-opacity-30"
                        >
                          Card
                        </SelectItem>
                        <SelectItem 
                          value="transfer"
                          style={{ backgroundColor: `${selectedOrg?.secondaryColor}20` }}
                          className="hover:bg-opacity-30"
                        >
                          Bank Transfer
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amountPaid" style={{ color: selectedOrg?.primaryColor }}>Amount Paid</Label>
                    <Input
                      id="amountPaid"
                      type="number"
                      step="0.01"
                      value={walkInData.amountPaid}
                      onChange={(e) => setWalkInData({ ...walkInData, amountPaid: e.target.value })}
                      placeholder={`${formatCurrency(Number(selectedClass.price))}`}
                      style={{ 
                        borderColor: selectedOrg?.secondaryColor
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = selectedOrg?.primaryColor || '';
                        e.target.style.outline = `2px solid ${selectedOrg?.primaryColor}40`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = selectedOrg?.secondaryColor || '';
                        e.target.style.outline = 'none';
                      }}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      style={{ 
                        backgroundColor: selectedOrg?.accentColor,
                        color: 'white'
                      }}
                      className="hover:opacity-90 w-full"
                      onClick={handleWalkInSubmit}
                      disabled={markAttendanceMutation.isPending || !walkInData.name || !walkInData.email}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add & Mark Present
                    </Button>
                  </div>
                </div>
              </div>

              {/* Walk-in Participants */}
              {attendance.some(att => att.isWalkIn) && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: selectedOrg?.primaryColor }}>
                    Walk-in Participants
                  </h3>
                  <div className="space-y-2">
                    {attendance.filter(att => att.isWalkIn).map((walkIn) => (
                      <div key={walkIn.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                            <UserPlus className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium">{walkIn.participantName}</div>
                            <div className="text-sm text-slate-600">{walkIn.participantEmail}</div>
                            {walkIn.participantPhone && (
                              <div className="text-sm text-slate-600">{walkIn.participantPhone}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            style={{ 
                              backgroundColor: selectedOrg?.accentColor,
                              color: 'white'
                            }}
                          >
                            Walk-in
                          </Badge>
                          <div className="text-sm mt-1" style={{ color: selectedOrg?.primaryColor }}>
                            {walkIn.paymentMethod} - {formatCurrency(Number(walkIn.amountPaid || 0))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}