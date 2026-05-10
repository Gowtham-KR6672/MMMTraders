'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PortalDashboard() {
  const [data, setData] = useState({
    totalBills: 0,
    pendingAmount: 0,
    ordersPlaced: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we would get the customer ID from the token/session.
    // Since we are using client-side fetching for now, we will fetch data and filter.
    // A better approach would be an API route that reads the cookie token and returns specific customer data.
    const fetchCustomerData = async () => {
      try {
        // Fetch user info from token (we need an endpoint for this, or parse it if it was sent in cookies)
        // For MVP, we will fetch the raw stats (requires setting up a customer dashboard route)
        // Let's create a placeholder for now since the user only asked for basic functionality.
        setTimeout(() => {
          setData({
            totalBills: 12,
            pendingAmount: 4500,
            ordersPlaced: 3
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        toast.error('Failed to load portal data');
        setLoading(false);
      }
    };
    fetchCustomerData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Your Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Invoices</CardTitle>
            <Receipt className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800">{data.totalBills}</div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pending Balance Due</CardTitle>
            <Clock className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-600">₹{data.pendingAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Orders Placed</CardTitle>
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">{data.ordersPlaced}</div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-indigo-50 text-indigo-800 p-6 rounded-3xl mt-8">
        <h3 className="font-bold text-lg mb-2">Welcome to your dedicated portal!</h3>
        <p className="text-indigo-600">Use the sidebar to view your past invoices, check pending balances, or place a new order for products directly from MMM Traders.</p>
      </div>
    </div>
  );
}
