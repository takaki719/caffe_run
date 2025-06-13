// /src/app/api/plan/route.ts
// --------------------------------------------------
// APIエンドポイントのメイン処理

import { SleepPeriod, OptimizationParams } from "@/lib/optimizer/interfaces";
import { PerformanceModel } from "@/lib/optimizer/PerformanceModel";
import { CaffeineOptimizer } from "@/lib/optimizer/CaffeineOptimizer";
import { NextResponse } from "next/server";

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
    const { bed_time, wake_time, focus_periods } = body;

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

    // --- データの前処理 ---
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const sleepHistory: SleepPeriod[] = [
      {
        start: timeToDate(bed_time, yesterday), // 就寝は昨日
        end: timeToDate(wake_time, today), // 起床は今日
      },
    ];

    const params: OptimizationParams = {
      timeWindows: validFocusPeriods.map((p: FocusPeriodRequest) => ({
        start: timeToDate(p.start, today),
        end: timeToDate(p.end, today),
      })),
      targetPerformance: 0.6,
      maxDosePerIntake: 200,
      minTimeBetweenDosesHours: 0.5, // 間隔を短くして柔軟性を高める
    };

    // --- 最適化の実行 ---
    const optimizer = new CaffeineOptimizer();
    const optimalSchedule =
      optimizer.findOptimalSchedule(sleepHistory, params) || [];

    // --- パフォーマンス予測グラフの生成 ---
    const model = new PerformanceModel();
    const predictedFocusData: { time: string; focus: number }[] = [];
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
        optimalSchedule,
      );
      predictedFocusData.push({
        time: currentTime.toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        focus: Math.round(performance * 100), // キーを "focus" に変更し、値を0-100の範囲にする
      });
    }

    // --- ここから変更点 ---

    // --------------------------------------------------
    /*
    const doseToPlanItem = (dose: CaffeineDose) => { ... }; // この関数を削除
    */

    // --- 最終的なレスポンス ---
    const responseData = {
      // optimalScheduleのmap処理を直接書き換える
      caffeinePlan: optimalSchedule.map((dose) => ({
        time: dose.time.toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        mg: dose.mg, // mgの値をそのまま返す
      })),
      data: predictedFocusData,
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
