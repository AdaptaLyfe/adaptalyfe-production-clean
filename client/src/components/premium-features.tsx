import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Crown, 
  Brain, 
  MessageSquare, 
  Camera, 
  Mic, 
  FileText,
  BarChart3,
  Users,
  Shield,
  Star,
  Zap,
  Target,
  BookOpen,
  Heart,
  Lock
} from "lucide-react";

interface PremiumFeatureProps {
  userPlan: 'basic' | 'premium' | 'family';
}

export default function PremiumFeatures({ userPlan }: PremiumFeatureProps) {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const isPremium = userPlan === 'premium' || userPlan === 'family';
  const isFamily = userPlan === 'family';

  const premiumFeatures = [
    {
      id: 'ai-coach',
      title: 'AI Life Skills Coach',
      description: 'Personalized guidance and real-time support for daily challenges',
      icon: Brain,
      available: isPremium,
      category: 'AI Enhanced'
    },
    {
      id: 'voice-commands',
      title: 'Voice Commands & Text-to-Speech',
      description: 'Hands-free navigation and audio feedback for accessibility',
      icon: Mic,
      available: isPremium,
      category: 'Accessibility'
    },
    {
      id: 'progress-photos',
      title: 'Visual Progress Journals',
      description: 'Photo documentation of achievements and daily accomplishments',
      icon: Camera,
      available: isPremium,
      category: 'Progress Tracking'
    },
    {
      id: 'advanced-analytics',
      title: 'Advanced Analytics & Insights',
      description: 'Detailed progress reports and behavioral pattern analysis',
      icon: BarChart3,
      available: isPremium,
      category: 'Analytics'
    },
    {
      id: 'skill-challenges',
      title: 'Interactive Skill Challenges',
      description: 'Gamified learning experiences with custom difficulty levels',
      icon: Target,
      available: isPremium,
      category: 'Gamification'
    },
    {
      id: 'smart-reminders',
      title: 'Smart Location-Based Reminders',
      description: 'GPS-triggered alerts for medications, tasks, and appointments',
      icon: MessageSquare,
      available: isPremium,
      category: 'Smart Features'
    },
    {
      id: 'offline-mode',
      title: 'Offline Mode & Sync',
      description: 'Full app functionality without internet, auto-sync when connected',
      icon: FileText,
      available: isPremium,
      category: 'Reliability'
    },
    {
      id: 'custom-templates',
      title: 'Custom Task Templates',
      description: 'Create and share personalized task sequences and routines',
      icon: BookOpen,
      available: isPremium,
      category: 'Customization'
    },
    {
      id: 'health-integration',
      title: 'Health Data Integration',
      description: 'Connect with Apple Health, Google Fit, and medical devices',
      icon: Heart,
      available: isPremium,
      category: 'Health'
    },
    {
      id: 'emergency-protocols',
      title: 'Emergency Response Protocols',
      description: 'Automated crisis detection and caregiver alert system',
      icon: Shield,
      available: isPremium,
      category: 'Safety'
    },
    {
      id: 'family-dashboard',
      title: 'Family Care Team Dashboard',
      description: 'Multi-user coordination and shared progress monitoring',
      icon: Users,
      available: isFamily,
      category: 'Family Features'
    },
    {
      id: 'priority-support',
      title: '24/7 Priority Support',
      description: 'Dedicated support team with guaranteed response times',
      icon: Shield,
      available: isPremium,
      category: 'Support'
    },
    {
      id: 'custom-workflows',
      title: 'Custom Workflow Builder',
      description: 'Design personalized routines and automation sequences',
      icon: Zap,
      available: isPremium,
      category: 'Customization'
    },
    {
      id: 'data-export',
      title: 'Advanced Data Export & Backup',
      description: 'Export progress reports for doctors, therapists, and schools',
      icon: FileText,
      available: isPremium,
      category: 'Professional Tools'
    },
    {
      id: 'video-tutorials',
      title: 'Personalized Video Tutorials',
      description: 'Custom step-by-step video guides for complex life skills',
      icon: Camera,
      available: isPremium,
      category: 'Learning'
    }
  ];

  const getFeatureDemo = (featureId: string) => {
    const demos = {
      'ai-coach': (
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-lg">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white p-3 rounded-lg flex-1">
                <p className="text-sm">"I'm having trouble remembering to take my medication. Can you help?"</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white p-3 rounded-lg flex-1">
                <p className="text-sm"><strong>AI Coach:</strong> "I can set up multiple reminders and create a visual medication schedule. Would you like me to also suggest a pill organizer routine that many users find helpful?"</p>
              </div>
            </div>
          </div>
        </div>
      ),
      'voice-commands': (
        <div className="bg-gradient-to-r from-green-100 to-teal-100 p-4 rounded-lg">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-700">
              <Mic className="w-4 h-4" />
              <span className="text-sm font-medium">Try saying:</span>
            </div>
            <div className="space-y-2">
              <div className="bg-white p-2 rounded text-sm">"Add grocery shopping to my tasks"</div>
              <div className="bg-white p-2 rounded text-sm">"What's my mood trend this week?"</div>
              <div className="bg-white p-2 rounded text-sm">"Read my upcoming appointments"</div>
            </div>
          </div>
        </div>
      ),
      'progress-photos': (
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-4 rounded-lg">
          <div className="grid grid-cols-3 gap-2">
            <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
              <Camera className="w-6 h-6 text-gray-400" />
            </div>
            <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-red-500" />
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">Document achievements, room organization, meal prep, and more</p>
        </div>
      ),
      'advanced-analytics': (
        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-4 rounded-lg">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Task Completion Rate</span>
              <span className="text-sm font-bold">87%</span>
            </div>
            <Progress value={87} className="h-2" />
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-600">Best Day: Tuesday</p>
                <p className="text-gray-600">Avg. Mood: 4.2/5</p>
              </div>
              <div>
                <p className="text-gray-600">Streak: 12 days</p>
                <p className="text-gray-600">Goals Met: 94%</p>
              </div>
            </div>
          </div>
        </div>
      )
    };
    return demos[featureId as keyof typeof demos];
  };

  const FeatureCard = ({ feature }: { feature: typeof premiumFeatures[0] }) => {
    const Icon = feature.icon;
    const isLocked = !feature.available;

    return (
      <Card className={`transition-all duration-200 ${isLocked ? 'opacity-60' : 'hover:shadow-lg'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isLocked ? 'bg-gray-100' : 'bg-gradient-to-br from-purple-500 to-blue-600'
              }`}>
                {isLocked ? (
                  <Lock className="w-5 h-5 text-gray-400" />
                ) : (
                  <Icon className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <Badge variant="outline" className="text-xs mt-1">
                  {feature.category}
                </Badge>
              </div>
            </div>
            {!isLocked && (
              <Crown className="w-5 h-5 text-yellow-500" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
          
          {activeDemo === feature.id && getFeatureDemo(feature.id) && (
            <div className="mb-4">
              {getFeatureDemo(feature.id)}
            </div>
          )}

          <div className="flex gap-2">
            {feature.available ? (
              <>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setActiveDemo(activeDemo === feature.id ? null : feature.id)}
                >
                  {activeDemo === feature.id ? 'Hide Demo' : 'View Demo'}
                </Button>
                <Button size="sm" className="bg-gradient-to-r from-purple-500 to-blue-600">
                  Use Feature
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" className="w-full">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Access
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Premium Features</h2>
        <p className="text-gray-600">
          Unlock advanced capabilities designed for enhanced independence and support
        </p>
        
        {userPlan === 'basic' && (
          <div className="mt-4 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
            <p className="text-sm text-purple-800 mb-2">
              You're currently on the Basic plan. Upgrade to access these powerful features!
            </p>
            <Button size="sm" className="bg-gradient-to-r from-purple-500 to-blue-600">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </div>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {premiumFeatures.map((feature) => (
          <FeatureCard key={feature.id} feature={feature} />
        ))}
      </div>

      {/* Upgrade CTA for Basic Users */}
      {userPlan === 'basic' && (
        <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
          <CardContent className="p-6 text-center">
            <Crown className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
            <h3 className="text-xl font-bold mb-2">Ready to Unlock Your Full Potential?</h3>
            <p className="mb-4 opacity-90">
              Join thousands of users who've transformed their independence with premium features
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" variant="secondary">
                Start Premium Trial
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
                View Pricing
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}