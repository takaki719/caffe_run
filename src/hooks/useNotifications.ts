import { useState, useEffect } from "react";

export const useNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    // ブラウザサポートチェック
    setIsSupported("serviceWorker" in navigator && "PushManager" in window);

    // 既存の許可状態を取得
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    // UUIDの取得または生成
    let storedUserId = localStorage.getItem("notification-user-id");
    if (!storedUserId) {
      storedUserId = crypto.randomUUID();
      localStorage.setItem("notification-user-id", storedUserId);
    }
    setUserId(storedUserId);

    // Service Worker登録
    if (isSupported) {
      registerServiceWorker();
    }
  }, [isSupported]);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered:", registration);

      // 既存のsubscriptionを確認
      const existingSubscription =
        await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setSubscription(existingSubscription);
      }
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn("Push notifications are not supported");
      return false;
    }

    try {
      console.log("Requesting notification permission...");
      const permission = await Notification.requestPermission();
      console.log("Permission result:", permission);
      setPermission(permission);
      return permission === "granted";
    } catch (error) {
      console.error("Permission request failed:", error);
      return false;
    }
  };

  const subscribeToPush = async (): Promise<PushSubscription | null> => {
    if (!isSupported || permission !== "granted") {
      console.log("Cannot subscribe:", { isSupported, permission });
      return null;
    }

    try {
      console.log("Getting service worker registration...");
      const registration = await navigator.serviceWorker.ready;

      // VAPID公開鍵をAPIから取得
      console.log("Fetching VAPID public key...");
      const vapidResponse = await fetch("/api/vapid");
      if (!vapidResponse.ok) {
        throw new Error(
          `Failed to fetch VAPID public key: ${vapidResponse.status}`,
        );
      }
      const { publicKey } = await vapidResponse.json();
      console.log("VAPID key received:", publicKey ? "✓" : "✗");

      console.log("Subscribing to push...");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      console.log("Push subscription successful:", subscription ? "✓" : "✗");
      setSubscription(subscription);
      return subscription;
    } catch (error) {
      console.error("Push subscription failed:", error);
      return null;
    }
  };

  const registerNotification = async (
    notificationTime: Date,
  ): Promise<boolean> => {
    if (!subscription || !userId) {
      console.warn("No subscription or user ID available");
      return false;
    }

    try {
      const response = await fetch("/api/register-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          notificationTime: notificationTime.toISOString(),
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: btoa(
                String.fromCharCode(
                  ...new Uint8Array(subscription.getKey("p256dh")!),
                ),
              ),
              auth: btoa(
                String.fromCharCode(
                  ...new Uint8Array(subscription.getKey("auth")!),
                ),
              ),
            },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
      }

      return response.ok;
    } catch (error) {
      console.error("Notification registration failed:", error);
      return false;
    }
  };

  const setupNotifications = async (): Promise<boolean> => {
    console.log("setupNotifications: Starting...");
    const hasPermission = await requestPermission();
    console.log("setupNotifications: Permission:", hasPermission);
    if (!hasPermission) return false;

    const sub = await subscribeToPush();
    console.log(
      "setupNotifications: Subscription:",
      sub ? "Success" : "Failed",
    );
    return sub !== null;
  };

  return {
    isSupported,
    permission,
    subscription,
    userId,
    setupNotifications,
    registerNotification,
  };
};

// VAPID公開鍵をUint8Arrayに変換するヘルパー関数
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
