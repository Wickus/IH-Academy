import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Crown, UserCheck, UserMinus, Users, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DailyScheduleCoachesFormProps {
  dailyScheduleId: number;
  organization: any;
}

export default function DailyScheduleCoachesForm({ dailyScheduleId, organization }: DailyScheduleCoachesFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCoachId, setSelectedCoachId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<"primary" | "assistant" | "substitute">("assistant");
  const [open, setOpen] = useState(false);

  // Fetch available coaches
  const { data: coaches = [] } = useQuery({
    queryKey: ['/api/coaches'],
    queryFn: () => apiRequest('GET', '/api/coaches'),
  });

  // Fetch assigned coaches for this daily schedule
  const { data: scheduleCoaches = [] } = useQuery({
    queryKey: ['/api/daily-schedules', dailyScheduleId, 'coaches'],
    queryFn: () => apiRequest('GET', `/api/daily-schedules/${dailyScheduleId}/coaches`),
    enabled: !!dailyScheduleId,
  });

  // Assign coach mutation
  const assignCoachMutation = useMutation({
    mutationFn: ({ coachId, role }: { coachId: number; role: string }) =>
      apiRequest('POST', `/api/daily-schedules/${dailyScheduleId}/coaches`, { coachId, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/daily-schedules', dailyScheduleId, 'coaches'] });
      setOpen(false);
      setSelectedCoachId(null);
      toast({
        title: "Coach Assigned",
        description: "Coach has been successfully assigned to this daily schedule.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign coach to daily schedule.",
        variant: "destructive",
      });
    },
  });

  // Remove coach mutation
  const removeCoachMutation = useMutation({
    mutationFn: (coachId: number) =>
      apiRequest('DELETE', `/api/daily-schedules/${dailyScheduleId}/coaches/${coachId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/daily-schedules', dailyScheduleId, 'coaches'] });
      toast({
        title: "Coach Removed",
        description: "Coach has been removed from this daily schedule.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Removal Failed",
        description: error.message || "Failed to remove coach from daily schedule.",
        variant: "destructive",
      });
    },
  });

  // Update coach role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ coachId, role }: { coachId: number; role: string }) =>
      apiRequest('PUT', `/api/daily-schedules/${dailyScheduleId}/coaches/${coachId}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/daily-schedules', dailyScheduleId, 'coaches'] });
      toast({
        title: "Role Updated",
        description: "Coach role has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update coach role.",
        variant: "destructive",
      });
    },
  });

  const handleAssignCoach = () => {
    if (!selectedCoachId) return;
    assignCoachMutation.mutate({ coachId: selectedCoachId, role: selectedRole });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "primary":
        return <Crown className="w-4 h-4" />;
      case "assistant":
        return <UserCheck className="w-4 h-4" />;
      case "substitute":
        return <UserMinus className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "primary":
        return organization?.primaryColor || "#20366B";
      case "assistant":
        return organization?.secondaryColor || "#278DD4";
      case "substitute":
        return organization?.accentColor || "#24D367";
      default:
        return "#6B7280";
    }
  };

  // Get available coaches (not already assigned)
  const scheduleCoachesArray = Array.isArray(scheduleCoaches) ? scheduleCoaches : [];
  const coachesArray = Array.isArray(coaches) ? coaches : [];
  const assignedCoachIds = new Set(scheduleCoachesArray.map((sc: any) => sc.coachId));
  const availableCoaches = coachesArray.filter((coach: any) => !assignedCoachIds.has(coach.id));

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Users className="w-5 h-5" style={{ color: organization?.primaryColor || "#20366B" }} />
          Assigned Coaches
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Assignments */}
        <div className="space-y-2">
          {scheduleCoachesArray.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No coaches assigned to this daily schedule yet.</p>
          ) : (
            scheduleCoachesArray.map((assignment: any) => {
              const coach = coachesArray?.find((c: any) => c.id === assignment.coachId);
              const coachName = coach?.name || coach?.displayName || coach?.username || 'Unknown Coach';
              return (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(assignment.role)}
                      <span className="font-medium">{coachName}</span>
                    </div>
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: getRoleColor(assignment.role),
                        color: getRoleColor(assignment.role),
                      }}
                    >
                      {assignment.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={assignment.role}
                      onValueChange={(newRole) =>
                        updateRoleMutation.mutate({ coachId: assignment.coachId, role: newRole })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="assistant">Assistant</SelectItem>
                        <SelectItem value="substitute">Substitute</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCoachMutation.mutate(assignment.coachId)}
                      disabled={removeCoachMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add New Coach */}
        {availableCoaches.length > 0 && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full"
                style={{
                  borderColor: organization?.secondaryColor || "#278DD4",
                  color: organization?.secondaryColor || "#278DD4",
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Assign Additional Coach
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Coach to Daily Schedule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Coach</label>
                  <Select value={selectedCoachId?.toString()} onValueChange={(value) => setSelectedCoachId(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a coach" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCoaches.map((coach: any) => (
                        <SelectItem key={coach.id} value={coach.id.toString()}>
                          {coach.name || coach.displayName || coach.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Coach Role</label>
                  <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary Coach</SelectItem>
                      <SelectItem value="assistant">Assistant Coach</SelectItem>
                      <SelectItem value="substitute">Substitute Coach</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleAssignCoach}
                    disabled={!selectedCoachId || assignCoachMutation.isPending}
                    style={{ backgroundColor: organization?.primaryColor || "#20366B" }}
                    className="flex-1"
                  >
                    {assignCoachMutation.isPending ? "Assigning..." : "Assign Coach"}
                  </Button>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}