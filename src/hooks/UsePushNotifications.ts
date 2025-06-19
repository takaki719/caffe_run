// src/hooks/usePushNotifications.ts
import { useState, useEffect, useCallback } from "react"; // useCallbackを追加
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
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermission | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ユーザーIDの管理
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

    // 現在の購読状態と通知許可状態を確認
    navigator.serviceWorker.ready.then((swReg) => {
      setPermissionStatus(Notification.permission);
      swReg.pushManager.getSubscription().then((sub) => {
        if (sub) {
          setSubscription(sub);
          setIsSubscribed(true);
        }
      });
    });
  }, []);

  const subscribeToPush = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) {
      setError("VAPID public key is not configured.");
      return;
    }
    if (!("serviceWorker" in navigator)) {
      setError("Service Worker not supported");
      return;
    }
    if (!userId) {
      setError("User ID is not set.");
      return;
    }

    try {
      const swReg = await navigator.serviceWorker.register("/sw.js");
      const sub = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, subscription: sub }),
      });

      setSubscription(sub);
      setIsSubscribed(true);
      setPermissionStatus("granted");
      setError(null);
    } catch (err) {
      console.error("Failed to subscribe to push notifications:", err);
      // ユーザーが許可しなかった場合は'denied'になる
      if (Notification.permission === "denied") {
        setPermissionStatus("denied");
      }
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    }
  }, [userId]);

  // 初回アクセス時に通知許可を促すロジック
  useEffect(() => {
    if (
      permissionStatus === "default" &&
      !localStorage.getItem(NOTIFICATION_PROMPTED_KEY)
    ) {
      // 'default'はユーザーがまだ選択していない状態
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
