// /src/app/api/plan/route.ts
// --------------------------------------------------
// APIエンドポイントのメイン処理

import { SleepPeriod, OptimizationParams } from "@/lib/optimizer/interfaces";
import { PerformanceModel } from "@/lib/optimizer/PerformanceModel";
import { CaffeineOptimizer } from "@/lib/optimizer/CaffeineOptimizer";
import { NextResponse } from "next/server";
import { calcCurrentStatus } from "@/lib/calcCurrentStatus";


// --- 型定義（フロントエンドからのリクエストボディ） ---
export type FocusPeriodRequest = {
  start: string; // "09:00"
  end: string; // "17:00"
};

/**
 * "HH:mm" 形式の時刻文字列を、指定された日付のDateオブジェクトに変換する
 * @param timeStr "HH:mm"
 * @param date 基準となる日付
 */
const timeToDate = (timeStr: string, date: Date): Date => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bed_time, wake_time, focus_periods, caffeine_logs } = body;

    // --- バリデーション ---
    if (
      !bed_time ||
      !wake_time ||
      !focus_periods ||
      focus_periods.length === 0
    ) {
      return NextResponse.json(
        { error: "必須の時刻データが不足しています。" },
        { status: 400 },
      );
    }
    const validFocusPeriods = focus_periods.filter(
      (p: FocusPeriodRequest) => p.start && p.end,
    );
    if (validFocusPeriods.length === 0) {
      return NextResponse.json(
        { error: "有効な集中時間がありません。" },
        { status: 400 },
      );
    }
    const currentStatusData = calcCurrentStatus(
      caffeine_logs || [],
      wake_time,
      bed_time,
    );

    // --- データの前処理 ---
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // 時刻の前後関係を比較するために、一旦同じ日付のDateオブジェクトに変換
    const bedTimeOnSameDay = timeToDate(bed_time, today);
    const wakeTimeOnSameDay = timeToDate(wake_time, today);

    // 就寝時刻が起床時刻より後（例: 23:00 > 07:00）なら、就寝日は昨日とする
    // そうでなければ（例: 01:00 < 09:00）、就寝日も今日とする
    const bedTimeDate =
      bedTimeOnSameDay > wakeTimeOnSameDay ? yesterday : today;

    const sleepHistory: SleepPeriod[] = [
      {
        start: timeToDate(bed_time, bedTimeDate), // 日またぎを考慮した就寝時刻
        end: timeToDate(wake_time, today), // 起床は常に「今日」
      },
    ];

    const params: OptimizationParams = {
      timeWindows: validFocusPeriods.map((p: FocusPeriodRequest) => {
        const startDate = timeToDate(p.start, today);
        let endDate = timeToDate(p.end, today);

        // 集中時間の開始時刻が終了時刻より後の場合（例: 23:00 > 05:00）、
        // 日をまたいだと判断し、終了日を明日に設定する
        if (startDate > endDate) {
          endDate = timeToDate(p.end, tomorrow);
        }

        return {
          start: startDate,
          end: endDate,
        };
      }),
      targetPerformance: 0.65,
      maxDosePerIntake: 200,
      minTimeBetweenDosesHours: 0.5, // 間隔を短くして柔軟性を高める
    };

    // --- 最適化の実行 ---
    const optimizer = new CaffeineOptimizer();
    const optimalSchedule = optimizer.findOptimalSchedule(sleepHistory, params);

    // --- パフォーマンス予測グラフの生成 ---
    const model = new PerformanceModel();
    const simulationData: { time: string; value: number }[] = [];
    const dayStart = timeToDate(wake_time, today);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(dayEnd.getHours() + 18);

    for (
      let t = dayStart.getTime();
      t <= dayEnd.getTime();
      t += 15 * 60 * 1000
    ) {
      const currentTime = new Date(t);
      const performance = model.predict(
        currentTime,
        sleepHistory,
        optimalSchedule || [],
      );
      simulationData.push({
        time: currentTime.toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        value: Math.max(5, Math.round(performance * 100)), // キーを "focus" に変更し、値を0-100の範囲にする
      });
    }

    // --- 最終的なレスポンス ---
    const isRecommended = optimalSchedule && optimalSchedule.length > 0;

    const responseData = {
      recommended: isRecommended,
      caffeinePlan: isRecommended
        ? optimalSchedule.map((dose) => ({
            time: dose.time.toLocaleTimeString("ja-JP", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            caffeineAmount: dose.mg,
          }))
        : [],
      simulationData: simulationData,
      currentStatusData: currentStatusData,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("API Error:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "サーバーでエラーが発生しました。", details: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "サーバーで不明なエラーが発生しました。" },
      { status: 500 },
    );
  }
}
