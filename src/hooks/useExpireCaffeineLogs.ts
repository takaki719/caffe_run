"use client";
import { useEffect } from "react";

/**
 * wakeTime: "HH:mm" 形式の起床時刻
 * storageKey: ログを保持している localStorage のキー
 * onExpire: 削除時に呼ばれるコールバック関数（ポップアップ表示などに使う）
 */
export function useExpireCaffeineLogs(
  wakeTime: string,
  storageKey: string = "caffeine-logs",
  onExpire?: () => void,
) {
  useEffect(() => {
    if (!wakeTime) return;

    const [h, m] = wakeTime.split(":").map(Number);
    const now = new Date();
    const wakeDate = new Date(now);
    wakeDate.setHours(h, m, 0, 0);

    if (wakeDate.getTime() <= now.getTime()) {
      wakeDate.setDate(wakeDate.getDate() + 1);
    }

    // 開発・テスト用：1分後に削除
    const delay = 60 * 1000;

    const timer = setTimeout(() => {
      // ローカルストレージからカフェインログのデータを取得
      const savedLogs = window.localStorage.getItem(storageKey);
      if (savedLogs) {
        const caffeineLogs = JSON.parse(savedLogs);

        // カフェイン摂取履歴が存在する場合
        if (Array.isArray(caffeineLogs)) {
          // ここでカフェイン摂取履歴を削除（例えば、ログの配列を空にする）
          // 削除するロジックをカスタマイズ
          window.localStorage.setItem(storageKey, JSON.stringify([])); // 空の配列に設定
          console.log(
            `Expired: cleared ${storageKey} at ${new Date().toISOString()}`,
          );
        }
      }

      onExpire?.(); // コールバックがあれば呼び出す
    }, delay);

    return () => clearTimeout(timer);
  }, [wakeTime, storageKey, onExpire]);
}
