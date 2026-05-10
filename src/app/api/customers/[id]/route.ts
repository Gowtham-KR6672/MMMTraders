import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Customer from '@/models/Customer';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const data = await request.json();
    const { id } = await context.params;
    await connectToDatabase();
    
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    } else {
      // Don't overwrite password if it's empty
      delete data.password;
    }
    
    const customer = await Customer.findByIdAndUpdate(id, data, { new: true });
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    
    return NextResponse.json(customer, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await connectToDatabase();
    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    
    return NextResponse.json({ message: 'Customer deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
