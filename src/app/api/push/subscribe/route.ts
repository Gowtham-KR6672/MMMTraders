export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import PushSubscription from '@/models/PushSubscription';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription } = body;

    // Validate subscription object
    if (
      !subscription?.endpoint ||
      !subscription?.keys?.p256dh ||
      !subscription?.keys?.auth
    ) {
      console.error('[Push Subscribe] Invalid subscription object:', JSON.stringify(subscription));
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
    }

    await connectToDatabase();

    // Upsert: update if endpoint exists, create if not
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        userId: decoded.id,
        role: decoded.role === 'customer' ? 'customer' : 'admin',
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      { upsert: true, new: true }
    );

    console.log(`[Push Subscribe] Saved subscription for user ${decoded.id} (${decoded.role})`);
    return NextResponse.json({ message: 'Subscribed successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('[Push Subscribe] Error:', error?.message || error);
    return NextResponse.json({ 
      error: 'Internal server error',
      detail: error?.message 
    }, { status: 500 });
  }
}
