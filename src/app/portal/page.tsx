'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, Clock, CheckCircle, ShoppingBag, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import axiosClient from '@/lib/axiosClient';

interface PortalStats {
  customerName: string;
  totalInvoices: number;
  totalAmount: number;
  amountPaid: number;
  pendingBalance: number;
  ordersPlaced: number;
  ordersDelivered: number;
  recentInvoices: {
    invoiceNumber: string;
    productName: string;
    totalAmount: number;
    balanceAmount: number;
    paymentStatus: string;
    date: string;
  }[];
}

const statusColor: Record<string, string> = {
  Paid: 'bg-emerald-100 text-emerald-700',
  Partial: 'bg-blue-100 text-blue-700',
  Pending: 'bg-amber-100 text-amber-700',
};

export default function PortalDashboard() {
  const [stats, setStats] = useState<PortalStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await axiosClient.get('/api/portal/stats');
      setStats(res.data);
    } catch (error: any) {
      console.error('Portal stats error:', error?.response?.data || error?.message);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-500">
        Could not load dashboard data. Please refresh.
      </div>
    );
  }

  const statCards = [
    { title: 'Total Invoices',    value: stats.totalInvoices,   icon: Receipt,      color: 'text-indigo-600',  bg: 'bg-indigo-50',  format: 'number'   },
    { title: 'Pending Balance',   value: stats.pendingBalance,  icon: Clock,        color: 'text-red-600',     bg: 'bg-red-50',     format: 'currency' },
    { title: 'Total Paid',        value: stats.amountPaid,      icon: CheckCircle,  color: 'text-emerald-600', bg: 'bg-emerald-50', format: 'currency' },
    { title: 'Orders Placed',     value: stats.ordersPlaced,    icon: ShoppingBag,  color: 'text-orange-600',  bg: 'bg-orange-50',  format: 'number'   },
    { title: 'Total Invoiced',    value: stats.totalAmount,     icon: TrendingUp,   color: 'text-violet-600',  bg: 'bg-violet-50',  format: 'currency' },
    { title: 'Delivered Orders',  value: stats.ordersDelivered, icon: CheckCircle,  color: 'text-teal-600',    bg: 'bg-teal-50',    format: 'number'   },
  ];

  return (
    <div className="space-y-6">

      {/* Welcome header */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-6 rounded-3xl shadow-[0_20px_40px_-10px_rgba(99,102,241,0.4)]">
        <p className="text-indigo-200 text-sm font-medium">Welcome back,</p>
        <h2 className="text-2xl font-black tracking-tight mt-1">{stats.customerName}</h2>
        <p className="text-indigo-300 text-sm mt-2">Here's your account overview with MMM Traders</p>
        {stats.pendingBalance > 0 && (
          <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-2xl px-4 py-3">
            <AlertCircle size={16} className="text-amber-300 flex-shrink-0" />
            <span className="text-sm text-amber-100">
              Outstanding balance:{' '}
              <span className="font-black text-white">
                ₹{stats.pendingBalance.toLocaleString('en-IN')}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border-slate-100 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.06)] rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                <CardTitle className="text-xs font-semibold text-slate-500">{card.title}</CardTitle>
                <div className={`p-1.5 rounded-lg ${card.bg}`}>
                  <Icon size={14} className={card.color} />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className={`text-2xl font-black ${card.color}`}>
                  {card.format === 'currency'
                    ? `₹${card.value.toLocaleString('en-IN')}`
                    : card.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent invoices */}
      {stats.recentInvoices.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50">
            <h3 className="font-bold text-slate-800">Recent Invoices</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {stats.recentInvoices.map((inv) => (
              <div key={inv.invoiceNumber} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{inv.invoiceNumber}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {inv.productName} · {new Date(inv.date).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-slate-800 text-sm">
                    ₹{inv.totalAmount.toLocaleString('en-IN')}
                  </p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[inv.paymentStatus] || 'bg-slate-100 text-slate-600'}`}>
                    {inv.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
