"use client";
import React from "react";
import { useNotifications } from "@/hooks/useNotifications";

const NotificationButton: React.FC = () => {
  const { isSupported, permission, setupNotifications, subscription, userId } =
    useNotifications();

  if (!isSupported) {
    return null; // ブラウザが対応していない場合は非表示
  }

  const handleSetupNotifications = async () => {
    const success = await setupNotifications();
    if (success) {
      alert("通知の設定が完了しました！");
    } else {
      alert("通知の設定に失敗しました。ブラウザの設定をご確認ください。");
    }
  };

  const handleTestNotification = async () => {
    // 5秒後にテスト通知を送信
    const testTime = new Date();
    testTime.setSeconds(testTime.getSeconds() + 5);

    console.log(
      "Registering test notification for:",
      testTime.toLocaleString(),
    );

    if (subscription && userId) {
      try {
        const response = await fetch("/api/register-notification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            notificationTime: testTime.toISOString(),
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

        if (response.ok) {
          alert("テスト通知を5秒後に送信するよう設定しました！");
        } else {
          const errorText = await response.text();
          alert(`テスト通知の設定に失敗: ${errorText}`);
        }
      } catch (error) {
        console.error("Test notification error:", error);
        alert("テスト通知の設定に失敗しました");
      }
    }
  };

  if (permission === "granted") {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <span>🔔</span>
          <span>通知設定済み</span>
        </div>
        <div className="text-xs text-gray-500">
          Subscription: {subscription ? "✓" : "✗"} | UserID:{" "}
          {userId ? "✓" : "✗"}
        </div>
        <div className="flex gap-2">
          {(!subscription || !userId) && (
            <button
              onClick={handleSetupNotifications}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              再設定
            </button>
          )}
          {subscription && userId && (
            <button
              onClick={handleTestNotification}
              className="text-xs text-green-600 hover:text-green-800"
            >
              テスト通知
            </button>
          )}
        </div>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <span>🔕</span>
        <span>通知が無効です</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleSetupNotifications}
      className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm"
    >
      <span>🔔</span>
      <span>通知を許可</span>
    </button>
  );
};

export default NotificationButton;
