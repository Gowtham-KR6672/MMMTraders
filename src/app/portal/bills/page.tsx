'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerBillsPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyBills = async () => {
    try {
      const meRes = await axios.get('/api/auth/me');
      const customerId = meRes.data.user.id;
      const salesRes = await axios.get(`/api/sales?customerId=${customerId}`);
      const mySales = salesRes.data.filter((s: any) => s.customer && s.customer._id === customerId);
      setSales(mySales);
    } catch (error) {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBills();
    const interval = setInterval(fetchMyBills, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    if (status === 'Paid') return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
    if (status === 'Partial') return 'bg-blue-500/10 text-blue-600 border-blue-200';
    if (status === 'Pending') return 'bg-amber-500/10 text-amber-600 border-amber-200';
    return 'bg-red-500/10 text-red-600 border-red-200';
  };

  const downloadInvoice = (invoiceNumber: string) => {
    // Placeholder for actual PDF generation logic
    toast.success(`Downloading invoice ${invoiceNumber}...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">My Bills & Invoices</h2>
            <p className="text-sm text-slate-500 mt-1">View your purchase history and pending balances</p>
          </div>
        </div>
      </div>

      <Card className="shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] border-slate-100 rounded-3xl overflow-hidden bg-white/90 backdrop-blur-2xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-b-slate-100 hover:bg-transparent">
                <TableHead className="font-semibold text-slate-600 h-12">Invoice No</TableHead>
                <TableHead className="font-semibold text-slate-600 h-12">Date</TableHead>
                <TableHead className="font-semibold text-slate-600 h-12">Product</TableHead>
                <TableHead className="font-semibold text-slate-600 h-12">Status</TableHead>
                <TableHead className="text-right font-semibold text-slate-600 h-12">Total Amount</TableHead>
                <TableHead className="text-right font-semibold text-slate-600 h-12">Balance Due</TableHead>
                <TableHead className="text-right font-semibold text-slate-600 h-12 w-[120px]">Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                      Loading bills...
                    </div>
                  </TableCell>
                </TableRow>
              ) : sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">No bills found.</TableCell>
                </TableRow>
              ) : (
                sales.map((sale: any) => (
                  <TableRow key={sale._id} className="hover:bg-indigo-50/30 transition-colors border-b-slate-100">
                    <TableCell className="font-medium text-slate-800">{sale.invoiceNumber}</TableCell>
                    <TableCell className="text-slate-600">{new Date(sale.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-700">{sale.productName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{sale.quantity} x ₹{sale.unitPrice}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`border ${getStatusColor(sale.paymentStatus)} bg-transparent shadow-none rounded-full px-3 py-0.5`}>
                        {sale.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-800">
                      ₹{sale.totalAmount?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {sale.balanceAmount > 0 ? (
                        <span className="font-bold text-red-600">₹{sale.balanceAmount.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-400 font-medium">₹0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => downloadInvoice(sale.invoiceNumber)}
                        className="rounded-xl border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        <Download size={16} className="mr-1" /> PDF
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
  );
}
