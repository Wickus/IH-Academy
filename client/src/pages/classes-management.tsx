import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClassCoachesForm from '@/components/forms/class-coaches-form';
import OrganisationAdminForm from '@/components/forms/organisation-admin-form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Search, Calendar, Clock, MapPin, Users, Edit, Bell, Filter, Plus, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Class, Coach, Organization, Booking } from '@shared/schema';

// Form schema for updating classes
const ClassUpdateSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  description: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  coachId: z.number().min(1, 'Coach is required'),
  location: z.string().optional(),
  price: z.string().min(1, 'Price is required'),
  capacity: z.string().min(1, 'Capacity is required'),
});

type ClassUpdateForm = z.infer<typeof ClassUpdateSchema>;

export default function ClassesManagement() {
  const [location, setLocation] = useLocation();
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [filterText, setFilterText] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get organization from auth context
  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: api.getCurrentUser,
  });

  // Get classes
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes'],
    queryFn: () => api.getClasses({ organizationId: organization?.id }),
    enabled: !!organization?.id,
  });

  // Get coaches
  const { data: coaches = [], isLoading: coachesLoading } = useQuery({
    queryKey: ['/api/coaches'],
    queryFn: () => apiRequest('GET', '/api/coaches'),
    enabled: !!organization?.id,
  });

  // Get bookings for selected class
  const { data: classBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/bookings', selectedClass?.id],
    queryFn: () => api.getBookings(selectedClass!.id),
    enabled: !!selectedClass?.id,
  });

  // Form setup
  const form = useForm<ClassUpdateForm>({
    resolver: zodResolver(ClassUpdateSchema),
    defaultValues: {
      name: '',
      description: '',
      startTime: '',
      endTime: '',
      coachId: 0,
      location: '',
      price: '',
      capacity: '',
    },
  });

  // Populate form when selectedClass changes
  useEffect(() => {
    if (selectedClass) {
      form.reset({
        name: selectedClass.name,
        description: selectedClass.description || '',
        startTime: new Date(selectedClass.startTime).toISOString().slice(0, 16),
        endTime: new Date(selectedClass.endTime).toISOString().slice(0, 16),
        coachId: selectedClass.coachId,
        location: selectedClass.location || '',
        price: selectedClass.price,
        capacity: selectedClass.capacity.toString(),
      });
    }
  }, [selectedClass, form]);

  // Update class mutation
  const updateClassMutation = useMutation({
    mutationFn: async (data: ClassUpdateForm) => {
      if (!selectedClass) throw new Error('No class selected');
      const response = await fetch(`/api/classes/${selectedClass.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          startTime: new Date(data.startTime).toISOString(),
          endTime: new Date(data.endTime).toISOString(),
          price: parseFloat(data.price),
          capacity: parseInt(data.capacity),
        }),
      });
      if (!response.ok) throw new Error('Failed to update class');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      toast({ title: 'Class updated successfully' });
      setSelectedClass(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update class',
        variant: 'destructive',
      });
    },
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async ({ classId, message }: { classId: number; message: string }) => {
      const response = await fetch(`/api/classes/${classId}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error('Failed to send notification');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Notification sent successfully' });
      setNotificationMessage('');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to send notification',
        variant: 'destructive',
      });
    },
  });

  if (orgLoading || classesLoading || coachesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please log in to access this page.</p>
      </div>
    );
  }

  // Filter classes based on search
  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(filterText.toLowerCase()) ||
    cls.description?.toLowerCase().includes(filterText.toLowerCase())
  );

  // Format functions
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: `${organization.primaryColor}10` }}>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/dashboard')}
            className="flex items-center gap-2"
            style={{ 
              color: organization.primaryColor,
              borderColor: organization.primaryColor
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold" style={{ color: organization.primaryColor }}>
            Classes Management
          </h1>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{
                backgroundColor: activeTab === 'overview' ? organization.primaryColor : 'transparent'
              }}
            >
              Classes Overview
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'admins'
                  ? 'text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{
                backgroundColor: activeTab === 'admins' ? organization.primaryColor : 'transparent'
              }}
            >
              Organisation Admins
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Search and Actions */}
            <div className="flex justify-between items-center mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search classes..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Classes Table */}
            <Card>
              <CardHeader>
                <CardTitle style={{ color: organization.primaryColor }}>
                  Classes ({filteredClasses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class Name</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Coach</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClasses.map((cls) => {
                        const coach = coaches.find(c => c.id === cls.coachId);
                        return (
                          <TableRow key={cls.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{cls.name}</p>
                                {cls.description && (
                                  <p className="text-sm text-gray-500">{cls.description}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p>{formatDate(cls.startTime)}</p>
                                <p className="text-sm text-gray-500">
                                  {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {coach?.name || 'No coach assigned'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {cls.location || 'No location set'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                {cls.capacity}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                R{cls.price}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {/* Edit Class Dialog */}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedClass(cls)}
                                      style={{ 
                                        borderColor: organization.primaryColor,
                                        color: organization.primaryColor 
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-1" />
                                      Edit
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Edit Class</DialogTitle>
                                    </DialogHeader>
                                    <Tabs defaultValue="details" className="w-full">
                                      <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="details">Class Details</TabsTrigger>
                                        <TabsTrigger value="coaches">Coach Assignments</TabsTrigger>
                                      </TabsList>
                                      
                                      <TabsContent value="details" className="space-y-4">
                                        <Form {...form}>
                                          <form onSubmit={form.handleSubmit((data) => updateClassMutation.mutate(data))} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                              <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>Class Name</FormLabel>
                                                    <FormControl>
                                                      <Input placeholder="Enter class name" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                              <FormField
                                                control={form.control}
                                                name="price"
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>Price (ZAR)</FormLabel>
                                                    <FormControl>
                                                      <Input placeholder="0.00" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                            </div>
                                            
                                            <FormField
                                              control={form.control}
                                              name="description"
                                              render={({ field }) => (
                                                <FormItem>
                                                  <FormLabel>Description</FormLabel>
                                                  <FormControl>
                                                    <Textarea placeholder="Class description..." {...field} />
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />

                                            <div className="grid grid-cols-2 gap-4">
                                              <FormField
                                                control={form.control}
                                                name="startTime"
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>Start Time</FormLabel>
                                                    <FormControl>
                                                      <Input type="datetime-local" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                              <FormField
                                                control={form.control}
                                                name="endTime"
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>End Time</FormLabel>
                                                    <FormControl>
                                                      <Input type="datetime-local" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                              <FormField
                                                control={form.control}
                                                name="coachId"
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>Primary Coach</FormLabel>
                                                    <Select
                                                      onValueChange={(value) => field.onChange(parseInt(value))}
                                                      value={field.value?.toString()}
                                                    >
                                                      <FormControl>
                                                        <SelectTrigger>
                                                          <SelectValue placeholder="Select primary coach" />
                                                        </SelectTrigger>
                                                      </FormControl>
                                                      <SelectContent>
                                                        {coaches.map((coach) => (
                                                          <SelectItem key={coach.id} value={coach.id.toString()}>
                                                            {coach.name}
                                                          </SelectItem>
                                                        ))}
                                                      </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                              <FormField
                                                control={form.control}
                                                name="capacity"
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>Capacity</FormLabel>
                                                    <FormControl>
                                                      <Input type="number" placeholder="Enter capacity" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                            </div>

                                            <FormField
                                              control={form.control}
                                              name="location"
                                              render={({ field }) => (
                                                <FormItem>
                                                  <FormLabel>Location</FormLabel>
                                                  <FormControl>
                                                    <Input placeholder="Enter location" {...field} />
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />

                                            <div className="flex justify-end gap-2">
                                              <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setSelectedClass(null)}
                                              >
                                                Cancel
                                              </Button>
                                              <Button
                                                type="submit"
                                                disabled={updateClassMutation.isPending}
                                                style={{ backgroundColor: organization.primaryColor }}
                                              >
                                                {updateClassMutation.isPending ? 'Updating...' : 'Update Class'}
                                              </Button>
                                            </div>
                                          </form>
                                        </Form>
                                      </TabsContent>
                                      
                                      <TabsContent value="coaches" className="space-y-4">
                                        {selectedClass && (
                                          <ClassCoachesForm
                                            classId={selectedClass.id}
                                            organization={organization}
                                          />
                                        )}
                                      </TabsContent>
                                    </Tabs>
                                  </DialogContent>
                                </Dialog>

                                {/* Notify Participants Dialog */}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedClass(cls)}
                                      style={{ 
                                        borderColor: organization.secondaryColor,
                                        color: organization.secondaryColor 
                                      }}
                                    >
                                      <Bell className="h-4 w-4 mr-1" />
                                      Notify
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Send Class Update Notification</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <p className="text-sm text-muted-foreground">
                                        Send a notification to all participants booked for: <strong>{selectedClass?.name}</strong>
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {classBookings.length} participant(s) will be notified
                                      </p>
                                      <Textarea
                                        placeholder="Enter your notification message..."
                                        value={notificationMessage}
                                        onChange={(e) => setNotificationMessage(e.target.value)}
                                        rows={4}
                                      />
                                      <Button
                                        onClick={() => {
                                          if (selectedClass) {
                                            sendNotificationMutation.mutate({
                                              classId: selectedClass.id,
                                              message: notificationMessage
                                            });
                                          }
                                        }}
                                        disabled={!notificationMessage.trim() || sendNotificationMutation.isPending}
                                        className="w-full"
                                        style={{ backgroundColor: organization.secondaryColor }}
                                      >
                                        <Bell className="h-4 w-4 mr-2" />
                                        Send Notification
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'admins' && (
          <Card>
            <CardHeader>
              <CardTitle style={{ color: organization.primaryColor }}>
                Organisation Administrators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrganisationAdminForm organization={organization} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}