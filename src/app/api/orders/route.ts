export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import { notifyAdmins, notifyCustomer } from '@/lib/notifications';

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

    // Populate customer info for notification
    const populatedOrder = await order.populate('customer');
    const customer = (populatedOrder.customer as any);
    const customerId = (populatedOrder.customer as any)?._id?.toString();

    // Notify admins about new order
    await notifyAdmins({
      title: '📦 New Order Received',
      body: `New order from ${customer?.name || 'Customer'}: ${data.productName} (Qty: ${data.quantity}) - ₹${data.totalAmount.toLocaleString('en-IN')}`,
      url: '/dashboard/orders',
    });

    // Notify customer about their order
    if (customerId) {
      await notifyCustomer(customerId, {
        title: '📦 Order Placed',
        body: `Your order for ${data.productName} (Qty: ${data.quantity}) totaling ₹${data.totalAmount.toLocaleString('en-IN')} has been received.`,
        url: '/portal/orders',
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
