import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import AchievementShowcase from "@/components/achievements/achievement-showcase";

export default function Achievements() {
  const { user } = useUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to view your achievements.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-slate-800">Your Achievements</h1>
        <p className="text-slate-600">Track your progress and unlock badges by staying active!</p>
      </div>
      
      <AchievementShowcase userId={user.id} />
    </div>
  );
}