import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, Star, Users, Calendar, Plus, Edit, UserPlus, Clock, CheckCircle, XCircle, Trash2 } from "lucide-react";
import CoachForm from "@/components/forms/coach-form";
import CoachInvitationForm from "@/components/forms/coach-invitation-form";

export default function Coaches() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [editingCoach, setEditingCoach] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: api.getCurrentUser,
  });

  const { data: userOrgs = [] } = useQuery({
    queryKey: ["/api/organizations/my"],
    queryFn: api.getUserOrganizations,
    enabled: !!currentUser,
  });

  const organization = userOrgs[0];

  const { data: coaches = [], isLoading } = useQuery({
    queryKey: ["/api/coaches", organization?.id],
    queryFn: () => api.getCoaches(organization?.id),
    enabled: !!organization?.id,
  });

  const { data: invitations = [] } = useQuery({
    queryKey: ["/api/coach-invitations"],
    queryFn: async () => {
      const response = await fetch("/api/coach-invitations", {
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error("Failed to fetch invitations");
      return response.json();
    },
    enabled: !!organization?.id,
  });

  const deleteInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await fetch(`/api/coach-invitations/${invitationId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error("Failed to delete invitation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coach-invitations"] });
      toast({ title: "Invitation deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading || !organization) {
    return (
      <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: `${organization?.secondaryColor || '#278DD4'}10` }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: organization?.secondaryColor || '#278DD4' }}>Coaches</h1>
            <p className="text-muted-foreground">Manage your coaching staff</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded mt-4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: `${organization.secondaryColor}10` }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: organization.secondaryColor }}>Coaches</h1>
          <p className="text-slate-600">Manage your coaching staff with ItsHappening.Africa</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                className="border-2"
                style={{ 
                  borderColor: organization.primaryColor,
                  color: organization.primaryColor
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Coach
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle style={{ color: organization.primaryColor }}>Invite New Coach</DialogTitle>
              </DialogHeader>
              <div className="max-h-[75vh] overflow-y-auto pr-2">
                <CoachInvitationForm 
                  onSuccess={() => setShowInviteDialog(false)}
                  organization={organization}
                />
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button 
                className="text-white shadow-lg border-0"
                style={{ backgroundColor: organization.accentColor }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${organization.accentColor}dd`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = organization.accentColor;
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Direct
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle style={{ color: organization.primaryColor }}>Add Coach Directly</DialogTitle>
              </DialogHeader>
              <div className="max-h-[75vh] overflow-y-auto pr-2">
                <CoachForm 
                  onSuccess={() => setShowCreateDialog(false)}
                  initialData={{ organizationId: organization?.id }}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Coach Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold" style={{ color: organization.primaryColor }}>Edit Coach</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {editingCoach && (
                <CoachForm
                  initialData={{
                    name: editingCoach.user?.name || '',
                    email: editingCoach.user?.email || '',
                    phone: editingCoach.phone || '',
                    bio: editingCoach.bio || '',
                    specializations: editingCoach.specializations || [],
                    hourlyRate: editingCoach.hourlyRate || 0,
                    profilePicture: editingCoach.profilePicture || '',
                    organizationId: editingCoach.organizationId
                  }}
                  isEdit={true}
                  editId={editingCoach.id}
                  onSuccess={() => {
                    setShowEditDialog(false);
                    setEditingCoach(null);
                  }}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="coaches" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="coaches" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Active Coaches ({coaches.length})
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Invitations ({invitations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coaches" className="space-y-6">
          {coaches.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">No Coaches Yet</h3>
              <p className="text-slate-500 mb-6">Start building your coaching team by inviting professional coaches or adding them directly.</p>
              <div className="flex justify-center gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setShowInviteDialog(true)}
                  style={{ 
                    borderColor: organization.primaryColor,
                    color: organization.primaryColor
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Coach
                </Button>
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  style={{ backgroundColor: organization.accentColor }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Direct
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coaches.map((coach) => (
          <Card key={coach.id} className="bg-white border border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#20366B] to-[#278DD4] text-white p-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                  {coach.profilePicture ? (
                    <img src={coach.profilePicture} alt={coach.user?.name} className="h-full w-full object-cover" />
                  ) : (
                    <AvatarFallback className="bg-[#24D367] text-white text-lg font-bold">
                      {coach.user?.name?.split(' ').map((n: string) => n[0]).join('') || 'C'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-xl text-white font-bold">{coach.user?.name || 'Unknown Coach'}</CardTitle>
                  <p className="text-blue-100 text-sm">Professional Coach</p>
                  {coach.user?.phone && (
                    <div className="flex items-center text-blue-100 text-sm mt-1">
                      <Phone className="mr-1 h-3 w-3" />
                      {coach.user.phone}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {coach.user?.email && (
                  <div className="flex items-center text-sm text-slate-700">
                    <Mail className="mr-2 h-4 w-4 text-[#278DD4]" />
                    <span className="text-slate-600">{coach.user.email}</span>
                  </div>
                )}

                {coach.specializations && coach.specializations.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2 text-[#20366B]">Specializations</p>
                    <div className="flex flex-wrap gap-1">
                      {coach.specializations.map((spec: string, index: number) => (
                        <Badge key={index} className="bg-[#24D3BF] text-[#20366B] hover:bg-[#1fb5a3] text-xs font-medium">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {coach.bio && (
                  <div>
                    <p className="text-sm font-semibold mb-2 text-[#20366B]">About</p>
                    <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {coach.bio}
                    </p>
                  </div>
                )}

                {coach.hourlyRate && (
                  <div className="bg-gradient-to-r from-[#24D367]/10 to-[#24D3BF]/10 p-3 rounded-lg border border-[#24D367]/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 font-medium">Hourly Rate</span>
                      <span className="font-bold text-[#20366B] text-lg">R{Number(coach.hourlyRate).toFixed(0)}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-4">
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-[#278DD4] hover:bg-[#1f7bc4] text-white border-0">
                      <Calendar className="mr-1 h-4 w-4" />
                      Schedule
                    </Button>
                    <Button size="sm" className="flex-1 bg-[#24D367] hover:bg-[#1fb557] text-white border-0">
                      <Users className="mr-1 h-4 w-4" />
                      Classes
                    </Button>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setEditingCoach(coach);
                      setShowEditDialog(true);
                    }}
                    className="w-full bg-[#20366B] hover:bg-[#1a2c57] text-white border-0"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Coach Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-6">
          {invitations.length === 0 ? (
            <Card className="p-12 text-center">
              <Clock className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">No Pending Invitations</h3>
              <p className="text-slate-500 mb-6">When you invite coaches, they'll appear here until they accept the invitation.</p>
              <Button 
                variant="outline"
                onClick={() => setShowInviteDialog(true)}
                style={{ 
                  borderColor: organization.primaryColor,
                  color: organization.primaryColor
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Send First Invitation
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation: any) => (
                <Card key={invitation.id} className="border-l-4" style={{ borderLeftColor: 
                  invitation.status === 'pending' ? '#F59E0B' : 
                  invitation.status === 'accepted' ? '#10B981' : '#EF4444' 
                }}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{invitation.firstName} {invitation.lastName}</h3>
                        <p className="text-slate-600">{invitation.email}</p>
                        {invitation.phone && (
                          <p className="text-slate-500 text-sm">{invitation.phone}</p>
                        )}
                        {invitation.specializations && invitation.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {invitation.specializations.map((spec: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          {invitation.status === 'pending' && (
                            <>
                              <Clock className="h-4 w-4 text-amber-500" />
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                Pending
                              </Badge>
                            </>
                          )}
                          {invitation.status === 'accepted' && (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Accepted
                              </Badge>
                            </>
                          )}
                          {invitation.status === 'expired' && (
                            <>
                              <XCircle className="h-4 w-4 text-red-500" />
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Expired
                              </Badge>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          Invited {new Date(invitation.createdAt).toLocaleDateString()}
                        </p>
                        {invitation.expiresAt && (
                          <p className="text-xs text-slate-500">
                            Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
