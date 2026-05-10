'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Home, FileText, ShoppingBag, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import NotificationSetup from '@/components/NotificationSetup';
import axiosClient from '@/lib/axiosClient';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Auth guard — redirect to login if no valid session
  useEffect(() => {
    axiosClient.get('/api/auth/me')
      .then((res) => {
        if (res.data?.user?.role !== 'customer') {
          router.replace('/dashboard');
        } else {
          setAuthChecked(true);
        }
      })
      .catch(() => {
        localStorage.removeItem('mmm_auth_token');
        router.replace('/login');
      });
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const navItems = [
    { name: 'Dashboard', href: '/portal',       icon: Home },
    { name: 'My Bills',  href: '/portal/bills', icon: FileText },
    { name: 'Order',     href: '/portal/order', icon: ShoppingBag },
  ];

  const handleLogout = () => {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    localStorage.removeItem('mmm_auth_token');
    router.push('/login');
  };

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FFF9F5]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#FFF9F5] selection:bg-orange-500/30">

      {/* ── Desktop Sidebar (hidden on mobile) ────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-[280px] bg-white border-r border-slate-100 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.05)] h-full flex-shrink-0">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-50">
          <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center overflow-hidden p-1 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="MMM Traders" className="w-full h-full object-contain" />
          </div>
          <span className="text-lg font-black text-slate-800 tracking-tight">MMM Traders</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 font-medium',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'hover:bg-slate-50 hover:text-slate-800 text-slate-500'
                )}
              >
                <Icon
                  size={20}
                  className={cn(isActive ? 'text-indigo-500' : 'text-slate-400')}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-50">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 gap-3 rounded-2xl px-4 py-5"
            onClick={handleLogout}
          >
            <LogOut size={20} strokeWidth={2} />
            <span className="font-medium">Logout</span>
          </Button>
        </div>
      </div>

      {/* ── Mobile Sidebar Overlay (slide-in, for extra links if needed) ─── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Main Content Area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden w-full relative">

        {/* Top Header */}
        <header className="bg-white/90 backdrop-blur-xl border-b border-slate-100 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3">
            {/* Logo visible on mobile in header */}
            <div className="h-8 w-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center overflow-hidden p-0.5 lg:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="MMM Traders" className="w-full h-full object-contain" />
            </div>
            <span className="font-black text-slate-800 text-base lg:text-xl tracking-tight">
              MMM Traders
            </span>
          </div>
          {/* Logout button visible on mobile top-right */}
          <button
            onClick={handleLogout}
            className="lg:hidden flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors"
          >
            <LogOut size={14} />
            Logout
          </button>
        </header>

        {/* Page Content — extra bottom padding on mobile for bottom nav */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 lg:pb-8 relative z-10">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar ──────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 shadow-[0_-8px_30px_-8px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-around px-2 py-1 safe-area-bottom">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all duration-200 min-w-[64px]"
              >
                <div className={cn(
                  'p-2 rounded-xl transition-all duration-200',
                  isActive ? 'bg-indigo-100' : 'bg-transparent'
                )}>
                  <Icon
                    size={22}
                    className={cn(
                      'transition-colors',
                      isActive ? 'text-indigo-600' : 'text-slate-400'
                    )}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </div>
                <span className={cn(
                  'text-[10px] font-semibold transition-colors',
                  isActive ? 'text-indigo-600' : 'text-slate-400'
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <NotificationSetup />
    </div>
  );
}
