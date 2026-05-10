import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Sale from '@/models/Sale';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const data = await request.json();
    const { id } = await context.params;
    await connectToDatabase();
    
    const sale = await Sale.findByIdAndUpdate(id, data, { new: true });
    if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    
    return NextResponse.json(sale, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await connectToDatabase();
    const sale = await Sale.findByIdAndDelete(id);
    if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    
    return NextResponse.json({ message: 'Sale deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
