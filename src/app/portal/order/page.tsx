'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ShoppingBag, Clock, Package, Truck, CheckCircle2, XCircle } from 'lucide-react';

type OrderStatus = 'Pending' | 'Order Accepted' | 'In Packing' | 'In Transit' | 'Delivered' | 'Rejected';

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: React.ElementType; bg: string; text: string; border: string }> = {
  'Pending':        { label: 'Pending Review',  icon: Clock,        bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  'Order Accepted': { label: 'Order Accepted',  icon: CheckCircle2, bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  'In Packing':     { label: 'In Packing',      icon: Package,      bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200' },
  'In Transit':     { label: 'In Transit',      icon: Truck,        bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200' },
  'Delivered':      { label: 'Delivered',        icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Rejected':       { label: 'Rejected',         icon: XCircle,      bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
};

// Progress steps shown on the tracker
const PIPELINE_STEPS: OrderStatus[] = ['Pending', 'Order Accepted', 'In Packing', 'In Transit', 'Delivered'];

export default function PlaceOrderPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [myOrders, setMyOrders] = useState<any[]>([]);

  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);

  const fetchData = async () => {
    try {
      const [meRes, productsRes] = await Promise.all([
        axios.get('/api/auth/me'),
        axios.get('/api/products')
      ]);
      const me = meRes.data.user;
      setCustomerInfo(me);
      setProducts(productsRes.data);

      // Fetch this customer's orders
      const ordersRes = await axios.get(`/api/orders?customerId=${me.id}`);
      setMyOrders(ordersRes.data.filter((o: any) => o.customer?._id === me.id));
    } catch (error) {
      toast.error('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo || !customerInfo.id) {
      return toast.error('Authentication error. Please login again.');
    }
    if (!productName || quantity < 1) {
      return toast.error('Please select a valid product and quantity');
    }

    setSubmitting(true);
    try {
      await axios.post('/api/orders', {
        customer: customerInfo.id,
        productName,
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
      });
      toast.success('Order placed! We will review and process it soon.');
      setProductName('');
      setQuantity(1);
      setUnitPrice(0);
      fetchData(); // Refresh orders list
    } catch (error) {
      toast.error('Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const getStepIndex = (status: OrderStatus) => PIPELINE_STEPS.indexOf(status);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <ShoppingBag size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Orders</h2>
            <p className="text-sm text-slate-500 mt-1">Place new orders and track existing ones</p>
          </div>
        </div>
      </div>

      {/* Order Form */}
      <Card className="border-indigo-100 shadow-xl shadow-indigo-100/20 rounded-3xl max-w-2xl">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100/50 rounded-t-3xl">
          <CardTitle className="text-indigo-800">New Order Request</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handlePlaceOrder} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-600 font-medium">Select Product</Label>
              <select
                className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base focus-visible:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                value={productName}
                onChange={e => {
                  const selectedName = e.target.value;
                  setProductName(selectedName);
                  const found: any = products.find((p: any) => p.name === selectedName);
                  if (found) setUnitPrice(found.price);
                }}
                required
              >
                <option value="">-- Choose a product --</option>
                {products.map((p: any) => (
                  <option key={p._id} value={p.name}>{p.name} (₹{p.price}/{p.unit})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-600 font-medium">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  required
                  className="rounded-xl border-slate-200 focus-visible:ring-indigo-500 h-12 text-lg font-semibold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600 font-medium">Estimated Total</Label>
                <div className="h-12 flex items-center px-3 bg-slate-50 border border-slate-100 rounded-xl text-xl font-black text-indigo-600">
                  ₹{(quantity * unitPrice).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl text-lg shadow-lg shadow-indigo-200 transition-all">
                {submitting ? 'Placing Order...' : 'Submit Order Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* My Orders List */}
      {myOrders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-700 px-1">My Orders</h3>
          {myOrders.map((order: any) => {
            const status = order.status as OrderStatus;
            const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Pending'];
            const StatusIcon = cfg.icon;
            const isRejected = status === 'Rejected';
            const currentStepIdx = getStepIndex(status);

            return (
              <Card key={order._id} className="border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] rounded-3xl bg-white overflow-hidden">
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-800 text-lg">{order.productName}</div>
                      <div className="text-sm text-slate-500">{order.quantity} units • ₹{order.totalAmount?.toLocaleString()}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      <StatusIcon size={12} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Pipeline tracker */}
                  {!isRejected && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between relative">
                        {PIPELINE_STEPS.map((step, idx) => {
                          const stepCfg = STATUS_CONFIG[step];
                          const StepIcon = stepCfg.icon;
                          const isDone = currentStepIdx >= idx;
                          const isCurrent = currentStepIdx === idx;

                          return (
                            <div key={step} className="flex-1 flex flex-col items-center relative">
                              {/* Connecting line */}
                              {idx < PIPELINE_STEPS.length - 1 && (
                                <div className={`absolute top-4 left-1/2 w-full h-0.5 ${isDone && currentStepIdx > idx ? 'bg-indigo-500' : 'bg-slate-100'}`} />
                              )}
                              <div className={`w-8 h-8 rounded-full z-10 flex items-center justify-center border-2 transition-all ${
                                isCurrent ? 'bg-indigo-600 border-indigo-600 text-white scale-110 shadow-md shadow-indigo-200' :
                                isDone ? 'bg-indigo-100 border-indigo-300 text-indigo-600' :
                                'bg-slate-100 border-slate-200 text-slate-400'
                              }`}>
                                <StepIcon size={14} />
                              </div>
                              <div className={`text-center mt-1.5 text-[9px] font-semibold leading-tight max-w-[48px] ${isCurrent ? 'text-indigo-600' : isDone ? 'text-slate-600' : 'text-slate-300'}`}>
                                {stepCfg.label}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {isRejected && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium p-3 rounded-xl">
                      ✗ This order was rejected. Please contact us for more details.
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
