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
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Search, Users, Download, Mail, MessageSquare, Eye, Filter, FileText, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User, Organization, Booking } from '@shared/schema';

export default function MembersManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [membershipFilter, setMembershipFilter] = useState('all');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  // Fetch current user's organization
  const { data: organizations } = useQuery({
    queryKey: ['/api/organizations/my'],
    queryFn: () => api.getUserOrganizations(),
  });

  const organization = organizations?.[0];

  // Fetch organization followers (members)
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['/api/organizations', organization?.id, 'members'],
    queryFn: async () => {
      // This would need to be implemented in the API
      const response = await fetch(`/api/organizations/${organization?.id}/followers`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!organization,
  });

  // Fetch member bookings for selected member
  const { data: memberBookings = [] } = useQuery({
    queryKey: ['/api/bookings/member', selectedMember?.id],
    queryFn: async () => {
      if (!selectedMember) return [];
      const response = await fetch(`/api/bookings/member/${selectedMember.id}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedMember,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ memberIds, message }: { memberIds: number[]; message: string }) => {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          organizationId: organization?.id,
          memberIds, 
          message,
          type: 'notification'
        }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Message sent successfully' });
      setMessageContent('');
      setSelectedMembers([]);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    },
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async ({ memberIds, subject, content }: { memberIds: number[]; subject: string; content: string }) => {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          organizationId: organization?.id,
          memberIds, 
          subject,
          content
        }),
      });
      if (!response.ok) throw new Error('Failed to send email');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Email sent successfully' });
      setEmailSubject('');
      setEmailContent('');
      setSelectedMembers([]);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to send email',
        variant: 'destructive',
      });
    },
  });

  // Export members list
  const exportMembers = () => {
    const csvContent = [
      ['Name', 'Email', 'Join Date', 'Status', 'Total Bookings'].join(','),
      ...filteredMembers.map(member => [
        member.username || 'N/A',
        member.email || 'N/A',
        new Date(member.createdAt || '').toLocaleDateString(),
        member.isActive ? 'Active' : 'Inactive',
        member.totalBookings || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${organization?.name}-members-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: 'Members list exported successfully' });
  };

  // Filter members based on search and membership status
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMembership = membershipFilter === 'all' || 
      (membershipFilter === 'active' && member.isActive) ||
      (membershipFilter === 'inactive' && !member.isActive);
    return matchesSearch && matchesMembership;
  });

  const toggleMemberSelection = (memberId: number) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectAllMembers = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers.map(member => member.id));
    }
  };

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
    <div className="min-h-screen" style={{ backgroundColor: `${organization.secondaryColor}10` }}>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/dashboard')}
            className="flex items-center gap-2 hover:bg-opacity-20"
            style={{ 
              color: organization.secondaryColor,
              borderColor: organization.secondaryColor
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="h-8 w-px bg-border" />
          <div>
            <h1 className="text-3xl font-bold" style={{ color: organization.secondaryColor }}>
              Members Management
            </h1>
            <p className="text-muted-foreground">
              Manage all members of {organization.name}
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <Card className="mb-6" style={{ borderTopColor: organization.secondaryColor, borderTopWidth: '4px' }}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Member Actions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={exportMembers}
                  variant="outline"
                  className="flex items-center gap-2"
                  style={{ borderColor: organization.secondaryColor, color: organization.secondaryColor }}
                >
                  <Download className="h-4 w-4" />
                  Export List
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={membershipFilter} onValueChange={setMembershipFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {selectedMembers.length > 0 && (
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        style={{ borderColor: organization.primaryColor, color: organization.primaryColor }}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Message ({selectedMembers.length})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Send Message</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Sending to {selectedMembers.length} selected member(s)
                        </p>
                        <Textarea
                          placeholder="Enter your message..."
                          value={messageContent}
                          onChange={(e) => setMessageContent(e.target.value)}
                          rows={4}
                        />
                        <Button
                          onClick={() => sendMessageMutation.mutate({ 
                            memberIds: selectedMembers, 
                            message: messageContent 
                          })}
                          disabled={!messageContent.trim() || sendMessageMutation.isPending}
                          className="w-full"
                          style={{ backgroundColor: organization.primaryColor }}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        style={{ borderColor: organization.accentColor, color: organization.accentColor }}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Email ({selectedMembers.length})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Send Email</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Sending to {selectedMembers.length} selected member(s)
                        </p>
                        <Input
                          placeholder="Email subject..."
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                        />
                        <Textarea
                          placeholder="Email content..."
                          value={emailContent}
                          onChange={(e) => setEmailContent(e.target.value)}
                          rows={6}
                        />
                        <Button
                          onClick={() => sendEmailMutation.mutate({ 
                            memberIds: selectedMembers, 
                            subject: emailSubject,
                            content: emailContent
                          })}
                          disabled={!emailSubject.trim() || !emailContent.trim() || sendEmailMutation.isPending}
                          className="w-full"
                          style={{ backgroundColor: organization.accentColor }}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send Email
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Members ({filteredMembers.length})
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllMembers}
                style={{ borderColor: organization.secondaryColor, color: organization.secondaryColor }}
              >
                {selectedMembers.length === filteredMembers.length ? 'Deselect All' : 'Select All'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div 
                  className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full"
                  style={{ borderColor: `${organization.secondaryColor}40`, borderTopColor: 'transparent' }}
                />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No members found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || membershipFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Members will appear here once people start following your organization.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                          onChange={selectAllMembers}
                          className="rounded"
                        />
                      </TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total Bookings</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(member.id)}
                            onChange={() => toggleMemberSelection(member.id)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{member.username}</span>
                            <span className="text-sm text-muted-foreground">{member.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(member.createdAt || '').toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={member.isActive ? "default" : "secondary"}
                            style={{ 
                              backgroundColor: member.isActive ? `${organization.primaryColor}20` : '#6b728020',
                              color: member.isActive ? organization.primaryColor : '#6b7280',
                              borderColor: member.isActive ? organization.primaryColor : '#6b7280',
                            }}
                          >
                            {member.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {member.totalBookings || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedMember(member)}
                                style={{ 
                                  borderColor: organization.secondaryColor,
                                  color: organization.secondaryColor 
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Member Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Name</label>
                                    <p className="text-sm text-muted-foreground">{selectedMember?.username}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Email</label>
                                    <p className="text-sm text-muted-foreground">{selectedMember?.email}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Join Date</label>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(selectedMember?.createdAt || '').toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedMember?.isActive ? 'Active' : 'Inactive'}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Recent Bookings</label>
                                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                                    {memberBookings.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">No bookings found</p>
                                    ) : (
                                      memberBookings.map((booking: any, index: number) => (
                                        <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                                          <span className="text-sm">{booking.className}</span>
                                          <Badge variant="outline">
                                            {booking.status}
                                          </Badge>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
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