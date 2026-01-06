import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  Heart, Bell, User as UserIcon, Menu, X, Pill, Stethoscope, 
  GraduationCap, AlertTriangle, Home, CheckSquare, DollarSign,
  Calendar, Users, BookOpen, ShoppingCart, Building, Keyboard,
  Moon, Sun, Volume2, VolumeX
} from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
// Note: EnhancedNotificationSystem temporarily removed for stability
import type { User } from "@shared/schema";

interface NavigationProps {
  className?: string;
}

export default function EnhancedNavigation({ className = "" }: NavigationProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isHighContrast, setIsHighContrast] = useState(false);
  
  // Use default user data for navigation without authentication
  const user = {
    id: "demo-user",
    name: "Demo User",
    email: "demo@adaptalyfe.com",
    subscriptionTier: "premium"
  } as User;

  // Load accessibility preferences from localStorage
  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    const highContrast = localStorage.getItem('highContrast') === 'true';
    
    setIsDarkMode(darkMode);
    setIsSoundEnabled(soundEnabled);
    setIsHighContrast(highContrast);
    
    // Apply theme classes
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.classList.toggle('high-contrast', highContrast);
  }, []);

  // Save preferences and apply changes
  const toggleDarkMode = () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    localStorage.setItem('darkMode', newValue.toString());
    document.documentElement.classList.toggle('dark', newValue);
  };

  const toggleSound = () => {
    const newValue = !isSoundEnabled;
    setIsSoundEnabled(newValue);
    localStorage.setItem('soundEnabled', newValue.toString());
  };

  const toggleHighContrast = () => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);
    localStorage.setItem('highContrast', newValue.toString());
    document.documentElement.classList.toggle('high-contrast', newValue);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.altKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            window.location.href = '/';
            break;
          case '2':
            event.preventDefault();
            window.location.href = '/daily-tasks';
            break;
          case '3':
            event.preventDefault();
            window.location.href = '/resources';
            break;
          case 'e':
            event.preventDefault();
            window.location.href = '/resources';
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const navigationItems = [
    { href: "/", label: "Dashboard", icon: Home, shortcut: "Alt+1" },
    { href: "/daily-tasks", label: "Daily Tasks", icon: CheckSquare, shortcut: "Alt+2" },
    { href: "/financial", label: "Financial", icon: DollarSign },
    { href: "/mood-tracking", label: "Mood", icon: Heart },
    { href: "/meal-shopping", label: "Meals & Shopping", icon: ShoppingCart },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/academic-planner", label: "Student", icon: GraduationCap },
    { href: "/pharmacy", label: "Medication List", icon: Pill },
    { href: "/medical", label: "Medical Info", icon: Stethoscope },
    { href: "/resources", label: "Resources", icon: BookOpen, shortcut: "Alt+3" },
    { href: "/caregiver", label: "Support", icon: Users },
    { href: "/task-builder", label: "Life Skills", icon: Building },
  ];

  const NavButton = ({ href, label, icon: Icon, shortcut, isEmergency = false }: {
    href: string;
    label: string;
    icon: any;
    shortcut?: string;
    isEmergency?: boolean;
  }) => (
    <Link href={href}>
      <Button 
        variant={location === href ? "default" : "ghost"}
        size="sm"
        className={`
          w-full justify-start touch-manipulation min-h-[44px] 
          ${location === href 
            ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }
          ${isEmergency 
            ? "bg-red-500 hover:bg-red-600 text-white font-medium" 
            : ""
          }
        `}
        title={shortcut ? `${label} (${shortcut})` : label}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <Icon className="w-4 h-4 mr-2" />
        {label}
        {shortcut && (
          <span className="ml-auto text-xs opacity-60">
            {shortcut}
          </span>
        )}
      </Button>
    </Link>
  );

  return (
    <header className={`bg-card shadow-lg border-b border-border backdrop-blur-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer touch-manipulation">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
                <Heart className="text-white" size={20} />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-foreground">Adaptalyfe</h1>
                <p className="text-xs text-muted-foreground">Grow with Guidance. Thrive with Confidence.</p>
              </div>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            {navigationItems.slice(0, 6).map((item) => (
              <NavButton key={item.href} {...item} />
            ))}
            
            {/* Emergency Button */}
            <NavButton 
              href="/resources" 
              label="Emergency" 
              icon={AlertTriangle} 
              shortcut="Alt+E"
              isEmergency={true}
            />
            
            <Button 
              variant="ghost" 
              size="sm"
              className="touch-manipulation min-h-[44px] p-2 relative"
            >
              <Bell className="w-4 h-4" />
              <span className="sr-only">Notifications</span>
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="lg:hidden flex items-center space-x-2">
            {/* Emergency Button - Always Visible */}
            <Link href="/resources">
              <Button 
                variant="destructive"
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white font-medium touch-manipulation min-h-[44px] px-3"
                title="Emergency (Alt+E)"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="ml-1 hidden xs:inline">Emergency</span>
              </Button>
            </Link>

            <Button 
              variant="ghost" 
              size="sm"
              className="touch-manipulation min-h-[44px] p-2 relative"
            >
              <Bell className="w-4 h-4" />
              <span className="sr-only">Notifications</span>
            </Button>
            
            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="touch-manipulation min-h-[44px] p-2"
                >
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
                          <Heart className="text-white" size={16} />
                        </div>
                        <h2 className="font-semibold">SkillBridge</h2>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Items */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Navigation</h3>
                      {navigationItems.map((item) => (
                        <NavButton key={item.href} {...item} />
                      ))}
                      
                      <div className="border-t border-border my-4 pt-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Emergency</h3>
                        <NavButton 
                          href="/resources" 
                          label="Emergency Resources" 
                          icon={AlertTriangle} 
                          shortcut="Alt+E"
                          isEmergency={true}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Accessibility Settings */}
                  <div className="p-4 border-t border-border">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Accessibility</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                          <span className="text-sm">Dark Mode</span>
                        </div>
                        <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                          <span className="text-sm">Sound Effects</span>
                        </div>
                        <Switch checked={isSoundEnabled} onCheckedChange={toggleSound} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Keyboard className="w-4 h-4" />
                          <span className="text-sm">High Contrast</span>
                        </div>
                        <Switch checked={isHighContrast} onCheckedChange={toggleHighContrast} />
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <h4 className="text-sm font-medium mb-1">Keyboard Shortcuts</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Alt+1: Dashboard</div>
                        <div>Alt+2: Daily Tasks</div>
                        <div>Alt+3: Resources</div>
                        <div>Alt+E: Emergency</div>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}