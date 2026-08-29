'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tag,
  ShoppingCart,
  Users,
  Star,
  Gift,
  Share2,
  FileText,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Store,
  Menu,
  X,
  Shield,
  Sun,
  Moon,
  Truck,
} from 'lucide-react';
import { useTheme } from '@/lib/context/ThemeContext';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Products', href: '/admin/products', icon: Package },
      { label: 'Categories', href: '/admin/categories', icon: FolderTree },
      { label: 'Offers & Coupons', href: '/admin/coupons', icon: Tag },
      { label: 'Suppliers & Dropship', href: '/admin/suppliers', icon: Truck },
    ],
  },
  {
    title: 'Sales',
    items: [
      { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
      { label: 'Customers', href: '/admin/customers', icon: Users },
      { label: 'Reviews', href: '/admin/reviews', icon: Star },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { label: 'Loyalty Program', href: '/admin/loyalty', icon: Gift },
      { label: 'Referrals', href: '/admin/referrals', icon: Share2 },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'CMS Pages', href: '/admin/cms', icon: FileText },
      { label: 'Banners', href: '/admin/banners', icon: Store },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { label: 'Reports', href: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      { label: 'Store Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isAdmin, isOrderManager, logout } = useAuth();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (!isAdmin && !isOrderManager) {
      router.push('/account');
      return;
    }
  }, [isAuthenticated, isAdmin, isOrderManager, router]);

  if (!isAuthenticated || (!isAdmin && !isOrderManager)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-[#0f1014]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300">Access Restricted</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2">Verifying admin credentials...</p>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="notranslate min-h-screen bg-neutral-50 dark:bg-[#0f1014] text-neutral-900 dark:text-neutral-100 flex transition-colors">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 bg-white dark:bg-[#14151a] border-r border-neutral-200 dark:border-neutral-800 flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'w-[72px]' : 'w-64',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo area */}
        <div className={cn('h-16 flex items-center border-b border-neutral-200 dark:border-neutral-800 px-4', sidebarCollapsed && 'justify-center')}>
          {!sidebarCollapsed && (
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-amber rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">O</span>
              </div>
              <span className="font-semibold text-lg text-neutral-900">Ozeira</span>
              <span className="text-xs bg-brand-amber/10 text-brand-amber px-1.5 py-0.5 rounded-full font-medium">Admin</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 bg-brand-amber rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {navSections.map((section) => (
            <div key={section.title} className="mb-4">
              {!sidebarCollapsed && (
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-3 mb-1.5">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5',
                      active
                        ? 'bg-brand-amber/10 text-brand-amber'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                      sidebarCollapsed && 'justify-center px-2'
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                    {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="hidden lg:flex border-t border-neutral-200 p-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-[#14151a] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {navSections.flatMap(s => s.items).find(i => isActive(i.href))?.label || 'Admin Panel'}
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block">
                Manage your store
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle in Admin */}
            <button
              onClick={toggleTheme}
              className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 animate-scale-in" />
              ) : (
                <Moon className="w-4 h-4 text-neutral-600 animate-scale-in" />
              )}
            </button>

            <Link
              href="/"
              className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Store</span>
            </Link>

            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-800" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-amber/20 rounded-full flex items-center justify-center">
                <span className="text-brand-amber font-semibold text-sm">
                  {user?.full_name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-tight">{user?.full_name}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-tight capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
