import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mail, Phone, Star, Users, Calendar, Plus, Edit } from "lucide-react";
import CoachForm from "@/components/forms/coach-form";

export default function Coaches() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
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
              Add New Coach
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle style={{ color: organization.primaryColor }}>Add New Coach</DialogTitle>
            </DialogHeader>
            <div className="max-h-[75vh] overflow-y-auto pr-2">
              <CoachForm 
                onSuccess={() => setShowCreateDialog(false)}
                initialData={{ organizationId: organization?.id }}
              />
            </div>
          </DialogContent>
        </Dialog>

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

      {coaches.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Users className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No coaches yet</h3>
          <p className="text-gray-500 mb-4">Add coaches to start managing your team.</p>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-[#24D367] hover:bg-[#1fb557] text-white shadow-lg border-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add First Coach
          </Button>
        </div>
      )}
    </div>
  );
}
