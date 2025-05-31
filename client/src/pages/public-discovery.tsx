import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api, type Organization, type Class } from "@/lib/api";
import { formatCurrency, formatTime } from "@/lib/utils";
import { MapPin, Clock, Users, Search, Heart, Calendar } from "lucide-react";
import { Link } from "wouter";

export default function PublicDiscovery() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: organizations, isLoading: orgsLoading } = useQuery({
    queryKey: ['/api/organizations'],
    queryFn: () => api.getOrganizations(),
  });

  const { data: upcomingClasses, isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes', { public: true }],
    queryFn: () => api.getClasses({ public: true }),
  });

  const filteredOrganizations = organizations?.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleFollowOrganization = async (organizationId: number) => {
    try {
      await api.followOrganization(organizationId);
      // Refresh data or show success message
    } catch (error) {
      console.error('Failed to follow organization:', error);
    }
  };

  if (orgsLoading || classesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading sports organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-[#ffffff]">Discover Sports Organizations</h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Find and follow your favorite sports academies, clubs, and training facilities
        </p>
        
        {/* Search */}
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
          <Input
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-slate-900 bg-white border-slate-300 focus:border-primary focus:ring-primary"
          />
        </div>
      </div>
      {/* Featured Classes */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming Classes
          </CardTitle>
          <CardDescription className="text-slate-600">
            Book sessions happening soon across all organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingClasses?.slice(0, 6).map((classItem) => (
              <Card key={classItem.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold">{classItem.name}</h3>
                      <Badge variant="outline">{classItem.sport?.name}</Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(classItem.startTime)}</span>
                      </div>
                      {classItem.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{classItem.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{classItem.availableSpots} spots available</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">{formatCurrency(classItem.price)}</span>
                      <Link href={`/book?class=${classItem.id}`}>
                        <Button size="sm">Book Now</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Organizations Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrganizations.map((org) => (
          <Card key={org.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: org.primaryColor }}
                >
                  {org.name.charAt(0)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFollowOrganization(org.id)}
                  className="gap-1"
                >
                  <Heart className="h-4 w-4" />
                  Follow
                </Button>
              </div>
              <div>
                <CardTitle className="text-xl">{org.name}</CardTitle>
                <CardDescription className="mt-2">
                  {org.description || "Sports training and coaching"}
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                {org.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{org.address}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className="border-2"
                    style={{ 
                      borderColor: org.secondaryColor,
                      color: org.secondaryColor 
                    }}
                  >
                    {org.planType}
                  </Badge>
                  <Badge variant="secondary">
                    Up to {org.maxClasses} classes
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/organizations/${org.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
                <Link href={`/organizations/${org.id}/classes`} className="flex-1">
                  <Button 
                    className="w-full"
                    style={{ backgroundColor: org.primaryColor }}
                  >
                    View Classes
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {filteredOrganizations.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No organizations found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}