'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Bell, X, CheckCircle, AlertCircle } from 'lucide-react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const LAST_REMINDER_KEY = 'mmm_last_daily_reminder';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationSetup() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showBanner, setShowBanner] = useState(false);
  const [status, setStatus] = useState<'idle' | 'subscribing' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Only run in browser & if push is supported
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (!('PushManager' in window)) return;

    // Register service worker
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('[SW] Registration failed:', err);
    });

    // Check current notification permission
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      setPermission(currentPermission);

      if (currentPermission === 'default') {
        // Show banner after 3 seconds
        setTimeout(() => setShowBanner(true), 3000);
      } else if (currentPermission === 'granted') {
        // Already granted — re-subscribe in background to ensure subscription is current
        setTimeout(() => subscribeToPush(true), 2000);
        triggerDailyReminder();
      }
    }
  }, []);

  const subscribeToPush = async (silent = false) => {
    try {
      if (!VAPID_PUBLIC_KEY) {
        if (!silent) console.error('[Push] VAPID public key not configured');
        return false;
      }

      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        if (!silent) console.warn('[Push] Push not supported in this browser');
        return false;
      }

      // Wait for SW to be ready (important on first load)
      const registration = await navigator.serviceWorker.ready;

      // Always get a fresh subscription to handle expired ones
      let subscription = await registration.pushManager.getSubscription();

      // If no subscription or it could be stale, create a new one
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      // Save subscription to backend
      await axios.post('/api/push/subscribe', {
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
          },
        },
      });

      console.log('[Push] Subscribed successfully');
      return true;
    } catch (error: any) {
      console.error('[Push] Subscribe failed:', error?.message || error);
      return false;
    }
  };

  const triggerDailyReminder = async () => {
    const lastReminder = localStorage.getItem(LAST_REMINDER_KEY);
    const today = new Date().toDateString();
    if (lastReminder === today) return;
    try {
      await axios.get('/api/cron/pending-reminders');
      localStorage.setItem(LAST_REMINDER_KEY, today);
    } catch {
      // Silent fail — not critical
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Notifications are not supported in your browser.');
      return;
    }

    setStatus('subscribing');

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setShowBanner(false);

      if (result === 'granted') {
        const ok = await subscribeToPush(false);
        setStatus(ok ? 'success' : 'error');
        if (ok) triggerDailyReminder();
      } else {
        setStatus('idle');
      }
    } catch (err) {
      console.error('[Push] Permission request failed:', err);
      setStatus('error');
    }
  };

  // Don't render if notifications aren't supported
  if (typeof window !== 'undefined' && !('Notification' in window)) return null;
  if (!showBanner || permission !== 'default') return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[100] animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)] border border-orange-100 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-orange-50 text-orange-600 rounded-xl flex-shrink-0 mt-0.5">
            <Bell size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm">Enable Notifications</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Get order updates, payment alerts, and daily pending payment reminders.
            </p>

            {status === 'subscribing' && (
              <div className="mt-2 text-xs text-orange-600 font-medium flex items-center gap-1.5">
                <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                Setting up notifications...
              </div>
            )}
            {status === 'success' && (
              <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                <CheckCircle size={12} /> Notifications enabled!
              </div>
            )}
            {status === 'error' && (
              <div className="mt-2 text-xs text-red-600 font-medium flex items-center gap-1.5">
                <AlertCircle size={12} /> Failed. Please try again.
              </div>
            )}

            {status === 'idle' || status === 'error' ? (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={requestPermission}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2 px-3 rounded-xl transition-all"
                >
                  Enable
                </button>
                <button
                  onClick={() => setShowBanner(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 py-2 px-3 rounded-xl hover:bg-slate-50 transition-all border border-slate-100"
                >
                  Not now
                </button>
              </div>
            ) : null}
          </div>
          <button onClick={() => setShowBanner(false)} className="text-slate-300 hover:text-slate-500 transition-colors mt-0.5">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
