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
import { Users, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('/api/customers');
      setCustomers(res.data);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    const interval = setInterval(fetchCustomers, 5000);
    return () => clearInterval(interval);
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setShowForm(true);
  };

  const openEditForm = (customer: any) => {
    setEditingId(customer._id);
    setName(customer.name);
    setPhone(customer.phone);
    setEmail(customer.email || '');
    setPassword(''); // Don't show existing hash, leave blank to not update
    setShowForm(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { name, phone, email };
      if (password) payload.password = password;

      if (editingId) {
        await axios.put(`/api/customers/${editingId}`, payload);
        toast.success('Customer updated successfully');
      } else {
        if (!password) return toast.error('Password is required for new customers');
        await axios.post('/api/customers', payload);
        toast.success('Customer added successfully');
      }
      setShowForm(false);
      fetchCustomers();
    } catch (error) {
      toast.error(editingId ? 'Failed to update customer' : 'Failed to add customer');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/customers/${id}`);
      toast.success('Customer deleted successfully');
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-black/20 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Customers</h2>
            <p className="text-sm text-slate-500 mt-1">Manage your clients and their details</p>
          </div>
        </div>
        <Button onClick={() => showForm ? setShowForm(false) : openAddForm()} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 w-full sm:w-auto shadow-lg shadow-indigo-200 transition-all">
          {showForm ? 'Cancel' : '+ Add Customer'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-indigo-100 shadow-xl shadow-indigo-100/20 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100/50 rounded-t-2xl">
            <CardTitle className="text-indigo-800">{editingId ? 'Edit Customer' : 'Add New Customer'}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-600 font-medium">Full Name</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="John Doe" className="rounded-xl border-slate-100 focus-visible:ring-indigo-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-600 font-medium">Phone Number</Label>
                  <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+91 9876543210" className="rounded-xl border-slate-100 focus-visible:ring-indigo-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-600 font-medium">Email Address</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" className="rounded-xl border-slate-100 focus-visible:ring-indigo-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-600 font-medium">Portal Password {editingId && <span className="text-xs text-slate-400 font-normal">(Leave blank to keep current)</span>}</Label>
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required={!editingId} placeholder="Set secure password" className="rounded-xl border-slate-100 focus-visible:ring-indigo-500" />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8 shadow-md">
                  {editingId ? 'Update Customer' : 'Save Customer'}
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
                  <TableHead className="font-semibold text-slate-600 h-12">Name</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12">Contact</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12">Joined Date</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 h-12 w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                      <div className="flex justify-center items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                        Loading customers...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-slate-500">No customers found.</TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer: any) => (
                    <TableRow key={customer._id} className="hover:bg-indigo-50/30 transition-colors border-b-slate-100">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                            {customer.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-slate-800">{customer.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-slate-700">{customer.phone}</div>
                        <div className="text-sm text-slate-500">{customer.email || 'No email'}</div>
                      </TableCell>
                      <TableCell className="text-slate-600">{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
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
                            <DropdownMenuItem onClick={() => openEditForm(customer)} className="cursor-pointer gap-2 text-slate-600 font-medium">
                              <Edit2 className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(customer._id)} className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 font-medium">
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
            <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            Loading customers...
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)]">No customers found.</div>
        ) : (
          customers.map((customer: any) => (
            <Card key={customer._id} className="shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] border-slate-100 rounded-3xl overflow-hidden bg-white p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                    {customer.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-lg">{customer.name}</div>
                    <div className="text-sm text-slate-500">Joined {new Date(customer.createdAt).toLocaleDateString()}</div>
                  </div>
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
                    <DropdownMenuItem onClick={() => openEditForm(customer)} className="cursor-pointer gap-2 text-slate-600 font-medium">
                      <Edit2 className="h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(customer._id)} className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 font-medium">
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="border-t border-slate-100 pt-4 space-y-1">
                <div className="text-slate-700 font-medium">{customer.phone}</div>
                <div className="text-sm text-slate-500">{customer.email || 'No email provided'}</div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
