import { Link, useLocation } from "wouter";
import {
  Brain, Menu, X, Home, CheckSquare, DollarSign, Stethoscope, Pill,
  Calendar as CalendarIcon, ShoppingCart, GraduationCap, Target, Globe,
  AlertTriangle, Settings, Trophy, FileText, UserPlus, Shield, Zap, Moon, Users, Building2,
  HeartHandshake, HelpCircle, Crown, Search, Bell, LogOut, ChevronDown, Sun,
  type LucideIcon,
} from "lucide-react";
import { useState, useEffect, useRef, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { logout } from "@/lib/queryClient";
import { useTheme } from "@/lib/theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  accent?: string;
};

const PRIMARY_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home, accent: "text-violet-600" },
  { href: "/daily-tasks", label: "Tasks", icon: CheckSquare, accent: "text-teal-600" },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon, accent: "text-indigo-600" },
  { href: "/mood-tracking", label: "Mood", icon: Brain, accent: "text-purple-600" },
  { href: "/caregiver", label: "Caregiver Support", icon: HeartHandshake, accent: "text-rose-600" },
];

const MORE_ITEMS: NavItem[] = [
  { href: "/medical", label: "Health Records", icon: Stethoscope, accent: "text-blue-600" },
  { href: "/personal-documents", label: "Documents", icon: FileText, accent: "text-slate-600" },
  { href: "/financial", label: "Financial", icon: DollarSign, accent: "text-green-600" },
  { href: "/sleep-tracking", label: "Sleep Routine", icon: Moon, accent: "text-indigo-600" },
  { href: "/pharmacy", label: "Medication List", icon: Pill, accent: "text-pink-600" },
  { href: "/meal-shopping", label: "Meals & Shopping", icon: ShoppingCart, accent: "text-orange-600" },
  { href: "/academic-planner", label: "Student Planner", icon: GraduationCap, accent: "text-purple-600" },
  { href: "/skills-milestones", label: "Life Skills", icon: Target, accent: "text-blue-600" },
  { href: "/caregiver-dashboard", label: "Caregiver Dashboard", icon: Shield, accent: "text-red-600" },
  { href: "/caregiver-setup", label: "Caregiver Setup", icon: UserPlus, accent: "text-purple-600" },
  { href: "/resources", label: "Resources", icon: Globe, accent: "text-orange-600" },
  { href: "/rewards", label: "Rewards", icon: Trophy, accent: "text-yellow-600" },
  { href: "/features", label: "Features", icon: Zap, accent: "text-blue-600" },
];

const FOOTER_ITEMS: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings, accent: "text-gray-600" },
  { href: "/resources", label: "Help", icon: HelpCircle, accent: "text-gray-600" },
];

function isActivePath(location: string, href: string) {
  if (href === "/dashboard") return location === "/dashboard" || location === "/demo";
  return location === href || location.startsWith(href + "/");
}

function NavLinkRow({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link href={item.href} onClick={onNavigate}>
      <span
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
          active
            ? "bg-violet-100 text-violet-800"
            : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        <Icon className={`h-4 w-4 shrink-0 ${active ? "text-violet-600" : item.accent || "text-gray-500"}`} />
        <span className="truncate">{item.label}</span>
      </span>
    </Link>
  );
}

function SidebarContent({
  user,
  location,
  onNavigate,
  onLogout,
}: {
  user?: User;
  location: string;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  const isAdmin = user?.accountType === "admin" || user?.username === "admin";

  // Decide what the sidebar upsell card should say (or hide it) from the
  // user's real subscription, so paying customers aren't asked to upgrade.
  const { data: subscription, isLoading: subscriptionLoading } = useQuery<{
    planType?: string;
    status?: string;
    isAccountTrial?: boolean;
    trialDaysLeft?: number | null;
  }>({
    queryKey: ["/api/subscription"],
    enabled: !!user,
  });
  const planType = (subscription?.planType ?? "").toLowerCase();
  const status = (subscription?.status ?? "").toLowerCase();
  const hasPaidAccess =
    !subscription?.isAccountTrial && (status === "active" || status === "trialing");
  const upsell: { title: string; text: string; cta: string } | null =
    isAdmin || subscriptionLoading || !user
      ? null
      : hasPaidAccess && (planType === "premium" || planType === "family" || planType === "lifetime")
        ? null
        : hasPaidAccess && planType === "basic"
          ? { title: "Upgrade to Premium", text: "Add mood tools, personal records and AI guidance.", cta: "Compare plans" }
          : subscription?.isAccountTrial && typeof subscription.trialDaysLeft === "number" && subscription.trialDaysLeft > 0
            ? {
                title: `Free trial · ${subscription.trialDaysLeft} day${subscription.trialDaysLeft === 1 ? "" : "s"} left`,
                text: "Choose a plan to keep full access after your trial.",
                cta: "View Plans",
              }
            : { title: "Upgrade to Premium", text: "Unlock more features and caregiver tools.", cta: "View Plans" };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-2 rounded-xl shadow-sm">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900 tracking-tight">Adaptalyfe</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="space-y-1">
          {PRIMARY_ITEMS.map((item) => (
            <NavLinkRow
              key={item.href + item.label}
              item={item}
              active={isActivePath(location, item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        <div>
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            More
          </p>
          <div className="space-y-1">
            {MORE_ITEMS.map((item) => (
              <NavLinkRow
                key={item.href + item.label}
                item={item}
                active={isActivePath(location, item.href)}
                onNavigate={onNavigate}
              />
            ))}
            <Link href="/resources" onClick={onNavigate}>
              <span className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 cursor-pointer">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                Emergency Contacts
              </span>
            </Link>
          </div>
        </div>

        {isAdmin && (
          <div>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
              Admin
            </p>
            <div className="space-y-1">
              <NavLinkRow
                item={{ href: "/admin-dashboard", label: "Admin Dashboard", icon: Shield, accent: "text-indigo-600" }}
                active={isActivePath(location, "/admin-dashboard")}
                onNavigate={onNavigate}
              />
              <NavLinkRow
                item={{ href: "/super-admin/subscriptions", label: "All Users", icon: Users, accent: "text-indigo-600" }}
                active={isActivePath(location, "/super-admin/subscriptions")}
                onNavigate={onNavigate}
              />
              <NavLinkRow
                item={{ href: "/admin/org-codes", label: "Org Codes", icon: Building2, accent: "text-indigo-600" }}
                active={isActivePath(location, "/admin/org-codes")}
                onNavigate={onNavigate}
              />
            </div>
          </div>
        )}

        {upsell && (
          <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-purple-100 border border-violet-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-4 w-4 text-violet-600" />
              <p className="text-sm font-semibold text-violet-900">{upsell.title}</p>
            </div>
            <p className="text-xs text-violet-700/80 mb-3">{upsell.text}</p>
            <Link href="/subscription" onClick={onNavigate}>
              <span className="inline-flex w-full items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold py-2 cursor-pointer transition-colors">
                {upsell.cta}
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SimpleNavigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { resolved: theme, toggle: toggleTheme } = useTheme();
  const drawerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty("--app-header-h", `${Math.ceil(el.getBoundingClientRect().height)}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--app-header-h");
    };
  }, []);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    }
    if (mobileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // still send user to login
    }
    setMobileOpen(false);
    setLocation("/login");
  };

  const initials = (user?.name || "User")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Desktop left sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 z-[100] w-64 flex-col border-r border-slate-100 bg-white">
        <SidebarContent
          user={user}
          location={location}
          onLogout={handleLogout}
        />
      </aside>

      {/* Top header — utilities top-right; greeting + Progress/Streak on one row */}
      <header
        ref={headerRef}
        className="fixed top-0 right-0 left-0 md:left-64 z-[90] bg-[#f4f7fb] min-h-[4.25rem] sm:min-h-[4.75rem]"
      >
        <div className="px-3 sm:px-6 py-3 sm:py-4 space-y-3">
          {/* Utilities row */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg bg-white border border-gray-200 text-gray-700 shrink-0 shadow-sm"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center justify-end gap-2 sm:gap-3 ml-auto">
              <button
                type="button"
                aria-label="Search"
                className="p-2.5 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm"
                onClick={() => setLocation("/features")}
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                title={theme === "dark" ? "Light theme" : "Dark theme"}
                className="p-2.5 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm"
                onClick={toggleTheme}
              >
                {theme === "dark" ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
              </button>
              <button
                type="button"
                aria-label="Notifications"
                className="relative p-2.5 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm"
                onClick={() => setLocation("/daily-tasks")}
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Open profile menu"
                    className="flex items-center gap-2 rounded-full bg-white border border-gray-200 pl-1 pr-2 sm:pr-3 py-1 hover:bg-gray-50 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-300 data-[state=open]:ring-2 data-[state=open]:ring-violet-200"
                  >
                    <span className="h-9 w-9 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">
                      {initials}
                    </span>
                    <span className="hidden sm:block text-sm font-medium text-gray-800 max-w-[120px] truncate">
                      {user?.name || "User"}
                    </span>
                    <ChevronDown className="hidden sm:block h-4 w-4 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="z-[200] w-64 rounded-2xl border-slate-100 bg-white p-2 shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
                >
                  <div className="flex items-center gap-3 px-2 py-2">
                    <span className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm font-bold flex items-center justify-center">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || "User"}</p>
                      {user?.email && <p className="text-xs text-slate-500 truncate">{user.email}</p>}
                    </div>
                  </div>
                  <DropdownMenuSeparator className="my-1.5 bg-slate-100" />
                  {FOOTER_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem
                        key={item.label}
                        onSelect={() => setLocation(item.href)}
                        className="cursor-pointer gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium text-slate-700 focus:bg-slate-50"
                      >
                        <Icon className="h-4 w-4 text-slate-500" />
                        {item.label}
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator className="my-1.5 bg-slate-100" />
                  <DropdownMenuItem
                    onSelect={handleLogout}
                    className="cursor-pointer gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium text-red-700 focus:bg-red-50 focus:text-red-700"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[110] bg-black/40">
          <div
            ref={drawerRef}
            className="absolute top-0 left-0 bottom-0 w-[min(20rem,88vw)] bg-white shadow-xl"
          >
            <div className="absolute top-3 right-3 z-10">
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent
              user={user}
              location={location}
              onNavigate={() => setMobileOpen(false)}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}
    </>
  );
}

/** Exported for layout verification / tests */
export const ALL_SIDEBAR_HREFS = [
  ...PRIMARY_ITEMS.map((i) => i.href),
  ...MORE_ITEMS.map((i) => i.href),
  ...FOOTER_ITEMS.map((i) => i.href),
  "/resources", // emergency contacts
  "/subscription",
  "/admin-dashboard",
  "/super-admin/subscriptions",
  "/admin/org-codes",
];
