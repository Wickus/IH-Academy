import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Send, MessageCircle, Inbox, Clock, Reply } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  senderEmail?: string;
  recipientType: 'organization' | 'user';
  recipientId: number;
  recipientName: string;
  subject: string;
  message: string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
  replies?: MessageReply[];
}

interface MessageReply {
  id: number;
  messageId: number;
  senderId: number;
  senderName: string;
  message: string;
  createdAt: string;
}

interface Organization {
  id: number;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

const messageSchema = z.object({
  recipientType: z.enum(['organization']),
  recipientId: z.string().min(1, "Please select a recipient"),
  subject: z.string().min(1, "Subject is required").max(100, "Subject must be less than 100 characters"),
  message: z.string().min(1, "Message is required").max(1000, "Message must be less than 1000 characters"),
});

type MessageFormData = z.infer<typeof messageSchema>;

export default function MessagesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showComposer, setShowComposer] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedOrganization, setSelectedOrganization] = useState("");

  // Mark message as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest('PUT', `/api/messages/${messageId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      toast({
        title: "Message marked as read",
        description: "The message status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark message as read.",
        variant: "destructive",
      });
    },
  });

  const handleViewMessage = (messageId: number) => {
    markAsReadMutation.mutate(messageId);
  };

  // Fetch user's messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/messages'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/messages');
      return response.json();
    },
  });

  // Fetch user's organizations for sending messages
  const { data: organizations = [] } = useQuery({
    queryKey: ['/api/organizations/my'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/organizations/my');
      return response.json();
    },
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/messages/send', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
      setShowComposer(false);
      setSubject("");
      setMessage("");
      setSelectedOrganization("");
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Message",
        description: error.message || "An error occurred while sending the message.",
        variant: "destructive",
      });
    },
  });



  if (messagesLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleSendMessage = () => {
    if (!selectedOrganization || !subject.trim() || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    sendMutation.mutate({
      recipientType: "organization",
      recipientId: parseInt(selectedOrganization),
      subject: subject.trim(),
      message: message.trim(),
    });
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  if (messagesLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#278DD4] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/")}
              className="flex items-center space-x-2 text-slate-600 hover:text-[#20366B]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Profile</span>
            </Button>
            <h1 className="text-2xl font-bold text-[#20366B]">Messages</h1>
          </div>
          <Button 
            onClick={() => setShowComposer(true)}
            className="bg-[#278DD4] hover:bg-[#278DD4]/90 text-white"
          >
            <Send className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100">
            <TabsTrigger 
              value="all" 
              className="flex items-center space-x-2 data-[state=active]:bg-[#278DD4] data-[state=active]:text-white"
            >
              <MessageCircle className="h-4 w-4" />
              <span>All Messages ({messages.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="sent" 
              className="flex items-center space-x-2 data-[state=active]:bg-[#278DD4] data-[state=active]:text-white"
            >
              <Send className="h-4 w-4" />
              <span>Sent ({messages.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="received" 
              className="flex items-center space-x-2 data-[state=active]:bg-[#278DD4] data-[state=active]:text-white"
            >
              <Inbox className="h-4 w-4" />
              <span>Received (0)</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {messages.length === 0 ? (
              <div className="border-2 border-[#278DD4]/20 bg-[#278DD4]/5 rounded-lg p-8 text-center">
                <MessageCircle className="mx-auto h-16 w-16 text-[#278DD4] mb-4" />
                <h3 className="text-lg font-semibold text-[#20366B] mb-2">No messages</h3>
                <p className="text-slate-600">You don't have any messages yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg: any) => (
                  <div key={msg.id} className="p-6 border border-slate-200 rounded-lg hover:border-[#278DD4]/30 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-[#20366B]">{msg.subject}</h3>
                        <p className="text-sm text-slate-600">
                          To: {msg.recipientName} • {formatDate(msg.createdAt)}
                        </p>
                      </div>
                      <Badge 
                        variant={msg.status === 'read' ? 'default' : 'secondary'}
                        className={msg.status === 'read' ? 'bg-[#24D367] text-white' : 'bg-slate-100 text-slate-700'}
                      >
                        {msg.status}
                      </Badge>
                    </div>
                    <p className="text-slate-700 mb-4">{msg.message}</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-[#278DD4] border-[#278DD4]/30 hover:bg-[#278DD4]/10"
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-6">
            {messages.length === 0 ? (
              <div className="border-2 border-[#278DD4]/20 bg-[#278DD4]/5 rounded-lg p-8 text-center">
                <Send className="mx-auto h-16 w-16 text-[#278DD4] mb-4" />
                <h3 className="text-lg font-semibold text-[#20366B] mb-2">No sent messages</h3>
                <p className="text-slate-600">You haven't sent any messages yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg: any) => (
                  <div key={msg.id} className="p-6 border border-slate-200 rounded-lg hover:border-[#278DD4]/30 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-[#20366B]">{msg.subject}</h3>
                        <p className="text-sm text-slate-600">
                          To: {msg.recipientName} • {formatDate(msg.createdAt)}
                        </p>
                      </div>
                      <Badge 
                        variant={msg.status === 'read' ? 'default' : 'secondary'}
                        className={msg.status === 'read' ? 'bg-[#24D367] text-white' : 'bg-slate-100 text-slate-700'}
                      >
                        {msg.status}
                      </Badge>
                    </div>
                    <p className="text-slate-700 mb-4">{msg.message}</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-[#278DD4] border-[#278DD4]/30 hover:bg-[#278DD4]/10"
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="received" className="mt-6">
            <div className="border-2 border-[#278DD4]/20 bg-[#278DD4]/5 rounded-lg p-8 text-center">
              <Inbox className="mx-auto h-16 w-16 text-[#278DD4] mb-4" />
              <h3 className="text-lg font-semibold text-[#20366B] mb-2">No received messages</h3>
              <p className="text-slate-600">You haven't received any messages yet.</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Message Composer Dialog */}
        <Dialog open={showComposer} onOpenChange={setShowComposer}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#20366B]">Send New Message</DialogTitle>
              <DialogDescription>
                Send a message to one of your organizations
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#20366B] mb-2 block">Organization</label>
                <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org: any) => (
                      <SelectItem key={org.id} value={org.id.toString()}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-[#20366B] mb-2 block">Subject</label>
                <Input 
                  placeholder="Enter message subject" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-[#20366B] mb-2 block">Message</label>
                <Textarea 
                  placeholder="Enter your message" 
                  className="min-h-[120px]" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowComposer(false)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={!selectedOrganization || !subject.trim() || !message.trim() || sendMutation.isPending}
                  className="bg-[#278DD4] hover:bg-[#278DD4]/90 text-white"
                >
                  {sendMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

