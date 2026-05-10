export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Sale from '@/models/Sale';
import { notifyAdmins, notifyCustomer } from '@/lib/notifications';

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

    // Populate customer info for notification
    const populatedSale = await sale.populate('customer');
    const customer = (populatedSale.customer as any);
    const customerId = (populatedSale.customer as any)?._id?.toString();

    // Notify admins about new invoice
    await notifyAdmins({
      title: '📄 New Invoice Generated',
      body: `Invoice #${sale.invoiceNumber} from ${customer?.name || 'Customer'} for ₹${sale.totalAmount.toLocaleString('en-IN')} has been created.`,
      url: '/dashboard/sales',
    });

    // Notify customer about their invoice
    if (customerId) {
      await notifyCustomer(customerId, {
        title: '📄 Invoice Generated',
        body: `Your invoice #${sale.invoiceNumber} for ₹${sale.totalAmount.toLocaleString('en-IN')} has been created. Amount due: ₹${sale.balanceAmount.toLocaleString('en-IN')}`,
        url: '/portal/bills',
      });
    }

    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    console.error('Sale creation error:', error);
    return NextResponse.json({ error: error.message || 'Invalid data' }, { status: 400 });
  }
}
