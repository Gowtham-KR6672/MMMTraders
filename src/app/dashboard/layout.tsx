'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Layout/Sidebar';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import NotificationSetup from '@/components/NotificationSetup';
import axiosClient from '@/lib/axiosClient';

export default function DashboardLayout({
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

  // Close sidebar on navigation on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // While auth is being checked, show a full-page loader
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

  return (
    <div className="flex h-screen overflow-hidden bg-[#FFF9F5] selection:bg-orange-500/30">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform lg:translate-x-0 lg:static transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        <header className="bg-white/80 backdrop-blur-xl border-b border-orange-900/5 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold tracking-tight text-slate-800">Dashboard</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center overflow-hidden p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="MMM Traders" className="w-full h-full object-contain" />
            </div>
            <span className="hidden sm:block text-sm font-bold text-slate-700">MMM Traders</span>
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
