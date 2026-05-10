import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Income from '@/models/Income';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const data = await request.json();
    const { id } = await context.params;
    await connectToDatabase();
    
    const income = await Income.findByIdAndUpdate(id, data, { new: true });
    if (!income) return NextResponse.json({ error: 'Income not found' }, { status: 404 });
    
    return NextResponse.json(income, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await connectToDatabase();
    const income = await Income.findByIdAndDelete(id);
    if (!income) return NextResponse.json({ error: 'Income not found' }, { status: 404 });
    
    return NextResponse.json({ message: 'Income deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
