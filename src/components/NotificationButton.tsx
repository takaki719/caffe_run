"use client";
import React from "react";
import { useNotifications } from "@/hooks/useNotifications";

const NotificationButton: React.FC = () => {
  const { isSupported, permission, setupNotifications, subscription, userId } = useNotifications();

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

  if (permission === "granted") {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <span>🔔</span>
          <span>通知設定済み</span>
        </div>
        <div className="text-xs text-gray-500">
          Subscription: {subscription ? "✓" : "✗"} | UserID: {userId ? "✓" : "✗"}
        </div>
        {(!subscription || !userId) && (
          <button
            onClick={handleSetupNotifications}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            再設定
          </button>
        )}
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
