import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Sale from '@/models/Sale';
import { notifyAdmins, notifyCustomer } from '@/lib/notifications';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const data = await request.json();
    const { id } = await context.params;
    await connectToDatabase();

    // Get old sale data to detect changes
    const oldSale = await Sale.findById(id).populate('customer');

    const sale = await Sale.findByIdAndUpdate(id, data, { new: true }).populate('customer');
    if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });

    const customer = (sale.customer as any);
    const customerId = (sale.customer as any)?._id?.toString();
    const oldPaymentStatus = oldSale?.paymentStatus;
    const newPaymentStatus = sale.paymentStatus;

    // Notify if payment status changed
    if (oldPaymentStatus !== newPaymentStatus) {
      // Notify admins
      let adminTitle = '💰 Payment Status Updated';
      let adminMessage = `Invoice #${sale.invoiceNumber} payment status changed to ${newPaymentStatus}`;

      if (newPaymentStatus === 'Paid') {
        adminTitle = '✅ Invoice Paid';
        adminMessage = `Invoice #${sale.invoiceNumber} from ${customer?.name || 'Customer'} has been marked as Paid`;
      } else if (newPaymentStatus === 'Partial') {
        adminTitle = '📥 Partial Payment Received';
        adminMessage = `Invoice #${sale.invoiceNumber} from ${customer?.name || 'Customer'}: ₹${data.amountPaid || sale.amountPaid} received (Balance: ₹${sale.balanceAmount})`;
      } else if (newPaymentStatus === 'Overdue') {
        adminTitle = '⚠️ Invoice Overdue';
        adminMessage = `Invoice #${sale.invoiceNumber} from ${customer?.name || 'Customer'} is now overdue`;
      }

      await notifyAdmins({
        title: adminTitle,
        body: adminMessage,
        url: '/dashboard/sales',
      });

      // Notify customer
      if (customerId) {
        let customerTitle = '💰 Payment Status Updated';
        let customerMessage = `Your invoice #${sale.invoiceNumber} payment status is now ${newPaymentStatus}`;

        if (newPaymentStatus === 'Paid') {
          customerTitle = '✅ Invoice Paid';
          customerMessage = `Your invoice #${sale.invoiceNumber} has been marked as Paid. Thank you!`;
        } else if (newPaymentStatus === 'Partial') {
          customerTitle = '📥 Payment Received';
          customerMessage = `We received ₹${data.amountPaid || sale.amountPaid} towards invoice #${sale.invoiceNumber}. Remaining balance: ₹${sale.balanceAmount}`;
        } else if (newPaymentStatus === 'Overdue') {
          customerTitle = '⚠️ Invoice Overdue';
          customerMessage = `Your invoice #${sale.invoiceNumber} is now overdue. Outstanding amount: ₹${sale.balanceAmount}`;
        }

        await notifyCustomer(customerId, {
          title: customerTitle,
          body: customerMessage,
          url: '/portal/bills',
        });
      }
    }

    // Notify if amount/balance changed significantly (payment received)
    const oldBalance = oldSale?.balanceAmount || 0;
    const newBalance = sale.balanceAmount || 0;

    if (oldBalance !== newBalance && oldPaymentStatus === newPaymentStatus) {
      if (customerId) {
        const amountPaid = oldBalance - newBalance;
        await notifyCustomer(customerId, {
          title: '💳 Payment Received',
          body: `We received ₹${amountPaid.toLocaleString('en-IN')} for invoice #${sale.invoiceNumber}. Remaining: ₹${newBalance.toLocaleString('en-IN')}`,
          url: '/portal/bills',
        });
      }
    }

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
