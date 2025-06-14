// src/hooks/useSleepTimes.ts
"use client";
import { useEffect, useState } from "react";

const STORAGE_KEYS = {
  BED_TIME: "bedTime",
  WAKE_TIME: "wakeTime",
};

export function useSleepTimes() {
  const [bedTime, setBedTime] = useState("");
  const [wakeTime, setWakeTime] = useState("");
  const [initialized, setInitialized] = useState(false);

  // 初期読み込み（localStorageから値を復元）
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedBedTime = localStorage.getItem(STORAGE_KEYS.BED_TIME);
        const savedWakeTime = localStorage.getItem(STORAGE_KEYS.WAKE_TIME);

        if (savedBedTime) setBedTime(savedBedTime);
        if (savedWakeTime) setWakeTime(savedWakeTime);
      } catch (e) {
        console.error("Failed to load sleep times:", e);
      }
      setInitialized(true);
    }
  }, []);

  // 保存処理（bedTime）
  useEffect(() => {
    if (initialized && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.BED_TIME, bedTime);
    }
  }, [bedTime, initialized]);

  // 保存処理（wakeTime）
  useEffect(() => {
    if (initialized && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.WAKE_TIME, wakeTime);
    }
  }, [wakeTime, initialized]);

  return { bedTime, wakeTime, setBedTime, setWakeTime };
}
