import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { ArrowLeft, Send, MessageCircle, Users, Clock, Reply } from "lucide-react";
import { Link } from "wouter";
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

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

  // New message form
  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      recipientType: 'organization',
      recipientId: '',
      subject: '',
      message: '',
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessageFormData) => {
      const response = await apiRequest('POST', '/api/messages/send', {
        recipientType: data.recipientType,
        recipientId: parseInt(data.recipientId),
        subject: data.subject,
        message: data.message,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
      setShowNewMessage(false);
      form.reset();
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

  const onSubmit = (data: MessageFormData) => {
    sendMessageMutation.mutate(data);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'read': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter messages
  const sentMessages = messages.filter((msg: Message) => msg.senderId === msg.senderId);
  const receivedMessages = messages.filter((msg: Message) => msg.senderId !== msg.senderId);

  if (messagesLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Profile
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
          </div>
          
          <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
            <DialogTrigger asChild>
              <Button className="bg-brand-primary hover:bg-brand-primary/90">
                <Send className="h-4 w-4 mr-2" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send New Message</DialogTitle>
                <DialogDescription>
                  Send a message to one of your organizations
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="recipientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an organization" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {organizations.map((org: Organization) => (
                              <SelectItem key={org.id} value={org.id.toString()}>
                                {org.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter message subject" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter your message" 
                            className="min-h-[120px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowNewMessage(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={sendMessageMutation.isPending}
                      className="bg-brand-primary hover:bg-brand-primary/90"
                    >
                      {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Messages Content */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              All Messages ({messages.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Sent ({sentMessages.length})
            </TabsTrigger>
            <TabsTrigger value="received" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Received ({receivedMessages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <MessageList messages={messages} onMessageClick={setSelectedMessage} />
          </TabsContent>
          
          <TabsContent value="sent" className="mt-6">
            <MessageList messages={sentMessages} onMessageClick={setSelectedMessage} />
          </TabsContent>
          
          <TabsContent value="received" className="mt-6">
            <MessageList messages={receivedMessages} onMessageClick={setSelectedMessage} />
          </TabsContent>
        </Tabs>

        {/* Message Detail Dialog */}
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            {selectedMessage && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedMessage.subject}</DialogTitle>
                  <DialogDescription className="flex items-center gap-4">
                    <span>From: {selectedMessage.senderName}</span>
                    <span>To: {selectedMessage.recipientName}</span>
                    <Badge className={getStatusColor(selectedMessage.status)}>
                      {selectedMessage.status}
                    </Badge>
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{selectedMessage.senderName}</span>
                      <span className="text-sm text-slate-500">
                        {formatDistanceToNow(new Date(selectedMessage.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="whitespace-pre-line">{selectedMessage.message}</p>
                  </div>
                  
                  {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Reply className="h-4 w-4" />
                        Replies ({selectedMessage.replies.length})
                      </h4>
                      {selectedMessage.replies.map((reply) => (
                        <div key={reply.id} className="bg-blue-50 p-4 rounded-lg ml-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{reply.senderName}</span>
                            <span className="text-sm text-slate-500">
                              {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="whitespace-pre-line">{reply.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Message List Component
function MessageList({ 
  messages, 
  onMessageClick 
}: { 
  messages: Message[], 
  onMessageClick: (message: Message) => void 
}) {
  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-medium mb-2">No messages</h3>
          <p className="text-slate-500">You don't have any messages yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <Card 
          key={message.id} 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onMessageClick(message)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-medium truncate">{message.subject}</h3>
                  <Badge className={`text-xs ${getStatusColor(message.status)}`}>
                    {message.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                  <span>From: {message.senderName}</span>
                  <span>•</span>
                  <span>To: {message.recipientName}</span>
                </div>
                <p className="text-slate-700 text-sm line-clamp-2">
                  {message.message}
                </p>
              </div>
              <div className="text-right ml-4">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                </div>
                {message.replies && message.replies.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                    <Reply className="h-3 w-3" />
                    {message.replies.length} replies
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Helper function for status colors
function getStatusColor(status: string) {
  switch (status) {
    case 'sent': return 'bg-blue-100 text-blue-800';
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'read': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}