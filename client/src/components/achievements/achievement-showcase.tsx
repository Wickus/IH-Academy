import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Zap, Target } from "lucide-react";
import Badge from "./badge";
import AchievementPopup from "./achievement-popup";
import AchievementsGrid from "./achievements-grid";
import { useToast } from "@/hooks/use-toast";
import type { Achievement, UserStats } from "@shared/schema";

interface AchievementShowcaseProps {
  userId: number;
}

export default function AchievementShowcase({ userId }: AchievementShowcaseProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showFullGrid, setShowFullGrid] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userStats } = useQuery({
    queryKey: ['/api/stats/user', userId],
  });

  const { data: achievements } = useQuery({
    queryKey: ['/api/achievements'],
  });

  const { data: userAchievements } = useQuery({
    queryKey: ['/api/achievements/user', userId],
  });

  const checkAchievementsMutation = useMutation({
    mutationFn: () => fetch(`/api/achievements/check/${userId}`, { method: 'POST' }).then(res => res.json()),
    onSuccess: (newAchievements: Achievement[]) => {
      if (newAchievements.length > 0) {
        // Show the first new achievement
        setSelectedAchievement(newAchievements[0]);
        setShowPopup(true);
        
        toast({
          title: "Achievement Unlocked!",
          description: `You earned ${newAchievements.length} new badge${newAchievements.length > 1 ? 's' : ''}!`,
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/achievements/user', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/user', userId] });
    },
  });

  if (!achievements || !userStats) return null;

  const recentAchievements = userAchievements?.slice(0, 3) || [];
  const totalUnlocked = userAchievements?.length || 0;
  const totalAvailable = achievements.length;

  const stats = [
    {
      label: "Total Points",
      value: userStats.totalPoints,
      icon: Star,
      color: "#F59E0B"
    },
    {
      label: "Achievements",
      value: `${totalUnlocked}/${totalAvailable}`,
      icon: Trophy,
      color: "#10B981"
    },
    {
      label: "Current Streak",
      value: `${userStats.currentStreak} days`,
      icon: Zap,
      color: "#F97316"
    },
    {
      label: "Classes Completed",
      value: userStats.completedClasses,
      icon: Target,
      color: "#8B5CF6"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="text-center">
              <CardContent className="p-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <stat.icon className="h-6 w-6" style={{ color: stat.color }} />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Achievements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl text-gray-900">Recent Achievements</CardTitle>
          <Button
            variant="outline"
            onClick={() => checkAchievementsMutation.mutate()}
            disabled={checkAchievementsMutation.isPending}
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            {checkAchievementsMutation.isPending ? "Checking..." : "Check Progress"}
          </Button>
        </CardHeader>
        <CardContent>
          {recentAchievements.length > 0 ? (
            <div className="flex gap-4 mb-4">
              {recentAchievements.map((userAchievement: any) => {
                const achievement = achievements.find((a: Achievement) => a.id === userAchievement.achievementId);
                if (!achievement) return null;
                
                return (
                  <Badge
                    key={achievement.id}
                    name={achievement.name}
                    description={achievement.description}
                    icon={achievement.icon}
                    color={achievement.color}
                    points={achievement.points}
                    isUnlocked={true}
                    onClick={() => {
                      setSelectedAchievement(achievement);
                      setShowPopup(true);
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No achievements unlocked yet. Start booking classes to earn your first badge!</p>
            </div>
          )}
          
          <Button
            variant="ghost"
            onClick={() => setShowFullGrid(true)}
            className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            View All Achievements ({totalAvailable} total)
          </Button>
        </CardContent>
      </Card>

      {/* Full Achievements Grid Modal */}
      {showFullGrid && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-lg shadow-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">All Achievements</h2>
              <Button
                variant="ghost"
                onClick={() => setShowFullGrid(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </Button>
            </div>
            
            <AchievementsGrid userId={userId} />
          </motion.div>
        </motion.div>
      )}

      <AchievementPopup
        achievement={selectedAchievement}
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
      />
    </div>
  );
}