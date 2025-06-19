import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, Clock, Users, Settings, Edit, CheckCircle, XCircle, User, UserPlus } from "lucide-react";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import AvailabilityForm from "@/components/forms/availability-form";

export default function CoachProfile() {
  const { organizationId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: "",
    bio: "",
    specializations: "",
    experience: "",
    phone: "",
  });

  // Attendance state
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [walkInData, setWalkInData] = useState({
    name: '',
    email: '',
    phone: '',
    paymentMethod: 'cash',
    amountPaid: ''
  });

  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => api.getCurrentUser(),
    retry: false
  });

  const { data: organization } = useQuery({
    queryKey: ['/api/organizations', organizationId],
    queryFn: () => api.getOrganization(Number(organizationId)),
    enabled: !!organizationId,
  });

  const { data: coach } = useQuery({
    queryKey: ['/api/coaches', user?.id, organizationId],
    queryFn: async () => {
      const coaches = await api.getCoaches();
      return coaches.find(c => c.userId === user?.id && c.organizationId === Number(organizationId));
    },
    enabled: !!user?.id && !!organizationId,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes', organizationId],
    queryFn: () => api.getClasses(),
    enabled: !!organizationId,
  });

  const { data: availability = [] } = useQuery({
    queryKey: ['/api/coach-availability', organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/coach-availability/${organizationId}`);
      if (!response.ok) throw new Error('Failed to fetch availability');
      return response.json();
    },
    enabled: !!organizationId,
  });

  const coachClasses = classes.filter(c => c.coachId === coach?.id);
  const coachAvailability = availability.filter((a: any) => a.coachId === coach?.id);

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

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/coaches/${coach?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coaches'] });
      toast({
        title: "Profile Updated",
        description: "Your coaching profile has been updated successfully.",
      });
      setIsEditingProfile(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Attendance mutations
  const markAttendanceMutation = useMutation({
    mutationFn: async ({ classId, bookingId, status, walkInData, notes }: any) => {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, bookingId, status, walkInData, notes }),
      });
      if (!response.ok) throw new Error('Failed to mark attendance');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Attendance Marked",
        description: "Attendance has been recorded successfully.",
      });
      setWalkInData({ name: '', email: '', phone: '', paymentMethod: 'cash', amountPaid: '' });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark attendance. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleMarkAttendance = (bookingId: number, status: 'present' | 'absent') => {
    if (!selectedClassId) return;
    
    markAttendanceMutation.mutate({
      classId: selectedClassId,
      bookingId,
      status,
      notes: null
    });
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

    if (!selectedClassId) return;
    
    markAttendanceMutation.mutate({
      classId: selectedClassId,
      status: 'present',
      walkInData: {
        ...walkInData,
        amountPaid: walkInData.amountPaid ? parseFloat(walkInData.amountPaid) : 0
      },
      notes: null
    });
  };

  const openAttendance = (classId: number) => {
    setSelectedClassId(classId);
    setIsAttendanceOpen(true);
  };

  const handleUpdateProfile = () => {
    updateProfileMutation.mutate({
      displayName: profileData.displayName,
      bio: profileData.bio,
      specializations: profileData.specializations,
      experience: profileData.experience,
      phone: profileData.phone,
    });
  };

  if (!organization || !coach) {
    return (
      <div className="p-6 lg:p-10 min-h-screen" style={{ backgroundColor: `${organization?.accentColor || '#24D367'}10` }}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 min-h-screen" style={{ backgroundColor: `${organization.accentColor}10` }}>
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button
          variant="outline"
          onClick={() => setLocation('/')}
          className="mr-4"
          style={{
            color: organization.primaryColor,
            borderColor: organization.primaryColor,
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: organization.primaryColor }}>
            Coach Profile - {organization.name}
          </h1>
          <p className="text-slate-600">Manage your coaching profile and availability</p>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card className="mb-8 border-0 shadow-lg">
        <CardHeader 
          className="text-white"
          style={{ background: `linear-gradient(135deg, ${organization.primaryColor} 0%, ${organization.secondaryColor} 100%)` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                {user?.firstName?.charAt(0) || 'C'}
              </div>
              <div>
                <CardTitle className="text-2xl">{coach.displayName || `${user?.firstName} ${user?.lastName}`}</CardTitle>
                <p className="text-white/90">Coach at {organization.name}</p>
              </div>
            </div>
            <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-white border-white/30 hover:bg-white/10"
                  onClick={() => {
                    setProfileData({
                      displayName: coach.displayName || `${user?.firstName} ${user?.lastName}` || "",
                      bio: coach.bio || "",
                      specializations: coach.specializations || "",
                      experience: coach.experience || "",
                      phone: coach.phone || "",
                    });
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle style={{ color: organization.primaryColor }}>
                    Edit Coach Profile
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="displayName" style={{ color: organization.primaryColor }}>
                      Display Name
                    </Label>
                    <Input
                      id="displayName"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                      style={{ borderColor: organization.secondaryColor }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio" style={{ color: organization.primaryColor }}>
                      Bio
                    </Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      style={{ borderColor: organization.secondaryColor }}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="specializations" style={{ color: organization.primaryColor }}>
                      Specializations
                    </Label>
                    <Input
                      id="specializations"
                      value={profileData.specializations}
                      onChange={(e) => setProfileData({...profileData, specializations: e.target.value})}
                      style={{ borderColor: organization.secondaryColor }}
                      placeholder="e.g., Youth Training, Fitness, Technical Skills"
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience" style={{ color: organization.primaryColor }}>
                      Experience
                    </Label>
                    <Input
                      id="experience"
                      value={profileData.experience}
                      onChange={(e) => setProfileData({...profileData, experience: e.target.value})}
                      style={{ borderColor: organization.secondaryColor }}
                      placeholder="e.g., 5 years coaching experience"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" style={{ color: organization.primaryColor }}>
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      style={{ borderColor: organization.secondaryColor }}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingProfile(false)}
                    style={{
                      color: organization.primaryColor,
                      borderColor: organization.primaryColor,
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={updateProfileMutation.isPending}
                    style={{
                      backgroundColor: organization.accentColor,
                      borderColor: organization.accentColor,
                    }}
                  >
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-2" style={{ color: organization.primaryColor }}>Bio</h4>
              <p className="text-slate-600 text-sm">
                {coach.bio || "No bio provided yet. Click 'Edit Profile' to add one."}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2" style={{ color: organization.primaryColor }}>Specializations</h4>
              <p className="text-slate-600 text-sm">
                {coach.specializations || "No specializations listed yet."}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2" style={{ color: organization.primaryColor }}>Experience</h4>
              <p className="text-slate-600 text-sm">
                {coach.experience || "Experience not specified yet."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="availability" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="availability" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Availability</span>
          </TabsTrigger>
          <TabsTrigger value="classes" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>My Classes</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Availability Tab */}
        <TabsContent value="availability">
          <Card className="border-0 shadow-lg">
            <CardHeader style={{ backgroundColor: `${organization.primaryColor}10` }}>
              <CardTitle style={{ color: organization.primaryColor }}>
                Manage Your Availability
              </CardTitle>
              <p className="text-slate-600">
                Set your available days, hours, and break times for this organization.
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <AvailabilityForm 
                coachId={coach.id.toString()}
                organization={organization}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/coach-availability', organizationId] });
                  toast({
                    title: "Availability Updated",
                    description: "Your availability has been updated successfully.",
                  });
                }}
                initialData={coachAvailability}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classes Tab */}
        <TabsContent value="classes">
          <Card className="border-0 shadow-lg">
            <CardHeader style={{ backgroundColor: `${organization.primaryColor}10` }}>
              <CardTitle style={{ color: organization.primaryColor }}>
                My Classes ({coachClasses.length})
              </CardTitle>
              <p className="text-slate-600">
                Classes you're assigned to coach at {organization.name}.
              </p>
            </CardHeader>
            <CardContent>
              {coachClasses.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{ color: organization.primaryColor }}>Class</TableHead>
                        <TableHead style={{ color: organization.primaryColor }}>Sport</TableHead>
                        <TableHead style={{ color: organization.primaryColor }}>Schedule</TableHead>
                        <TableHead style={{ color: organization.primaryColor }}>Capacity</TableHead>
                        <TableHead style={{ color: organization.primaryColor }}>Price</TableHead>
                        <TableHead style={{ color: organization.primaryColor }}>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coachClasses.map((classItem) => (
                        <TableRow key={classItem.id}>
                          <TableCell>
                            <div className="font-semibold">{classItem.name}</div>
                            <div className="text-sm text-slate-600">{classItem.description}</div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              style={{
                                backgroundColor: `${organization.accentColor}20`,
                                color: organization.primaryColor,
                                borderColor: `${organization.accentColor}30`
                              }}
                            >
                              {classItem.sport?.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{formatDateTime(classItem.startTime)}</div>
                              <div className="text-slate-500">
                                Class scheduled
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <span className="font-semibold">{classItem.capacity}</span> students
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold" style={{ color: organization.accentColor }}>
                              {formatCurrency(Number(classItem.price))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              style={{ backgroundColor: organization.accentColor, color: 'white' }}
                              className="hover:opacity-90"
                              onClick={() => openAttendance(classItem.id)}
                            >
                              <Users className="h-4 w-4 mr-1" />
                              Open Class
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">No Classes Assigned</h3>
                  <p className="text-slate-500">
                    You haven't been assigned to any classes yet. Contact your organization admin to get started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card className="border-0 shadow-lg">
            <CardHeader style={{ backgroundColor: `${organization.primaryColor}10` }}>
              <CardTitle style={{ color: organization.primaryColor }}>
                Profile Settings
              </CardTitle>
              <p className="text-slate-600">
                Manage your coaching profile and preferences for {organization.name}.
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium" style={{ color: organization.primaryColor }}>
                      Contact Information
                    </Label>
                    <div className="mt-2 space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Email:</span> {user?.email}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Phone:</span> {coach.phone || 'Not provided'}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: organization.primaryColor }}>
                      Coach Status
                    </Label>
                    <div className="mt-2">
                      <Badge 
                        className="text-sm"
                        style={{
                          backgroundColor: coach.isActive ? `${organization.accentColor}20` : '#fee2e2',
                          color: coach.isActive ? organization.primaryColor : '#dc2626',
                          borderColor: coach.isActive ? `${organization.accentColor}30` : '#fecaca'
                        }}
                      >
                        {coach.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Attendance Modal */}
      <Dialog open={isAttendanceOpen} onOpenChange={setIsAttendanceOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: organization?.primaryColor }}>
              Class Attendance - {coachClasses.find(c => c.id === selectedClassId)?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedClassId && (
            <div className="space-y-6">
              {/* Class Info */}
              <div 
                className="p-4 rounded-lg"
                style={{ backgroundColor: `${organization?.primaryColor}10` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold" style={{ color: organization?.primaryColor }}>
                      {coachClasses.find(c => c.id === selectedClassId)?.name}
                    </h3>
                    <p className="text-sm" style={{ color: organization?.secondaryColor }}>
                      {(() => {
                        const classData = coachClasses.find(c => c.id === selectedClassId);
                        return classData?.startTime ? formatDateTime(classData.startTime) : 'Time TBD';
                      })()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium" style={{ color: organization?.primaryColor }}>
                      Capacity: {coachClasses.find(c => c.id === selectedClassId)?.capacity}
                    </div>
                    <div className="text-sm" style={{ color: organization?.secondaryColor }}>
                      Registered: {classBookings.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Registered Participants */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: organization?.primaryColor }}>
                  Registered Participants ({classBookings.length})
                </h3>
                {classBookings.length > 0 ? (
                  <div className="space-y-2">
                    {classBookings.map((booking) => {
                      const attendanceRecord = attendance.find(att => att.bookingId === booking.id);
                      const isMarked = !!attendanceRecord;
                      
                      return (
                        <div 
                          key={booking.id} 
                          className="flex items-center justify-between p-3 rounded-lg"
                          style={{ 
                            backgroundColor: `${organization?.secondaryColor}10`,
                            border: `2px solid ${organization?.secondaryColor}`
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: `${organization?.primaryColor}20` }}
                            >
                              <Users className="h-4 w-4" style={{ color: organization?.primaryColor }} />
                            </div>
                            <div>
                              <div className="font-medium" style={{ color: organization?.primaryColor }}>
                                {booking.participantName}
                              </div>
                              <div className="text-sm" style={{ color: organization?.secondaryColor }}>
                                {booking.participantEmail}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!isMarked ? (
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  style={{ backgroundColor: organization?.primaryColor, color: 'white' }}
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
                                    color: organization?.secondaryColor,
                                    borderColor: organization?.secondaryColor
                                  }}
                                  onClick={() => handleMarkAttendance(booking.id, 'absent')}
                                  disabled={markAttendanceMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Absent
                                </Button>
                              </div>
                            ) : (
                              <Badge 
                                style={{ 
                                  backgroundColor: attendanceRecord.status === 'present' 
                                    ? organization?.primaryColor 
                                    : organization?.secondaryColor,
                                  color: 'white'
                                }}
                              >
                                {attendanceRecord.status === 'present' ? 'Present' : 'Absent'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No registered participants for this class.
                  </div>
                )}
              </div>

              {/* Walk-in Registration */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: organization?.primaryColor }}>
                  Walk-in Registration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="walkInName" style={{ color: organization?.primaryColor }}>
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="walkInName"
                      value={walkInData.name}
                      onChange={(e) => setWalkInData({...walkInData, name: e.target.value})}
                      placeholder="Client's full name"
                      style={{ borderColor: organization?.secondaryColor }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="walkInEmail" style={{ color: organization?.primaryColor }}>
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="walkInEmail"
                      type="email"
                      value={walkInData.email}
                      onChange={(e) => setWalkInData({...walkInData, email: e.target.value})}
                      placeholder="Client's email address"
                      style={{ borderColor: organization?.secondaryColor }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="walkInPhone" style={{ color: organization?.primaryColor }}>
                      Phone (Optional)
                    </Label>
                    <Input
                      id="walkInPhone"
                      value={walkInData.phone}
                      onChange={(e) => setWalkInData({...walkInData, phone: e.target.value})}
                      placeholder="Client's phone number"
                      style={{ borderColor: organization?.secondaryColor }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="walkInPayment" style={{ color: organization?.primaryColor }}>
                      Payment Method
                    </Label>
                    <Select
                      value={walkInData.paymentMethod}
                      onValueChange={(value) => setWalkInData({...walkInData, paymentMethod: value})}
                    >
                      <SelectTrigger style={{ borderColor: organization?.secondaryColor }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="walkInAmount" style={{ color: organization?.primaryColor }}>
                      Amount Paid
                    </Label>
                    <Input
                      id="walkInAmount"
                      type="number"
                      step="0.01"
                      value={walkInData.amountPaid}
                      onChange={(e) => setWalkInData({...walkInData, amountPaid: e.target.value})}
                      placeholder="0.00"
                      style={{ borderColor: organization?.secondaryColor }}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleWalkInSubmit}
                      disabled={markAttendanceMutation.isPending}
                      style={{ backgroundColor: organization?.accentColor, color: 'white' }}
                      className="w-full hover:opacity-90"
                    >
                      {markAttendanceMutation.isPending ? 'Adding...' : 'Add Walk-in Client'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Walk-in Participants List */}
              {attendance.filter(att => att.isWalkIn).length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: organization?.primaryColor }}>
                    Walk-in Participants
                  </h3>
                  <div className="space-y-2">
                    {attendance.filter(att => att.isWalkIn).map((walkIn) => (
                      <div 
                        key={walkIn.id} 
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ 
                          backgroundColor: `${organization?.accentColor}10`,
                          border: `2px solid ${organization?.accentColor}`
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${organization?.accentColor}30` }}
                          >
                            <UserPlus className="h-4 w-4" style={{ color: organization?.primaryColor }} />
                          </div>
                          <div>
                            <div className="font-medium" style={{ color: organization?.primaryColor }}>
                              {walkIn.participantName}
                            </div>
                            <div className="text-sm" style={{ color: organization?.secondaryColor }}>
                              {walkIn.participantEmail}
                            </div>
                            {walkIn.participantPhone && (
                              <div className="text-sm" style={{ color: organization?.secondaryColor }}>
                                {walkIn.participantPhone}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            style={{ 
                              backgroundColor: organization?.accentColor,
                              color: 'white'
                            }}
                          >
                            Walk-in
                          </Badge>
                          <div className="text-sm mt-1" style={{ color: organization?.primaryColor }}>
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