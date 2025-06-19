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
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermission | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("usePushNotifications hook mounted.");

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

    // ★★★ 修正点 ★★★
    // serviceWorker.readyを待たずに、まず現在の通知許可状態をセットする
    setPermissionStatus(Notification.permission);
    console.log("Initial permission status:", Notification.permission);

    // 既存の購読情報がないか確認する
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        registration.pushManager.getSubscription().then((sub) => {
          if (sub) {
            console.log("Existing subscription found.");
            setSubscription(sub);
            setIsSubscribed(true);
          }
        });
      }
    });
  }, []);

  const subscribeToPush = useCallback(async () => {
    console.log("subscribeToPush called.");
    if (!VAPID_PUBLIC_KEY) {
      console.error("VAPID public key is missing.");
      setError("VAPID public key is not configured.");
      return;
    }
    if (!userId) {
      console.error("User ID is not set yet.");
      setError("User ID is not set.");
      return;
    }

    try {
      const swReg = await navigator.serviceWorker.register("/sw.js");
      console.log("Service worker registered.");
      const sub = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      console.log("PushManager subscribed.");

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
    console.log(
      `Checking if prompt is needed. Status: ${permissionStatus}, Prompted: ${prompted}`,
    );

    if (permissionStatus === "default" && !prompted) {
      console.log("Conditions met. Triggering subscription prompt.");
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
