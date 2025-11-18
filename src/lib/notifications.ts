import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (!('serviceWorker' in navigator)) {
    console.log('Service workers not supported');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export async function subscribeToPushNotifications(userId: string) {
  try {
    if (!VAPID_PUBLIC_KEY) {
      console.log('VAPID public key not configured');
      return false;
    }

    const permission = await requestNotificationPermission();
    if (!permission) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const subscriptionJSON = subscription.toJSON();

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscriptionJSON.endpoint!,
        p256dh_key: subscriptionJSON.keys!.p256dh,
        auth_key: subscriptionJSON.keys!.auth,
      }, {
        onConflict: 'endpoint',
      });

    if (error) {
      console.error('Error saving subscription:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return false;
  }
}

export async function unsubscribeFromPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      const subscriptionJSON = subscription.toJSON();
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', subscriptionJSON.endpoint!);
    }

    return true;
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return false;
  }
}
