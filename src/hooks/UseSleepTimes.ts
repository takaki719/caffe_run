import { useState, useEffect } from "react";

const SLEEP_TIME_KEY = "caffe-run-sleep-time";

export function useSleepTimes() {
  const [bedTime, setBedTime] = useState("");
  const [wakeTime, setWakeTime] = useState("");

  // LocalStorageからデータを読み込むuseEffect
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedData = window.localStorage.getItem(SLEEP_TIME_KEY);
        if (savedData) {
          const { bedTime: savedBed, wakeTime: savedWake } =
            JSON.parse(savedData);
          setBedTime(savedBed || "");
          setWakeTime(savedWake || "");
        }
      } catch (e) {
        console.error("Failed to load sleep times from local storage", e);
      }
    }
  }, []); // 初回のみ実行

  // LocalStorageへデータを保存するuseEffect
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const data = JSON.stringify({ bedTime, wakeTime });
        window.localStorage.setItem(SLEEP_TIME_KEY, data);
      } catch (e) {
        console.error("Failed to save sleep times to local storage", e);
      }
    }
  }, [bedTime, wakeTime]); // bedTimeかwakeTimeが変わるたびに実行

  return { bedTime, wakeTime, setBedTime, setWakeTime };
}
