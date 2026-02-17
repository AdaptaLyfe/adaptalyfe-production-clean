import { Link, useLocation } from "wouter";
import { Brain, Menu, X, Home, CheckSquare, DollarSign, Stethoscope, Pill, 
         Calendar as CalendarIcon, ShoppingCart, GraduationCap, Target, User as UserIcon, Globe,
         AlertTriangle, Settings, Trophy, FileText, UserPlus, Shield, Zap, Moon, Users } from "lucide-react";
import { useState, useEffect, useRef } from "react";
// AuthUtils inlined to avoid import issues
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { logout } from "@/lib/queryClient";

export default function SimpleNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-[100] android-header android-elevation-2">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={async (e) => {
              e.preventDefault();
              console.log('Logo clicked - checking session and navigating');
              
              // Mobile-optimized navigation with session preservation
              const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
              if (isMobile) {
                try {
                  const response = await fetch('/api/user', { credentials: 'include' });
                  if (response.ok) {
                    setLocation('/dashboard');
                  } else {
                    console.warn('Session lost, redirecting to login');
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
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">AdaptaLyfe</span>
          </div>
          
          {/* Minimal Desktop Navigation - Only show on very large screens */}
          <div className="hidden xl:flex items-center gap-2">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 px-2 py-1 rounded text-sm">
              Home
            </Link>
            <Link href="/daily-tasks" className="text-gray-600 hover:text-gray-900 px-2 py-1 rounded text-sm">
              Tasks
            </Link>
            {(user?.accountType === 'admin' || user?.username === 'admin') && (
              <>
                <Link href="/admin-dashboard" className="text-indigo-600 hover:text-indigo-900 px-2 py-1 rounded text-sm font-medium">
                  <span className="flex items-center gap-1"><Shield size={14} /> Admin</span>
                </Link>
                <Link href="/super-admin/subscriptions" className="text-indigo-600 hover:text-indigo-900 px-2 py-1 rounded text-sm font-medium">
                  <span className="flex items-center gap-1"><Users size={14} /> All Users</span>
                </Link>
              </>
            )}
          </div>

          {/* User info and Menu button */}
          <div className="flex items-center space-x-3">
            {/* User info for larger screens */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
              <span className="hidden lg:block">{user?.name || "User"}</span>
            </div>
            
            {/* Menu button - ALWAYS show this */}
            <div>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors shadow-sm"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="hidden sm:block text-xs font-medium">Menu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Comprehensive App Features Menu */}
        {isMenuOpen && (
          <div 
            ref={menuRef}
            className="fixed md:absolute right-0 left-0 md:left-auto md:w-96 md:max-w-[90vw] bg-white border-t md:border border-gray-200 md:rounded-lg android-elevation-2 z-50 md:mr-4 max-h-[70vh] overflow-y-auto"
            style={{ top: 'calc(3.5rem + max(env(safe-area-inset-top, 0px), 24px))' }}
          >
            <div className="p-4 pb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 sticky top-0 bg-white pt-1 pb-2 z-10">Quick Access to All Features</h3>
              <div className="grid grid-cols-2 gap-2">
                {/* Core Features - Row 1 */}
                <Link href="/dashboard">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 active:bg-gray-100 flex items-center space-x-2 transition-colors touch-manipulation"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Home className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium">Dashboard</span>
                  </button>
                </Link>
                <Link href="/daily-tasks">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 active:bg-gray-100 flex items-center space-x-2 transition-colors touch-manipulation"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <CheckSquare className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium">Daily Tasks</span>
                  </button>
                </Link>
                
                {/* Financial & Health - Row 2 */}
                <Link href="/financial">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 active:bg-gray-100 flex items-center space-x-2 transition-colors touch-manipulation"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium">Financial</span>
                  </button>
                </Link>
                <Link href="/mood-tracking">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 active:bg-gray-100 flex items-center space-x-2 transition-colors touch-manipulation"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium">Mood Check-ins</span>
                  </button>
                </Link>
                
                {/* Sleep Routine - New Feature */}
                <Link href="/sleep-tracking">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 active:bg-gray-100 flex items-center space-x-2 transition-colors touch-manipulation"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-medium">Sleep Routine</span>
                  </button>
                </Link>
                
                {/* Medical & Pharmacy - Row 3 */}
                <Link href="/medical">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 active:bg-gray-100 flex items-center space-x-2 transition-colors touch-manipulation"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium">Health Records</span>
                  </button>
                </Link>
                <Link href="/pharmacy">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 active:bg-gray-100 flex items-center space-x-2 transition-colors touch-manipulation"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Pill className="w-4 h-4 text-pink-600" />
                    <span className="text-xs font-medium">Medication List</span>
                  </button>
                </Link>
                
                {/* Life & Learning - Row 4 */}
                <Link href="/meal-shopping">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 active:bg-gray-100 flex items-center space-x-2 transition-colors touch-manipulation"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ShoppingCart className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-medium">Meals & Shopping</span>
                  </button>
                </Link>
                <Link href="/calendar">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 active:bg-gray-100 flex items-center space-x-2 transition-colors touch-manipulation"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <CalendarIcon className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-medium">Calendar</span>
                  </button>
                </Link>
                
                {/* Education & Skills - Row 5 */}
                <Link href="/academic-planner">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 active:bg-gray-100 flex items-center space-x-2 transition-colors touch-manipulation"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium">Student Planner</span>
                  </button>
                </Link>
                <Link href="/skills-milestones">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 active:bg-gray-100 flex items-center space-x-2 transition-colors touch-manipulation"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Target className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium">Life Skills</span>
                  </button>
                </Link>
                
                {/* Documents & Support - Row 6 */}
                <Link href="/personal-documents">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 active:bg-gray-100 flex items-center space-x-2 transition-colors touch-manipulation"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium">Personal Documents</span>
                  </button>
                </Link>
                <Link href="/caregiver">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 active:bg-gray-100 flex items-center space-x-2 transition-colors touch-manipulation"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserIcon className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-medium">Support Network</span>
                  </button>
                </Link>
                
                {/* Caregiver Management - Row 7 */}
                <Link href="/caregiver-dashboard">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 active:bg-gray-100 flex items-center space-x-2 transition-colors touch-manipulation"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Shield className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-medium">🔐 Caregiver Dashboard</span>
                  </button>
                </Link>
                <Link href="/caregiver-setup">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 active:bg-gray-100 flex items-center space-x-2 transition-colors touch-manipulation"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserPlus className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium">🎯 Caregiver Setup</span>
                  </button>
                </Link>
                
                {/* Resources - Row 8 */}
                <Link href="/resources">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 active:bg-gray-100 flex items-center space-x-2 transition-colors col-span-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Globe className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-medium">Resources</span>
                  </button>
                </Link>
                
                {/* Rewards - Row 9 */}
                <Link href="/rewards">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-yellow-50 active:bg-yellow-100 bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 flex items-center space-x-2 transition-colors col-span-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs font-bold text-yellow-700">🏆 Rewards</span>
                  </button>
                </Link>
              </div>
              
              {/* Admin Section - Only visible for admin users */}
              {(user?.accountType === 'admin' || user?.username === 'admin') && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <h3 className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-2">Admin</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/admin-dashboard">
                      <button 
                        className="w-full text-left p-3 rounded-md bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200 flex items-center space-x-2 transition-colors touch-manipulation"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Shield className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-medium text-indigo-700">Admin Dashboard</span>
                      </button>
                    </Link>
                    <Link href="/super-admin/subscriptions">
                      <button 
                        className="w-full text-left p-3 rounded-md bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200 flex items-center space-x-2 transition-colors touch-manipulation"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-medium text-indigo-700">All Users</span>
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Special Actions */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <Link href="/resources">
                  <button 
                    className="w-full text-left p-3 rounded-md bg-red-600 hover:bg-red-700 active:bg-red-800 text-white mb-2 flex items-center space-x-2 touch-manipulation"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-medium">Emergency Contacts</span>
                  </button>
                </Link>
                
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/settings">
                    <button 
                      className="w-full text-left p-3 rounded-md border border-gray-200 hover:bg-gray-50 active:bg-gray-100 flex items-center space-x-2 touch-manipulation"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4 text-gray-600" />
                      <span className="text-xs font-medium">Settings</span>
                    </button>
                  </Link>
                  <Link href="/features">
                    <button 
                      className="w-full text-left p-3 rounded-md border border-blue-200 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 flex items-center space-x-2 touch-manipulation"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Zap className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-medium">Features</span>
                    </button>
                  </Link>
                </div>
              </div>
              
              {/* User Info Footer */}
              <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3 mt-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
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
                <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  Demo
                </div>
              </div>
              
              {/* Logout Button */}
              <button 
                className="w-full mt-3 p-3 rounded-md bg-red-50 hover:bg-red-100 active:bg-red-200 border border-red-200 text-red-700 font-medium text-sm flex items-center justify-center space-x-2 transition-colors touch-manipulation"
                onClick={async () => {
                  try {
                    await logout();
                    setIsMenuOpen(false);
                    setLocation('/login');
                  } catch (error) {
                    console.error('Logout failed:', error);
                    // Force navigation to login anyway
                    setLocation('/login');
                  }
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}