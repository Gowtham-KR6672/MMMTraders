export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Sale from '@/models/Sale';
import Order from '@/models/Order';
import Customer from '@/models/Customer';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function GET(request: Request) {
  try {
    // Read token from cookie OR Authorization header
    const cookieStore = await cookies();
    let token = cookieStore.get('token')?.value;

    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const customerId = decoded.id;

    await connectToDatabase();

    // Fetch customer info, their sales, and orders in parallel
    const [customer, sales, orders] = await Promise.all([
      Customer.findById(customerId).select('name email phone').lean(),
      Sale.find({ customer: customerId }).sort({ date: -1 }).lean(),
      Order.find({ customer: customerId }).sort({ createdAt: -1 }).lean(),
    ]);

    // Aggregate calculations
    const totalInvoices = sales.length;
    const totalAmount = sales.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
    const amountPaid = sales.reduce((sum: number, s: any) => sum + (s.amountPaid || 0), 0);
    const pendingBalance = sales.reduce((sum: number, s: any) => sum + (s.balanceAmount || 0), 0);

    const ordersPlaced = orders.length;
    const ordersDelivered = orders.filter((o: any) => o.status === 'Delivered').length;

    // 3 most recent invoices
    const recentInvoices = sales.slice(0, 3).map((s: any) => ({
      invoiceNumber: s.invoiceNumber,
      productName: s.productName,
      totalAmount: s.totalAmount,
      balanceAmount: s.balanceAmount,
      paymentStatus: s.paymentStatus,
      date: s.date,
    }));

    return NextResponse.json({
      customerName: (customer as any)?.name || decoded.name || 'Customer',
      totalInvoices,
      totalAmount,
      amountPaid,
      pendingBalance,
      ordersPlaced,
      ordersDelivered,
      recentInvoices,
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Portal Stats] Error:', error?.message);
    return NextResponse.json({ error: 'Failed to load stats', detail: error?.message }, { status: 500 });
  }
}
