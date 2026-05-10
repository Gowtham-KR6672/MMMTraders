export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import PushSubscription from '@/models/PushSubscription';
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_EMAIL = process.env.VAPID_EMAIL!;

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

// Send to specific userId
export async function POST(request: Request) {
  try {
    const { userId, role, payload } = await request.json() as {
      userId?: string;
      role?: string;
      payload: PushPayload;
    };

    await connectToDatabase();

    let query: any = {};
    if (userId) query.userId = userId;
    if (role) query.role = role;

    const subs = await PushSubscription.find(query);
    if (subs.length === 0) return NextResponse.json({ message: 'No subscribers found' });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({ ...payload, icon: '/logo.png', badge: '/logo.png' })
        )
      )
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    // Clean up expired/invalid subscriptions
    const expiredEndpoints: string[] = [];
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const reason = (r as PromiseRejectedResult).reason;
        if (reason?.statusCode === 410 || reason?.statusCode === 404) {
          expiredEndpoints.push(subs[i].endpoint);
        }
      }
    });
    if (expiredEndpoints.length > 0) {
      await PushSubscription.deleteMany({ endpoint: { $in: expiredEndpoints } });
    }

    return NextResponse.json({ sent, failed });
  } catch (error: any) {
    console.error('Push send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
