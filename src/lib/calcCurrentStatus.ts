import type { CaffeineLogEntry } from "../components/CaffeineLogTable";

export interface FocusDataPoint {
  time: string;
  value: number;
}

/**
 * 実際のカフェイン摂取履歴から、現在の覚醒度の推移を計算する関数
 */
export function calcCurrentStatus(
  logs: CaffeineLogEntry[],
  wakeUpTime: string,
  bedTime: string,
): FocusDataPoint[] {
  const timeline: FocusDataPoint[] = [];
  // --- ここから修正 ---
  // wakeUpTime または bedTime が空文字列の場合、計算を行わず空の配列を返す
  if (!wakeUpTime || !bedTime) {
    return timeline;
  }
  // --- ここまで修正 ---

  const [wakeH, wakeM] = wakeUpTime.split(":").map(Number);
  const [bedH, bedM] = bedTime.split(":").map(Number);

  const bedTotalMinutes = bedH * 60 + bedM;
  const wakeTotalMinutes = wakeH * 60 + wakeM;
  const duration =
    bedTotalMinutes <= wakeTotalMinutes
      ? 24 * 60 - wakeTotalMinutes + bedTotalMinutes
      : bedTotalMinutes - wakeTotalMinutes;

  const intervals = Math.floor(duration / 30);

  for (let i = 0; i <= intervals; i++) {
    const currentMinutes = wakeTotalMinutes + i * 30;
    const hour = Math.floor(currentMinutes / 60) % 24;
    const minute = currentMinutes % 60;
    const timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    timeline.push({ time: timeString, value: 0 });
  }

  logs.forEach((log) => {
    // --- ここから修正 ---
    // log.time が空や未定義の場合、このログはスキップする
    if (!log.time) return;
    // --- ここまで修正 ---

    const [logH, logM] = log.time.split(":").map(Number);
    const logTimeInMinutes = logH * 60 + logM;

    const startIndex = timeline.findIndex((point) => {
      const [pointH, pointM] = point.time.split(":").map(Number);
      return pointH * 60 + pointM >= logTimeInMinutes;
    });

    if (startIndex === -1) return;

    const effectValue = Math.round(log.caffeineMg / 2);
    const effectDurationInIntervals = 8;

    for (let i = 0; i < effectDurationInIntervals; i++) {
      const effectIndex = startIndex + i;
      if (effectIndex < timeline.length) {
        timeline[effectIndex].value += effectValue;
      }
    }
  });

  return timeline;
}
