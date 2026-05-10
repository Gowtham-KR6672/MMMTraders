'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { IndianRupee, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';

export default function IncomePage() {
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const fetchIncome = async () => {
    try {
      const res = await axios.get('/api/income');
      setIncome(res.data);
    } catch (error) {
      toast.error('Failed to fetch income records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncome();
    const interval = setInterval(fetchIncome, 5000);
    return () => clearInterval(interval);
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setSource('');
    setAmount('');
    setNotes('');
    setShowForm(true);
  };

  const openEditForm = (item: any) => {
    setEditingId(item._id);
    setSource(item.source);
    setAmount(item.amount);
    setNotes(item.notes || '');
    setShowForm(true);
  };

  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/income/${editingId}`, { source, amount: Number(amount), notes });
        toast.success('Income updated successfully');
      } else {
        await axios.post('/api/income', { source, amount: Number(amount), notes });
        toast.success('Income recorded successfully');
      }
      setShowForm(false);
      fetchIncome();
    } catch (error) {
      toast.error(editingId ? 'Failed to update income record' : 'Failed to add income record');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await axios.delete(`/api/income/${id}`);
      toast.success('Record deleted successfully');
      fetchIncome();
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-black/20 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <IndianRupee size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Income</h2>
            <p className="text-sm text-slate-500 mt-1">Track your non-sales revenue sources</p>
          </div>
        </div>
        <Button onClick={() => showForm ? setShowForm(false) : openAddForm()} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 w-full sm:w-auto shadow-lg shadow-emerald-200 transition-all">
          {showForm ? 'Cancel' : '+ Add Income'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-emerald-100 shadow-xl shadow-emerald-100/20 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100/50 rounded-t-2xl">
            <CardTitle className="text-emerald-800">{editingId ? 'Edit Income Record' : 'Record New Income'}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSaveIncome} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-600 font-medium">Source / Category</Label>
                  <Input value={source} onChange={e => setSource(e.target.value)} required placeholder="e.g. Investment Return" className="rounded-xl border-slate-100 focus-visible:ring-emerald-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-medium">Amount (₹)</Label>
                  <Input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="10000" className="rounded-xl border-slate-100 focus-visible:ring-emerald-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-medium">Notes (Optional)</Label>
                  <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional details..." className="rounded-xl border-slate-100 focus-visible:ring-emerald-500" />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-8 shadow-md">
                  {editingId ? 'Update Record' : 'Save Record'}
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
                  <TableHead className="font-semibold text-slate-600 h-12">Date</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12">Source</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12">Notes</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 h-12">Amount</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 h-12 w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                      <div className="flex justify-center items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                        Loading records...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : income.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">No income records found.</TableCell>
                  </TableRow>
                ) : (
                  income.map((item: any) => (
                    <TableRow key={item._id} className="hover:bg-emerald-50/30 transition-colors border-b-slate-100">
                      <TableCell className="text-slate-600">{new Date(item.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`font-medium px-3 py-1 rounded-full ${item.isSale ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {item.source}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-500">{item.notes || '-'}</TableCell>
                      <TableCell className="text-right font-bold text-emerald-600 text-lg">
                        +₹{item.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.isSale ? (
                          <span className="text-xs font-medium text-slate-400">Auto-Synced</span>
                        ) : (
                          <DropdownMenu>
                            {/* @ts-expect-error Radix UI type mismatch */}
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-slate-100">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4 text-slate-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-slate-100">
                              <DropdownMenuItem onClick={() => openEditForm(item)} className="cursor-pointer gap-2 text-slate-600 font-medium">
                                <Edit2 className="h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(item._id)} className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 font-medium">
                                <Trash2 className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
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
            <div className="w-4 h-4 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
            Loading records...
          </div>
        ) : income.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)]">No income records found.</div>
        ) : (
          income.map((item: any) => (
            <Card key={item._id} className="shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] border-slate-100 rounded-3xl overflow-hidden bg-white p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className={`font-bold text-lg px-3 py-1 rounded-full inline-block mb-2 ${item.isSale ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {item.source}
                  </div>
                  <div className="text-sm text-slate-500">{new Date(item.date || item.createdAt).toLocaleDateString()}</div>
                </div>
                {item.isSale ? (
                  <span className="text-xs font-medium text-slate-400 mt-2 block">Auto-Synced</span>
                ) : (
                  <DropdownMenu>
                    {/* @ts-expect-error Radix UI type mismatch */}
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 bg-slate-50/80">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4 text-slate-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-slate-100">
                      <DropdownMenuItem onClick={() => openEditForm(item)} className="cursor-pointer gap-2 text-slate-600 font-medium">
                        <Edit2 className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(item._id)} className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 font-medium">
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                <div>
                  <div className="text-xs text-slate-500 mt-1 max-w-[200px] truncate">{item.notes || 'No notes'}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-emerald-600 text-xl">+₹{item.amount.toLocaleString()}</div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
