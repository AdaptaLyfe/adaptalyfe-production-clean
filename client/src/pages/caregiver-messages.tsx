import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { formatTimeAgo } from "@/lib/utils";
import { useSubscriptionEnforcement } from "@/middleware/subscription-middleware";
import PremiumFeaturePrompt from "@/components/premium-feature-prompt";
import type { Caregiver, Message } from "@shared/schema";

const retryTransientRequest = (failureCount: number, error: unknown) => {
  const status = (error as { status?: number } | null)?.status;

  // Authentication and permission failures will not be fixed by retrying.
  if (status !== undefined && status >= 400 && status < 500) {
    return false;
  }

  // Three total attempts covers startup/network races without creating a
  // request loop when the backend is unavailable.
  return failureCount < 2;
};

const retryDelay = (attemptIndex: number) =>
  Math.min(500 * 2 ** attemptIndex, 2000);

async function fetchCollection<T>(url: string): Promise<T[]> {
  const response = await apiRequest("GET", url);
  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error(`Invalid response received from ${url}`);
  }

  return data as T[];
}

function getMessageDate(value: Message["sentAt"]): Date | null {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function CaregiverMessages() {
  const [, setLocation] = useLocation();
  const { isPremiumUser } = useSubscriptionEnforcement();

  const {
    data: messagesResponse,
    isLoading: messagesLoading,
    isError: messagesError,
    refetch: refetchMessages,
  } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    queryFn: () => fetchCollection<Message>("/api/messages"),
    retry: retryTransientRequest,
    retryDelay,
  });

  const {
    data: caregiversResponse,
    isLoading: caregiversLoading,
    isError: caregiversError,
    refetch: refetchCaregivers,
  } = useQuery<Caregiver[]>({
    queryKey: ["/api/caregivers"],
    queryFn: () => fetchCollection<Caregiver>("/api/caregivers"),
    retry: retryTransientRequest,
    retryDelay,
  });

  if (!isPremiumUser) {
    return (
      <div className="container mx-auto p-6">
        <PremiumFeaturePrompt
          title="Caregiver Communication"
          description="Connect with your support network, share updates, and coordinate care. Subscribe to continue using Adaptalyfe's caregiver features."
          feature="caregiver"
          requiredPlan="family"
          className="max-w-md mx-auto mt-20"
        />
      </div>
    );
  }

  const messages = Array.isArray(messagesResponse) ? messagesResponse : [];
  const caregivers = (Array.isArray(caregiversResponse) ? caregiversResponse : [])
    .filter((caregiver): caregiver is Caregiver => Boolean(caregiver && typeof caregiver === "object"));
  const sortedMessages = [...messages]
    .filter((message): message is Message => Boolean(message && typeof message === "object"))
    .sort((a, b) => {
      const aTime = getMessageDate(a.sentAt)?.getTime() ?? 0;
      const bTime = getMessageDate(b.sentAt)?.getTime() ?? 0;
      return bTime - aTime;
    });
  const isLoading = messagesLoading || caregiversLoading;
  const hasError = messagesError || caregiversError;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/caregiver")}
          aria-label="Back to Contact Support"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">Your complete support message history</p>
        </div>
      </div>

      <Card className="border-t-4 border-bright-blue">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <MessageCircle className="text-bright-blue" size={24} />
            Message History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4" aria-label="Loading messages">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-24 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : hasError ? (
            <Alert variant="destructive">
              <AlertTitle>Unable to load messages</AlertTitle>
              <AlertDescription className="flex flex-wrap items-center gap-3">
                <span>We couldn’t load your support message history. Please try again.</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void refetchMessages();
                    void refetchCaregivers();
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </AlertDescription>
            </Alert>
          ) : sortedMessages.length === 0 ? (
            <div className="py-12 text-center">
              <MessageCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">No messages yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Messages you send to your support team will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedMessages.map((message) => {
                const caregiver = caregivers.find((item) => item.id === message.caregiverId);
                const recipientLabel = caregiver?.name || "Support";
                const messageDate = getMessageDate(message.sentAt);

                return (
                  <div
                    key={message.id}
                    className={`rounded-lg border-2 p-4 ${
                      message.fromUser
                        ? "ml-0 bg-blue-50 border-blue-200 sm:ml-8"
                        : "mr-0 bg-teal-50 border-teal-200 sm:mr-8"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-gray-900">
                        {message.fromUser ? `Sent to ${recipientLabel}` : recipientLabel}
                      </span>
                      <span className="shrink-0 text-xs text-gray-500">
                        {messageDate ? formatTimeAgo(messageDate) : "Date unavailable"}
                      </span>
                    </div>
                    <p className="text-gray-700">{message.content}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}