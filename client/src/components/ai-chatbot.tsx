import { useState, useEffect, useCallback } from "react";
import { useSafeRef } from "@/hooks/useSafeRef";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useSubscription } from "@/hooks/useSubscription";
import { ChatInput } from "@/components/chat-input";
import { 
  Bot, 
  Send, 
  Mic, 
  Volume2, 
  Heart, 
  Lightbulb, 
  HelpCircle, 
  MessageCircle,
  Sparkles,
  Crown,
  Lock,
  Minimize2,
  Maximize2,
  X
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'encouragement';
}

interface QuickSuggestion {
  id: string;
  text: string;
  category: 'help' | 'encouragement' | 'planning' | 'skills';
  icon: React.ReactNode;
}

export default function AIChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm AdaptAI, your personal AI assistant. I'm here to help you succeed and build confidence every day!\n\nI can help you with:\n• Planning daily tasks and routines\n• Managing money and budgets\n• Understanding medications and health\n• Learning new life skills\n• Connecting with your support team\n• Handling difficult emotions\n• Using AdaptaLyfe features\n\nWhat would you like to work on today? You can type a question or choose from the suggestions below!",
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [showFullChat, setShowFullChat] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useSafeRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const { isPremium } = useSubscription();

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  }) as { data: any };

  const quickSuggestions: QuickSuggestion[] = [
    {
      id: 'help-tasks',
      text: "Help me plan my daily tasks",
      category: 'planning',
      icon: <HelpCircle className="w-4 h-4" />
    },
    {
      id: 'encouragement',
      text: "I'm feeling overwhelmed",
      category: 'encouragement',
      icon: <Heart className="w-4 h-4" />
    },
    {
      id: 'cooking-help',
      text: "Show me simple cooking tips",
      category: 'skills',
      icon: <Lightbulb className="w-4 h-4" />
    },
    {
      id: 'money-help',
      text: "Help me understand my budget",
      category: 'help',
      icon: <HelpCircle className="w-4 h-4" />
    },
    {
      id: 'medication-help',
      text: "How do I organize my medications?",
      category: 'help',
      icon: <HelpCircle className="w-4 h-4" />
    },
    {
      id: 'routine-building',
      text: "Help me build a daily routine",
      category: 'planning',
      icon: <Lightbulb className="w-4 h-4" />
    },
    {
      id: 'social-support',
      text: "I want to connect with my caregivers",
      category: 'help',
      icon: <MessageCircle className="w-4 h-4" />
    },
    {
      id: 'learning-skills',
      text: "What new skills can I learn?",
      category: 'skills',
      icon: <Sparkles className="w-4 h-4" />
    },
    {
      id: 'app-navigation',
      text: "How do I use this app?",
      category: 'help',
      icon: <HelpCircle className="w-4 h-4" />
    },
    {
      id: 'feeling-proud',
      text: "I accomplished something today!",
      category: 'encouragement',
      icon: <Heart className="w-4 h-4" />
    }
  ];

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, userId }: { message: string; userId: number }) => {
      const response = await apiRequest("POST", "/api/chat", { message, userId });
      return await response.json();
    },
    onSuccess: (data: any) => {
      console.log("Chat response:", data); // Debug log
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message || "I'm here to help you with any questions.",
        timestamp: new Date(),
        type: data.type || 'text'
      };
      
      // Show notice if it's a fallback response
      if (data.notice) {
        toast({
          title: data.notice,
          description: "Using smart fallback responses while AI service recovers.",
          duration: 3000,
        });
      }
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    },
    onError: (error: any) => {
      console.error("Chat error:", error);
      setIsTyping(false);
      
      let errorMessage = "I'm having trouble right now. Please try again in a moment.";
      
      // Handle rate limiting specifically
      if (error.message?.includes('429') || error.message?.includes('Too many requests')) {
        errorMessage = "I'm getting a lot of questions right now! Please wait a moment and try again.";
      }
      
      const errorResponseMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorResponseMessage]);
    }
  });

  const handleSendMessage = useCallback((message: string) => {
    if (!message.trim() || !user?.id) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    sendMessageMutation.mutate({
      message: message,
      userId: user.id
    });
  }, [user?.id, sendMessageMutation]);

  const handleQuickSuggestion = (suggestion: QuickSuggestion) => {
    setInputMessage(suggestion.text);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'encouragement':
        return <Heart className="w-3 h-3 text-pink-500" />;
      case 'suggestion':
        return <Lightbulb className="w-3 h-3 text-yellow-500" />;
      default:
        return <Bot className="w-3 h-3 text-blue-500" />;
    }
  };

  const CompactChat = () => {
    return (
      <Card className="w-80 h-96 flex flex-col bg-white border-2 border-gray-200 shadow-xl">
        <CardHeader className="pb-3 bg-blue-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                  <Bot className="w-3 h-3" />
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-sm text-gray-800 font-semibold">AdaptAI</CardTitle>
            </div>
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0 hover:bg-gray-100"
                title="Close"
              >
                <X className="w-3 h-3" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowFullChat(true)}
                className="h-6 w-6 p-0 hover:bg-gray-100"
                title="Expand"
              >
                <Maximize2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-3 pt-0 bg-white">
          <ScrollArea className="flex-1 pr-3 max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-2 mt-2">
            <div className="space-y-3">
              {messages.slice(-3).map((message) => (
                <div key={message.id} className={`flex gap-2 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}>
                  {message.role === 'assistant' && (
                    <Avatar className="w-6 h-6 flex-shrink-0">
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                        {getMessageIcon(message.type)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[70%] rounded-lg p-2 text-xs shadow-sm ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white ml-auto' 
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}>
                    {message.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                      <Bot className="w-3 h-3" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white border border-gray-200 rounded-lg p-2 text-xs shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-75" />
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-150" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>
          
          <div className="mt-3 space-y-2 bg-white">
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={sendMessageMutation.isPending}
              placeholder="Type your message..."
              className="text-xs border-gray-300"
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const FullChat = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between p-4 border-b bg-blue-50 border-gray-200">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-blue-100 text-blue-600">
              <Bot className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-gray-800">AdaptAI</h3>
            <p className="text-sm text-gray-600">Always here to help and support you</p>
          </div>
        </div>
        {!isPremium && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Crown className="w-3 h-3" />
            Basic Plan
          </Badge>
        )}
      </div>

      <div className="flex-1 flex bg-white">
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4 overflow-y-auto bg-gray-50">
            <div className="space-y-4 min-h-0">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}>
                  {message.role === 'assistant' && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getMessageIcon(message.type)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white ml-auto' 
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          <div className="p-4 border-t space-y-3 bg-white">
            <div className="flex gap-2 flex-wrap">
              {quickSuggestions.map((suggestion) => (
                <Button
                  key={suggestion.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSuggestion(suggestion)}
                  className="text-xs border-gray-300 hover:bg-gray-50"
                >
                  {suggestion.icon}
                  {suggestion.text}
                </Button>
              ))}
            </div>
            
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={sendMessageMutation.isPending}
              placeholder="Type your message..."
              className="border-gray-300"
            />
          </div>
        </div>

        {!isPremium && (
          <div className="w-64 border-l bg-gray-50 p-4">
            <div className="text-center space-y-3">
              <Crown className="w-8 h-8 text-yellow-500 mx-auto" />
              <h4 className="font-medium text-gray-800">Upgrade to Premium</h4>
              <p className="text-sm text-gray-600">
                Get unlimited AI conversations, advanced features, and priority support.
              </p>
              <Button className="w-full">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Chatbot Toggle Button */}
      <div className="fixed bottom-4 right-4 z-50">
        {!isOpen && !showFullChat && (
          <Button
            onClick={() => setIsOpen(true)}
            className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
            title="Open AdaptAI Assistant"
          >
            <Bot className="w-6 h-6 text-white" />
          </Button>
        )}
        
        {isOpen && !showFullChat && <CompactChat />}
      </div>

      {/* Full Screen Chat Dialog */}
      <Dialog open={showFullChat} onOpenChange={setShowFullChat}>
        <DialogContent className="max-w-4xl h-[80vh] p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>AdaptAI Chat</DialogTitle>
            <DialogDescription>Full screen chat interface with the AdaptAI assistant</DialogDescription>
          </DialogHeader>
          <FullChat />
        </DialogContent>
      </Dialog>
    </>
  );
}

// Premium Feature Gate Component
export function PremiumFeatureGate({ 
  children, 
  feature, 
  fallback 
}: { 
  children: React.ReactNode;
  feature: 'premium' | 'family';
  fallback?: React.ReactNode;
}) {
  const { isPremium } = useSubscription();
  
  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
        <div className="text-center space-y-2">
          <Lock className="w-8 h-8 text-gray-400 mx-auto" />
          <p className="text-sm font-medium text-gray-600">Premium Feature</p>
          <Button size="sm" variant="outline">
            <Crown className="w-4 h-4 mr-1" />
            Upgrade
          </Button>
        </div>
      </div>
      <div className="opacity-30 pointer-events-none">
        {children}
      </div>
    </div>
  );
}