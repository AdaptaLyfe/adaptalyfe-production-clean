import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { UserCheck, MessageCircle, Share } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import type { Caregiver, Message } from "@shared/schema";

export default function CaregiverModule() {
  const { data: caregivers = [] } = useQuery<Caregiver[]>({
    queryKey: ["/api/caregivers"],
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  const recentMessages = messages
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
    .slice(0, 2);

  return (
    <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border-t-4 border-calm-teal">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-calm-teal rounded-lg flex items-center justify-center">
            <UserCheck className="text-white" size={20} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Support Network</h3>
        </div>
        <div className="flex space-x-2">
          <Button className="bg-calm-teal hover:bg-calm-teal text-white">
            <Share size={16} className="mr-2" />
            Share Progress
          </Button>
          <Link href="/caregiver">
            <Button variant="outline" className="border-calm-teal text-calm-teal hover:bg-teal-50">
              Request Help
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Connected Caregivers</h4>
          <div className="space-y-3">
            {caregivers.map((caregiver) => (
              <div key={caregiver.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-calm-teal rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {caregiver.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{caregiver.name}</h5>
                  <p className="text-sm text-gray-600">
                    {caregiver.relationship === "therapist" 
                      ? "Next session: Tomorrow 2 PM" 
                      : "Last active: 2 hours ago"
                    }
                  </p>
                </div>
                <Link href="/caregiver">
                  <Button variant="ghost" size="sm" className="text-calm-teal hover:text-teal-600">
                    <MessageCircle size={16} />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Recent Messages</h4>
          <div className="space-y-3">
            {recentMessages.map((message) => {
              const caregiver = caregivers.find(c => c.id === message.caregiverId);
              return (
                <div 
                  key={message.id} 
                  className={`border rounded-lg p-3 ${
                    message.fromUser 
                      ? "bg-blue-50 border-blue-200" 
                      : "bg-teal-50 border-teal-200"
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm">
                      {message.fromUser ? "You" : caregiver?.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(new Date(message.sentAt))}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{message.content}</p>
                </div>
              );
            })}
          </div>
          
          <Link href="/caregiver">
            <Button 
              variant="outline" 
              className="w-full mt-4 border-calm-teal text-calm-teal hover:bg-teal-50"
            >
              View All Messages
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
