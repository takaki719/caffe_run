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

    // wakeTimeが現在時刻を過ぎていたら、翌日に設定
    if (wakeDate.getTime() <= now.getTime()) {
      wakeDate.setDate(wakeDate.getDate() + 1);
    }

    // wakeTimeの24時間後を計算
    const expireAt = wakeDate.getTime() + 24 * 60 * 60 * 1000; // 24時間後
    const delay = expireAt - now.getTime(); // 現在時刻から24時間後までのミリ秒数を計算

    const timer = setTimeout(() => {
      // すべてのローカルストレージデータを削除
      window.localStorage.clear();
      console.log(
        `Expired: cleared all localStorage at ${new Date().toISOString()}`,
      );

      onExpire?.(); // コールバックがあれば呼び出す
    }, delay);

    return () => clearTimeout(timer); // クリーンアップ処理
  }, [wakeTime, storageKey, onExpire]);
}
