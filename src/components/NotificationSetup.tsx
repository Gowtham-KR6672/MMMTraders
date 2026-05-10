'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Bell, BellOff, X } from 'lucide-react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
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
  const [swRegistered, setSwRegistered] = useState(false);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[SW] Registered:', reg.scope);
          setSwRegistered(true);
        })
        .catch((err) => console.error('[SW] Registration failed:', err));
    }

    if ('Notification' in window) {
      setPermission(Notification.permission);
      // Show banner if user hasn't decided yet
      if (Notification.permission === 'default') {
        setTimeout(() => setShowBanner(true), 2000);
      }
    }
  }, []);

  // Auto-subscribe if permission was already granted
  useEffect(() => {
    if (swRegistered && permission === 'granted') {
      subscribeToPush();
      triggerDailyReminder();
    }
  }, [swRegistered, permission]);

  const subscribeToPush = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();

      let subscription = existing;
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      // Save to backend
      await axios.post('/api/push/subscribe', { subscription });
      console.log('[Push] Subscribed successfully');
    } catch (error) {
      console.error('[Push] Subscribe failed:', error);
    }
  };

  const triggerDailyReminder = async () => {
    // Only trigger once per day
    const lastReminder = localStorage.getItem(LAST_REMINDER_KEY);
    const today = new Date().toDateString();

    if (lastReminder === today) return;

    try {
      await axios.get('/api/cron/pending-reminders');
      localStorage.setItem(LAST_REMINDER_KEY, today);
      console.log('[Cron] Daily reminders triggered');
    } catch (err) {
      // Silently fail - cron will retry next load
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Your browser does not support notifications.');
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    setShowBanner(false);

    if (result === 'granted') {
      await subscribeToPush();
      await triggerDailyReminder();
    }
  };

  const dismissBanner = () => setShowBanner(false);

  if (!showBanner || permission !== 'default') return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[100] animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)] border border-orange-100 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-orange-50 text-orange-600 rounded-xl flex-shrink-0">
            <Bell size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm">Enable Notifications</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Get alerts for new orders, payment updates, and daily pending payment reminders.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={requestPermission}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2 px-3 rounded-xl transition-all"
              >
                Enable
              </button>
              <button
                onClick={dismissBanner}
                className="text-xs text-slate-400 hover:text-slate-600 py-2 px-3 rounded-xl hover:bg-slate-50 transition-all border border-slate-100"
              >
                Not now
              </button>
            </div>
          </div>
          <button onClick={dismissBanner} className="text-slate-300 hover:text-slate-500 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
