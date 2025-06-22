// src/hooks/useExpireCaffeineLogs.ts
"use client";
import { useEffect } from "react";

export function useExpireCaffeineLogs(
  wakeTime: string,
  storageKeys: string[] = ["caffeine-logs"],
  onExpire?: () => void,
) {
  const storageKeysString = JSON.stringify(storageKeys);

  useEffect(() => {
    if (!wakeTime) return;

    const [h, m] = wakeTime.split(":").map(Number);
    const now = new Date();
    const wakeDate = new Date(now);
    wakeDate.setHours(h, m, 0, 0);

    const expireAt = wakeDate.getTime() + 24 * 60 * 60 * 1000;
    const delay = expireAt - now.getTime();

    const timer = setTimeout(() => {
      storageKeys.forEach((key) => window.localStorage.removeItem(key));
      console.log(
        `Expired: removed keys [${storageKeys.join(", ")}] at ${new Date().toISOString()}`,
      );
      if (onExpire) onExpire();
    }, delay);

    return () => clearTimeout(timer);
  }, [wakeTime, storageKeysString, onExpire, storageKeys]);
}
