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

async function sendPush(sub: any, payload: PushPayload): Promise<boolean> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ icon: '/logo.png', badge: '/logo.png', ...payload })
    );
    return true;
  } catch (error: any) {
    if (error?.statusCode === 410 || error?.statusCode === 404) {
      await PushSubscription.deleteOne({ endpoint: sub.endpoint });
    }
    return false;
  }
}

export async function notifyAdmins(payload: PushPayload): Promise<{ sent: number; failed: number }> {
  try {
    const subs = await PushSubscription.find({ role: 'admin' });
    let sent = 0;
    let failed = 0;

    for (const sub of subs) {
      const success = await sendPush(sub, payload);
      if (success) sent++;
      else failed++;
    }

    return { sent, failed };
  } catch (error) {
    console.error('Error notifying admins:', error);
    return { sent: 0, failed: 0 };
  }
}

export async function notifyCustomer(
  customerId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  try {
    const subs = await PushSubscription.find({ userId: customerId, role: 'customer' });
    let sent = 0;
    let failed = 0;

    for (const sub of subs) {
      const success = await sendPush(sub, payload);
      if (success) sent++;
      else failed++;
    }

    return { sent, failed };
  } catch (error) {
    console.error('Error notifying customer:', error);
    return { sent: 0, failed: 0 };
  }
}

export async function notifyByRole(
  role: 'admin' | 'customer',
  payload: PushPayload,
  userId?: string
): Promise<{ sent: number; failed: number }> {
  if (role === 'admin') {
    return notifyAdmins(payload);
  } else if (userId) {
    return notifyCustomer(userId, payload);
  }
  return { sent: 0, failed: 0 };
}
