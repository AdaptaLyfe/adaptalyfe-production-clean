import { useCallback, useEffect, useRef, useState } from "react";
import { useSafeRef } from "@/hooks/useSafeRef";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  getChatbotGreeting,
  getDisplayName,
  getLocalDateKey,
} from "@/lib/chatbot-greeting";
import { useSubscription } from "@/hooks/useSubscription";
import { ChatInput } from "@/components/chat-input";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  Compass,
  Crown,
  ListChecks,
  Lock,
  Maximize2,
  Sparkles,
  X,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "text" | "fallback" | "suggestion" | "encouragement";
  action?: ProposedAction;
  actionStatus?: ActionStatus;
}

type ProposedAction =
  | {
      action: "create_task";
      parameters: {
        title: string;
        dueDate?: string;
        dueTime?: string;
      };
    }
  | {
      action: "complete_task";
      parameters: {
        taskId: number;
      };
    };

type ActionStatus = "pending" | "executing" | "completed" | "cancelled" | "failed";

interface QuickSuggestion {
  id: string;
  text: string;
  icon: React.ReactNode;
}

const quickSuggestions: QuickSuggestion[] = [
  {
    id: "today",
    text: "What do I need to do today?",
    icon: <ListChecks className="h-4 w-4" />,
  },
  {
    id: "next",
    text: "What's next?",
    icon: <ArrowRight className="h-4 w-4" />,
  },
  {
    id: "plan",
    text: "Help me plan my day",
    icon: <Compass className="h-4 w-4" />,
  },
  {
    id: "appointments",
    text: "Show my appointments",
    icon: <CalendarDays className="h-4 w-4" />,
  },
];

const followUpSuggestions: QuickSuggestion[] = [
  {
    id: "follow-up-next",
    text: "What's next?",
    icon: <ArrowRight className="h-4 w-4" />,
  },
  {
    id: "follow-up-plan",
    text: "Help me plan my day",
    icon: <Compass className="h-4 w-4" />,
  },
  {
    id: "follow-up-appointments",
    text: "Show my appointments",
    icon: <CalendarDays className="h-4 w-4" />,
  },
];

function actionLabel(action: ProposedAction): string {
  if (action.action === "create_task") {
    return `Add “${action.parameters.title}”`;
  }
  return "Mark this daily task complete";
}

function AssistantAvatar({ compact = false }: { compact?: boolean }) {
  return (
    <Avatar className={compact ? "h-7 w-7 shrink-0" : "h-9 w-9 shrink-0"}>
      <AvatarFallback className="bg-emerald-100 text-emerald-700">
        <Bot className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </AvatarFallback>
    </Avatar>
  );
}

function renderAssistantLine(line: string, index: number) {
  const trimmed = line.trim();
  if (!trimmed) return <div key={`space-${index}`} className="h-1" />;

  const checklistMatch = trimmed.match(/^(?:✓\s*)?(.+?)\s+—\s+(.+)$/);
  if (checklistMatch) {
    return (
      <div
        key={`item-${index}`}
        className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5"
      >
        <CheckCircle2
          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
          aria-hidden="true"
        />
        <span className="min-w-0 text-sm leading-5 text-slate-700">
          <span className="font-semibold text-slate-900">{checklistMatch[1]}</span>
          <span className="mx-1 text-slate-400">—</span>
          {checklistMatch[2]}
        </span>
      </div>
    );
  }

  const isFollowUp = /^(want me|would you like|what would you like)/i.test(trimmed);
  const isGreeting = /^(good morning|good afternoon|good evening|hello|hi)\b/i.test(trimmed);

  return (
    <p
      key={`line-${index}`}
      className={
        isFollowUp
          ? "rounded-xl bg-blue-50 px-3 py-2.5 font-medium text-blue-800"
          : isGreeting
            ? "font-semibold text-slate-900"
            : "text-sm leading-6 text-slate-700"
      }
    >
      {trimmed}
    </p>
  );
}

function AssistantMessageBody({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const hasStructuredLines = lines.some((line) => /—/.test(line));

  if (!hasStructuredLines) {
    return <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{content}</p>;
  }

  return <div className="space-y-1.5">{lines.map(renderAssistantLine)}</div>;
}

function SuggestionButtons({
  suggestions,
  onSelect,
  compact = false,
  disabled = false,
}: {
  suggestions: QuickSuggestion[];
  onSelect: (suggestion: QuickSuggestion) => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className={compact ? "space-y-2" : "grid gap-2 sm:grid-cols-2"}>
      {suggestions.map((suggestion) => (
        <Button
          key={suggestion.id}
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => onSelect(suggestion)}
          className={`h-auto justify-between rounded-xl border-slate-200 bg-white text-left font-medium text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 ${
            compact ? "w-full px-3 py-2.5 text-xs" : "px-3 py-3 text-sm"
          }`}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              {suggestion.icon}
            </span>
            <span className="truncate">{suggestion.text}</span>
          </span>
          <ArrowRight className="ml-2 h-3.5 w-3.5 shrink-0 text-slate-400" />
        </Button>
      ))}
    </div>
  );
}

function WelcomeState({
  greeting,
  onSelect,
  compact = false,
  disabled = false,
}: {
  greeting: string;
  onSelect: (suggestion: QuickSuggestion) => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  if (compact) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-3">
        <div className="mb-3 flex items-start gap-2.5">
          <AssistantAvatar compact />
          <div>
            <p className="text-sm font-semibold text-slate-900">{greeting}</p>
            <p className="mt-0.5 text-xs text-slate-500">What would you like help with?</p>
          </div>
        </div>
        <SuggestionButtons
          suggestions={quickSuggestions.slice(0, 3)}
          onSelect={onSelect}
          compact
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center px-1 py-8 sm:px-6">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200">
          <Sparkles className="h-8 w-8" />
        </div>
        <p className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          {greeting}
        </p>
        <p className="mt-2 text-base text-slate-500">What would you like help with?</p>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-3 shadow-sm backdrop-blur sm:p-4">
        <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Try asking
        </p>
        <SuggestionButtons suggestions={quickSuggestions} onSelect={onSelect} disabled={disabled} />
      </div>
    </div>
  );
}

export default function AIChatbot({ careRecipientId }: { careRecipientId?: number } = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showFullChat, setShowFullChat] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useSafeRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isPremium } = useSubscription();
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  }) as { data: any };
  const dailyGreeting = getChatbotGreeting(
    getDisplayName(
      user?.username,
      user?.displayName ||
        user?.name ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" "),
    ),
  );

  const sendMessageMutation = useMutation({
    mutationFn: async ({
      message,
      localDate,
      localTime,
      timezone,
    }: {
      message: string;
      localDate: string;
      localTime: string;
      timezone?: string;
    }) => {
      const response = await apiRequest("POST", "/api/chat", {
        message,
        localDate,
        localTime,
        timezone,
        ...(careRecipientId ? { careRecipientId } : {}),
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message || "I'm here to help you with any questions.",
        timestamp: new Date(),
        type: data.type === "fallback" ? "fallback" : "text",
        action: data.action,
        actionStatus: data.action ? "pending" : undefined,
      };

      if (data.notice) {
        toast({
          title: data.notice,
          description: "Using smart fallback responses while AI service recovers.",
          duration: 3000,
        });
      }

      setMessages((previous) => [...previous, assistantMessage]);
      setIsTyping(false);
    },
    onError: (error: any) => {
      setIsTyping(false);

      let errorMessage = "I'm having trouble right now. Please try again in a moment.";
      if (error.message?.includes("429") || error.message?.includes("Too many requests")) {
        errorMessage = "I'm getting a lot of questions right now! Please wait a moment and try again.";
      }

      setMessages((previous) => [
        ...previous,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: errorMessage,
          timestamp: new Date(),
          type: "text",
        },
      ]);
    },
  });

  const executeActionMutation = useMutation({
    mutationFn: async ({
      messageId,
      action,
    }: {
      messageId: string;
      action: ProposedAction;
    }) => {
      const response = await apiRequest("POST", "/api/ai/actions/execute", {
        ...action,
        confirmed: true,
      });
      return (await response.json()) as { message: string };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points/balance"] });
      setMessages((previous) =>
        previous.map((message) =>
          message.id === variables.messageId
            ? {
                ...message,
                content: data.message,
                actionStatus: "completed",
              }
            : message,
        ),
      );
    },
    onError: (error: any, variables) => {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === variables.messageId
            ? {
                ...message,
                content:
                  error.message?.includes("already marked complete")
                    ? error.message.split(": ").slice(1).join(": ")
                    : "I couldn't complete that task action. Please try again.",
                actionStatus: "failed",
              }
            : message,
        ),
      );
      toast({
        title: "Action not completed",
        description: "Your daily task was not changed.",
        variant: "destructive",
      });
    },
  });

  const handleConfirmAction = useCallback(
    (messageId: string, action: ProposedAction) => {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === messageId
            ? { ...message, actionStatus: "executing" }
            : message,
        ),
      );
      executeActionMutation.mutate({ messageId, action });
    },
    [executeActionMutation],
  );

  const handleCancelAction = useCallback((messageId: string) => {
    setMessages((previous) =>
      previous.map((message) =>
        message.id === messageId
          ? {
              ...message,
              content: "No changes made.",
              actionStatus: "cancelled",
            }
          : message,
      ),
    );
  }, []);

  const handleSendMessage = useCallback(
    (message: string) => {
      const trimmedMessage = message.trim();
      if (!trimmedMessage || !user?.id || sendMessageMutation.isPending) return;

      setMessages((previous) => [
        ...previous,
        {
          id: `user-${Date.now()}`,
          role: "user",
          content: trimmedMessage,
          timestamp: new Date(),
        },
      ]);
      setIsTyping(true);

      const now = new Date();
      sendMessageMutation.mutate({
        message: trimmedMessage,
        localDate: getLocalDateKey(now),
        localTime: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    },
    [sendMessageMutation, user?.id],
  );

  const handleQuickSuggestion = useCallback(
    (suggestion: QuickSuggestion) => {
      handleSendMessage(suggestion.text);
    },
    [handleSendMessage],
  );

  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, messagesEndRef]);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const renderMessage = (message: ChatMessage, compact = false) => {
    const isAssistant = message.role === "assistant";

    return (
      <div
        key={message.id}
        className={`flex items-start gap-2.5 ${isAssistant ? "" : "flex-row-reverse"}`}
      >
        {isAssistant && <AssistantAvatar compact={compact} />}
        <div
          className={`min-w-0 rounded-2xl px-3.5 py-3 shadow-sm ${
            compact ? "max-w-[82%]" : "max-w-[88%] sm:max-w-[78%]"
          } ${
            isAssistant
              ? "border border-slate-200/80 bg-white"
              : "bg-slate-900 text-white"
          }`}
        >
          {isAssistant ? (
            <AssistantMessageBody content={message.content} />
          ) : (
            <p className="text-sm leading-6">{message.content}</p>
          )}
          {isAssistant && message.action && (
            <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
              <p className="text-xs font-semibold text-emerald-900">
                {message.actionStatus === "completed"
                  ? "Done"
                  : message.actionStatus === "cancelled"
                    ? "Cancelled"
                    : message.actionStatus === "failed"
                      ? "Not completed"
                      : "Please confirm"}
              </p>
              <p className="mt-1 text-xs leading-5 text-emerald-800">
                {actionLabel(message.action)}
              </p>
              {message.actionStatus === "pending" && (
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 rounded-lg bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-700"
                    onClick={() => handleConfirmAction(message.id, message.action!)}
                  >
                    Confirm
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg border-emerald-200 px-3 text-xs text-emerald-800"
                    onClick={() => handleCancelAction(message.id)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
              {message.actionStatus === "executing" && (
                <p className="mt-2 text-xs text-emerald-700">Making that change…</p>
              )}
            </div>
          )}
          <p
            className={`mt-2 text-[10px] ${
              isAssistant ? "text-slate-400" : "text-slate-300"
            }`}
          >
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
    );
  };

  const TypingIndicator = ({ compact = false }: { compact?: boolean }) => (
    <div className="flex items-start gap-2.5">
      <AssistantAvatar compact={compact} />
      <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
        <div className="flex gap-1" aria-label="AdaptAI is thinking">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:120ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  );

  const CompactChat = () => (
    <Card className="flex h-[min(38rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border-slate-200/80 bg-white shadow-2xl shadow-slate-900/15">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-blue-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AssistantAvatar compact />
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900">AdaptAI</CardTitle>
              <p className="text-[11px] text-slate-500">Your everyday assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full p-0 text-slate-500 hover:bg-white hover:text-slate-900"
              title="Close"
              aria-label="Close AdaptAI"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowFullChat(true)}
              className="h-8 w-8 rounded-full p-0 text-slate-500 hover:bg-white hover:text-slate-900"
              title="Expand"
              aria-label="Expand AdaptAI"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 bg-slate-50/70 p-3">
        <ScrollArea className="min-h-0 flex-1 pr-1">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <WelcomeState
                greeting={dailyGreeting}
                onSelect={handleQuickSuggestion}
                compact
                disabled={sendMessageMutation.isPending}
              />
            ) : (
              <>
                {messages.slice(-4).map((message) => renderMessage(message, true))}
                {isTyping && <TypingIndicator compact />}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {messages.length > 0 && !isTyping && (
          <div className="border-t border-slate-200/70 pt-2">
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Keep going
            </p>
            <SuggestionButtons
              suggestions={followUpSuggestions}
              onSelect={handleQuickSuggestion}
              compact
              disabled={sendMessageMutation.isPending}
            />
          </div>
        )}

        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={sendMessageMutation.isPending}
          placeholder="Ask AdaptAI..."
          className="border-slate-200"
        />
      </CardContent>
    </Card>
  );

  const FullChat = () => (
    <div className="flex h-full min-h-0 flex-col bg-gradient-to-b from-slate-50 to-white">
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <AssistantAvatar />
          <div>
            <h3 className="font-semibold text-slate-950">AdaptAI</h3>
            <p className="text-xs text-slate-500">A calm place to figure out what’s next</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isPremium && (
            <Badge variant="secondary" className="hidden items-center gap-1 sm:flex">
              <Crown className="h-3 w-3" />
              Basic plan
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFullChat(false)}
            className="h-9 w-9 rounded-full p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close full-screen AdaptAI"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <ScrollArea className="min-h-0 flex-1">
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-5 sm:px-8 sm:py-8">
            {messages.length === 0 ? (
              <WelcomeState
                greeting={dailyGreeting}
                onSelect={handleQuickSuggestion}
                disabled={sendMessageMutation.isPending}
              />
            ) : (
              <div className="space-y-5">
                {messages.map((message) => renderMessage(message))}
                {isTyping && <TypingIndicator />}
                {!isTyping && (
                  <div className="border-t border-slate-200/70 pt-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      You could also ask
                    </p>
                    <SuggestionButtons
                      suggestions={followUpSuggestions}
                      onSelect={handleQuickSuggestion}
                      disabled={sendMessageMutation.isPending}
                    />
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-slate-200/80 bg-white/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur sm:px-8">
          <div className="mx-auto w-full max-w-3xl">
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={sendMessageMutation.isPending}
              placeholder="Ask AdaptAI anything..."
              className="border-slate-200"
            />
            <p className="mt-2 text-center text-[10px] text-slate-400">
              AdaptAI uses your saved information to give relevant, grounded help.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-4 z-50 md:bottom-4">
        {!isOpen && !showFullChat && (
          <Button
            onClick={openChat}
            className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 p-0 shadow-lg shadow-emerald-900/20 transition hover:from-emerald-600 hover:to-teal-700"
            title="Open AdaptAI Chat"
            aria-label="Open AdaptAI Chat"
          >
            <Sparkles className="h-6 w-6 text-white" />
          </Button>
        )}
        {isOpen && !showFullChat && <CompactChat />}
      </div>

      <Dialog open={showFullChat} onOpenChange={setShowFullChat}>
        <DialogContent className="h-[calc(100dvh-1rem)] w-[calc(100vw-0.5rem)] max-w-4xl overflow-hidden rounded-3xl p-0 sm:h-[min(48rem,calc(100dvh-2rem))] sm:w-[calc(100vw-2rem)]">
          <DialogHeader className="sr-only">
            <DialogTitle>AdaptAI assistant</DialogTitle>
            <DialogDescription>
              Ask AdaptAI about your tasks, schedule, and next steps.
            </DialogDescription>
          </DialogHeader>
          <FullChat />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PremiumFeatureGate({
  children,
  feature,
  fallback,
}: {
  children: React.ReactNode;
  feature: "premium" | "family";
  fallback?: React.ReactNode;
}) {
  const { isPremium } = useSubscription();

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="space-y-2 text-center">
          <Lock className="mx-auto h-8 w-8 text-slate-400" />
          <p className="text-sm font-medium text-slate-600">Premium Feature</p>
          <Button size="sm" variant="outline">
            <Crown className="mr-1 h-4 w-4" />
            Upgrade
          </Button>
        </div>
      </div>
      <div className="pointer-events-none opacity-30">{fallback ?? children}</div>
    </div>
  );
}