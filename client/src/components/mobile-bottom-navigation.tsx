import { Link, useLocation } from "wouter";
import { 
  Home, 
  CheckSquare, 
  DollarSign, 
  Heart, 
  ShoppingCart, 
  Calendar,
  Target,
  Menu as MenuIcon 
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function MobileBottomNavigation() {
  const [location] = useLocation();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const primaryNavItems = [
    { 
      name: 'Home', 
      href: '/dashboard', 
      icon: Home,
      activeColor: 'text-blue-600',
      activeBg: 'bg-blue-100'
    },
    { 
      name: 'Tasks', 
      href: '/daily-tasks', 
      icon: CheckSquare,
      activeColor: 'text-green-600',
      activeBg: 'bg-green-100'
    },
    { 
      name: 'Money', 
      href: '/financial', 
      icon: DollarSign,
      activeColor: 'text-blue-600',
      activeBg: 'bg-blue-100'
    },
    { 
      name: 'Mood', 
      href: '/mood-tracking', 
      icon: Heart,
      activeColor: 'text-purple-600',
      activeBg: 'bg-purple-100'
    },
  ];

  const moreNavItems = [
    { name: 'Meals & Shopping', href: '/meal-shopping', icon: ShoppingCart },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Skills', href: '/skills-milestones', icon: Target },
    { name: 'Medical', href: '/medical', icon: Heart },
    { name: 'Resources', href: '/resources', icon: Heart },
    { name: 'Support', href: '/caregiver', icon: Heart },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return location === '/dashboard' || location === '/';
    return location.startsWith(href);
  };

  return (
    <>
      {/* More Menu Overlay - Android Material Design */}
      {showMoreMenu && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setShowMoreMenu(false)}>
          <div 
            className="absolute bottom-[72px] left-2 right-2 bg-white rounded-2xl p-4 android-elevation-2"
            style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-2 gap-2">
              {moreNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant="ghost"
                      className={`w-full h-14 flex flex-col items-center justify-center gap-1 rounded-xl android-ripple ${
                        active ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      onClick={() => setShowMoreMenu(false)}
                    >
                      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                      <span className={`text-[11px] ${active ? 'font-semibold' : 'font-medium'}`}>{item.name}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar - Android Material Design */}
      <div className="fixed bottom-0 left-0 right-0 bg-white z-30 md:hidden android-bottom-nav android-elevation-2">
        <div className="flex items-center justify-around px-1 py-1"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
        >
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className={`flex flex-col items-center justify-center gap-0.5 h-14 min-w-[64px] flex-1 p-1 rounded-lg android-ripple transition-all ${
                    active 
                      ? `${item.activeBg} ${item.activeColor}` 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                  <span className={`text-[11px] ${active ? 'font-semibold' : 'font-medium'}`}>{item.name}</span>
                </Button>
              </Link>
            );
          })}
          
          {/* More Button */}
          <Button
            variant="ghost"
            className={`flex flex-col items-center justify-center gap-0.5 h-14 min-w-[64px] flex-1 p-1 rounded-lg android-ripple transition-all ${
              showMoreMenu 
                ? 'bg-gray-100 text-gray-900' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setShowMoreMenu(!showMoreMenu)}
          >
            <MenuIcon size={22} strokeWidth={showMoreMenu ? 2.5 : 2} />
            <span className={`text-[11px] ${showMoreMenu ? 'font-semibold' : 'font-medium'}`}>More</span>
          </Button>
        </div>
      </div>

      {/* Add bottom padding to main content to prevent overlap with safe area */}
      <div className="h-20 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
    </>
  );
}