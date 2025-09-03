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
  ArrowRight
} from "lucide-react";

export default function Features() {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const enhancedFeatures = [
    {
      id: 'smart-notifications',
      title: 'Smart Notifications',
      description: 'Intelligent reminder system with priority levels and customizable scheduling',
      icon: Bell,
      status: 'integrated',
      category: 'core'
    },
    {
      id: 'achievement-system',
      title: 'Achievement System',
      description: 'Gamification features with points, levels, and progress tracking',
      icon: Star,
      status: 'integrated',
      category: 'motivation'
    },
    {
      id: 'voice-commands',
      title: 'Voice Commands',
      description: 'Hands-free navigation and task management with speech recognition',
      icon: Volume2,
      status: 'integrated',
      category: 'accessibility'
    },
    {
      id: 'dashboard-insights',
      title: 'Dashboard Insights',
      description: 'AI-powered personalized recommendations and behavior analysis',
      icon: Zap,
      status: 'integrated',
      category: 'ai'
    },
    {
      id: 'enhanced-communication',
      title: 'Enhanced Communication',
      description: 'Improved messaging with emoji reactions and quick responses',
      icon: HelpCircle,
      status: 'integrated',
      category: 'communication'
    },
    {
      id: 'personalization-engine',
      title: 'Personalization Engine',
      description: 'Adaptive UI themes and AI-powered customization based on usage patterns',
      icon: Settings,
      status: 'integrated',
      category: 'customization'
    },
    {
      id: 'ai-coach',
      title: 'AI Life Skills Coach',
      description: 'Personalized guidance and real-time support for daily challenges',
      icon: Brain,
      status: 'premium',
      category: 'ai'
    },
    {
      id: 'progress-photos',
      title: 'Visual Progress Journals',
      description: 'Photo documentation of achievements and daily accomplishments',
      icon: Camera,
      status: 'premium',
      category: 'tracking'
    },
    {
      id: 'advanced-analytics',
      title: 'Advanced Analytics & Insights',
      description: 'Detailed progress reports and behavioral pattern analysis',
      icon: BarChart3,
      status: 'premium',
      category: 'analytics'
    },
    {
      id: 'skill-challenges',
      title: 'Interactive Skill Challenges',
      description: 'Gamified learning experiences with custom difficulty levels',
      icon: Target,
      status: 'premium',
      category: 'learning'
    },
    {
      id: 'smart-reminders',
      title: 'Smart Location-Based Reminders',
      description: 'GPS-triggered alerts for medications, tasks, and appointments',
      icon: MessageSquare,
      status: 'premium',
      category: 'location'
    },
    {
      id: 'offline-mode',
      title: 'Offline Mode & Sync',
      description: 'Full app functionality without internet, auto-sync when connected',
      icon: FileText,
      status: 'premium',
      category: 'reliability'
    },
    {
      id: 'custom-templates',
      title: 'Custom Task Templates',
      description: 'Create and share personalized task sequences and routines',
      icon: BookOpen,
      status: 'premium',
      category: 'customization'
    },
    {
      id: 'health-integration',
      title: 'Health Data Integration',
      description: 'Connect with Apple Health, Google Fit, and medical devices',
      icon: Heart,
      status: 'premium',
      category: 'health'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Features', count: enhancedFeatures.length },
    { id: 'core', name: 'Core Features', count: enhancedFeatures.filter(f => f.category === 'core').length },
    { id: 'ai', name: 'AI Enhanced', count: enhancedFeatures.filter(f => f.category === 'ai').length },
    { id: 'accessibility', name: 'Accessibility', count: enhancedFeatures.filter(f => f.category === 'accessibility').length },
    { id: 'motivation', name: 'Motivation', count: enhancedFeatures.filter(f => f.category === 'motivation').length },
    { id: 'communication', name: 'Communication', count: enhancedFeatures.filter(f => f.category === 'communication').length },
    { id: 'customization', name: 'Customization', count: enhancedFeatures.filter(f => f.category === 'customization').length },
    { id: 'tracking', name: 'Progress Tracking', count: enhancedFeatures.filter(f => f.category === 'tracking').length },
    { id: 'learning', name: 'Learning', count: enhancedFeatures.filter(f => f.category === 'learning').length },
    { id: 'health', name: 'Health & Wellness', count: enhancedFeatures.filter(f => f.category === 'health').length },
  ];

  const filteredFeatures = activeCategory === 'all' 
    ? enhancedFeatures 
    : enhancedFeatures.filter(feature => feature.category === activeCategory);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'integrated': return 'text-green-600 bg-green-100 border-green-300';
      case 'premium': return 'text-purple-600 bg-purple-100 border-purple-300';
      case 'coming-soon': return 'text-blue-600 bg-blue-100 border-blue-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'integrated': return <CheckCircle2 className="w-3 h-3" />;
      case 'premium': return <Lock className="w-3 h-3" />;
      case 'coming-soon': return <ArrowRight className="w-3 h-3" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'integrated': return 'Available Now';
      case 'premium': return 'Premium Feature';
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