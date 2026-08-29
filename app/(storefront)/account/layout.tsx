'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  User, 
  ShoppingBag, 
  Heart, 
  MapPin, 
  Award, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=' + encodeURIComponent(pathname));
    }
  }, [isAuthenticated, router, pathname]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-xs text-stone-400">
        Loading Atelier Account...
      </div>
    );
  }

  const navLinks = [
    { name: 'Overview', href: '/account', icon: User },
    { name: 'My Orders', href: '/account/orders', icon: ShoppingBag },
    { name: 'Wishlist', href: '/account/wishlist', icon: Heart },
    { name: 'Addresses', href: '/account/addresses', icon: MapPin },
    { name: 'Loyalty Points', href: '/account/loyalty', icon: Award },
    { name: 'Refer & Earn', href: '/account/referrals', icon: Users },
    { name: 'Settings', href: '/account/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0f1014] pt-24 pb-16 transition-colors">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex justify-between items-center bg-white dark:bg-[#16171b] p-4 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-[#c46331] font-bold text-sm">
                {user.full_name.charAt(0)}
              </div>
              <div>
                <h2 className="font-semibold text-xs text-stone-900 dark:text-stone-100">{user.full_name}</h2>
                <p className="text-[11px] text-stone-400">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-500 hover:text-[#c46331]"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Sidebar */}
          <aside className={cn(
            "w-full md:w-72 flex-shrink-0 transition-all duration-300 md:block",
            mobileMenuOpen ? "block" : "hidden"
          )}>
            <div className="bg-white dark:bg-[#16171b] rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 p-6 sticky top-28 space-y-6">
              {/* User Info (Desktop) */}
              <div className="hidden md:flex flex-col items-center text-center pb-6 border-b border-stone-100 dark:border-stone-800">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-[#c46331] text-xl font-bold mb-3 shadow-xs">
                  {user.full_name.charAt(0)}
                </div>
                <h2 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">{user.full_name}</h2>
                <p className="text-xs text-stone-400 mb-3 truncate max-w-[200px]">{user.email}</p>
                
                {user.role === 'customer' ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/50 text-[#c46331] dark:text-amber-400 rounded-full text-xs font-semibold border border-amber-200/60 dark:border-amber-900/40">
                    <Sparkles size={13} />
                    <span>{user.loyalty_points} Loyalty Points</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <ShieldCheck size={13} />
                    <span>{user.role === 'admin' ? 'Store Owner' : 'Order Staff'}</span>
                  </div>
                )}
              </div>

              {/* Admin Jump Button for Staff */}
              {(user.role === 'admin' || user.role === 'order_manager') && (
                <div className="pb-2">
                  <Link
                    href="/admin"
                    className="flex items-center justify-between px-3 py-2 bg-[#1a1714] dark:bg-stone-800 text-white rounded-xl text-xs font-bold hover:bg-[#c46331] transition-colors shadow-sm"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" /> Admin Dashboard
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* Navigation Links */}
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all",
                        isActive 
                          ? "bg-amber-50 dark:bg-amber-950/40 text-[#c46331] dark:text-amber-400 font-bold" 
                          : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-200"
                      )}
                    >
                      <Icon size={16} className={isActive ? "text-[#c46331] dark:text-amber-400" : "text-stone-400"} />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all mt-4 text-left cursor-pointer"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Account Content Area */}
          <main className="flex-1 min-w-0">
            {children}
          </main>

        </div>
      </div>
    </div>
  );
}
