// hooks/useFocusPeriods.ts
"use client";
import { useState, useEffect } from "react";

export interface FocusPeriod {
  start: string;
  end: string;
}

const STORAGE_KEY = "focusPeriods";

export function useFocusPeriods() {
  const [focusPeriods, setFocusPeriods] = useState<FocusPeriod[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // localStorage から読み込み
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log("読み込み成功:", parsed);
          setFocusPeriods(parsed);
        } catch (e) {
          console.error("パース失敗:", e);
        }
      } else {
        setFocusPeriods([{ start: "", end: "" }]); // 初期値セット
      }
      setIsInitialized(true);
    }
  }, []);

  // localStorage に保存
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      console.log("保存:", focusPeriods);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(focusPeriods));
    }
  }, [focusPeriods, isInitialized]);

  const addFocusPeriod = () =>
    setFocusPeriods((prev) => [...prev, { start: "", end: "" }]);

  const removeFocusPeriod = (idx: number) =>
    setFocusPeriods((prev) => prev.filter((_, i) => i !== idx));

  const updateFocusPeriod = (
    idx: number,
    key: "start" | "end",
    value: string,
  ) =>
    setFocusPeriods((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [key]: value } : p)),
    );

  return {
    focusPeriods,
    addFocusPeriod,
    removeFocusPeriod,
    updateFocusPeriod,
  };
}
