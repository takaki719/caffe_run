// /src/lib/optimizer/CaffeineOptimizer.ts
// --------------------------------------------------
// 最適なカフェイン摂取スケジュールを探すクラス (ベストエフォート方式)

import { SleepPeriod, CaffeineDose, OptimizationParams } from "./interfaces";
import { PerformanceModel } from "./PerformanceModel";

export class CaffeineOptimizer {
  private model: PerformanceModel;

  constructor() {
    this.model = new PerformanceModel();
  }

  /**
   * スケジュールのパフォーマンスを評価し、成功した集中時間帯の数と、その間の最低パフォーマンスを返す
   * @returns {{ successfulWindows: number, minimumPerformance: number }} 評価結果
   */
  private evaluateSchedulePerformance(
    schedule: CaffeineDose[],
    sleepHistory: SleepPeriod[],
    params: OptimizationParams,
  ): { successfulWindows: number; minimumPerformance: number } {
    const { timeWindows, targetPerformance } = params;
    let successfulWindows = 0;
    let overallMinimumPerformance = 1.0; // パフォーマンスの最低値を記録（1.0から開始）

    for (const window of timeWindows) {
      let isWindowSuccessful = true;
      let windowMinimumPerformance = 1.0;

      for (
        let t = window.start.getTime();
        t <= window.end.getTime();
        t += 30 * 60 * 1000 // 30分ごとにチェック
      ) {
        const performance = this.model.predict(
          new Date(t),
          sleepHistory,
          schedule,
        );
        // このウィンドウ内の最低パフォーマンスを更新
        windowMinimumPerformance = Math.min(
          windowMinimumPerformance,
          performance,
        );
        if (performance < targetPerformance) {
          isWindowSuccessful = false;
        }
      }

      if (isWindowSuccessful) {
        successfulWindows++;
        // 全ての成功したウィンドウを通しての最低パフォーマンスを更新
        overallMinimumPerformance = Math.min(
          overallMinimumPerformance,
          windowMinimumPerformance,
        );
      }
    }

    // 成功したウィンドウが一つもなければ、最低パフォーマンスは0とする
    if (successfulWindows === 0) {
      return { successfulWindows, minimumPerformance: 0 };
    }

    return { successfulWindows, minimumPerformance: overallMinimumPerformance };
  }

  /**
   * 最善のカフェイン摂取スケジュールを見つける (ベストエフォート)
   */
  public findOptimalSchedule(
    sleepHistory: SleepPeriod[],
    params: OptimizationParams,
  ): CaffeineDose[] | null {
    let bestSchedule: CaffeineDose[] | null = null;
    let maxWindowsAchieved = 0;
    let bestMinimumPerformance = 0; // ★ 最低パフォーマンスの最高値を記録
    let minCaffeineForMaxWindows = Infinity;

    const doseOptions = [50, 100, 150, 200].filter(
      (d) => d <= params.maxDosePerIntake,
    );
    if (doseOptions.length === 0) return null;

    const timeSlots: Date[] = [];
    params.timeWindows.forEach((window) => {
      const primarySlot = new Date(window.start.getTime() - 30 * 60 * 1000);
      if (!timeSlots.some((t) => t.getTime() === primarySlot.getTime())) {
        timeSlots.push(primarySlot);
      }
      let t = new Date(window.start.getTime());
      while (t < window.end) {
        const isTooClose = timeSlots.some(
          (existingSlot) =>
            Math.abs(existingSlot.getTime() - t.getTime()) <
            params.minTimeBetweenDosesHours * 3600 * 1000,
        );
        if (!isTooClose) {
          timeSlots.push(new Date(t));
        }
        t = new Date(t.getTime() + 60 * 60 * 1000);
      }
    });

    timeSlots.sort((a, b) => a.getTime() - b.getTime());
    const searchSlots = timeSlots.slice(0, 8);

    const evaluateAndUpdateBest = (schedule: CaffeineDose[]) => {
      const {
        successfulWindows,
        minimumPerformance,
      } = // ★ 最低パフォーマンスを取得
        this.evaluateSchedulePerformance(schedule, sleepHistory, params);

      if (successfulWindows === 0) return;

      const totalCaffeine = schedule.reduce((sum, d) => sum + d.mg, 0);

      // --- ★ 評価ロジックを「最低パフォーマンス」優先に変更 ---
      // 1. 達成ウィンドウ数が多いものを優先
      if (successfulWindows > maxWindowsAchieved) {
        maxWindowsAchieved = successfulWindows;
        bestMinimumPerformance = minimumPerformance;
        minCaffeineForMaxWindows = totalCaffeine;
        bestSchedule = schedule;
      } else if (successfulWindows === maxWindowsAchieved) {
        // 2. ウィンドウ数が同じなら、「最低パフォーマンス」が高いものを優先
        if (minimumPerformance > bestMinimumPerformance) {
          bestMinimumPerformance = minimumPerformance;
          minCaffeineForMaxWindows = totalCaffeine;
          bestSchedule = schedule;
        } else if (minimumPerformance === bestMinimumPerformance) {
          // 3. 最低パフォーマンスも同じなら、カフェイン量が少ないものを優先
          if (totalCaffeine < minCaffeineForMaxWindows) {
            minCaffeineForMaxWindows = totalCaffeine;
            bestSchedule = schedule;
          }
        }
      }
    };

    // 1回摂取の全パターンを試す
    for (const slot of searchSlots) {
      for (const dose of doseOptions) {
        evaluateAndUpdateBest([{ time: slot, mg: dose }]);
      }
    }

    // 2回摂取の全パターンを試す
    if (searchSlots.length >= 2) {
      for (let i = 0; i < searchSlots.length; i++) {
        for (let j = i + 1; j < searchSlots.length; j++) {
          for (const dose1 of doseOptions) {
            for (const dose2 of doseOptions) {
              evaluateAndUpdateBest([
                { time: searchSlots[i], mg: dose1 },
                { time: searchSlots[j], mg: dose2 },
              ]);
            }
          }
        }
      }
    }
    return bestSchedule;
  }
}
