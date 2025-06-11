export type FocusDataPoint = {
  time: string; // "08:00" など
  focus: number; // 0-100
};

export function calcFocusData(
  wakeTime: string,
  bedTime: string,
  focusStart: string,
  focusEnd: string,
): FocusDataPoint[] {
  // 時刻文字列を数値(0-23)に変換
  const toHour = (t: string) => parseInt(t.split(":")[0], 10);

  const wake = toHour(wakeTime);
  const bed = toHour(bedTime);
  const focusS = toHour(focusStart);
  const focusE = toHour(focusEnd);

  // 活動時間帯の判定関数
  function isActive(hour: number): boolean {
    // 例: wake=7, bed=2 → 7-23, 0-1までが活動時間
    if (wake < bed) return hour >= wake && hour < bed;
    return hour >= wake || hour < bed;
  }
  // 集中時間帯の判定関数（範囲が日またぎでも対応）
  function isFocus(hour: number): boolean {
    if (focusS < focusE) return hour >= focusS && hour < focusE;
    return hour >= focusS || hour < focusE;
  }

  const data: FocusDataPoint[] = [];
  for (let hour = 0; hour < 24; hour++) {
    let focus = 5; // デフォルト:活動時間外
    if (isActive(hour)) {
      if (isFocus(hour)) {
        // 集中時間帯: 80-100でランダム
        focus = 80 + Math.floor(Math.random() * 21);
      } else {
        // 活動時間内だが集中帯でない
        focus = 25 + Math.floor(Math.random() * 11);
      }
    }
    data.push({
      time: `${hour.toString().padStart(2, "0")}:00`,
      focus,
    });
  }
  return data;
}
