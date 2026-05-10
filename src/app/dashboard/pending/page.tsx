'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PendingPage() {
  const [pendingSales, setPendingSales] = useState([]);
  const [loading, setLoading] = useState(true);

  // Update Payment Modal State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [newPayment, setNewPayment] = useState('');

  const fetchPending = async () => {
    try {
      // We can reuse the sales API and just filter it on the frontend,
      // or we can create a dedicated route. For simplicity, we filter here since we already have the endpoint.
      const res = await axios.get('/api/sales');
      const pending = res.data.filter((sale: any) => sale.balanceAmount > 0);
      setPendingSales(pending);
    } catch (error) {
      toast.error('Failed to fetch pending payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenUpdate = (sale: any) => {
    setSelectedSale(sale);
    setNewPayment('');
    setShowUpdateModal(true);
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;

    const addedAmount = Number(newPayment);
    if (addedAmount <= 0) return toast.error('Enter a valid amount');
    if (addedAmount > selectedSale.balanceAmount) return toast.error('Amount exceeds pending balance');

    const updatedAmountPaid = selectedSale.amountPaid + addedAmount;
    const updatedBalanceAmount = selectedSale.totalAmount - updatedAmountPaid;
    const updatedStatus = updatedBalanceAmount <= 0 ? 'Paid' : 'Partial';

    try {
      await axios.put(`/api/sales/${selectedSale._id}`, {
        amountPaid: updatedAmountPaid,
        balanceAmount: updatedBalanceAmount,
        paymentStatus: updatedStatus
      });
      toast.success('Payment updated successfully');
      setShowUpdateModal(false);
      fetchPending();
    } catch (error) {
      toast.error('Failed to update payment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertCircle size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Pending Payments</h2>
            <p className="text-sm text-slate-500 mt-1">Track outstanding balances owed by customers</p>
          </div>
        </div>
      </div>

      {showUpdateModal && selectedSale && (
        <Card className="border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader className="bg-gradient-to-r from-red-50 to-white border-b border-red-100/50 rounded-t-2xl">
            <CardTitle className="text-red-800">Update Payment - Invoice {selectedSale.invoiceNumber}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleUpdatePayment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl mb-4">
                <div>
                  <div className="text-sm text-slate-500">Customer</div>
                  <div className="font-semibold text-slate-800">{selectedSale.customer?.name}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Pending Balance</div>
                  <div className="font-bold text-red-600 text-xl">₹{selectedSale.balanceAmount.toLocaleString()}</div>
                </div>
              </div>
              <div className="space-y-2 max-w-sm">
                <Label className="text-slate-600 font-medium">New Amount Received (₹)</Label>
                <Input 
                  type="number" 
                  min="1" 
                  max={selectedSale.balanceAmount}
                  step="0.01" 
                  value={newPayment} 
                  onChange={e => setNewPayment(e.target.value)} 
                  required 
                  placeholder="Enter amount" 
                  className="rounded-xl border-slate-200 focus-visible:ring-red-500 text-lg py-6 font-semibold" 
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 rounded-xl px-8 shadow-md">
                  Confirm Payment
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowUpdateModal(false)} className="rounded-xl px-8">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Desktop View */}
      <div className="hidden md:block">
        <Card className="shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] border-slate-100 rounded-3xl overflow-hidden bg-white/90 backdrop-blur-2xl">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-b-slate-100 hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-600 h-12">Invoice</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12">Customer</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12">Status</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 h-12">Total Amount</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 h-12">Amount Paid</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 h-12 text-red-600">Pending Balance</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 h-12 w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      <div className="flex justify-center items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
                        Loading pending records...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : pendingSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">No pending payments! All clear.</TableCell>
                  </TableRow>
                ) : (
                  pendingSales.map((item: any) => (
                    <TableRow key={item._id} className="hover:bg-red-50/30 transition-colors border-b-slate-100">
                      <TableCell className="font-medium text-slate-600">{item.invoiceNumber}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-slate-800">{item.customer?.name || 'Unknown'}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.paymentStatus === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {item.paymentStatus}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-slate-600 font-medium">
                        ₹{item.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">
                        ₹{item.amountPaid.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600 text-lg">
                        ₹{item.balanceAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenUpdate(item)}
                          className="rounded-full border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                        >
                          Update
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="flex justify-center items-center gap-2 py-12 text-slate-500">
            <div className="w-4 h-4 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
            Loading pending records...
          </div>
        ) : pendingSales.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)]">No pending payments! All clear.</div>
        ) : (
          pendingSales.map((item: any) => (
            <Card key={item._id} className="shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] border-slate-100 rounded-3xl overflow-hidden bg-white p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-slate-800 text-lg mb-1">{item.customer?.name || 'Unknown'}</div>
                  <div className="text-xs font-medium text-slate-500">INV: {item.invoiceNumber}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.paymentStatus === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {item.paymentStatus}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <div className="text-xs text-slate-500">Total / Paid</div>
                  <div className="font-medium text-slate-700">₹{item.totalAmount} / <span className="text-emerald-600">₹{item.amountPaid}</span></div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 mb-1">Remaining Balance</div>
                  <div className="font-black text-red-600 text-xl">₹{item.balanceAmount.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleOpenUpdate(item)}
                  className="w-full rounded-xl border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                >
                  Log Received Payment
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
