// /src/lib/optimizer/PerformanceModel.ts
// --------------------------------------------------
// 睡眠とカフェインの効果を計算するコアロジック

import { SleepPeriod, CaffeineDose, OptimizationParams } from "./interfaces";
import * as C from "./constants";

// モデルが管理する内部状態
interface ModelState {
  time: Date;
  processS: number; // 睡眠圧
  caffeineInGut: number; // 胃の中のカフェイン量
  caffeineInPlasma: number; // 血漿中のカフェイン濃度
}

export class PerformanceModel {
  /**
   * 睡眠履歴とカフェイン履歴から未来のパフォーマンスを予測する
   */
  public predict(
    targetTime: Date,
    sleepHistory: SleepPeriod[],
    caffeineHistory: CaffeineDose[],
    initialProcessS: number = 0,
  ): number {
    // 履歴の中で最も古い睡眠開始時刻を見つける
    const firstSleepStart =
      sleepHistory.length > 0
        ? Math.min(...sleepHistory.map((s) => s.start.getTime()))
        : new Date().getTime();

    let state: ModelState = {
      time: new Date(firstSleepStart), // 履歴の開始時刻からシミュレーション
      processS: initialProcessS,
      caffeineInGut: 0,
      caffeineInPlasma: 0,
    };

    while (state.time < targetTime) {
      const currentTimeMs = state.time.getTime();
      const nextTime = new Date(currentTimeMs + C.TIME_STEP_SECONDS * 1000);

      const doseNow = caffeineHistory.find(
        (d) =>
          d.time.getTime() >= currentTimeMs &&
          d.time.getTime() < nextTime.getTime(),
      );
      if (doseNow) {
        state.caffeineInGut += doseNow.mg;
      }

      state = this.step(state, this.isSleeping(state.time, sleepHistory));
      state.time = nextTime;
    }

    return this.calculatePerformance(state);
  }

  /**
   * 1タイムステップ分、状態を進める
   */
  private step(currentState: ModelState, isSleeping: boolean): ModelState {
    const dt = C.TIME_STEP_SECONDS / 3600; // 時間単位に変換
    const nextState = { ...currentState };

    if (isSleeping) {
      nextState.processS -= currentState.processS * C.PROCESS_S_DECAY_RATE * dt;
    } else {
      nextState.processS += C.PROCESS_S_INCREASE_RATE * dt;
    }
    nextState.processS = Math.max(0, nextState.processS);

    const absorption =
      C.CAFFEINE_ABSORPTION_RATE * currentState.caffeineInGut * dt;
    const elimination =
      C.CAFFEINE_ELIMINATION_RATE * currentState.caffeineInPlasma * dt;
    nextState.caffeineInGut -= absorption;
    nextState.caffeineInPlasma += absorption - elimination;
    nextState.caffeineInGut = Math.max(0, nextState.caffeineInGut);
    nextState.caffeineInPlasma = Math.max(0, nextState.caffeineInPlasma);

    return nextState;
  }

  /**
   * 現在の状態からパフォーマンスを計算
   */
  private calculatePerformance(state: ModelState): number {
    const hours = state.time.getHours() + state.time.getMinutes() / 60;
    const processC = 0.5 * (1 + Math.sin((hours - 8) * (Math.PI / 12))); // 午前8時にピーク
    const caffeineEffect =
      C.CAFFEINE_MAX_EFFECT *
      (state.caffeineInPlasma / (C.CAFFEINE_EC50 + state.caffeineInPlasma));
    const performance = processC - state.processS + caffeineEffect;
    return Math.max(0, Math.min(1, performance));
  }

  private isSleeping(time: Date, sleepHistory: SleepPeriod[]): boolean {
    return sleepHistory.some((p) => time >= p.start && time < p.end);
  }
}
