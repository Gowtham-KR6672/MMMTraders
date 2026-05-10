export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    // Parse query params to optionally filter by customer
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    
    let query = {};
    if (customerId) {
      query = { customer: customerId };
    }
    
    const orders = await Order.find(query).populate('customer').sort({ createdAt: -1 });
    return NextResponse.json(orders, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    await connectToDatabase();
    
    if (!data.customer || !data.productName || !data.quantity || !data.unitPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    data.totalAmount = data.quantity * data.unitPrice;
    data.status = 'Pending';
    
    const order = await Order.create(data);
    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
