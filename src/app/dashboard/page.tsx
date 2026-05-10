'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, TrendingUp, TrendingDown, ShoppingBag, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useFetch } from '@/hooks/useFetch';
import { LoadingSkeleton, ErrorDisplay } from '@/components/LoadingStates';

interface DashboardData {
  totalSales: number;
  totalIncome: number;
  totalPending: number;
  monthlyAnalytics: Array<{ name: string; Sales: number; Income: number }>;
}

export default function DashboardPage() {
  const { data, loading, error, refetch, isRetrying } = useFetch<DashboardData>('/api/dashboard', {
    pollInterval: 30000, // Poll every 30 seconds instead of 5 seconds
  });

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  const dashData = data || {
    totalSales: 0,
    totalIncome: 0,
    totalPending: 0,
    monthlyAnalytics: []
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Invoiced Sales</CardTitle>
            <ShoppingBag className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800">₹{dashData.totalSales.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Actual Income Collected</CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">₹{dashData.totalIncome.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Pending Payments</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-black text-red-600">₹{dashData.totalPending.toLocaleString('en-IN')}</div>
              {isRetrying && <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 lg:col-span-2 border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] rounded-3xl">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-slate-800">Sales vs Actual Income</CardTitle>
            <button
              onClick={refetch}
              className="text-slate-500 hover:text-slate-700 transition"
              disabled={isRetrying}
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            </button>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dashData.monthlyAnalytics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Legend />
                  <Bar dataKey="Sales" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
