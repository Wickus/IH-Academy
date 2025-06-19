import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Star, Users, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function FavouriteOrganizations() {
  const { toast } = useToast();

  const { data: userOrganizations = [] } = useQuery({
    queryKey: ["/api/organizations/my"],
    queryFn: api.getUserOrganizations,
  });

  const handleToggleFavorite = (orgId: number, orgName: string, isFavorite: boolean) => {
    toast({
      title: isFavorite ? "Removed from Favorites" : "Added to Favorites",
      description: `${orgName} has been ${isFavorite ? 'removed from' : 'added to'} your favorites`,
    });
  };

  const handleViewClasses = (orgId: number) => {
    window.location.href = `/organizations/${orgId}/classes`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-4 text-[#20366B] hover:bg-[#278DD4]/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="bg-gradient-to-r from-[#20366B] to-[#278DD4] rounded-xl p-6 text-white">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <Heart className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Favourite Organizations</h1>
                <p className="text-white/80">Manage your favorite sports organizations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Organizations Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {userOrganizations.map((org) => (
            <Card key={org.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                {/* Organization Header */}
                <div 
                  className="h-24 p-4 text-white relative rounded-t-lg"
                  style={{ 
                    background: `linear-gradient(135deg, ${org.primaryColor} 0%, ${org.secondaryColor} 100%)` 
                  }}
                >
                  <div className="absolute top-4 right-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFavorite(org.id, org.name, false)}
                      className="p-1 hover:bg-white/20"
                    >
                      <Heart className="h-5 w-5 text-white" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    {org.logo ? (
                      <img 
                        src={org.logo} 
                        alt={`${org.name} logo`}
                        className="w-8 h-8 rounded object-cover border border-white/20"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : null}
                    <div>
                      <h3 className="font-bold text-lg">{org.name}</h3>
                      <div className="flex items-center mt-1">
                        <Star className="h-4 w-4 mr-1" />
                        <span className="text-sm">Member</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Organization Details */}
                <div className="p-4">
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                    {org.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge 
                      variant="outline"
                      style={{ borderColor: org.primaryColor, color: org.primaryColor }}
                    >
                      {org.businessModel === 'membership' ? 'Membership' : 'Pay per class'}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      {org.planType}
                    </Badge>
                  </div>

                  <div className="text-sm text-slate-600 mb-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>
                        {org.businessModel === 'membership' 
                          ? `R${org.membershipPrice}/${org.membershipBillingCycle}`
                          : 'Pay per class'
                        }
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleFavorite(org.id, org.name, true)}
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Heart className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleViewClasses(org.id)}
                      className="flex-1 text-white"
                      style={{ backgroundColor: org.primaryColor }}
                    >
                      View Classes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {userOrganizations.length === 0 && (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No Favorite Organizations</h3>
            <p className="text-slate-500 mb-6">You haven't added any organizations to your favorites yet.</p>
            <Button
              onClick={() => window.location.href = '/discover'}
              className="bg-[#278DD4] hover:bg-[#278DD4]/90 text-white"
            >
              Discover Organizations
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}