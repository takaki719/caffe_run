// /src/lib/optimizer/CaffeineOptimizer.ts
// --------------------------------------------------
// 最適なカフェイン摂取スケジュールを探すクラス

import { SleepPeriod, CaffeineDose, OptimizationParams } from './interfaces';
import {PerformanceModel} from './PerformanceModel';

export class CaffeineOptimizer {
  private model: PerformanceModel;

  constructor() {
    this.model = new PerformanceModel();
  }

  /**
   * 最適なカフェイン摂取スケジュールを見つける (グリッドサーチ)
   */
  public findOptimalSchedule(
    sleepHistory: SleepPeriod[],
    params: OptimizationParams
  ): CaffeineDose[] | null {
    let bestSchedule: CaffeineDose[] | null = null;
    let minTotalCaffeine = Infinity;

    const doseOptions = [0, 50, 100, 150, 200].filter(d => d <= params.maxDosePerIntake);
    const timeSlots: Date[] = [];
    let t = new Date(params.timeWindow.start);
    while (t < params.timeWindow.end) {
      timeSlots.push(new Date(t));
      t = new Date(t.getTime() + params.minTimeBetweenDosesHours * 3600 * 1000);
    }
    
    // 探索する摂取回数を絞る（ここでは最大2回まで）
    const limitedTimeSlots = timeSlots.slice(0, 2);

    // 組み合わせを生成して評価
    for (const dose1 of doseOptions) {
      for (const dose2 of doseOptions) {
        const candidateSchedule: CaffeineDose[] = [];
        if (dose1 > 0 && limitedTimeSlots.length > 0) {
            candidateSchedule.push({ time: limitedTimeSlots[0], mg: dose1 });
        }
        if (dose2 > 0 && limitedTimeSlots.length > 1) {
            candidateSchedule.push({ time: limitedTimeSlots[1], mg: dose2 });
        }
        
        // 摂取量が同じなら、後の時間の方が有利なので、このチェックは単純化のためコメントアウトも可
        if(candidateSchedule.length === 1 && dose2 > 0) continue;


        const totalCaffeine = candidateSchedule.reduce((sum, d) => sum + d.mg, 0);

        if (totalCaffeine >= minTotalCaffeine) continue;

        if (this.checkScheduleEffectiveness(candidateSchedule, sleepHistory, params)) {
          minTotalCaffeine = totalCaffeine;
          bestSchedule = candidateSchedule;
        }
      }
    }
    return bestSchedule;
  }

  private checkScheduleEffectiveness(
    schedule: CaffeineDose[],
    sleepHistory: SleepPeriod[],
    params: OptimizationParams
  ): boolean {
    const { timeWindow, targetPerformance } = params;

    // 30分ごとにパフォーマンスをチェック
    for (let t = timeWindow.start.getTime(); t <= timeWindow.end.getTime(); t += 30 * 60 * 1000) {
      const performance = this.model.predict(new Date(t), sleepHistory, schedule);
      if (performance < targetPerformance) {
        return false;
      }
    }
    return true;
  }
}
