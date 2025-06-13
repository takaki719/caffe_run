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
   * スケジュールのパフォーマンスを評価し、成功した集中時間帯の数を返す
   * @returns {number} 成功したウィンドウの数
   */
  private evaluateSchedulePerformance(
    schedule: CaffeineDose[],
    sleepHistory: SleepPeriod[],
    params: OptimizationParams,
  ): number {
    const { timeWindows, targetPerformance } = params;
    let successfulWindows = 0;

    for (const window of timeWindows) {
      let isWindowSuccessful = true;
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
        if (performance < targetPerformance) {
          isWindowSuccessful = false; // このウィンドウは失敗
          break; // 次のウィンドウのチェックへ
        }
      }
      if (isWindowSuccessful) {
        successfulWindows++;
      }
    }
    return successfulWindows;
  }

  /**
   * 最善のカフェイン摂取スケジュールを見つける (ベストエフォート)
   */
  public findOptimalSchedule(
    sleepHistory: SleepPeriod[],
    params: OptimizationParams,
  ): CaffeineDose[] | null {
    let bestSchedule: CaffeineDose[] | null = null;
    let maxWindowsAchieved = 0; // 達成したウィンドウ数の最大値
    let minCaffeineForMaxWindows = Infinity; // 最大ウィンドウ達成時の最小カフェイン量

    const doseOptions = [50, 100, 150, 200].filter(
      (d) => d <= params.maxDosePerIntake,
    );
    if (doseOptions.length === 0) return null;

    const timeSlots: Date[] = [];
    params.timeWindows.forEach((window) => {
      // 集中時間の30分前から候補時間を生成するように変更
      const startTime = new Date(window.start.getTime() - 30 * 60 * 1000);
      let t = startTime;

      while (t < window.end) {
        const lastSlotTime =
          timeSlots.length > 0 ? timeSlots[timeSlots.length - 1].getTime() : 0;
        if (
          t.getTime() - lastSlotTime <
          params.minTimeBetweenDosesHours * 3600 * 1000
        ) {
          t = new Date(
            lastSlotTime + params.minTimeBetweenDosesHours * 3600 * 1000,
          );
          if (t < startTime) t = startTime; // 開始時刻より前に戻らないように
          continue;
        }
        timeSlots.push(new Date(t));
        t = new Date(
          t.getTime() + params.minTimeBetweenDosesHours * 3600 * 1000,
        );
      }
    });

    const searchSlots = timeSlots.slice(0, 8);

    // スケジュールを評価し、最良であれば更新するヘルパー関数
    const evaluateAndUpdateBest = (schedule: CaffeineDose[]) => {
      const achievedWindows = this.evaluateSchedulePerformance(
        schedule,
        sleepHistory,
        params,
      );

      // 全く達成できないスケジュールは無視
      if (achievedWindows === 0) return;

      const totalCaffeine = schedule.reduce((sum, d) => sum + d.mg, 0);

      if (achievedWindows > maxWindowsAchieved) {
        // ★ より多くのウィンドウを達成したので、無条件で更新
        maxWindowsAchieved = achievedWindows;
        minCaffeineForMaxWindows = totalCaffeine;
        bestSchedule = schedule;
      } else if (achievedWindows === maxWindowsAchieved) {
        // ★ 同じウィンドウ達成数なら、より少ないカフェイン量のものを採用
        if (totalCaffeine < minCaffeineForMaxWindows) {
          minCaffeineForMaxWindows = totalCaffeine;
          bestSchedule = schedule;
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

    // (計算負荷に応じて3回摂取のパターンも同様に追加可能)

    return bestSchedule;
  }
}
