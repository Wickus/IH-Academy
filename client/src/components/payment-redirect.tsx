import { useEffect } from "react";
import { useLocation } from "wouter";

export default function PaymentRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to user profile/dashboard
    setLocation("/dashboard");
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your profile...</p>
      </div>
    </div>
  );
}