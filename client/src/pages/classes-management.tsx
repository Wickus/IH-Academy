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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Search, Calendar, Clock, MapPin, Users, Edit, Bell, Filter, Plus, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Class, Coach, Organization, Booking } from '@shared/schema';

const classUpdateSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  description: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  maxParticipants: z.number().min(1, 'Must allow at least 1 participant'),
  coachId: z.number().min(1, 'Coach is required'),
  location: z.string().min(1, 'Location is required'),
  price: z.string().min(1, 'Price is required'),
});

type ClassUpdateForm = z.infer<typeof classUpdateSchema>;

export default function ClassesManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('upcoming');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Fetch current user's organization
  const { data: organizations } = useQuery({
    queryKey: ['/api/organizations/my'],
    queryFn: () => api.getUserOrganizations(),
  });

  const organization = organizations?.[0];

  // Fetch classes for the organization
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes', organization?.id],
    queryFn: () => api.getClasses(),
    enabled: !!organization,
  });

  // Fetch coaches for the organization
  const { data: coaches = [] } = useQuery({
    queryKey: ['/api/coaches', organization?.id],
    queryFn: () => api.getCoaches(),
    enabled: !!organization,
  });

  // Fetch bookings for notification purposes
  const { data: classBookings = [] } = useQuery({
    queryKey: ['/api/bookings/class', selectedClass?.id],
    queryFn: async () => {
      if (!selectedClass) return [];
      const response = await fetch(`/api/bookings/class/${selectedClass.id}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedClass,
  });

  const form = useForm<ClassUpdateForm>({
    resolver: zodResolver(classUpdateSchema),
    defaultValues: {
      name: '',
      description: '',
      startTime: '',
      endTime: '',
      maxParticipants: 1,
      coachId: 0,
      location: '',
      price: '',
    },
  });

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
      const response = await fetch('/api/notifications/class-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          classId,
          message,
          organizationId: organization?.id
        }),
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

  // Filter classes based on search and time
  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const classDate = new Date(cls.startTime);
    const now = new Date();
    const matchesTime = timeFilter === 'all' ||
      (timeFilter === 'upcoming' && classDate >= now) ||
      (timeFilter === 'past' && classDate < now) ||
      (timeFilter === 'today' && 
        classDate.toDateString() === now.toDateString());
    
    return matchesSearch && matchesTime;
  });

  const getStatusColor = (cls: Class) => {
    const classDate = new Date(cls.startTime);
    const now = new Date();
    if (classDate < now) return '#6b7280'; // past - gray
    if (classDate.toDateString() === now.toDateString()) return organization?.secondaryColor || '#f59e0b'; // today - orange
    return organization?.primaryColor || '#10b981'; // upcoming - green
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  // Populate form when class is selected
  useEffect(() => {
    if (selectedClass) {
      const startDateTime = new Date(selectedClass.startTime);
      const endDateTime = new Date(selectedClass.endTime);
      
      form.reset({
        name: selectedClass.name || '',
        description: selectedClass.description || '',
        startTime: startDateTime.toISOString().slice(0, 16),
        endTime: endDateTime.toISOString().slice(0, 16),
        maxParticipants: selectedClass.maxParticipants || 1,
        coachId: selectedClass.coachId || 0,
        location: selectedClass.location || '',
        price: selectedClass.price?.toString() || '',
      });
    }
  }, [selectedClass, form]);

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Organization Found</h2>
          <p className="text-muted-foreground">Please create an organization first.</p>
        </div>
      </div>
    );
  }

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
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${organization.primaryColor}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="h-8 w-px bg-border" />
          <div>
            <h1 className="text-3xl font-bold" style={{ color: organization.primaryColor }}>
              Classes Management
            </h1>
            <p className="text-muted-foreground">
              Manage upcoming classes for {organization.name}
            </p>
          </div>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6" style={{ borderTopColor: organization.primaryColor, borderTopWidth: '4px' }}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Actions
              </div>
              <Button
                onClick={() => setLocation('/classes')}
                style={{ backgroundColor: organization.primaryColor }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add New Class
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by class name or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Classes Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              All Classes ({filteredClasses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {classesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div 
                  className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full"
                  style={{ borderColor: `${organization.primaryColor}40`, borderTopColor: 'transparent' }}
                />
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No classes found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || timeFilter !== 'upcoming' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Create your first class to get started.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Coach</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClasses.map((cls) => {
                      const { date, time } = formatDateTime(cls.startTime);
                      const coach = coaches.find(c => c.id === cls.coachId);
                      
                      return (
                        <TableRow key={cls.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{cls.name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: getStatusColor(cls) }}
                                />
                                <Badge 
                                  variant="secondary"
                                  style={{ 
                                    backgroundColor: `${getStatusColor(cls)}20`,
                                    color: getStatusColor(cls),
                                  }}
                                >
                                  {new Date(cls.startTime) < new Date() ? 'Past' : 
                                   new Date(cls.startTime).toDateString() === new Date().toDateString() ? 'Today' : 'Upcoming'}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {date}
                              </span>
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {time}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {coach?.name || 'Unassigned'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {cls.location}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>
                                {cls.currentParticipants || 0}/{cls.maxParticipants}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              R{cls.price || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
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
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Edit Class</DialogTitle>
                                  </DialogHeader>
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
                                              <FormLabel>Coach</FormLabel>
                                              <Select
                                                onValueChange={(value) => field.onChange(parseInt(value))}
                                                value={field.value?.toString()}
                                              >
                                                <FormControl>
                                                  <SelectTrigger>
                                                    <SelectValue placeholder="Select coach" />
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
                                          name="maxParticipants"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Max Participants</FormLabel>
                                              <FormControl>
                                                <Input 
                                                  type="number" 
                                                  min="1" 
                                                  placeholder="20"
                                                  {...field}
                                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                />
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
                                </DialogContent>
                              </Dialog>

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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}