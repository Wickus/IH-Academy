import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Phone, FileText, Shield } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function CoachSettings() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    specializations: "",
    experience: "",
  });

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

  const { data: userOrganizations = [] } = useQuery({
    queryKey: ["/api/organizations/my"],
    queryFn: api.getUserOrganizations,
    enabled: !!user,
  });

  // Find the coach record for the current user
  const coachRecord = coaches.find(c => c.userId === user?.id);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/coaches/${coachRecord?.id}`, {
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
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStartEditing = () => {
    setProfileData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: coachRecord?.phone || "",
      bio: coachRecord?.bio || "",
      specializations: coachRecord?.specializations || "",
      experience: coachRecord?.experience || "",
    });
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      displayName: `${profileData.firstName} ${profileData.lastName}`,
      bio: profileData.bio,
      specializations: profileData.specializations,
      experience: profileData.experience,
      phone: profileData.phone,
    });
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-[#20366B]">Coach Settings</h1>
        <p className="text-slate-600">Manage your coaching profile and preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Organizations</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Preferences</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#20366B] to-[#278DD4] text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Personal Profile</CardTitle>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    className="text-white border-white/30 hover:bg-white/10"
                    onClick={handleStartEditing}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      className="text-white border-white/30 hover:bg-white/10"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-[#24D367] hover:bg-[#24D367]/90 text-white"
                      onClick={handleSaveProfile}
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isEditing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="firstName" className="text-[#20366B] font-medium">
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                        className="border-slate-300 focus:border-[#24D367]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-[#20366B] font-medium">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                        className="border-slate-300 focus:border-[#24D367]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="email" className="text-[#20366B] font-medium">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        className="border-slate-300 focus:border-[#24D367]"
                        disabled
                      />
                      <p className="text-xs text-slate-500 mt-1">Contact support to change your email address</p>
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-[#20366B] font-medium">
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        className="border-slate-300 focus:border-[#24D367]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bio" className="text-[#20366B] font-medium">
                      Bio
                    </Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      className="border-slate-300 focus:border-[#24D367]"
                      rows={3}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="specializations" className="text-[#20366B] font-medium">
                      Specializations
                    </Label>
                    <Input
                      id="specializations"
                      value={profileData.specializations}
                      onChange={(e) => setProfileData({...profileData, specializations: e.target.value})}
                      className="border-slate-300 focus:border-[#24D367]"
                      placeholder="e.g., Youth Training, Fitness, Technical Skills"
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience" className="text-[#20366B] font-medium">
                      Experience
                    </Label>
                    <Input
                      id="experience"
                      value={profileData.experience}
                      onChange={(e) => setProfileData({...profileData, experience: e.target.value})}
                      className="border-slate-300 focus:border-[#24D367]"
                      placeholder="e.g., 5 years coaching experience"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-[#20366B]" />
                      <div>
                        <p className="font-medium text-[#20366B]">Full Name</p>
                        <p className="text-slate-600">{user?.firstName} {user?.lastName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-[#20366B]" />
                      <div>
                        <p className="font-medium text-[#20366B]">Email</p>
                        <p className="text-slate-600">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-[#20366B]" />
                      <div>
                        <p className="font-medium text-[#20366B]">Phone</p>
                        <p className="text-slate-600">{coachRecord?.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-[#20366B]" />
                      <div>
                        <p className="font-medium text-[#20366B]">Status</p>
                        <Badge className="bg-[#24D367]/20 text-[#20366B] border-[#24D367]/30">
                          Active Coach
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-[#20366B] mb-2">Bio</p>
                    <p className="text-slate-600">
                      {coachRecord?.bio || "No bio provided yet. Click 'Edit Profile' to add one."}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-[#20366B] mb-2">Specializations</p>
                    <p className="text-slate-600">
                      {coachRecord?.specializations || "No specializations listed yet."}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-[#20366B] mb-2">Experience</p>
                    <p className="text-slate-600">
                      {coachRecord?.experience || "Experience not specified yet."}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organizations Tab */}
        <TabsContent value="organizations">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-[#20366B]/10">
              <CardTitle className="text-[#20366B]">My Organizations</CardTitle>
              <p className="text-slate-600">Organizations where you provide coaching services.</p>
            </CardHeader>
            <CardContent className="p-6">
              {userOrganizations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userOrganizations.map((org) => (
                    <div
                      key={org.id}
                      className="p-4 rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: org.primaryColor }}
                        >
                          {org.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold" style={{ color: org.primaryColor }}>
                            {org.name}
                          </h4>
                          <Badge 
                            style={{
                              backgroundColor: `${org.accentColor}20`,
                              color: org.primaryColor,
                              borderColor: `${org.accentColor}30`
                            }}
                          >
                            {org.businessModel} model
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">
                        {org.description || 'No description provided'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                  <h4 className="font-semibold text-slate-600 mb-1">No Organizations</h4>
                  <p className="text-slate-500">You haven't been assigned to any organizations yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-[#20366B]/10">
              <CardTitle className="text-[#20366B]">Preferences</CardTitle>
              <p className="text-slate-600">Manage your notification and display preferences.</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-[#20366B] mb-2">Notifications</h4>
                  <p className="text-sm text-slate-600">
                    Email and push notification preferences will be available in a future update.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-[#20366B] mb-2">Language</h4>
                  <p className="text-sm text-slate-600">
                    Interface language settings will be available in a future update.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}