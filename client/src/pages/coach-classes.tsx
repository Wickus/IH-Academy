import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, Users, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTime, formatCurrency } from "@/lib/utils";

export default function CoachClasses() {
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

  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes'],
    queryFn: () => api.getClasses(),
  });

  const { data: userOrganizations } = useQuery({
    queryKey: ["/api/organizations/my"],
    queryFn: api.getUserOrganizations,
    enabled: !!user,
  });

  // Find the coach record for the current user
  const coachRecord = coaches.find(c => c.userId === user?.id);
  
  // Filter classes that this coach is assigned to
  const coachClasses = classes.filter(c => c.coachId === coachRecord?.id);
  
  // Group classes by organization
  const classesByOrg = coachClasses.reduce((acc, classItem) => {
    const orgId = classItem.organizationId;
    if (!acc[orgId]) {
      acc[orgId] = [];
    }
    acc[orgId].push(classItem);
    return acc;
  }, {} as Record<number, typeof classes>);

  return (
    <div className="p-6 lg:p-10 space-y-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-[#20366B]">My Classes</h1>
        <p className="text-slate-600">Classes you're assigned to coach across all organizations.</p>
      </div>

      {coachClasses.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Calendar className="mx-auto h-16 w-16 text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No Classes Assigned</h3>
            <p className="text-slate-500">
              You haven't been assigned to any classes yet. Contact your organization admin to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {userOrganizations?.map((org) => {
            const orgClasses = classesByOrg[org.id] || [];
            if (orgClasses.length === 0) return null;

            return (
              <Card key={org.id} className="border-0 shadow-lg">
                <CardHeader style={{ backgroundColor: `${org.primaryColor}10` }}>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: org.primaryColor }}
                      >
                        {org.name.charAt(0)}
                      </div>
                      <span style={{ color: org.primaryColor }}>
                        {org.name} ({orgClasses.length} {orgClasses.length === 1 ? 'class' : 'classes'})
                      </span>
                    </div>
                    <Badge 
                      style={{
                        backgroundColor: `${org.accentColor}20`,
                        color: org.primaryColor,
                        borderColor: `${org.accentColor}30`
                      }}
                    >
                      {org.businessModel} model
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead style={{ color: org.primaryColor }}>Class</TableHead>
                          <TableHead style={{ color: org.primaryColor }}>Sport</TableHead>
                          <TableHead style={{ color: org.primaryColor }}>Schedule</TableHead>
                          <TableHead style={{ color: org.primaryColor }}>Capacity</TableHead>
                          <TableHead style={{ color: org.primaryColor }}>Price</TableHead>
                          <TableHead style={{ color: org.primaryColor }}>Location</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orgClasses.map((classItem) => (
                          <TableRow key={classItem.id}>
                            <TableCell>
                              <div className="font-semibold">{classItem.name}</div>
                              <div className="text-sm text-slate-600">{classItem.description}</div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                style={{
                                  backgroundColor: `${org.accentColor}20`,
                                  color: org.primaryColor,
                                  borderColor: `${org.accentColor}30`
                                }}
                              >
                                {classItem.sport?.name}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-slate-500" />
                                <div className="text-sm">
                                  <div>{formatDateTime(classItem.startTime)}</div>
                                  <div className="text-slate-500">Class scheduled</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4 text-slate-500" />
                                <span className="font-semibold">{classItem.capacity}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold" style={{ color: org.accentColor }}>
                                {formatCurrency(Number(classItem.price))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-slate-500" />
                                <span className="text-sm">{classItem.location || 'TBA'}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}