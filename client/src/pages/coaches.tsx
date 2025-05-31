import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, Star, Users, Calendar } from "lucide-react";

export default function Coaches() {
  const { data: coaches = [], isLoading } = useQuery({
    queryKey: ["/api/coaches"],
    queryFn: () => api.getCoaches(1),
  });

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Coaches</h1>
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
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Coaches</h1>
          <p className="text-muted-foreground">Manage your coaching staff</p>
        </div>
        <Button>
          Add New Coach
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coaches.map((coach) => (
          <Card key={coach.id}>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {coach.user?.name?.split(' ').map((n: string) => n[0]).join('') || 'C'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{coach.user?.name || 'Unknown Coach'}</CardTitle>
                  <p className="text-sm text-muted-foreground">Coach</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {coach.user?.email && (
                  <div className="flex items-center text-sm text-slate-600">
                    <Mail className="mr-2 h-4 w-4 text-[#278DD4]" />
                    {coach.user.email}
                  </div>
                )}

                {coach.specializations && coach.specializations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Specializations</p>
                    <div className="flex flex-wrap gap-1">
                      {coach.specializations.map((spec: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {coach.bio && (
                  <div>
                    <p className="text-sm font-medium mb-1">Bio</p>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {coach.bio}
                    </p>
                  </div>
                )}

                {coach.hourlyRate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Hourly Rate</span>
                    <span className="font-medium">R{Number(coach.hourlyRate).toFixed(0)}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Users className="mr-2 h-4 w-4" />
                    Classes
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
          <Button>
            Add First Coach
          </Button>
        </div>
      )}
    </div>
  );
}
