export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Income from '@/models/Income';

import Sale from '@/models/Sale';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Get standalone income
    const incomeRecords = await Income.find().lean();
    
    // Get paid sales revenue
    const salesRecords = await Sale.find({ amountPaid: { $gt: 0 } }).populate('customer').lean();
    
    // Map sales to match the Income interface structure for the frontend
    const mappedSales = salesRecords.map((sale: any) => ({
      _id: sale._id.toString() + '-sale', // prevent key conflicts
      source: `Sale: Invoice ${sale.invoiceNumber}`,
      amount: sale.amountPaid,
      notes: `Customer: ${sale.customer?.name || 'Unknown'}`,
      date: sale.date,
      isSale: true, // Flag to prevent frontend edit/delete
      createdAt: sale.createdAt
    }));

    // Combine and sort by date descending
    const combined = [...incomeRecords, ...mappedSales].sort((a: any, b: any) => 
      new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
    );

    return NextResponse.json(combined, { status: 200 });
  } catch (error: any) {
    console.error('Income fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    await connectToDatabase();
    const income = await Income.create(data);
    return NextResponse.json(income, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
