// src/hooks/usePushNotifications.ts
import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

const USER_ID_KEY = "caffe-run-user-id";
const NOTIFICATION_PROMPTED_KEY = "caffe-run-notification-prompted";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // 1. ユーザーIDのセットアップとService Workerの登録・有効化を行うEffect
  useEffect(() => {
    let currentUserId = localStorage.getItem(USER_ID_KEY);
    if (!currentUserId) {
      currentUserId = uuidv4();
      localStorage.setItem(USER_ID_KEY, currentUserId);
    }
    setUserId(currentUserId);

    if (!("serviceWorker" in navigator && "PushManager" in window)) {
      console.error("Push Notifications are not supported.");
      setError("Push Notifications are not supported by this browser.");
      return;
    }

    // Service Workerを登録し、有効化されるのを待つ
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('Service Worker registration successful', reg);
        setSwRegistration(reg); // 登録オブジェクトをstateに保存
      })
      .catch(err => {
        console.error('Service Worker registration failed:', err);
        setError('Service Worker registration failed.');
      });
  }, []);

  // 2. 購読処理を行うEffect
  const subscribe = useCallback(async () => {
    if (!swRegistration || !userId || !VAPID_PUBLIC_KEY) {
      // 必要なものが揃っていなければ何もしない
      return;
    }

    const prompted = localStorage.getItem(NOTIFICATION_PROMPTED_KEY);
    const permission = Notification.permission;

    // 初回アクセス時のみ実行
    if (permission === 'default' && !prompted) {
      console.log('Conditions met, starting subscription process.');
      localStorage.setItem(NOTIFICATION_PROMPTED_KEY, 'true');
      
      try {
        // Service Workerの準備が本当に完了するのを待つ
        const readySwRegistration = await navigator.serviceWorker.ready;
        
        const sub = await readySwRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        console.log('PushManager subscribed successfully.');
        await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, subscription: sub }),
        });

        console.log('Subscription sent to server.');
        setSubscription(sub);
        setIsSubscribed(true);
      } catch (err) {
        console.error('Failed to subscribe to push notifications:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      }
    }
  }, [swRegistration, userId]);

  useEffect(() => {
    subscribe();
  }, [subscribe]);


  return {
    isSubscribed,
    error,
  };
};