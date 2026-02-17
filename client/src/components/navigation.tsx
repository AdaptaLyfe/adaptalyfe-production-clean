import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Heart, Bell, User as UserIcon, Menu, X, Pill, Stethoscope, GraduationCap, AlertTriangle, Target, 
         Calendar as CalendarIcon, DollarSign, Brain, ShoppingCart, Home, CheckSquare, Settings, 
         Phone, BookOpen, Globe, Trophy, Star, Shield, Users } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import NotificationCenter from "./notification-center";
// AuthUtils inlined to avoid import issues
import type { User } from "@shared/schema";

export default function Navigation() {
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 shadow-lg border-b border-border backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16">
          <div 
            className="flex items-center space-x-2 cursor-pointer min-w-0 flex-shrink"
            onClick={async (e) => {
              e.preventDefault();
              console.log('Navigation logo clicked - session check');
              
              const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
              if (isMobile) {
                try {
                  const response = await fetch('/api/user', { credentials: 'include' });
                  if (response.ok) {
                    setLocation('/dashboard');
                  } else {
                    console.warn('Session invalid, redirecting to login');
                    setLocation('/login');
                  }
                } catch (error) {
                  console.error('Session check failed:', error);
                  setLocation('/login');
                }
              } else {
                setLocation('/dashboard');
              }
            }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center shadow-md border border-white">
              <Heart className="text-white" size={16} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-foreground">Adaptalyfe</h1>
              <p className="text-xs text-muted-foreground hidden lg:block">Grow with Guidance. Thrive with Confidence.</p>
            </div>
          </div>
          
          {/* Quick access items in center - hidden on smaller screens */}
          <div className="hidden lg:flex items-center space-x-2 flex-1 justify-center">
            <Link href="/">
              <Button variant={location === "/" ? "default" : "ghost"} size="sm" className="text-xs px-2">
                <Home size={16} className="mr-1" />
                Home
              </Button>
            </Link>
            <Link href="/daily-tasks">
              <Button variant={location === "/daily-tasks" ? "default" : "ghost"} size="sm" className="text-xs px-2">
                <CheckSquare size={16} className="mr-1" />
                Tasks
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* User info for larger screens */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
              <UserIcon size={16} />
              <span className="hidden lg:block">{user?.name || "User"}</span>
            </div>
            
            {/* Hamburger Menu Button - Top Right Corner */}
            <Button
              variant="outline" 
              size="sm"
              className="flex items-center space-x-1 shadow-sm hover:shadow-md transition-shadow"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              <span className="hidden sm:block text-xs">Menu</span>
            </Button>
          </div>
        </div>

        {/* Comprehensive App Features Menu */}
        {isMobileMenuOpen && (
          <div 
            ref={menuRef}
            className="absolute right-0 top-16 w-80 max-w-[90vw] bg-white border border-gray-200 rounded-lg shadow-xl z-50 mr-4 max-h-[80vh] overflow-y-auto"
          >
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Access to All Features</h3>
              <div className="grid grid-cols-2 gap-2">
                {/* Core Features - Row 1 */}
                <Link href="/">
                  <Button 
                    variant={location === "/" ? "default" : "ghost"}
                    className="w-full justify-start h-12 text-xs"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/daily-tasks">
                  <Button 
                    variant={location === "/daily-tasks" ? "default" : "ghost"}
                    className="w-full justify-start h-12 text-xs"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Daily Tasks
                  </Button>
                </Link>
                
                {/* Financial & Health - Row 2 */}
                <Link href="/financial">
                  <Button 
                    variant={location === "/financial" ? "default" : "ghost"}
                    className="w-full justify-start h-12 text-xs"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Financial
                  </Button>
                </Link>
                <Link href="/mood-tracking">
                  <Button 
                    variant={location === "/mood-tracking" ? "default" : "ghost"}
                    className="w-full justify-start h-12 text-xs"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Mood Tracking
                  </Button>
                </Link>
                
                {/* Medical & Pharmacy - Row 3 */}
                <Link href="/medical">
                  <Button 
                    variant={location === "/medical" ? "default" : "ghost"}
                    className="w-full justify-start h-12 text-xs"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Stethoscope className="w-4 h-4 mr-2" />
                    Health Records
                  </Button>
                </Link>
                <Link href="/pharmacy">
                  <Button 
                    variant={location === "/pharmacy" ? "default" : "ghost"}
                    className="w-full justify-start h-12 text-xs"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Pill className="w-4 h-4 mr-2" />
                    Medication List
                  </Button>
                </Link>
                
                {/* Life & Learning - Row 4 */}
                <Link href="/meal-shopping">
                  <Button 
                    variant={location === "/meal-shopping" ? "default" : "ghost"}
                    className="w-full justify-start h-12 text-xs"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Meals & Shopping
                  </Button>
                </Link>
                <Link href="/calendar">
                  <Button 
                    variant={location === "/calendar" ? "default" : "ghost"}
                    className="w-full justify-start h-12 text-xs"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Calendar
                  </Button>
                </Link>
                
                {/* Education & Skills - Row 5 */}
                <Link href="/academic-planner">
                  <Button 
                    variant={location === "/academic-planner" ? "default" : "ghost"}
                    className="w-full justify-start h-12 text-xs"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Student Planner
                  </Button>
                </Link>
                <Link href="/task-builder">
                  <Button 
                    variant={location === "/task-builder" ? "default" : "ghost"}
                    className="w-full justify-start h-12 text-xs"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Life Skills
                  </Button>
                </Link>
                
                {/* Support Network & Resources - Row 6 */}
                <Link href="/caregiver">
                  <Button 
                    variant={location === "/caregiver" ? "default" : "ghost"}
                    className="w-full justify-start h-12 text-xs"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <UserIcon className="w-4 h-4 mr-2" />
                    Support Network
                  </Button>
                </Link>
                <Link href="/resources">
                  <Button 
                    variant={location === "/resources" ? "default" : "ghost"}
                    className="w-full justify-start h-12 text-xs"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Resources
                  </Button>
                </Link>
                
                {/* Rewards - Row 7 */}
                <Link href="/rewards">
                  <Button 
                    variant={location === "/rewards" ? "default" : "ghost"}
                    className="w-full justify-start h-12 text-xs col-span-2 bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Trophy className="w-4 h-4 mr-2 text-yellow-600" />
                    <span className="text-yellow-700 font-medium">Rewards</span>
                  </Button>
                </Link>
              </div>
              
              {/* Admin Section - Only visible for admin users */}
              {(user?.accountType === 'admin' || user?.username === 'admin') && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Admin</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/admin-dashboard">
                      <Button 
                        variant={location === "/admin-dashboard" ? "default" : "ghost"}
                        className="w-full justify-start h-12 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </Button>
                    </Link>
                    <Link href="/super-admin/subscriptions">
                      <Button 
                        variant={location === "/super-admin/subscriptions" ? "default" : "ghost"}
                        className="w-full justify-start h-12 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        All Users
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Special Actions */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <Link href="/subscription">
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white mb-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Subscription Plans
                  </Button>
                </Link>
                
                <Link href="/resources">
                  <Button 
                    className="w-full justify-start bg-red-600 hover:bg-red-700 text-white mb-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Emergency Contacts
                  </Button>
                </Link>
                
                <Link href="/settings">
                  <Button 
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </Link>
              </div>
              
              {/* User Info Footer */}
              <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3 mt-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center">
                  <UserIcon className="text-white" size={16} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">
                    {user?.name || "Loading..."}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.email || ""}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
