'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, ShoppingCart, IndianRupee,
  Receipt, Package, ClipboardList, LogOut, X, Menu,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import NotificationSetup from '@/components/NotificationSetup';
import axiosClient from '@/lib/axiosClient';

const navItems = [
  { name: 'Dashboard',       href: '/dashboard',          icon: LayoutDashboard },
  { name: 'Sales',           href: '/dashboard/sales',    icon: ShoppingCart },
  { name: 'Products',        href: '/dashboard/products', icon: Package },
  { name: 'Incoming Orders', href: '/dashboard/orders',   icon: ClipboardList },
  { name: 'Income',          href: '/dashboard/income',   icon: IndianRupee },
  { name: 'Pending',         href: '/dashboard/pending',  icon: Receipt },
  { name: 'Customers',       href: '/dashboard/customers',icon: Users },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    axiosClient.get('/api/auth/me')
      .then((res) => {
        if (res.data?.user?.role === 'customer') {
          router.replace('/portal');
        } else {
          setAuthChecked(true);
        }
      })
      .catch(() => {
        localStorage.removeItem('mmm_auth_token');
        router.replace('/login');
      });
  }, []);

  // Close menu on navigation
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const handleLogout = () => {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    localStorage.removeItem('mmm_auth_token');
    window.location.href = '/login';
  };

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FFF9F5]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading MMM Traders...</p>
        </div>
      </div>
    );
  }

  const activePage = navItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#FFF9F5]">

      {/* ── Desktop Sidebar (hidden on mobile) ────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[280px] bg-white border-r border-orange-900/5 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.05)] h-full flex-shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-50">
          <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center overflow-hidden p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="MMM Traders" className="w-full h-full object-contain" />
          </div>
          <span className="text-lg font-black text-slate-800 tracking-tight">MMM Traders</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 font-medium',
                  isActive
                    ? 'bg-orange-50 text-orange-700 shadow-sm'
                    : 'hover:bg-slate-50 hover:text-slate-800 text-slate-500'
                )}
              >
                <Icon size={20} className={cn(isActive ? 'text-orange-500' : 'text-slate-400')} strokeWidth={isActive ? 2.5 : 2} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors font-medium"
          >
            <LogOut size={20} strokeWidth={2} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">

        {/* Top Header */}
        <header className="bg-white/90 backdrop-blur-xl border-b border-orange-900/5 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center overflow-hidden p-0.5 lg:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="MMM Traders" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 tracking-tight leading-none">
                {activePage?.name || 'Dashboard'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">MMM Traders Admin</p>
            </div>
          </div>
          {/* Logout on mobile top-right */}
          <button
            onClick={handleLogout}
            className="lg:hidden flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors"
          >
            <LogOut size={14} />
            Logout
          </button>
        </header>

        {/* Page Content — extra bottom padding for mobile bottom nav */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 lg:pb-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile Full-Screen Menu Overlay ───────────────────────────────── */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          {/* Slide-up panel */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom-4 duration-300">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center overflow-hidden p-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="MMM Traders" className="w-full h-full object-contain" />
                </div>
                <span className="font-black text-slate-800 text-sm">MMM Traders</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav Items Grid */}
            <div className="px-4 py-4 grid grid-cols-1 gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200 font-medium',
                      isActive
                        ? 'bg-orange-50 text-orange-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <div className={cn(
                      'p-2 rounded-xl',
                      isActive ? 'bg-orange-100' : 'bg-slate-100'
                    )}>
                      <Icon size={18} className={cn(isActive ? 'text-orange-500' : 'text-slate-500')} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className="flex-1">{item.name}</span>
                    {isActive && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                    {!isActive && <ChevronRight size={16} className="text-slate-300" />}
                  </Link>
                );
              })}
            </div>

            {/* Logout inside menu */}
            <div className="px-4 pb-6 pt-1 border-t border-slate-50">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-500 hover:bg-red-50 transition-colors font-medium"
              >
                <div className="p-2 rounded-xl bg-red-50">
                  <LogOut size={18} className="text-red-500" />
                </div>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Navigation Bar ──────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 shadow-[0_-8px_30px_-8px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-around px-2 py-1">

          {/* Dashboard tab */}
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl min-w-[64px]"
          >
            <div className={cn(
              'p-2 rounded-xl transition-all',
              pathname === '/dashboard' ? 'bg-orange-100' : 'bg-transparent'
            )}>
              <LayoutDashboard
                size={22}
                className={pathname === '/dashboard' ? 'text-orange-600' : 'text-slate-400'}
                strokeWidth={pathname === '/dashboard' ? 2.5 : 1.8}
              />
            </div>
            <span className={cn(
              'text-[10px] font-semibold',
              pathname === '/dashboard' ? 'text-orange-600' : 'text-slate-400'
            )}>Home</span>
          </Link>

          {/* Orders tab */}
          <Link
            href="/dashboard/orders"
            className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl min-w-[64px]"
          >
            <div className={cn(
              'p-2 rounded-xl transition-all',
              pathname === '/dashboard/orders' ? 'bg-orange-100' : 'bg-transparent'
            )}>
              <ClipboardList
                size={22}
                className={pathname === '/dashboard/orders' ? 'text-orange-600' : 'text-slate-400'}
                strokeWidth={pathname === '/dashboard/orders' ? 2.5 : 1.8}
              />
            </div>
            <span className={cn(
              'text-[10px] font-semibold',
              pathname === '/dashboard/orders' ? 'text-orange-600' : 'text-slate-400'
            )}>Orders</span>
          </Link>

          {/* Menu button (opens full-screen panel) */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl min-w-[64px]"
          >
            <div className={cn(
              'p-2 rounded-xl transition-all',
              menuOpen ? 'bg-slate-100' : 'bg-transparent'
            )}>
              <Menu size={22} className={menuOpen ? 'text-slate-700' : 'text-slate-400'} strokeWidth={1.8} />
            </div>
            <span className="text-[10px] font-semibold text-slate-400">Menu</span>
          </button>

        </div>
      </nav>

      <NotificationSetup />
    </div>
  );
}
