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
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let currentUserId = localStorage.getItem(USER_ID_KEY);
    if (!currentUserId) {
      currentUserId = uuidv4();
      localStorage.setItem(USER_ID_KEY, currentUserId);
    }
    setUserId(currentUserId);

    if (!("serviceWorker" in navigator && "PushManager" in window)) {
      setError("Push Notifications are not supported by this browser.");
      return;
    }

    setPermissionStatus(Notification.permission);

    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration) {
        registration.pushManager.getSubscription().then(sub => {
          if (sub) {
            setSubscription(sub);
            setIsSubscribed(true);
          }
        });
      }
    });
  }, []);

  const subscribeToPush = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) {
      setError("VAPID public key is not configured.");
      return;
    }
    if (!userId) {
      setError("User ID is not set.");
      return;
    }

    try {
      // 1. Service Workerを登録する
      await navigator.serviceWorker.register('/sw.js');
      console.log("Service worker registered.");

      // 2. Service Workerが有効化され、準備が完了するのを待つ
      const registration = await navigator.serviceWorker.ready;
      console.log("Service worker is active and ready.");

      // 3. 準備完了後、Push通知の購読を行う
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      console.log("PushManager subscribed successfully.");

      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, subscription: sub }),
      });
      console.log("Subscription sent to server.");

      setSubscription(sub);
      setIsSubscribed(true);
      setPermissionStatus("granted");
      setError(null);
    } catch (err) {
      console.error("Failed to subscribe:", err);
      if (Notification.permission === "denied") {
        setPermissionStatus("denied");
      }
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred during subscription.");
      }
    }
  }, [userId]);

  useEffect(() => {
    const prompted = localStorage.getItem(NOTIFICATION_PROMPTED_KEY);
    
    if (permissionStatus === "default" && !prompted) {
      subscribeToPush();
      localStorage.setItem(NOTIFICATION_PROMPTED_KEY, "true");
    }
  }, [permissionStatus, subscribeToPush]);

  return {
    userId,
    subscribeToPush,
    isSubscribed,
    permissionStatus,
    error,
    subscription,
  };
};