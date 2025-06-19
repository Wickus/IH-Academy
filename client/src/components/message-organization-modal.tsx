import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCircle, Send } from "lucide-react";

interface MessageOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: any;
  currentUser: any;
}

export default function MessageOrganizationModal({
  isOpen,
  onClose,
  organization,
  currentUser
}: MessageOrganizationModalProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: async ({ subject, message }: { subject: string; message: string }) => {
      return api.sendMessage({
        recipientType: 'organization',
        recipientId: organization.id,
        subject,
        message,
        senderName: currentUser.firstName || currentUser.username,
        senderEmail: currentUser.email
      });
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: `Your message has been sent to ${organization.name}`,
      });
      setSubject("");
      setMessage("");
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both subject and message",
        variant: "destructive",
      });
      return;
    }
    sendMessageMutation.mutate({ subject, message });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: organization.primaryColor || '#278DD4' }}
            >
              <MessageCircle className="h-4 w-4" />
            </div>
            <span>Message {organization.name}</span>
          </DialogTitle>
          <DialogDescription>
            Send a message directly to the organization administrators. They will receive an in-app notification and email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter message subject..."
              className="focus:ring-2"
              style={{ 
                focusRingColor: organization.primaryColor || '#278DD4',
                borderColor: organization.secondaryColor || '#f1f5f9'
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
              className="resize-none focus:ring-2"
              style={{ 
                focusRingColor: organization.primaryColor || '#278DD4',
                borderColor: organization.secondaryColor || '#f1f5f9'
              }}
            />
          </div>

          <div 
            className="flex items-center space-x-2 p-3 rounded-lg"
            style={{ backgroundColor: `${organization.primaryColor}10` }}
          >
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: organization.primaryColor || '#1c9bfd' }}
            >
              {(currentUser.firstName || currentUser.username).charAt(0).toUpperCase()}
            </div>
            <div className="text-sm" style={{ color: organization.primaryColor || '#1c9bfd' }}>
              Sending as: {currentUser.firstName || currentUser.username} ({currentUser.email})
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={sendMessageMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={sendMessageMutation.isPending}
              style={{ backgroundColor: organization.primaryColor || '#278DD4' }}
              className="text-white hover:opacity-90"
            >
              {sendMessageMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="h-4 w-4" />
                  <span>Send Message</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}