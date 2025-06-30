import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Key, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Get token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      toast({
        title: "Invalid Reset Link",
        description: "This password reset link is invalid or expired.",
        variant: "destructive",
      });
      setLocation("/auth");
    }
  }, [setLocation, toast]);

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reset password");
      }
      return response.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. You can now log in with your new password.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Password Reset Failed",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast({
        title: "Error",
        description: "Please enter a new password",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    resetPasswordMutation.mutate({ token, password });
  };

  if (isSuccess) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: 'linear-gradient(135deg, #20366B 0%, #278DD4 50%, #24D367 100%)'
        }}
      >
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold" style={{ color: '#20366B' }}>
              Password Reset Complete
            </CardTitle>
            <CardDescription style={{ color: '#64748B' }}>
              Your password has been successfully updated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => setLocation("/auth")}
              className="w-full"
              style={{ backgroundColor: '#278DD4', color: 'white' }}
            >
              Continue to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #20366B 0%, #278DD4 50%, #24D367 100%)'
      }}
    >
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Key className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold" style={{ color: '#20366B' }}>
            Reset Your Password
          </CardTitle>
          <CardDescription style={{ color: '#64748B' }}>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium" style={{ color: '#374151' }}>
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                placeholder="Enter your new password"
                required
                minLength={8}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium" style={{ color: '#374151' }}>
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full"
                placeholder="Confirm your new password"
                required
                minLength={8}
              />
            </div>

            <Button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="w-full"
              style={{ backgroundColor: '#278DD4', color: 'white' }}
            >
              {resetPasswordMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Resetting Password...
                </div>
              ) : (
                "Reset Password"
              )}
            </Button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => setLocation("/auth")}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Back to Login
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}