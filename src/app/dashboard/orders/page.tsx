'use client';

import { useState } from 'react';
import axiosClient from '@/lib/axiosClient';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { ClipboardList, Package, Truck, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import { LoadingSkeleton, ErrorDisplay, TableLoadingSkeleton } from '@/components/LoadingStates';

type OrderStatus = 'Pending' | 'Order Accepted' | 'In Packing' | 'In Transit' | 'Delivered' | 'Rejected';

const ALL_STATUSES: OrderStatus[] = ['Pending', 'Order Accepted', 'In Packing', 'In Transit', 'Delivered', 'Rejected'];

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: React.ElementType; bg: string; text: string; border: string }> = {
  'Pending':        { label: 'Pending Review',  icon: Clock,        bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  'Order Accepted': { label: 'Order Accepted',  icon: CheckCircle2, bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  'In Packing':     { label: 'In Packing',      icon: Package,      bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200' },
  'In Transit':     { label: 'In Transit',      icon: Truck,        bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200' },
  'Delivered':      { label: 'Delivered',        icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Rejected':       { label: 'Rejected',         icon: XCircle,      bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
};

// Next valid statuses for each status (workflow)
const NEXT_STATUSES: Partial<Record<OrderStatus, OrderStatus[]>> = {
  'Pending':        ['Order Accepted', 'Rejected'],
  'Order Accepted': ['In Packing', 'Rejected'],
  'In Packing':     ['In Transit'],
  'In Transit':     ['Delivered'],
};

interface Order {
  _id: string;
  customer: { _id: string; name: string; phone: string };
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [updating, setUpdating] = useState<string | null>(null);

  const { data: fetchedOrders, loading, error, refetch, isRetrying } = useFetch<Order[]>('/api/orders', {
    pollInterval: 30000,
  });

  const orders = fetchedOrders || [];

  const handleStatusChange = async (id: string, newStatus: OrderStatus, currentStatus: OrderStatus) => {
    if (newStatus === currentStatus) return;

    const confirmMsg = newStatus === 'Order Accepted'
      ? `Accepting this order will auto-generate a Sale Invoice for the customer. Proceed?`
      : newStatus === 'Rejected'
      ? `Are you sure you want to reject this order?`
      : null;

    if (confirmMsg && !confirm(confirmMsg)) return;

    setUpdating(id);
    try {
      await axiosClient.put(`/api/orders/${id}`, { status: newStatus });
      toast.success(`Order status updated to "${newStatus}"`);
      await refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update order status');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <ClipboardList size={28} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-800">Incoming Orders</h2>
              <p className="text-sm text-slate-500 mt-1">Review and manage customer orders through the full delivery pipeline</p>
            </div>
          </div>
        </div>
        <TableLoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <ClipboardList size={28} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-800">Incoming Orders</h2>
              <p className="text-sm text-slate-500 mt-1">Review and manage customer orders through the full delivery pipeline</p>
            </div>
          </div>
        </div>
        <ErrorDisplay error={error} onRetry={refetch} />
      </div>
    );
  }

  const filteredOrders = filterStatus === 'All' ? orders : orders.filter((o) => o.status === filterStatus);

  const counts = orders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <ClipboardList size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Incoming Orders</h2>
            <p className="text-sm text-slate-500 mt-1">Review and manage customer orders through the full delivery pipeline</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRetrying}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-purple-600 bg-slate-50 hover:bg-purple-50 border border-slate-100 px-4 py-2 rounded-xl transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Status Filter Pills */}
      <div className="flex gap-2 flex-wrap">
        {['All', ...ALL_STATUSES].map((s) => {
          const isActive = filterStatus === s;
          const cfg = s !== 'All' ? STATUS_CONFIG[s as OrderStatus] : null;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                isActive
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-100'
                  : 'bg-white text-slate-500 border-slate-100 hover:border-purple-200 hover:text-purple-600'
              }`}
            >
              {s === 'All' ? `All (${orders.length})` : `${cfg?.label} ${counts[s] ? `(${counts[s]})` : ''}`}
            </button>
          );
        })}
      </div>

      {/* Desktop Table */}
      <Card className="shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] border-slate-100 rounded-3xl overflow-hidden bg-white/90 backdrop-blur-2xl hidden md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-b-slate-100 hover:bg-transparent">
                <TableHead className="font-semibold text-slate-600 h-12">Date</TableHead>
                <TableHead className="font-semibold text-slate-600 h-12">Customer</TableHead>
                <TableHead className="font-semibold text-slate-600 h-12">Order Details</TableHead>
                <TableHead className="text-right font-semibold text-slate-600 h-12">Amount</TableHead>
                <TableHead className="font-semibold text-slate-600 h-12 text-center w-[180px]">Current Status</TableHead>
                <TableHead className="text-right font-semibold text-slate-600 h-12 w-[200px]">Update Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">No orders found for this filter.</TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order: any) => {
                  const cfg = STATUS_CONFIG[order.status as OrderStatus] || STATUS_CONFIG['Pending'];
                  const StatusIcon = cfg.icon;
                  const nextStatuses = NEXT_STATUSES[order.status as OrderStatus] || [];

                  return (
                    <TableRow key={order._id} className="hover:bg-purple-50/20 transition-colors border-b-slate-100">
                      <TableCell className="text-slate-600 whitespace-nowrap text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                        <div className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-slate-800">{order.customer?.name || 'Unknown'}</span>
                        <div className="text-xs text-slate-500">{order.customer?.phone}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-700">{order.productName}</div>
                        <div className="text-xs text-slate-500 bg-slate-100 inline-block px-2 py-0.5 rounded-md mt-1">
                          {order.quantity} x ₹{order.unitPrice}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-800">
                        ₹{order.totalAmount?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          <StatusIcon size={12} />
                          {cfg.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {nextStatuses.length > 0 ? (
                          <div className="flex justify-end gap-2 flex-wrap">
                            {nextStatuses.map((ns) => {
                              const nCfg = STATUS_CONFIG[ns];
                              const isRejecting = ns === 'Rejected';
                              return (
                                <button
                                  key={ns}
                                  onClick={() => handleStatusChange(order._id, ns, order.status)}
                                  disabled={updating === order._id}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all disabled:opacity-50 ${
                                    isRejecting
                                      ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                      : `${nCfg.bg} ${nCfg.text} ${nCfg.border} hover:opacity-80`
                                  }`}
                                >
                                  {updating === order._id ? (
                                    <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                  ) : (
                                    <nCfg.icon size={11} />
                                  )}
                                  {nCfg.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            {order.status === 'Delivered' ? '✓ Completed' : '✗ Rejected'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)]">
            No orders found for this filter.
          </div>
        ) : (
          filteredOrders.map((order: any) => {
            const cfg = STATUS_CONFIG[order.status as OrderStatus] || STATUS_CONFIG['Pending'];
            const StatusIcon = cfg.icon;
            const nextStatuses = NEXT_STATUSES[order.status as OrderStatus] || [];

            return (
              <Card key={order._id} className="shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] border-slate-100 rounded-3xl bg-white p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-slate-800 text-lg">{order.customer?.name || 'Unknown'}</div>
                    <div className="text-sm text-slate-500">{order.customer?.phone}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{new Date(order.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                    <StatusIcon size={12} />
                    {cfg.label}
                  </span>
                </div>

                <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                  <div>
                    <div className="font-medium text-slate-700">{order.productName}</div>
                    <div className="text-xs text-slate-500 bg-slate-100 inline-block px-2 py-1 rounded-lg mt-1">{order.quantity} x ₹{order.unitPrice}</div>
                  </div>
                  <div className="text-2xl font-black text-purple-600">₹{order.totalAmount?.toLocaleString()}</div>
                </div>

                {nextStatuses.length > 0 && (
                  <div className="flex gap-2 flex-wrap pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-400 font-medium w-full mb-1">Move to:</span>
                    {nextStatuses.map((ns) => {
                      const nCfg = STATUS_CONFIG[ns];
                      const isRejecting = ns === 'Rejected';
                      return (
                        <button
                          key={ns}
                          onClick={() => handleStatusChange(order._id, ns, order.status)}
                          disabled={updating === order._id}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all disabled:opacity-50 ${
                            isRejecting
                              ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                              : `${nCfg.bg} ${nCfg.text} ${nCfg.border} hover:opacity-80`
                          }`}
                        >
                          {updating === order._id ? (
                            <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          ) : (
                            <nCfg.icon size={11} />
                          )}
                          {nCfg.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
