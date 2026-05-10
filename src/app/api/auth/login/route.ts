import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Customer from '@/models/Customer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function POST(request: Request) {
  try {
    const { email, password, rememberMe = true } = await request.json();
    // Cookie lifetime: 90 days if Remember Me, else 1 day
    const cookieMaxAge = rememberMe ? 90 * 24 * 60 * 60 : 24 * 60 * 60;
    const jwtExpiry = rememberMe ? '90d' : '1d';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email/Phone and password are required' }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Check if it's an Admin User (by email)
    const user = await User.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password || '');
      if (!isMatch) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, {
        expiresIn: jwtExpiry,
      });

      const response = NextResponse.json({
        message: 'Login successful',
        token, // Return token so client can store in localStorage for PWA
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      }, { status: 200 });

      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: cookieMaxAge,
        path: '/',
      });

      return response;
    }

    // 2. Check if it's a Customer (by phone or email)
    const customer = await Customer.findOne({ $or: [{ phone: email }, { email: email }] });
    if (customer) {
      if (!customer.password) {
        return NextResponse.json({ error: 'Account not setup. Please contact admin.' }, { status: 401 });
      }
      
      const isMatch = await bcrypt.compare(password, customer.password);
      if (!isMatch) {
        return NextResponse.json({ error: 'Invalid phone or password' }, { status: 401 });
      }

      // Issue customer token
      const token = jwt.sign({ id: customer._id, email: customer.email, phone: customer.phone, role: 'customer' }, JWT_SECRET, {
        expiresIn: jwtExpiry,
      });

      const response = NextResponse.json({
        message: 'Customer login successful',
        token, // Return token so client can store in localStorage for PWA
        user: { id: customer._id, name: customer.name, role: 'customer' }
      }, { status: 200 });

      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: cookieMaxAge,
        path: '/',
      });

      return response;
    }

    // If neither User nor Customer found
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
