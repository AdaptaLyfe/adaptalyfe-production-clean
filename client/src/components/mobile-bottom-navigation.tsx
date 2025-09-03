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
      href: '/', 
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
    if (href === '/') return location === '/';
    return location.startsWith(href);
  };

  return (
    <>
      {/* More Menu Overlay */}
      {showMoreMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setShowMoreMenu(false)}>
          <div className="absolute bottom-16 left-0 right-0 bg-white border-t border-gray-200 rounded-t-xl p-4">
            <div className="grid grid-cols-2 gap-3">
              {moreNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant="ghost"
                      className={`w-full h-16 flex flex-col items-center justify-center gap-1 ${
                        isActive(item.href) ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
                      }`}
                      onClick={() => setShowMoreMenu(false)}
                    >
                      <Icon size={20} />
                      <span className="text-xs font-medium">{item.name}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 md:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className={`flex flex-col items-center justify-center gap-1 h-12 w-16 p-1 ${
                    active 
                      ? `${item.activeBg} ${item.activeColor}` 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-xs font-medium">{item.name}</span>
                </Button>
              </Link>
            );
          })}
          
          {/* More Button */}
          <Button
            variant="ghost"
            className={`flex flex-col items-center justify-center gap-1 h-12 w-16 p-1 ${
              showMoreMenu 
                ? 'bg-gray-100 text-gray-900' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setShowMoreMenu(!showMoreMenu)}
          >
            <MenuIcon size={18} />
            <span className="text-xs font-medium">More</span>
          </Button>
        </div>
      </div>

      {/* Add bottom padding to main content to prevent overlap */}
      <div className="h-16 md:hidden" />
    </>
  );
}