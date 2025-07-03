import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface DailyScheduleCoachesFormProps {
  dailyScheduleId: number;
  organization: any;
}

export default function DailyScheduleCoachesForm({ dailyScheduleId, organization }: DailyScheduleCoachesFormProps) {
  const [coach1, setCoach1] = useState<number | null>(null);
  const [coach2, setCoach2] = useState<number | null>(null);
  const [coach3, setCoach3] = useState<number | null>(null);
  const [coach4, setCoach4] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available coaches
  const { data: coaches = [] } = useQuery({
    queryKey: ['/api/coaches'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/coaches');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch assigned coaches for this daily schedule
  const { data: scheduleCoaches = [] } = useQuery({
    queryKey: ['/api/daily-schedules', dailyScheduleId, 'coaches'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/daily-schedules/${dailyScheduleId}/coaches`);
      return response.json();
    },
    staleTime: 30 * 1000,
  });

  // Prepare typed data
  const coachesArray = Array.isArray(coaches) ? coaches : [];
  const scheduleCoachesArray = Array.isArray(scheduleCoaches) ? scheduleCoaches : [];
  const typedScheduleCoaches = scheduleCoachesArray as Array<{
    id: number;
    coachId: number;
    role: string;
  }>;

  // Load existing coach assignments when data changes
  useEffect(() => {
    if (typedScheduleCoaches.length > 0) {
      // Find coaches by their role
      const primaryCoach = typedScheduleCoaches.find(sc => sc.role === 'primary');
      const assistantCoaches = typedScheduleCoaches.filter(sc => sc.role === 'assistant');
      
      if (primaryCoach) setCoach1(primaryCoach.coachId);
      if (assistantCoaches[0]) setCoach2(assistantCoaches[0].coachId);
      if (assistantCoaches[1]) setCoach3(assistantCoaches[1].coachId);
      if (assistantCoaches[2]) setCoach4(assistantCoaches[2].coachId);
    }
  }, [typedScheduleCoaches]);

  // Update coaches mutation
  const updateCoachesMutation = useMutation({
    mutationFn: async (coachIds: (number | null)[]) => {
      const assignments = [];
      
      // Add primary coach (Coach 1)
      if (coachIds[0]) {
        assignments.push({ coachId: coachIds[0], role: 'primary' });
      }
      
      // Add assistant coaches (Coach 2, 3, 4)
      for (let i = 1; i < coachIds.length; i++) {
        if (coachIds[i]) {
          assignments.push({ coachId: coachIds[i], role: 'assistant' });
        }
      }

      const response = await apiRequest('PUT', `/api/daily-schedules/${dailyScheduleId}/coaches`, {
        assignments
      });
      
      if (!response.ok) {
        throw new Error('Failed to update coach assignments');
      }
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/daily-schedules', dailyScheduleId, 'coaches'] });
      toast({
        title: 'Coach Assignments Updated',
        description: 'The coaches have been successfully assigned to this daily schedule.',
      });
    },
    onError: (error) => {
      console.error('Failed to update coaches:', error);
      toast({
        title: 'Update Failed', 
        description: 'Failed to update coach assignments. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const isLoading = updateCoachesMutation.isPending;

  const handleSaveCoaches = () => {
    updateCoachesMutation.mutate([coach1, coach2, coach3, coach4]);
  };

  const getCoachName = (coachId: number | null) => {
    if (!coachId) return '';
    const coach = coachesArray.find((c: any) => c.id === coachId);
    return coach?.name || coach?.displayName || coach?.username || `Coach ${coachId}`;
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-bold" style={{ color: organization?.primaryColor || '#20366B' }}>
          <Users className="h-5 w-5" />
          Coach Assignments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {coachesArray.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Coaches Available</h3>
            <p className="text-slate-600 mb-4">
              You need to add coaches to your organization before you can assign them to daily schedules.
            </p>
            <p className="text-sm text-slate-500">
              Go to the Coaches page to invite or add coaches to your organization.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {/* Coach 1 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Coach 1 (Primary)</label>
                <Select
                  value={coach1?.toString() || ""}
                  onValueChange={(value) => setCoach1(value ? parseInt(value) : null)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary coach" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No coach assigned</SelectItem>
                    {coachesArray.map((coach: any) => (
                      <SelectItem 
                        key={coach.id} 
                        value={coach.id.toString()}
                        disabled={[coach2, coach3, coach4].includes(coach.id)}
                      >
                        {getCoachName(coach.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Coach 2 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Coach 2</label>
                <Select
                  value={coach2?.toString() || ""}
                  onValueChange={(value) => setCoach2(value ? parseInt(value) : null)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select second coach" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No coach assigned</SelectItem>
                    {coachesArray.map((coach: any) => (
                      <SelectItem 
                        key={coach.id} 
                        value={coach.id.toString()}
                        disabled={[coach1, coach3, coach4].includes(coach.id)}
                      >
                        {getCoachName(coach.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Coach 3 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Coach 3</label>
                <Select
                  value={coach3?.toString() || ""}
                  onValueChange={(value) => setCoach3(value ? parseInt(value) : null)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select third coach" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No coach assigned</SelectItem>
                    {coachesArray.map((coach: any) => (
                      <SelectItem 
                        key={coach.id} 
                        value={coach.id.toString()}
                        disabled={[coach1, coach2, coach4].includes(coach.id)}
                      >
                        {getCoachName(coach.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Coach 4 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Coach 4</label>
                <Select
                  value={coach4?.toString() || ""}
                  onValueChange={(value) => setCoach4(value ? parseInt(value) : null)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fourth coach" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No coach assigned</SelectItem>
                    {coachesArray.map((coach: any) => (
                      <SelectItem 
                        key={coach.id} 
                        value={coach.id.toString()}
                        disabled={[coach1, coach2, coach3].includes(coach.id)}
                      >
                        {getCoachName(coach.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleSaveCoaches}
                disabled={isLoading}
                className="text-white"
                style={{ 
                  backgroundColor: organization?.primaryColor || '#20366B',
                  borderColor: organization?.primaryColor || '#20366B'
                }}
              >
                {isLoading ? 'Saving...' : 'Save Assignments'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}