// /src/lib/optimizer/PerformanceModel.ts
// --------------------------------------------------
// 睡眠とカフェインの効果を計算するコアロジック

import { SleepPeriod, CaffeineDose } from "./interfaces";
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

    // targetTimeより前の直近の起床時刻を取得する
    const relevantSleepPeriods = sleepHistory.filter(
      (s) => s.end <= targetTime,
    );
    relevantSleepPeriods.sort((a, b) => b.end.getTime() - a.end.getTime());

    // 適切な睡眠履歴がない場合は、デフォルトで午前6時起床と仮定する
    const wakeUpTime =
      relevantSleepPeriods.length > 0
        ? relevantSleepPeriods[0].end
        : new Date(new Date(targetTime).setHours(6, 0, 0, 0));

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

      // step関数にwakeUpTimeを渡す
      state = this.step(
        state,
        this.isSleeping(state.time, sleepHistory),
        wakeUpTime,
      );
      state.time = nextTime;
    }
    // パフォーマンス計算に起床時刻を渡す
    return this.calculatePerformance(state, wakeUpTime);
  }

  /**
   * 1タイムステップ分、状態を進める
   */
  // 引数に `wakeUpTime` を追加
  private step(
    currentState: ModelState,
    isSleeping: boolean,
    wakeUpTime: Date,
  ): ModelState {
    const dt = C.TIME_STEP_SECONDS / 3600; // 時間単位に変換
    const nextState = { ...currentState };

    if (isSleeping) {
      // 睡眠中は睡眠圧が減衰する
      nextState.processS -= currentState.processS * C.PROCESS_S_DECAY_RATE * dt;
    } else {
      // --- 2プロセスモデルの統合ロジック ---
      // 現在の概日リズム(Process C)を計算
      const currentHours =
        currentState.time.getHours() + currentState.time.getMinutes() / 60;
      const PEAK_HOURS_AFTER_WAKE = 2; // パフォーマンス計算時と値を合わせる
      const wakeUpHours = wakeUpTime.getHours() + wakeUpTime.getMinutes() / 60;
      const peakTime = wakeUpHours + PEAK_HOURS_AFTER_WAKE;
      const processC =
        0.5 * (1 + Math.sin((currentHours - peakTime) * (Math.PI / 12)));

      // Process C の値に応じて、Process S の上昇率を変動させる
      // Process C が高い（覚醒度が高い）時 → 上昇率は低く
      // Process C が低い（覚醒度が低い）時 → 上昇率は高く
      // 例: processCが1.0の時、上昇率は基本値の0.7倍。0.0の時、1.3倍。
      const modulationFactor = 1.3 - 0.6 * processC;
      const modulatedIncreaseRate =
        C.PROCESS_S_INCREASE_RATE * modulationFactor;

      nextState.processS += modulatedIncreaseRate * dt;
    }
    nextState.processS = Math.max(0, nextState.processS);

    // カフェイン濃度の計算
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
  // 引数に `wakeUpTime` を追加
  private calculatePerformance(state: ModelState, wakeUpTime: Date): number {
    const hours = state.time.getHours() + state.time.getMinutes() / 60;

    // 覚醒度のピークは起床から数時間後と仮定する
    // 元のモデルではピークが8時であり、一般的な起床時刻を6時と仮定すると、ピークは起床の2時間後
    const PEAK_HOURS_AFTER_WAKE = 2;
    const wakeUpHours = wakeUpTime.getHours() + wakeUpTime.getMinutes() / 60;
    const peakTime = wakeUpHours + PEAK_HOURS_AFTER_WAKE;

    // 起床時刻に合わせて概日リズム(processC)の位相をシフトさせる
    const processC = 0.5 * (1 + Math.sin((hours - peakTime) * (Math.PI / 12)));

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
