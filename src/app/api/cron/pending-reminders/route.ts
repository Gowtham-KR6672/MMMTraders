export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Sale from '@/models/Sale';
import PushSubscription from '@/models/PushSubscription';
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_EMAIL = process.env.VAPID_EMAIL!;

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

async function sendPush(sub: any, payload: object) {
  return webpush.sendNotification(
    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    JSON.stringify({ icon: '/logo.png', badge: '/logo.png', ...payload })
  );
}

// This endpoint is called daily (by the client or an external cron)
// It sends pending payment reminders to:
// 1. The admin — a summary of all pending invoices
// 2. Each customer — a personal reminder about their own balance
export async function GET() {
  try {
    await connectToDatabase();

    // Fetch all sales with outstanding balance
    const pendingSales = await Sale.find({ balanceAmount: { $gt: 0 } }).populate('customer');

    if (pendingSales.length === 0) {
      return NextResponse.json({ message: 'No pending payments. No notifications sent.' });
    }

    const totalPending = pendingSales.reduce((sum, s) => sum + (s.balanceAmount || 0), 0);
    const expiredEndpoints: string[] = [];
    let sent = 0;

    // ── 1. Notify ALL admin subscribers with a summary ─────────────────────
    const adminSubs = await PushSubscription.find({ role: 'admin' });
    for (const sub of adminSubs) {
      try {
        await sendPush(sub, {
          title: '⚠️ Pending Payments Reminder',
          body: `${pendingSales.length} invoice(s) have an outstanding balance of ₹${totalPending.toLocaleString('en-IN')}. Tap to review.`,
          url: '/dashboard/pending',
        });
        sent++;
      } catch (e: any) {
        if (e?.statusCode === 410 || e?.statusCode === 404) expiredEndpoints.push(sub.endpoint);
      }
    }

    // ── 2. Notify each CUSTOMER individually about their own balance ────────
    // Group pending sales by customer
    const customerMap: Record<string, { name: string; balance: number; count: number }> = {};
    for (const sale of pendingSales) {
      const customerId = (sale.customer as any)?._id?.toString();
      if (!customerId) continue;
      if (!customerMap[customerId]) {
        customerMap[customerId] = {
          name: (sale.customer as any)?.name || 'Customer',
          balance: 0,
          count: 0,
        };
      }
      customerMap[customerId].balance += sale.balanceAmount;
      customerMap[customerId].count += 1;
    }

    for (const [customerId, info] of Object.entries(customerMap)) {
      const customerSubs = await PushSubscription.find({ userId: customerId, role: 'customer' });
      for (const sub of customerSubs) {
        try {
          await sendPush(sub, {
            title: `💳 Payment Reminder - MMM Traders`,
            body: `Hello ${info.name}, you have ₹${info.balance.toLocaleString('en-IN')} pending across ${info.count} invoice(s). Tap to view your bills.`,
            url: '/portal/bills',
          });
          sent++;
        } catch (e: any) {
          if (e?.statusCode === 410 || e?.statusCode === 404) expiredEndpoints.push(sub.endpoint);
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await PushSubscription.deleteMany({ endpoint: { $in: expiredEndpoints } });
    }

    return NextResponse.json({
      message: 'Daily reminders sent',
      sent,
      pendingInvoices: pendingSales.length,
      totalPending,
    });
  } catch (error: any) {
    console.error('Cron reminder error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
