import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Clock, MapPin } from "lucide-react";
import { formatTime, formatDate, formatCurrency, getSportColor } from "@/lib/utils";
import ClassForm from "@/components/forms/class-form";
import RealTimeAvailability from "@/components/real-time-availability";
import RealTimeNotifications from "@/components/real-time-notifications";

export default function Classes() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["/api/classes"],
    queryFn: () => api.getClasses({ organizationId: 1 }),
  });

  const { data: sports = [] } = useQuery({
    queryKey: ["/api/sports"],
    queryFn: api.getSports,
  });

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Classes & Clinics</h1>
            <p className="text-muted-foreground">Manage your sports classes and training sessions</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold">Classes & Clinics</h1>
          <p className="text-muted-foreground">Manage your sports classes and training sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <RealTimeNotifications userId={1} organizationId={1} />
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                New Class
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
              </DialogHeader>
              <ClassForm 
                sports={sports}
                onSuccess={() => setShowCreateDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classItem) => {
          const sportColor = getSportColor(classItem.sport?.name || '');
          const isUpcoming = new Date(classItem.startTime) > new Date();
          
          return (
            <Card key={classItem.id} className="overflow-hidden">
              <CardHeader className={`bg-${sportColor}/5 border-l-4 border-${sportColor}`}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{classItem.name}</CardTitle>
                  <Badge 
                    variant={isUpcoming ? "default" : "secondary"}
                    className={isUpcoming ? `bg-${sportColor} text-white` : ''}
                  >
                    {classItem.sport?.name}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(classItem.startTime)}
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-2 h-4 w-4" />
                    {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}
                  </div>
                  
                  {classItem.location && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="mr-2 h-4 w-4" />
                      {classItem.location}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm">
                      <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{classItem.bookingCount}/{classItem.capacity}</span>
                      <span className="text-muted-foreground ml-1">participants</span>
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {formatCurrency(Number(classItem.price))}
                    </div>
                  </div>

                  {classItem.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {classItem.description}
                    </p>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    <Button 
                      size="sm"
                      className={`flex-1 bg-${sportColor} hover:bg-${sportColor}/90 text-white`}
                      disabled={classItem.availableSpots === 0}
                    >
                      {classItem.availableSpots === 0 ? 'Full' : 'Book Now'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {classes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Users className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No classes yet</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first class or clinic.</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create First Class
          </Button>
        </div>
      )}
    </div>
  );
}
