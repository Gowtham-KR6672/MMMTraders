import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import Sale from '@/models/Sale';
import { notifyAdmins, notifyCustomer } from '@/lib/notifications';

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

    // Notify customer and admins on status change
    if (order.status !== previousStatus) {
      const customerId = (order.customer as any)?._id?.toString();
      const customerName = (order.customer as any)?.name || 'Customer';

      const statusMessages: Record<string, { customer: string; admin: string }> = {
        'Order Accepted': {
          customer: `Great news! Your order for ${order.productName} has been accepted and is being processed.`,
          admin: `Order for ${customerName} (${order.productName}) has been accepted.`,
        },
        'In Packing': {
          customer: `Your order for ${order.productName} is now being packed and will be ready soon.`,
          admin: `Order for ${customerName} (${order.productName}) is now in packing.`,
        },
        'In Transit': {
          customer: `Your order for ${order.productName} is on the way! It's been dispatched.`,
          admin: `Order for ${customerName} (${order.productName}) is in transit.`,
        },
        'Delivered': {
          customer: `Your order for ${order.productName} has been delivered. An invoice of ₹${order.totalAmount.toLocaleString('en-IN')} will be sent.`,
          admin: `Order for ${customerName} (${order.productName}) has been delivered.`,
        },
        'Rejected': {
          customer: `Unfortunately, your order for ${order.productName} has been rejected. Please contact us for details.`,
          admin: `Order for ${customerName} (${order.productName}) has been rejected.`,
        },
      };

      const messages = statusMessages[order.status as string] || {
        customer: `Your order status is now: ${order.status}`,
        admin: `Order for ${customerName} status changed to: ${order.status}`,
      };

      // Notify customer
      if (customerId) {
        await notifyCustomer(customerId, {
          title: '📦 Order Update',
          body: messages.customer,
          url: '/portal/orders',
        });
      }

      // Notify admins
      await notifyAdmins({
        title: '📦 Order Status Updated',
        body: messages.admin,
        url: '/dashboard/orders',
      });
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
