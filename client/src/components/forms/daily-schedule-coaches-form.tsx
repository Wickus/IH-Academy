import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';
import { Users } from 'lucide-react';

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
    queryFn: () => apiRequest('GET', '/api/coaches'),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch assigned coaches for this daily schedule
  const { data: scheduleCoaches = [] } = useQuery({
    queryKey: ['/api/daily-schedules', dailyScheduleId, 'coaches'],
    queryFn: () => apiRequest('GET', `/api/daily-schedules/${dailyScheduleId}/coaches`),
    staleTime: 30 * 1000,
  });

  // Update coaches mutation
  const updateCoachesMutation = useMutation({
    mutationFn: async (coachIds: (number | null)[]) => {
      // First, remove all existing coaches
      const scheduleCoachesArray = Array.isArray(scheduleCoaches) ? scheduleCoaches : [];
      for (const assignment of scheduleCoachesArray) {
        await apiRequest('DELETE', `/api/daily-schedules/${dailyScheduleId}/coaches/${assignment.coachId}`);
      }
      
      // Then add new coaches
      const validCoachIds = coachIds.filter(id => id !== null) as number[];
      for (let i = 0; i < validCoachIds.length; i++) {
        const coachId = validCoachIds[i];
        const role = i === 0 ? 'primary' : 'assistant';
        await apiRequest('POST', `/api/daily-schedules/${dailyScheduleId}/coaches`, { coachId, role });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/daily-schedules', dailyScheduleId, 'coaches'] });
      toast({
        title: "Coaches Updated",
        description: "Coach assignments have been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update coach assignments. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Load existing coach assignments
  useEffect(() => {
    const scheduleCoachesArray = Array.isArray(scheduleCoaches) ? scheduleCoaches : [];
    const sortedCoaches = scheduleCoachesArray.sort((a: any, b: any) => {
      if (a.role === 'primary') return -1;
      if (b.role === 'primary') return 1;
      return 0;
    });

    setCoach1(sortedCoaches[0]?.coachId || null);
    setCoach2(sortedCoaches[1]?.coachId || null);
    setCoach3(sortedCoaches[2]?.coachId || null);
    setCoach4(sortedCoaches[3]?.coachId || null);
  }, [scheduleCoaches]);

  const handleSaveCoaches = () => {
    updateCoachesMutation.mutate([coach1, coach2, coach3, coach4]);
  };

  const coachesArray = Array.isArray(coaches) ? coaches : [];
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
        <div className="grid gap-4">
          {/* Coach 1 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Coach 1 (Primary)</label>
            <Select 
              value={coach1?.toString() || ''} 
              onValueChange={(value) => setCoach1(value ? Number(value) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select primary coach" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No coach assigned</SelectItem>
                {coachesArray.map((coach: any) => (
                  <SelectItem key={coach.id} value={coach.id.toString()}>
                    {coach.name || coach.displayName || coach.username || `Coach ${coach.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Coach 2 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Coach 2</label>
            <Select 
              value={coach2?.toString() || ''} 
              onValueChange={(value) => setCoach2(value ? Number(value) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select second coach" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No coach assigned</SelectItem>
                {coachesArray
                  .filter((coach: any) => coach.id !== coach1)
                  .map((coach: any) => (
                  <SelectItem key={coach.id} value={coach.id.toString()}>
                    {coach.name || coach.displayName || coach.username || `Coach ${coach.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Coach 3 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Coach 3</label>
            <Select 
              value={coach3?.toString() || ''} 
              onValueChange={(value) => setCoach3(value ? Number(value) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select third coach" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No coach assigned</SelectItem>
                {coachesArray
                  .filter((coach: any) => coach.id !== coach1 && coach.id !== coach2)
                  .map((coach: any) => (
                  <SelectItem key={coach.id} value={coach.id.toString()}>
                    {coach.name || coach.displayName || coach.username || `Coach ${coach.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Coach 4 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Coach 4</label>
            <Select 
              value={coach4?.toString() || ''} 
              onValueChange={(value) => setCoach4(value ? Number(value) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fourth coach" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No coach assigned</SelectItem>
                {coachesArray
                  .filter((coach: any) => coach.id !== coach1 && coach.id !== coach2 && coach.id !== coach3)
                  .map((coach: any) => (
                  <SelectItem key={coach.id} value={coach.id.toString()}>
                    {coach.name || coach.displayName || coach.username || `Coach ${coach.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Current Assignments Summary */}
        {(coach1 || coach2 || coach3 || coach4) && (
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Current Assignments:</h4>
            <div className="space-y-1 text-sm">
              {coach1 && <p>• Coach 1: {getCoachName(coach1)}</p>}
              {coach2 && <p>• Coach 2: {getCoachName(coach2)}</p>}
              {coach3 && <p>• Coach 3: {getCoachName(coach3)}</p>}
              {coach4 && <p>• Coach 4: {getCoachName(coach4)}</p>}
            </div>
          </div>
        )}

        <Button 
          onClick={handleSaveCoaches}
          disabled={updateCoachesMutation.isPending}
          className="w-full mt-6"
          style={{ backgroundColor: organization?.primaryColor || '#20366B' }}
        >
          {updateCoachesMutation.isPending ? 'Saving...' : 'Save Coach Assignments'}
        </Button>

        {coachesArray.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No coaches available. Please create coaches first.
          </p>
        )}
      </CardContent>
    </Card>
  );
}