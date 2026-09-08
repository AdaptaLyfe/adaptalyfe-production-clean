import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  MessageSquare, Send, Heart, ThumbsUp, Smile, Star, Plus,
  Video, Phone, Edit, Trash2, Clock, Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  messageType: string;
  isRead: boolean;
  sentAt: string;
  senderName?: string;
  reactions?: MessageReaction[];
}

interface MessageReaction {
  id: number;
  messageId: number;
  userId: number;
  emoji: string;
  createdAt: string;
  userName?: string;
}

interface QuickResponse {
  id: number;
  messageTemplate: string;
  category: string;
  useCount: number;
  isActive: boolean;
}

export function EnhancedCommunication() {
  const [newMessage, setNewMessage] = useState("");
  const [selectedCaregiver, setSelectedCaregiver] = useState<number | null>(null);
  const [showQuickResponses, setShowQuickResponses] = useState(false);
  const [editingQuickResponse, setEditingQuickResponse] = useState<QuickResponse | null>(null);
  const [newQuickResponse, setNewQuickResponse] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("greeting");
  
  const { toast } = useToast();

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ['/api/messages']
  });

  // Fetch caregivers
  const { data: caregivers = [] } = useQuery({
    queryKey: ['/api/caregivers']
  });

  // Fetch quick responses
  const { data: quickResponses = [] } = useQuery({
    queryKey: ['/api/quick-responses']
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: {
      receiverId: number;
      content: string;
      messageType: string;
    }) => {
      return await apiRequest('POST', '/api/messages', messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      setNewMessage("");
      toast({
        title: "Message Sent",
        description: "Your message has been delivered successfully."
      });
    }
  });

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async (reactionData: {
      messageId: number;
      emoji: string;
    }) => {
      return await apiRequest('POST', '/api/message-reactions', reactionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    }
  });

  // Remove reaction mutation
  const removeReactionMutation = useMutation({
    mutationFn: async (reactionData: {
      messageId: number;
      emoji: string;
    }) => {
      return await apiRequest('DELETE', `/api/message-reactions`, reactionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    }
  });

  // Create quick response mutation
  const createQuickResponseMutation = useMutation({
    mutationFn: async (responseData: {
      messageTemplate: string;
      category: string;
    }) => {
      return await apiRequest('POST', '/api/quick-responses', responseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quick-responses'] });
      setNewQuickResponse("");
      toast({
        title: "Quick Response Added",
        description: "Your template has been saved for future use."
      });
    }
  });

  // Use quick response mutation
  const useQuickResponseMutation = useMutation({
    mutationFn: async (responseId: number) => {
      return await apiRequest('PATCH', `/api/quick-responses/${responseId}/use`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quick-responses'] });
    }
  });

  const availableEmojis = ['👍', '❤️', '😊', '😢', '😮', '🎉', '⭐', '🔥'];

  const quickResponseCategories = [
    { id: "greeting", name: "Greetings", icon: "👋" },
    { id: "status", name: "Status Updates", icon: "📝" },
    { id: "request", name: "Requests", icon: "🙋" },
    { id: "emergency", name: "Emergency", icon: "🚨" },
    { id: "thanks", name: "Thanks", icon: "🙏" }
  ];

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedCaregiver) {
      toast({
        title: "Message Required",
        description: "Please select a caregiver and enter a message.",
        variant: "destructive"
      });
      return;
    }

    sendMessageMutation.mutate({
      receiverId: selectedCaregiver,
      content: newMessage.trim(),
      messageType: "text"
    });
  };

  const handleQuickResponse = (template: string, responseId: number) => {
    setNewMessage(template);
    useQuickResponseMutation.mutate(responseId);
  };

  const handleReaction = (messageId: number, emoji: string) => {
    const message = messages.find((m: Message) => m.id === messageId);
    const existingReaction = message?.reactions?.find(
      (r: MessageReaction) => r.emoji === emoji && r.userId === 1 // Current user ID
    );

    if (existingReaction) {
      removeReactionMutation.mutate({ messageId, emoji });
    } else {
      addReactionMutation.mutate({ messageId, emoji });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const grouped: { [key: string]: Message[] } = {};
    
    messages.forEach((message) => {
      const dateKey = formatDate(message.sentAt);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(message);
    });

    return grouped;
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Communication Hub */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Enhanced Communication
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Caregiver Selection */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Select Caregiver:</label>
            <div className="flex gap-2 flex-wrap">
              {caregivers.map((caregiver: any) => (
                <Button
                  key={caregiver.id}
                  variant={selectedCaregiver === caregiver.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCaregiver(caregiver.id)}
                  className="flex items-center gap-2"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {caregiver.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuickResponses(!showQuickResponses)}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Quick Responses
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              disabled
              className="flex items-center gap-2"
            >
              <Video className="h-4 w-4" />
              Video Call
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              disabled
              className="flex items-center gap-2"
            >
              <Phone className="h-4 w-4" />
              Voice Call
            </Button>
          </div>

          {/* Quick Responses Panel */}
          {showQuickResponses && (
            <Card className="mb-4 bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Quick Response Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickResponseCategories.map((category) => {
                    const categoryResponses = quickResponses.filter(
                      (qr: QuickResponse) => qr.category === category.id
                    );
                    
                    if (categoryResponses.length === 0) return null;

                    return (
                      <div key={category.id}>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                          <span>{category.icon}</span>
                          {category.name}
                        </h4>
                        <div className="flex gap-2 flex-wrap">
                          {categoryResponses.map((response: QuickResponse) => (
                            <Button
                              key={response.id}
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickResponse(response.messageTemplate, response.id)}
                              className="text-xs"
                            >
                              {response.messageTemplate}
                              <Badge variant="secondary" className="ml-1 text-xs">
                                {response.useCount}
                              </Badge>
                            </Button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Add New Quick Response */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="dashed" size="sm" className="w-full">
                        <Plus className="h-4 w-4 mr-1" />
                        Add New Template
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Quick Response Template</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Category:</label>
                          <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                          >
                            {quickResponseCategories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-2 block">Message Template:</label>
                          <Textarea
                            value={newQuickResponse}
                            onChange={(e) => setNewQuickResponse(e.target.value)}
                            placeholder="Enter your message template..."
                            rows={3}
                          />
                        </div>
                        
                        <Button
                          onClick={() => {
                            if (newQuickResponse.trim()) {
                              createQuickResponseMutation.mutate({
                                messageTemplate: newQuickResponse.trim(),
                                category: selectedCategory
                              });
                            }
                          }}
                          disabled={!newQuickResponse.trim()}
                          className="w-full"
                        >
                          Create Template
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message Input */}
          <div className="space-y-3">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[100px]"
            />
            
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                {selectedCaregiver ? "Ready to send" : "Select a caregiver first"}
              </p>
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !selectedCaregiver || sendMessageMutation.isPending}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Send Message
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message History */}
      <Card>
        <CardHeader>
          <CardTitle>Message History</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No messages yet</p>
              <p className="text-sm text-gray-500">Start a conversation with your caregiver</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
                <div key={dateKey}>
                  <div className="text-center mb-4">
                    <Badge variant="outline" className="bg-gray-100">
                      {dateKey}
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    {dateMessages.map((message: Message) => (
                      <div key={message.id} className="space-y-2">
                        <div className={`flex ${message.senderId === 1 ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderId === 1 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-200 text-gray-900'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs opacity-75">
                                {formatTime(message.sentAt)}
                              </p>
                              {message.senderId === 1 && (
                                <Check className="h-3 w-3 opacity-75" />
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Message Reactions */}
                        <div className="flex items-center gap-2 justify-center">
                          <div className="flex gap-1">
                            {availableEmojis.map((emoji) => (
                              <Button
                                key={emoji}
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReaction(message.id, emoji)}
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                              >
                                {emoji}
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Show existing reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex gap-2 justify-center flex-wrap">
                            {message.reactions.reduce((acc: any[], reaction: MessageReaction) => {
                              const existingReaction = acc.find(r => r.emoji === reaction.emoji);
                              if (existingReaction) {
                                existingReaction.count++;
                                existingReaction.users.push(reaction.userName || 'Someone');
                              } else {
                                acc.push({
                                  emoji: reaction.emoji,
                                  count: 1,
                                  users: [reaction.userName || 'Someone']
                                });
                              }
                              return acc;
                            }, []).map((reactionGroup, index) => (
                              <Badge 
                                key={index}
                                variant="outline" 
                                className="text-xs cursor-pointer hover:bg-gray-100"
                                title={`Reacted by: ${reactionGroup.users.join(', ')}`}
                              >
                                {reactionGroup.emoji} {reactionGroup.count}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}