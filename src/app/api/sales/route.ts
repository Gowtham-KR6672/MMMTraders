export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Sale from '@/models/Sale';

export async function GET() {
  try {
    await connectToDatabase();
    const sales = await Sale.find().populate('customer').sort({ createdAt: -1 });
    return NextResponse.json(sales, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    await connectToDatabase();
    const sale = await Sale.create(data);
    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    console.error('Sale creation error:', error);
    return NextResponse.json({ error: error.message || 'Invalid data' }, { status: 400 });
  }
}
