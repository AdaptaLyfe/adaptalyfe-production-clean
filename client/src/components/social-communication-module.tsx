import { useState } from "react";
import { useSafeRef } from "@/hooks/useSafeRef";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { formatTimeAgo } from "@/lib/utils";
import { 
  Video, 
  Mic, 
  Camera, 
  MessageCircle, 
  Users, 
  Phone,
  PhoneOff,
  Play,
  Pause,
  Send,
  Image,
  Heart,
  Share2,
  Plus,
  VideoOff,
  MicOff
} from "lucide-react";

interface ChatRoom {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  isJoined: boolean;
  lastActivity: Date;
}

interface VoiceMessage {
  id: number;
  senderId: number;
  senderName: string;
  audioUrl: string;
  duration: number;
  transcript?: string;
  createdAt: Date;
}

interface PhotoShare {
  id: number;
  userId: number;
  userName: string;
  photoUrl: string;
  caption: string;
  category: string;
  likes: number;
  createdAt: Date;
  isLiked: boolean;
}

export default function SocialCommunicationModule() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(null);
  const [messageText, setMessageText] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const fileInputRef = useSafeRef<HTMLInputElement | null>(null);
  
  const { toast } = useToast();

  const chatRooms: ChatRoom[] = [
    {
      id: 1,
      name: "Daily Check-ins",
      description: "Share how your day is going with supportive peers",
      memberCount: 24,
      isJoined: true,
      lastActivity: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    },
    {
      id: 2,
      name: "Cooking Adventures",
      description: "Share recipes, cooking tips, and meal photos",
      memberCount: 18,
      isJoined: true,
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      id: 3,
      name: "Job Search Support",
      description: "Help each other with job hunting and workplace skills",
      memberCount: 15,
      isJoined: false,
      lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
    },
    {
      id: 4,
      name: "Weekend Activities",
      description: "Plan and share fun weekend activities",
      memberCount: 32,
      isJoined: false,
      lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
    }
  ];

  const voiceMessages: VoiceMessage[] = [
    {
      id: 1,
      senderId: 2,
      senderName: "Sarah",
      audioUrl: "/audio/voice-message-1.mp3",
      duration: 15,
      transcript: "Hey! Just wanted to check in and see how your cooking lesson went today.",
      createdAt: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
    },
    {
      id: 2,
      senderId: 3,
      senderName: "Mom",
      audioUrl: "/audio/voice-message-2.mp3",
      duration: 23,
      transcript: "Great job on completing your daily tasks! Remember we have the doctor appointment tomorrow at 2 PM.",
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
    }
  ];

  const photoShares: PhotoShare[] = [
    {
      id: 1,
      userId: 1,
      userName: "You",
      photoUrl: "/photos/meal-photo-1.jpg",
      caption: "Made my first pasta dish today! It was easier than I thought 🍝",
      category: "achievement",
      likes: 12,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isLiked: false
    },
    {
      id: 2,
      userId: 4,
      userName: "Alex",
      photoUrl: "/photos/achievement-photo-1.jpg",
      caption: "Successfully took the bus to the library by myself today! Feeling proud.",
      category: "independence",
      likes: 18,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      isLiked: true
    },
    {
      id: 3,
      userId: 5,
      userName: "Jamie",
      photoUrl: "/photos/social-photo-1.jpg",
      caption: "Had coffee with a new friend today. Building my social confidence!",
      category: "social",
      likes: 9,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      isLiked: false
    }
  ];

  const startVideoCall = () => {
    setIsVideoCallActive(true);
    toast({
      title: "Video call started",
      description: "Connecting with your caregiver...",
    });
  };

  const endVideoCall = () => {
    setIsVideoCallActive(false);
    toast({
      title: "Call ended",
      description: "Video call has been disconnected.",
    });
  };

  const startRecording = () => {
    setIsRecording(true);
    toast({
      title: "Recording started",
      description: "Speak your message. Tap again to stop recording.",
    });
  };

  const stopRecording = () => {
    setIsRecording(false);
    toast({
      title: "Message recorded",
      description: "Your voice message has been sent!",
    });
  };

  const joinChatRoom = (roomId: number) => {
    toast({
      title: "Joined chat room",
      description: "You're now part of this supportive community!",
    });
  };

  const sendMessage = () => {
    if (messageText.trim()) {
      toast({
        title: "Message sent",
        description: "Your message has been shared with the group.",
      });
      setMessageText("");
    }
  };

  const likePhoto = (photoId: number) => {
    toast({
      title: "Photo liked",
      description: "Showing support for your peer's achievement!",
    });
  };

  const sharePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "Photo shared",
        description: "Your achievement photo has been posted!",
      });
      setPhotoCaption("");
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          Social Communication
        </CardTitle>
        <CardDescription>
          Connect with caregivers and peers for support and friendship
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Video className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">Video Call</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Connect face-to-face with your caregiver or support team
                </p>
                <Button onClick={startVideoCall} className="w-full">
                  Start Call
                </Button>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Mic className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Voice Message</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Send a quick voice message when typing is difficult
                </p>
                <Button 
                  onClick={isRecording ? stopRecording : startRecording}
                  variant={isRecording ? "destructive" : "default"}
                  className="w-full"
                >
                  {isRecording ? "Stop Recording" : "Record Message"}
                </Button>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">Recent Messages</h3>
              <div className="space-y-3">
                {voiceMessages.slice(0, 2).map((message) => (
                  <div key={message.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{message.senderName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{message.senderName}</div>
                      <div className="text-xs text-gray-600">
                        Voice message • {message.duration}s • {formatTimeAgo(message.createdAt)}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Community Highlights */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">Community Highlights</h3>
              <div className="space-y-3">
                {photoShares.slice(0, 2).map((photo) => (
                  <div key={photo.id} className="flex items-start gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{photo.userName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{photo.userName}</div>
                      <div className="text-sm text-gray-700 mb-1">{photo.caption}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Heart className="w-3 h-3" />
                        {photo.likes} likes
                        <span>•</span>
                        {formatTimeAgo(photo.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="video" className="space-y-4 mt-4">
            {!isVideoCallActive ? (
              <div className="space-y-4">
                <Card className="p-6 text-center">
                  <Video className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Start a Video Call</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Connect with your caregivers for face-to-face support and check-ins
                  </p>
                  <Button onClick={startVideoCall} className="bg-blue-600 hover:bg-blue-700">
                    <Video className="w-4 h-4 mr-2" />
                    Start Video Call
                  </Button>
                </Card>

                {/* Available Contacts */}
                <Card className="p-4">
                  <h3 className="font-medium mb-3">Available Contacts</h3>
                  <div className="space-y-3">
                    {[
                      { name: "Mom", status: "online", avatar: "M" },
                      { name: "Care Coordinator", status: "online", avatar: "C" },
                      { name: "Therapist", status: "busy", avatar: "T" }
                    ].map((contact, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>{contact.avatar}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{contact.name}</div>
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${
                                contact.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                              }`} />
                              <span className="text-xs text-gray-600">{contact.status}</span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" onClick={startVideoCall}>
                          <Video className="w-4 h-4 mr-2" />
                          Call
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="p-6">
                <div className="aspect-video bg-gray-900 rounded-lg mb-4 flex items-center justify-center text-white">
                  <div className="text-center">
                    <Video className="w-12 h-12 mx-auto mb-2" />
                    <p>Video call in progress...</p>
                    <p className="text-sm opacity-75">Connected with Mom</p>
                  </div>
                </div>
                
                <div className="flex justify-center gap-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsMicMuted(!isMicMuted)}
                    className={isMicMuted ? "bg-red-100" : ""}
                  >
                    {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsVideoMuted(!isVideoMuted)}
                    className={isVideoMuted ? "bg-red-100" : ""}
                  >
                    {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={endVideoCall}
                  >
                    <PhoneOff className="w-4 h-4 mr-2" />
                    End Call
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="voice" className="space-y-4 mt-4">
            {/* Record New Voice Message */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">Send Voice Message</h3>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={isRecording ? stopRecording : startRecording}
                  className={isRecording ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                  size="lg"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  {isRecording ? "Stop Recording" : "Start Recording"}
                </Button>
                {isRecording && (
                  <div className="flex items-center gap-2 text-red-600">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Recording...</span>
                  </div>
                )}
              </div>
              {!isRecording && (
                <p className="text-sm text-gray-600 mt-2">
                  Voice messages are great when typing is difficult or you want to express tone and emotion.
                </p>
              )}
            </Card>

            {/* Voice Message History */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">Recent Voice Messages</h3>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {voiceMessages.map((message) => (
                    <div key={message.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{message.senderName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{message.senderName}</span>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(message.createdAt)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <Button size="sm" variant="outline">
                            <Play className="w-4 h-4" />
                          </Button>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full w-0" />
                          </div>
                          <span className="text-xs text-gray-500">{message.duration}s</span>
                        </div>
                        
                        {message.transcript && (
                          <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            <strong>Transcript:</strong> {message.transcript}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="space-y-4 mt-4">
            {/* Chat Rooms */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">Peer Support Groups</h3>
              <div className="space-y-3">
                {chatRooms.map((room) => (
                  <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{room.name}</h4>
                        {room.isJoined && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Joined
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{room.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{room.memberCount} members</span>
                        <span>Last active {formatTimeAgo(room.lastActivity)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {room.isJoined ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Chat
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle>{room.name}</DialogTitle>
                              <DialogDescription>{room.memberCount} members online</DialogDescription>
                            </DialogHeader>
                            
                            <ScrollArea className="h-64 border rounded p-3">
                              <div className="space-y-3">
                                {/* Sample chat messages */}
                                <div className="text-sm">
                                  <strong>Sarah:</strong> Good morning everyone! How is everyone doing today?
                                </div>
                                <div className="text-sm">
                                  <strong>Mike:</strong> Doing well! Just finished my morning walk.
                                </div>
                                <div className="text-sm">
                                  <strong>Lisa:</strong> Great job Mike! I'm about to start cooking breakfast.
                                </div>
                              </div>
                            </ScrollArea>
                            
                            <div className="flex gap-2">
                              <Input 
                                placeholder="Type your message..."
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                              />
                              <Button onClick={sendMessage}>
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => joinChatRoom(room.id)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Join
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Photo Sharing */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Achievement Photos</h3>
                <Button size="sm" onClick={sharePhoto}>
                  <Camera className="w-4 h-4 mr-2" />
                  Share Photo
                </Button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />

              <div className="space-y-4">
                {photoShares.map((photo) => (
                  <div key={photo.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{photo.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{photo.userName}</div>
                        <div className="text-xs text-gray-500">{formatTimeAgo(photo.createdAt)}</div>
                      </div>
                      <Badge variant="outline">{photo.category}</Badge>
                    </div>
                    
                    <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                      <Image className="w-12 h-12 text-gray-400" />
                    </div>
                    
                    <p className="text-sm mb-3">{photo.caption}</p>
                    
                    <div className="flex items-center justify-between">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => likePhoto(photo.id)}
                        className={photo.isLiked ? "text-red-500" : ""}
                      >
                        <Heart className={`w-4 h-4 mr-1 ${photo.isLiked ? 'fill-current' : ''}`} />
                        {photo.likes}
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Share2 className="w-4 h-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}