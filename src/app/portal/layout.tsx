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
    { name: 'Dashboard', href: '/portal', icon: Home },
    { name: 'My Bills', href: '/portal/bills', icon: FileText },
    { name: 'Place Order', href: '/portal/order', icon: ShoppingBag },
  ];

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
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform lg:translate-x-0 lg:static transition-transform duration-300 ease-in-out
        w-[280px] bg-white text-slate-600 h-full border-r border-orange-900/5 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.05)]
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center overflow-hidden p-1 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="MMM Traders" className="w-full h-full object-contain" />
            </div>
            <span className="text-lg font-black text-slate-800 tracking-tight">MMM Traders</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-indigo-600 p-2 transition-colors bg-slate-50 hover:bg-indigo-50 rounded-xl">
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group font-medium',
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'hover:bg-slate-50 hover:text-slate-800 text-slate-500'
                )}
              >
                <Icon size={22} className={cn("transition-colors", isActive ? "text-indigo-500" : "text-slate-400 group-hover:text-slate-600")} strokeWidth={isActive ? 2.5 : 2} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 absolute bottom-0 w-full">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 gap-4 rounded-2xl px-4 py-6 transition-colors" 
            onClick={() => {
              document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
              localStorage.removeItem('mmm_auth_token');
              router.push('/login');
            }}
          >
            <LogOut size={22} strokeWidth={2} />
            <span className="font-medium">Logout</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        <header className="bg-white/80 backdrop-blur-xl border-b border-indigo-900/5 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold tracking-tight text-slate-800">Welcome</h2>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative z-10">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
      <NotificationSetup />
    </div>
  );
}
