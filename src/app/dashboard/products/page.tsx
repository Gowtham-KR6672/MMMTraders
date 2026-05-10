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
import { Package, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [description, setDescription] = useState('');

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/products');
      setProducts(res.data);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setUnit('kg');
    setDescription('');
    setShowForm(true);
  };

  const openEditForm = (item: any) => {
    setEditingId(item._id);
    setName(item.name);
    setPrice(item.price);
    setUnit(item.unit || 'kg');
    setDescription(item.description || '');
    setShowForm(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/products/${editingId}`, { name, price: Number(price), unit, description });
        toast.success('Product updated successfully');
      } else {
        await axios.post('/api/products', { name, price: Number(price), unit, description });
        toast.success('Product added successfully');
      }
      setShowForm(false);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || (editingId ? 'Failed to update product' : 'Failed to add product'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`/api/products/${id}`);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <Package size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Products List</h2>
            <p className="text-sm text-slate-500 mt-1">Manage predefined inventory items and standard prices</p>
          </div>
        </div>
        <Button onClick={() => showForm ? setShowForm(false) : openAddForm()} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6 w-full sm:w-auto shadow-lg shadow-orange-100/40 transition-all">
          {showForm ? 'Cancel' : '+ Add Product'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-orange-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b border-orange-100 rounded-t-2xl">
            <CardTitle className="text-orange-800">{editingId ? 'Edit Product' : 'Create New Product'}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2 lg:col-span-2">
                  <Label className="text-slate-600 font-medium">Product Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Chicken (Whole)" className="rounded-xl border-slate-100 focus-visible:ring-orange-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-medium">Standard Price (₹)</Label>
                  <Input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required placeholder="240" className="rounded-xl border-slate-100 focus-visible:ring-orange-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-medium">Unit</Label>
                  <select 
                    className="flex h-10 w-full rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 transition-shadow"
                    value={unit} 
                    onChange={e => setUnit(e.target.value)} 
                    required
                  >
                    <option value="kg">kg</option>
                    <option value="grams">grams</option>
                    <option value="pieces">pieces</option>
                    <option value="boxes">boxes</option>
                    <option value="liters">liters</option>
                  </select>
                </div>
                <div className="space-y-2 lg:col-span-4">
                  <Label className="text-slate-600 font-medium">Description (Optional)</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Any specific details..." className="rounded-xl border-slate-100 focus-visible:ring-orange-500" />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600 rounded-xl px-8 shadow-md">
                  {editingId ? 'Update Product' : 'Save Product'}
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
                  <TableHead className="font-semibold text-slate-600 h-12">Product Name</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12">Description</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12">Unit</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 h-12">Price</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 h-12 w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                      <div className="flex justify-center items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                        Loading products...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">No products added yet.</TableCell>
                  </TableRow>
                ) : (
                  products.map((item: any) => (
                    <TableRow key={item._id} className="hover:bg-slate-50 transition-colors border-b-slate-100">
                      <TableCell>
                        <span className="font-medium text-slate-800">{item.name}</span>
                      </TableCell>
                      <TableCell className="text-slate-500 max-w-[200px] truncate">{item.description || '-'}</TableCell>
                      <TableCell>
                        <span className="text-slate-600 bg-slate-100 px-3 py-1 rounded-full text-sm font-medium">{item.unit}</span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-orange-600 text-lg">
                        ₹{item.price.toLocaleString()}
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
                            <DropdownMenuItem onClick={() => openEditForm(item)} className="cursor-pointer gap-2 text-slate-600 font-medium">
                              <Edit2 className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(item._id)} className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 font-medium">
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
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)]">No products added yet.</div>
        ) : (
          products.map((item: any) => (
            <Card key={item._id} className="shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] border-slate-100 rounded-3xl overflow-hidden bg-white p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-slate-800 text-lg mb-1">{item.name}</div>
                  <div className="text-slate-600 bg-slate-100 px-3 py-1 rounded-full text-xs font-medium inline-block">{item.unit}</div>
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
                    <DropdownMenuItem onClick={() => openEditForm(item)} className="cursor-pointer gap-2 text-slate-600 font-medium">
                      <Edit2 className="h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(item._id)} className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 font-medium">
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                <div>
                  <div className="text-xs text-slate-500 max-w-[150px] truncate">{item.description || '-'}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-orange-600 text-xl">₹{item.price.toLocaleString()}</div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
