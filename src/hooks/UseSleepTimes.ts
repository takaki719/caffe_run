// src/hooks/useSleepTimes.ts
import { useState } from "react";

export function useSleepTimes() {
  // 単純に useState だけで睡眠時間を管理
  const [bedTime, setBedTime] = useState("");
  const [wakeTime, setWakeTime] = useState("");

  return { bedTime, wakeTime, setBedTime, setWakeTime };
}
