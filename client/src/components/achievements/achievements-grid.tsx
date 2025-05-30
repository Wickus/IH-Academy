import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Badge from "./badge";
import AchievementPopup from "./achievement-popup";
import type { Achievement, UserAchievement } from "@shared/schema";

interface AchievementsGridProps {
  userId: number;
}

export default function AchievementsGrid({ userId }: AchievementsGridProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  const { data: achievements } = useQuery({
    queryKey: ['/api/achievements'],
  });

  const { data: userAchievements } = useQuery({
    queryKey: ['/api/achievements/user', userId],
  });

  const categories = ['all', 'booking', 'attendance', 'social', 'milestone'];
  const [activeCategory, setActiveCategory] = useState('all');

  if (!achievements) return null;

  const filteredAchievements = achievements.filter((achievement: Achievement) => 
    activeCategory === 'all' || achievement.category === activeCategory
  );

  const isAchievementUnlocked = (achievementId: number) => {
    return userAchievements?.some((ua: UserAchievement) => 
      ua.achievementId === achievementId && ua.isCompleted
    );
  };

  const handleBadgeClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowPopup(true);
  };

  const categoryLabels = {
    all: 'All',
    booking: 'Booking',
    attendance: 'Attendance', 
    social: 'Social',
    milestone: 'Milestones'
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>
        <p className="text-gray-600">Unlock badges by completing activities and reaching milestones</p>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-gray-100">
          {categories.map((category) => (
            <TabsTrigger 
              key={category}
              value={category}
              className="text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              {categoryLabels[category as keyof typeof categoryLabels]}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="mt-6">
            <motion.div 
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {filteredAchievements.map((achievement: Achievement, index: number) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.3,
                    delay: index * 0.05
                  }}
                >
                  <Badge
                    name={achievement.name}
                    description={achievement.description}
                    icon={achievement.icon}
                    color={achievement.color}
                    points={achievement.points}
                    isUnlocked={isAchievementUnlocked(achievement.id)}
                    onClick={() => handleBadgeClick(achievement)}
                  />
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>

      <AchievementPopup
        achievement={selectedAchievement}
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
      />
    </div>
  );
}