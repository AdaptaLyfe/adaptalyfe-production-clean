import { Link, useLocation } from "wouter";
import { Brain, Menu, X, Home, CheckSquare, DollarSign, Stethoscope, Pill, 
         Calendar as CalendarIcon, ShoppingCart, GraduationCap, Target, User as UserIcon, Globe,
         AlertTriangle, Settings, Trophy, FileText, UserPlus, Shield, Zap, Moon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { AuthUtils } from "../lib/auth";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={async (e) => {
              e.preventDefault();
              console.log('Logo clicked - checking session and navigating');
              
              // Mobile-optimized navigation with session preservation
              if (AuthUtils.isMobileDevice()) {
                const sessionValid = await AuthUtils.ensureSessionPersistence();
                if (sessionValid) {
                  setLocation('/dashboard');
                } else {
                  console.warn('Session lost, redirecting to login');
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
            className="absolute right-0 top-16 w-80 max-w-[90vw] bg-white border border-gray-200 rounded-lg shadow-xl z-50 mr-4"
          >
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Access to All Features</h3>
              <div className="grid grid-cols-2 gap-2">
                {/* Core Features - Row 1 */}
                <Link href="/dashboard">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Home className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium">Dashboard</span>
                  </button>
                </Link>
                <Link href="/daily-tasks">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <CheckSquare className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium">Daily Tasks</span>
                  </button>
                </Link>
                
                {/* Financial & Health - Row 2 */}
                <Link href="/financial">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium">Financial</span>
                  </button>
                </Link>
                <Link href="/mood-tracking">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium">Mood Tracking</span>
                  </button>
                </Link>
                
                {/* Sleep Tracking - New Feature */}
                <Link href="/sleep-tracking">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-medium">Sleep Tracking</span>
                  </button>
                </Link>
                
                {/* Medical & Pharmacy - Row 3 */}
                <Link href="/medical">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium">Medical Info</span>
                  </button>
                </Link>
                <Link href="/pharmacy">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Pill className="w-4 h-4 text-pink-600" />
                    <span className="text-xs font-medium">Pharmacy</span>
                  </button>
                </Link>
                
                {/* Life & Learning - Row 4 */}
                <Link href="/meal-shopping">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ShoppingCart className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-medium">Meals & Shopping</span>
                  </button>
                </Link>
                <Link href="/calendar">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <CalendarIcon className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-medium">Calendar</span>
                  </button>
                </Link>
                
                {/* Education & Skills - Row 5 */}
                <Link href="/academic-planner">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium">Student Planner</span>
                  </button>
                </Link>
                <Link href="/skills-milestones">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Target className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium">Life Skills</span>
                  </button>
                </Link>
                
                {/* Documents & Support - Row 6 */}
                <Link href="/personal-documents">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium">Personal Documents</span>
                  </button>
                </Link>
                <Link href="/caregiver">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserIcon className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-medium">Support Network</span>
                  </button>
                </Link>
                
                {/* Caregiver Management - Row 7 */}
                <Link href="/caregiver-dashboard">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Shield className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-medium">🔐 Caregiver Dashboard</span>
                  </button>
                </Link>
                <Link href="/caregiver-setup">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserPlus className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium">🎯 Caregiver Setup</span>
                  </button>
                </Link>
                
                {/* Resources - Row 8 */}
                <Link href="/resources">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 flex items-center space-x-2 transition-colors col-span-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Globe className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-medium">Resources</span>
                  </button>
                </Link>
                
                {/* Rewards - Row 9 */}
                <Link href="/rewards">
                  <button 
                    className="w-full text-left p-3 rounded-md hover:bg-yellow-50 bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 flex items-center space-x-2 transition-colors col-span-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs font-bold text-yellow-700">🏆 Rewards</span>
                  </button>
                </Link>
              </div>
              
              {/* Special Actions */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <Link href="/resources">
                  <button 
                    className="w-full text-left p-3 rounded-md bg-red-600 hover:bg-red-700 text-white mb-2 flex items-center space-x-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-medium">Emergency Contacts</span>
                  </button>
                </Link>
                
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/settings">
                    <button 
                      className="w-full text-left p-3 rounded-md border border-gray-200 hover:bg-gray-50 flex items-center space-x-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4 text-gray-600" />
                      <span className="text-xs font-medium">Settings</span>
                    </button>
                  </Link>
                  <Link href="/features">
                    <button 
                      className="w-full text-left p-3 rounded-md border border-blue-200 bg-blue-50 hover:bg-blue-100 flex items-center space-x-2"
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
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}