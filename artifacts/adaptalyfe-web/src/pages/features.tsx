import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Star, 
  Volume2, 
  Zap, 
  HelpCircle, 
  Settings, 
  Brain, 
  MessageSquare, 
  Camera, 
  Mic, 
  FileText,
  BarChart3,
  Users,
  Shield,
  Target,
  BookOpen,
  Heart,
  Lock,
  CheckCircle2,
  CheckSquare,
  Smile,
  DollarSign,
  Calendar,
  Phone,
  Smartphone,
  Mail,
  ClipboardList,
  Utensils,
  Download,
  Trophy,
  UserPlus,
  LayoutDashboard,
  KeyRound,
  Video,
  History,
  TrendingUp,
  CalendarDays,
  AlertCircle,
  Award,
  HeadphonesIcon,
  MessagesSquare,
  GraduationCap,
  ArrowRight
} from "lucide-react";

export default function Features() {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // ============================================================
  // FEATURES LIST — Aligned with subscription pricing tiers
  // (Basic $4.99 / Premium $12.99 / Family $24.99)
  // ============================================================
  const enhancedFeatures = [
    // ===== BASIC PLAN — Core features (Available Now) =====
    {
      id: 'daily-task-management',
      title: 'Daily Task Management',
      description: 'Create and complete daily activities with categorized tasks and progress tracking',
      icon: CheckSquare,
      status: 'integrated',
      category: 'basic'
    },
    {
      id: 'daily-checkins',
      title: 'Daily Check-ins',
      description: 'Simple 1–5 scale for personal reflection and mood tracking',
      icon: Smile,
      status: 'integrated',
      category: 'basic'
    },
    {
      id: 'financial-tracking',
      title: 'Financial Tracking',
      description: 'Bill reminders, due-date alerts, and bill payment quick links',
      icon: DollarSign,
      status: 'integrated',
      category: 'basic'
    },
    {
      id: 'appointment-management',
      title: 'Appointment Management',
      description: 'Track personal schedules, appointments, and reminders',
      icon: Calendar,
      status: 'integrated',
      category: 'basic'
    },
    {
      id: 'trusted-contacts',
      title: 'Trusted Contacts',
      description: 'Quick access to saved contacts and your support network',
      icon: Phone,
      status: 'integrated',
      category: 'basic'
    },
    {
      id: 'mobile-app-access',
      title: 'Mobile App Access',
      description: 'Full mobile functionality on iOS and Android',
      icon: Smartphone,
      status: 'integrated',
      category: 'basic'
    },
    {
      id: 'email-support',
      title: 'Email Support',
      description: 'Standard customer assistance via email',
      icon: Mail,
      status: 'integrated',
      category: 'basic'
    },

    // ===== PREMIUM PLAN — Everything in Basic, plus =====
    {
      id: 'usage-patterns',
      title: 'Usage Patterns & Progress Journals',
      description: 'Track patterns and document your independence journey over time',
      icon: BarChart3,
      status: 'premium',
      category: 'premium'
    },
    {
      id: 'personal-records',
      title: 'Personal Records',
      description: 'Notes, medications, allergies, and sensitivities all in one place',
      icon: ClipboardList,
      status: 'premium',
      category: 'premium'
    },
    {
      id: 'skill-challenges-templates',
      title: 'Skill Challenges & Custom Task Templates',
      description: 'Interactive challenges and personalized task templates for daily routines',
      icon: Target,
      status: 'premium',
      category: 'premium'
    },
    {
      id: 'meal-planning',
      title: 'Meal Planning & Shopping Lists',
      description: 'Weekly meal plans, recipes, and grocery list management',
      icon: Utensils,
      status: 'premium',
      category: 'premium'
    },
    {
      id: 'data-export-tutorials',
      title: 'Data Export & Guided Tutorials',
      description: 'Export your data (JSON, CSV, PDF) with step-by-step skill tutorials',
      icon: Download,
      status: 'premium',
      category: 'premium'
    },
    {
      id: 'unlimited-tasks',
      title: 'Unlimited Daily Tasks & Trusted Contacts',
      description: 'No limits on daily tasks or how many trusted contacts you can add',
      icon: Zap,
      status: 'premium',
      category: 'premium'
    },
    {
      id: 'expanded-achievements',
      title: 'Expanded Achievements & Rewards',
      description: 'Unlock advanced gamification with badges, levels, and reward milestones',
      icon: Trophy,
      status: 'premium',
      category: 'premium'
    },
    {
      id: 'priority-email-support',
      title: 'Priority Email Support',
      description: 'Faster response times for premium subscribers',
      icon: Mail,
      status: 'premium',
      category: 'premium'
    },

    // ===== FAMILY / CARE TEAM PLAN — Everything in Premium, plus =====
    {
      id: 'multiple-profiles',
      title: 'Up to 5 Individual User Profiles',
      description: 'Manage multiple family members or care recipients under one plan',
      icon: UserPlus,
      status: 'family',
      category: 'family'
    },
    {
      id: 'shared-dashboards',
      title: 'Shared Dashboards',
      description: 'Coordinated views for family members and caregivers',
      icon: LayoutDashboard,
      status: 'family',
      category: 'family'
    },
    {
      id: 'role-based-access',
      title: 'Role-Based Access Controls',
      description: 'Set permissions for caregivers, family, and care team roles',
      icon: KeyRound,
      status: 'family',
      category: 'family'
    },
    {
      id: 'in-app-messaging',
      title: 'In-App Messaging & Video Calls',
      description: 'Stay connected with secure messaging and video communication',
      icon: Video,
      status: 'family',
      category: 'family'
    },
    {
      id: 'granular-sharing',
      title: 'Granular Sharing & Security Controls',
      description: 'Fine-grained control over what each family member can see',
      icon: Shield,
      status: 'family',
      category: 'family'
    },
    {
      id: 'activity-history',
      title: 'Activity History & Audit Views',
      description: 'Complete audit log of activity across all family profiles',
      icon: History,
      status: 'family',
      category: 'family'
    },
    {
      id: 'combined-progress',
      title: 'Combined Progress Summaries',
      description: 'See progress across all family members in unified reports',
      icon: TrendingUp,
      status: 'family',
      category: 'family'
    },
    {
      id: 'shared-routines',
      title: 'Shared Routines, Templates & Calendars',
      description: 'Build and share routines, task templates, and calendars across the family',
      icon: CalendarDays,
      status: 'family',
      category: 'family'
    },
    {
      id: 'cascading-alerts',
      title: 'Cascading Contact Alerts',
      description: 'Automated alert system that notifies multiple contacts in priority order',
      icon: AlertCircle,
      status: 'family',
      category: 'family'
    },
    {
      id: 'family-achievements',
      title: 'Family Achievements & Milestones',
      description: 'Celebrate wins and milestones together as a family',
      icon: Award,
      status: 'family',
      category: 'family'
    },
    {
      id: 'dedicated-assistance',
      title: 'Dedicated Account Assistance',
      description: 'Personal support representative for your family account',
      icon: HeadphonesIcon,
      status: 'family',
      category: 'family'
    },
    {
      id: 'priority-chat-support',
      title: 'Priority Email & Chat Support',
      description: 'Top-tier support with priority email and live chat access',
      icon: MessagesSquare,
      status: 'family',
      category: 'family'
    },
    {
      id: 'guided-onboarding',
      title: 'Guided Onboarding Sessions',
      description: 'Personalized onboarding to help your family get the most from Adaptalyfe',
      icon: GraduationCap,
      status: 'family',
      category: 'family'
    },

    // ============================================================
    // OLD FEATURES — Commented out to align with pricing tiers
    // Uncomment any item below to restore it on the features page
    // ============================================================
    // {
    //   id: 'smart-notifications',
    //   title: 'Smart Notifications',
    //   description: 'Intelligent reminder system with priority levels and customizable scheduling',
    //   icon: Bell,
    //   status: 'integrated',
    //   category: 'core'
    // },
    // {
    //   id: 'achievement-system',
    //   title: 'Achievement System',
    //   description: 'Gamification features with points, levels, and progress tracking',
    //   icon: Star,
    //   status: 'integrated',
    //   category: 'motivation'
    // },
    // {
    //   id: 'dashboard-insights',
    //   title: 'Dashboard Insights',
    //   description: 'AI-powered personalized recommendations and behavior analysis',
    //   icon: Zap,
    //   status: 'integrated',
    //   category: 'ai'
    // },
    // {
    //   id: 'enhanced-communication',
    //   title: 'Enhanced Communication',
    //   description: 'Improved messaging with emoji reactions and quick responses',
    //   icon: HelpCircle,
    //   status: 'integrated',
    //   category: 'communication'
    // },
    // {
    //   id: 'personalization-engine',
    //   title: 'Personalization Engine',
    //   description: 'Adaptive UI themes and AI-powered customization based on usage patterns',
    //   icon: Settings,
    //   status: 'integrated',
    //   category: 'customization'
    // },
    // {
    //   id: 'ai-coach',
    //   title: 'AI Life Skills Coach',
    //   description: 'Personalized guidance and real-time support for daily challenges',
    //   icon: Brain,
    //   status: 'premium',
    //   category: 'ai'
    // },
    // {
    //   id: 'progress-photos',
    //   title: 'Visual Progress Journals',
    //   description: 'Photo documentation of achievements and daily accomplishments',
    //   icon: Camera,
    //   status: 'premium',
    //   category: 'tracking'
    // },
    // {
    //   id: 'advanced-analytics',
    //   title: 'Advanced Analytics & Insights',
    //   description: 'Detailed progress reports and behavioral pattern analysis',
    //   icon: BarChart3,
    //   status: 'premium',
    //   category: 'analytics'
    // },
    // {
    //   id: 'skill-challenges',
    //   title: 'Interactive Skill Challenges',
    //   description: 'Gamified learning experiences with custom difficulty levels',
    //   icon: Target,
    //   status: 'premium',
    //   category: 'learning'
    // },
    // {
    //   id: 'custom-templates',
    //   title: 'Custom Task Templates',
    //   description: 'Create and share personalized task sequences and routines',
    //   icon: BookOpen,
    //   status: 'premium',
    //   category: 'customization'
    // },
  ];

  const categories = [
    { id: 'all', name: 'All Features', count: enhancedFeatures.length },
    { id: 'basic', name: 'Basic Plan', count: enhancedFeatures.filter(f => f.category === 'basic').length },
    { id: 'premium', name: 'Premium Plan', count: enhancedFeatures.filter(f => f.category === 'premium').length },
    { id: 'family', name: 'Family Plan', count: enhancedFeatures.filter(f => f.category === 'family').length },
  ];

  const filteredFeatures = activeCategory === 'all' 
    ? enhancedFeatures 
    : enhancedFeatures.filter(feature => feature.category === activeCategory);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'integrated': return 'text-green-600 bg-green-100 border-green-300';
      case 'premium': return 'text-purple-600 bg-purple-100 border-purple-300';
      case 'family': return 'text-pink-600 bg-pink-100 border-pink-300';
      case 'coming-soon': return 'text-blue-600 bg-blue-100 border-blue-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'integrated': return <CheckCircle2 className="w-3 h-3" />;
      case 'premium': return <Lock className="w-3 h-3" />;
      case 'family': return <Users className="w-3 h-3" />;
      case 'coming-soon': return <ArrowRight className="w-3 h-3" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'integrated': return 'Basic Plan';
      case 'premium': return 'Premium Feature';
      case 'family': return 'Family Plan';
      case 'coming-soon': return 'Coming Soon';
      default: return 'Unknown';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Adaptalyfe Features
        </h1>
        <p className="text-muted-foreground">
          Discover all the tools and features available to help you achieve independence and build life skills
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category.id)}
              className="text-sm"
            >
              {category.name}
              <Badge variant="secondary" className="ml-2 text-xs">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredFeatures.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <Card key={feature.id} className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-blue-600" />
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs font-medium px-2 py-1 ${getStatusColor(feature.status)}`}
                  >
                    <div className="flex items-center gap-1">
                      {getStatusIcon(feature.status)}
                      {getStatusText(feature.status)}
                    </div>
                  </Badge>
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
                {feature.status === 'premium' && (
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-700">
                      Upgrade to Premium to unlock this feature and gain access to advanced tools designed to enhance your independence journey.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredFeatures.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No features found in this category.</p>
        </div>
      )}

      {/* Feature Summary */}
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Available Now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 mb-1">
              {enhancedFeatures.filter(f => f.status === 'integrated').length}
            </div>
            <p className="text-sm text-green-600">Features ready to use</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-purple-800 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Premium Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 mb-1">
              {enhancedFeatures.filter(f => f.status === 'premium').length}
            </div>
            <p className="text-sm text-purple-600">Advanced capabilities available</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Total Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 mb-1">
              {enhancedFeatures.length}
            </div>
            <p className="text-sm text-blue-600">Tools to support your journey</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}