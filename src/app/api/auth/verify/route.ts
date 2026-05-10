import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import OTP from '@/models/OTP';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, otp, name, password } = await request.json();

    if (!email || !otp || !name || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    await connectToDatabase();

    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin', // Make the first user or default users admin based on requirements. Real app might differ.
    });

    // Delete OTP after successful verification
    await OTP.deleteOne({ _id: otpRecord._id });

    return NextResponse.json({ message: 'User created successfully', user: { id: newUser._id, email: newUser.email, name: newUser.name } }, { status: 201 });
  } catch (error: any) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
