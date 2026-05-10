import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import Sale from '@/models/Sale';
import PushSubscription from '@/models/PushSubscription';
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_EMAIL = process.env.VAPID_EMAIL!;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_EMAIL) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const data = await request.json();
    const { id } = await context.params;
    await connectToDatabase();
    
    const order = await Order.findById(id).populate('customer');
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    
    const previousStatus = order.status;
    order.status = data.status || order.status;
    await order.save();
    
    // When order is marked as Delivered, automatically create a Sale Invoice
    // Guard: only create once (when transitioning INTO Delivered, not already there)
    if (order.status === 'Delivered' && previousStatus !== 'Delivered') {
      // Check if a sale already exists for this order to prevent duplicates
      const existingSale = await Sale.findOne({ sourceOrderId: order._id });
      if (!existingSale) {
        // Auto-generate invoice number based on today's date
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const prefix = `MMM${dd}${mm}${yyyy}`;
        
        const todaysSales = await Sale.find({ invoiceNumber: new RegExp(`^${prefix}`) });
        let maxSeq = 0;
        todaysSales.forEach((s: any) => {
          const seq = parseInt(s.invoiceNumber.slice(-3), 10);
          if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
        });
        const invoiceNumber = `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
        
        // Create Sale with Pending payment status so it appears in Pending Payments
        await Sale.create({
          customer: (order.customer as any)._id,
          productName: order.productName,
          quantity: order.quantity,
          unitPrice: order.unitPrice,
          gstTax: 0,
          totalAmount: order.totalAmount,
          amountPaid: 0,
          balanceAmount: order.totalAmount,
          paymentStatus: 'Pending',
          invoiceNumber,
          sourceOrderId: order._id
        });
      }
    }

    // ── Push notification to customer on every status change ──────────────────
    if (order.status !== previousStatus) {
      try {
        const customerId = (order.customer as any)?._id?.toString();
        const customerName = (order.customer as any)?.name || 'Customer';
        const statusMessages: Record<string, string> = {
          'Order Accepted': `Great news! Your order for ${order.productName} has been accepted and is being processed.`,
          'In Packing':     `Your order for ${order.productName} is now being packed and will be ready soon.`,
          'In Transit':     `Your order for ${order.productName} is on the way! It's been dispatched.`,
          'Delivered':      `Your order for ${order.productName} has been delivered. An invoice of ₹${order.totalAmount.toLocaleString('en-IN')} will be sent.`,
          'Rejected':       `Unfortunately, your order for ${order.productName} has been rejected. Please contact us for details.`,
        };

        const body = statusMessages[order.status as string] || `Your order status is now: ${order.status}`;
        const customerSubs = await PushSubscription.find({ userId: customerId, role: 'customer' });
        
        for (const sub of customerSubs) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              JSON.stringify({
                title: `📦 Order Update - MMM Traders`,
                body,
                icon: '/logo.png',
                badge: '/logo.png',
                url: '/portal/order',
              })
            );
          } catch (e: any) {
            // Clean up expired subscriptions
            if (e?.statusCode === 410 || e?.statusCode === 404) {
              await PushSubscription.deleteOne({ endpoint: sub.endpoint });
            }
          }
        }
      } catch (notifErr) {
        // Non-fatal - don't fail the main request
        console.error('[Push] Failed to notify customer:', notifErr);
      }
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
