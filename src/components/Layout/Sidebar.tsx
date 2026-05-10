'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, ShoppingCart, IndianRupee, Receipt, LogOut, X, Package, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Sales', href: '/dashboard/sales', icon: ShoppingCart },
  { name: 'Products', href: '/dashboard/products', icon: Package },
  { name: 'Incoming Orders', href: '/dashboard/orders', icon: ClipboardList },
  { name: 'Income', href: '/dashboard/income', icon: IndianRupee },
  { name: 'Pending', href: '/dashboard/pending', icon: Receipt },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-[280px] bg-white text-slate-600 h-full border-r border-orange-900/5 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.05)] relative z-20">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center overflow-hidden p-1 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="MMM Traders" className="w-full h-full object-contain" />
            </div>
            <span className="text-lg font-black text-slate-800 tracking-tight">MMM Traders</span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-orange-600 p-2 transition-colors bg-slate-50 hover:bg-orange-50 rounded-xl">
            <X size={20} />
          </button>
        )}
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group font-medium',
                isActive 
                  ? 'bg-orange-50 text-orange-700 shadow-sm' 
                  : 'hover:bg-slate-50 hover:text-slate-800 text-slate-500'
              )}
            >
              <Icon size={22} className={cn("transition-colors", isActive ? "text-orange-500" : "text-slate-400 group-hover:text-slate-600")} strokeWidth={isActive ? 2.5 : 2} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-6">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 gap-4 rounded-2xl px-4 py-6 transition-colors" 
          onClick={() => {
            document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            localStorage.removeItem('mmm_auth_token');
            window.location.href = '/login';
          }}
        >
          <LogOut size={22} strokeWidth={2} />
          <span className="font-medium">Logout</span>
        </Button>
      </div>
    </div>
  );
}
