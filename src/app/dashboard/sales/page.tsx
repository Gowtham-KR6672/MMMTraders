'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { ShoppingCart, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [customer, setCustomer] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [gstTax, setGstTax] = useState(0);
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  const fetchData = async () => {
    try {
      const [salesRes, customersRes, productsRes] = await Promise.all([
        axios.get('/api/sales'),
        axios.get('/api/customers'),
        axios.get('/api/products')
      ]);
      setSales(salesRes.data);
      setCustomers(customersRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setCustomer('');
    setProductName('');
    setQuantity(1);
    setUnitPrice(0);
    setGstTax(0);
    setAmountPaid('');
    setPaymentMethod('');
    setPaymentStatus('Paid');
    
    // Auto-generate Invoice Number based on today's date
    // Format: MMM + DDMMYYYY + 001
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const dateStr = `${dd}${mm}${yyyy}`;
    const prefix = `MMM${dateStr}`;
    
    // Find highest sequence for today
    const todaysSales = sales.filter((s: any) => s.invoiceNumber && s.invoiceNumber.startsWith(prefix));
    let maxSeq = 0;
    todaysSales.forEach((s: any) => {
      const seqStr = s.invoiceNumber.slice(-3);
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    });
    
    const nextSeq = String(maxSeq + 1).padStart(3, '0');
    setInvoiceNumber(`${prefix}${nextSeq}`);
    
    setShowForm(true);
  };

  const openEditForm = (sale: any) => {
    setEditingId(sale._id);
    setCustomer(sale.customer?._id || '');
    setProductName(sale.productName);
    setQuantity(sale.quantity);
    setUnitPrice(sale.unitPrice);
    setGstTax(sale.gstTax || 0);
    setAmountPaid(sale.amountPaid);
    setPaymentMethod(sale.paymentMethod);
    setPaymentStatus(sale.paymentStatus);
    setInvoiceNumber(sale.invoiceNumber);
    setShowForm(true);
  };

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return toast.error('Please select a customer');

    const totalAmount = (quantity * unitPrice) + Number(gstTax);
    
    let finalAmountPaid = Number(amountPaid);
    if (amountPaid === '') {
      if (paymentStatus === 'Paid') finalAmountPaid = totalAmount;
      else if (paymentStatus === 'Pending' || paymentStatus === 'Overdue') finalAmountPaid = 0;
    }
    
    const balanceAmount = totalAmount - finalAmountPaid;
    
    const payload = {
      customer, productName, quantity: Number(quantity), unitPrice: Number(unitPrice), 
      totalAmount, gstTax: Number(gstTax), amountPaid: finalAmountPaid, balanceAmount,
      paymentMethod, paymentStatus, invoiceNumber 
    };

    try {
      if (editingId) {
        await axios.put(`/api/sales/${editingId}`, payload);
        toast.success('Sale updated successfully');
      } else {
        await axios.post('/api/sales', payload);
        toast.success('Sale added successfully');
      }
      setShowForm(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || (editingId ? 'Failed to update sale' : 'Failed to add sale'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sale?')) return;
    try {
      await axios.delete(`/api/sales/${id}`);
      toast.success('Sale deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete sale');
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Paid') return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
    if (status === 'Partial') return 'bg-orange-50 text-orange-600 border-blue-200';
    if (status === 'Pending') return 'bg-amber-500/10 text-amber-600 border-amber-200';
    return 'bg-red-500/10 text-red-600 border-red-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-black/20 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <ShoppingCart size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Sales Record</h2>
            <p className="text-sm text-slate-500 mt-1">Manage invoices and tracking</p>
          </div>
        </div>
        <Button onClick={() => showForm ? setShowForm(false) : openAddForm()} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6 w-full sm:w-auto shadow-lg shadow-blue-200 transition-all">
          {showForm ? 'Cancel' : '+ New Sale'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-orange-100 shadow-xl shadow-orange-100/40 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b border-orange-100 rounded-t-2xl">
            <CardTitle className="text-orange-800">{editingId ? 'Edit Invoice' : 'Create Invoice'}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSaveSale} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-600 font-medium">Customer</Label>
                  <select 
                    className="flex h-10 w-full rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 transition-shadow"
                    value={customer} 
                    onChange={e => setCustomer(e.target.value)} 
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map((c: any) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-medium">Invoice Number (Auto-Generated)</Label>
                  <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} required placeholder="MMM10052026001" className="rounded-xl border-slate-100 focus-visible:ring-orange-500 font-mono text-sm bg-slate-50 text-slate-500" readOnly />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-medium">Product</Label>
                  <select 
                    className="flex h-10 w-full rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 transition-shadow"
                    value={productName} 
                    onChange={e => {
                      const selectedName = e.target.value;
                      setProductName(selectedName);
                      // Auto-fill price if found
                      const foundProduct = products.find((p: any) => p.name === selectedName);
                      if (foundProduct) {
                        setUnitPrice(foundProduct.price);
                      }
                    }} 
                    required
                  >
                    <option value="">Select Product</option>
                    {products.map((p: any) => (
                      <option key={p._id} value={p.name}>{p.name} (₹{p.price}/{p.unit})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-medium">Quantity</Label>
                  <Input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value as any)} required className="rounded-xl border-slate-100 focus-visible:ring-orange-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-medium">Unit Price (₹)</Label>
                  <Input type="number" min="0" step="0.01" value={unitPrice} onChange={e => setUnitPrice(e.target.value as any)} required className="rounded-xl border-slate-100 focus-visible:ring-orange-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-medium">GST/Tax (₹)</Label>
                  <Input type="number" min="0" step="0.01" value={gstTax} onChange={e => setGstTax(e.target.value as any)} className="rounded-xl border-slate-100 focus-visible:ring-orange-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-medium">Payment Method</Label>
                  <select 
                    className="flex h-10 w-full rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 transition-shadow"
                    value={paymentMethod} 
                    onChange={e => setPaymentMethod(e.target.value)} 
                    required
                  >
                    <option value="">Select Method</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-medium">Payment Status</Label>
                  <select 
                    className="flex h-10 w-full rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 transition-shadow"
                    value={paymentStatus} 
                    onChange={e => setPaymentStatus(e.target.value)} 
                  >
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
                {paymentStatus === 'Partial' && (
                  <div className="space-y-2 lg:col-span-4 max-w-sm">
                    <Label className="text-slate-600 font-medium">Amount Paid (₹)</Label>
                    <Input type="number" min="0" step="0.01" value={amountPaid} onChange={e => setAmountPaid(e.target.value as any)} required className="rounded-xl border-slate-100 focus-visible:ring-orange-500" />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-center p-6 bg-slate-50/80 rounded-xl border border-slate-100 gap-4 mt-8">
                {paymentStatus === 'Partial' ? (
                   <div className="w-full sm:w-auto text-left">
                     <p className="text-sm text-slate-500 font-medium">Remaining Balance</p>
                     <p className="text-2xl font-bold text-red-600">
                       ₹{Math.max(0, ((quantity * unitPrice) + Number(gstTax)) - Number(amountPaid || 0)).toLocaleString()}
                     </p>
                   </div>
                ) : <div />}
                <div className="w-full sm:w-auto text-left sm:text-right">
                  <p className="text-sm text-slate-500 font-medium">Total Amount</p>
                  <p className="text-3xl font-black text-orange-600 tracking-tight">
                    ₹{((quantity * unitPrice) + Number(gstTax)).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600 rounded-xl px-8 shadow-md w-full sm:w-auto">
                  {editingId ? 'Update Sale' : 'Complete Sale'}
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
                  <TableHead className="font-semibold text-slate-600 h-12">Date</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12">Customer</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12">Product</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12">Status</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 h-12">Total / Balance</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 h-12 w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      <div className="flex justify-center items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                        Loading sales data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">No sales recorded yet.</TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale: any) => (
                    <TableRow key={sale._id} className="hover:bg-orange-50 transition-colors border-b-slate-100">
                      <TableCell className="font-medium text-orange-600">{sale.invoiceNumber}</TableCell>
                      <TableCell className="text-slate-600">{new Date(sale.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className="font-medium text-slate-800">{sale.customer?.name || 'Unknown'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-700">{sale.productName}</div>
                        <div className="text-xs text-slate-500 bg-slate-100 inline-block px-2 py-0.5 rounded-md mt-1">{sale.quantity} x ₹{sale.unitPrice}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`border ${getStatusColor(sale.paymentStatus)} bg-transparent shadow-black/20 rounded-full px-3 py-0.5`}>
                          {sale.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-bold text-slate-800 text-lg">₹{sale.totalAmount?.toLocaleString() || 0}</div>
                        {(sale.paymentStatus === 'Partial' || sale.paymentStatus === 'Pending' || sale.paymentStatus === 'Overdue') && (
                          <div className="text-xs text-red-600 font-semibold mt-0.5">
                            Bal: ₹{sale.balanceAmount?.toLocaleString() || sale.totalAmount?.toLocaleString() || 0}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          {/* @ts-expect-error Radix UI type mismatch */}
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-slate-100">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4 text-slate-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-slate-100">
                            <DropdownMenuItem onClick={() => openEditForm(sale)} className="cursor-pointer gap-2 text-slate-600 font-medium">
                              <Edit2 className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(sale._id)} className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 font-medium">
                              <Trash2 className="h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
            <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
            Loading sales data...
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)]">No sales recorded yet.</div>
        ) : (
          sales.map((sale: any) => (
            <Card key={sale._id} className="shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] border-slate-100 rounded-3xl overflow-hidden bg-white p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-slate-800 text-lg">{sale.customer?.name || 'Unknown'}</div>
                  <div className="text-sm text-slate-500">{sale.invoiceNumber} • {new Date(sale.date).toLocaleDateString()}</div>
                </div>
                <DropdownMenu>
                  {/* @ts-expect-error Radix UI type mismatch */}
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 bg-slate-50/80">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4 text-slate-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-slate-100">
                    <DropdownMenuItem onClick={() => openEditForm(sale)} className="cursor-pointer gap-2 text-slate-600 font-medium">
                      <Edit2 className="h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(sale._id)} className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 font-medium">
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                <div>
                  <div className="font-medium text-slate-700">{sale.productName}</div>
                  <div className="text-xs text-slate-500 bg-slate-100 inline-block px-2 py-1 rounded-lg mt-1">{sale.quantity} x ₹{sale.unitPrice}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-orange-600 text-xl">₹{sale.totalAmount?.toLocaleString() || 0}</div>
                  <Badge className={`mt-1 border ${getStatusColor(sale.paymentStatus)} bg-transparent shadow-black/20 rounded-full px-3 py-0.5`}>
                    {sale.paymentStatus}
                  </Badge>
                </div>
              </div>
              {(sale.paymentStatus === 'Partial' || sale.paymentStatus === 'Pending' || sale.paymentStatus === 'Overdue') && (
                <div className="bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-xl flex justify-between">
                  <span>Balance Due</span>
                  <span>₹{sale.balanceAmount?.toLocaleString() || sale.totalAmount?.toLocaleString() || 0}</span>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
