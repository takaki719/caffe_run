// /src/app/api/plan/route.ts
// --------------------------------------------------
// APIエンドポイントのメイン処理（元の計算モデル）

import {
  CaffeineDose,
  SleepPeriod,
  OptimizationParams,
} from "@/lib/optimizer/interfaces";
import { PerformanceModel } from "@/lib/optimizer/PerformanceModel";
import { CaffeineOptimizer } from "@/lib/optimizer/CaffeineOptimizer";
import { NextResponse } from "next/server";
import type { CaffeineLogEntry } from "@/components/CaffeineLogTable";

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
    console.log("API /plan - Request received");
    const body = await request.json();
    console.log("API /plan - Request body:", body);
    const { bed_time, wake_time, focus_periods, caffeine_logs } = body;

    // --- バリデーション ---
    console.log("API /plan - Validation check:", {
      bed_time: !!bed_time,
      wake_time: !!wake_time,
      focus_periods: !!focus_periods,
      focus_periods_length: focus_periods?.length
    });
    
    if (
      !bed_time ||
      !wake_time ||
      !focus_periods ||
      focus_periods.length === 0
    ) {
      console.log("API /plan - Validation failed");
      return NextResponse.json(
        { error: "必須の時刻データが不足しています。" },
        { status: 400 },
      );
    }
    const validFocusPeriods = focus_periods.filter(
      (p: FocusPeriodRequest) => p.start && p.end,
    );
    console.log("API /plan - Valid focus periods:", validFocusPeriods);
    
    if (validFocusPeriods.length === 0) {
      console.log("API /plan - No valid focus periods");
      return NextResponse.json(
        { error: "有効な集中時間がありません。" },
        { status: 400 },
      );
    }

    // --- データの前処理 ---
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const bedTimeOnSameDay = timeToDate(bed_time, today);
    const wakeTimeOnSameDay = timeToDate(wake_time, today);

    const bedTimeDate =
      bedTimeOnSameDay > wakeTimeOnSameDay ? yesterday : today;

    const finalBedTime = timeToDate(bed_time, bedTimeDate);
    const finalWakeTime = timeToDate(wake_time, today);

    const sleepHistory: SleepPeriod[] = [
      {
        start: finalBedTime,
        end: finalWakeTime,
      },
    ];

    const actualCaffeineHistory: CaffeineDose[] = (caffeine_logs || [])
      .map((log: CaffeineLogEntry) => ({
        time: timeToDate(log.time, today),
        mg: log.caffeineMg,
      }))
      .sort((a, b) => a.time.getTime() - b.time.getTime()); // 時系列順にソート
    
    // デバッグ用: カフェイン履歴の詳細ログ
    console.log("API /plan - Caffeine History Details:", {
      originalLogs: caffeine_logs,
      processedHistory: actualCaffeineHistory.map(h => ({
        time: h.time.toLocaleTimeString(),
        mg: h.mg
      })),
      totalEntries: actualCaffeineHistory.length,
      isSorted: actualCaffeineHistory.every((h, i, arr) => 
        i === 0 || arr[i-1].time.getTime() <= h.time.getTime())
    });

    const sleepDurationMs = finalWakeTime.getTime() - finalBedTime.getTime();
    const sleepDurationHours = sleepDurationMs / (1000 * 60 * 60);

    const SHORT_SLEEP_THRESHOLD_HOURS = 5;
    const isShortSleep = sleepDurationHours < SHORT_SLEEP_THRESHOLD_HOURS;

    const fallbackDose = isShortSleep ? 200 : 200;
    const doseOptions = isShortSleep ? [150, 200] : [50, 100, 150, 200];

    const params: OptimizationParams = {
      timeWindows: validFocusPeriods.map((p: FocusPeriodRequest) => {
        const startDate = timeToDate(p.start, today);
        let endDate = timeToDate(p.end, today);

        if (startDate > endDate) {
          endDate = timeToDate(p.end, tomorrow);
        }

        return {
          start: startDate,
          end: endDate,
        };
      }),
      targetPerformance: 0.7,
      maxDosePerIntake: 200,
      minTimeBetweenDosesHours: 0.5,
      fallbackDose: fallbackDose,
      doseOptions: doseOptions,
    };

    const optimizer = new CaffeineOptimizer();
    const optimalSchedule = optimizer.findOptimalSchedule(sleepHistory, params);

    const model = new PerformanceModel();
    const simulationData: { time: string; value: number }[] = [];
    const dayStart = timeToDate(wake_time, today);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(dayEnd.getHours() + 18);

    const windowMinPerformances = new Array(params.timeWindows.length).fill(
      1.1,
    );

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
        params.timeWindows,
      );

      params.timeWindows.forEach((window, index) => {
        if (currentTime >= window.start && currentTime <= window.end) {
          windowMinPerformances[index] = Math.min(
            windowMinPerformances[index],
            performance,
          );
        }
      });

      simulationData.push({
        time: currentTime.toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        value: Math.max(5, Math.round(performance * 100)),
      });
    }

    const currentStatusData: { time: string; value: number }[] = [];
    for (
      let t = dayStart.getTime();
      t <= dayEnd.getTime();
      t += 15 * 60 * 1000
    ) {
      const currentTime = new Date(t);
      const performance = model.predict(
        currentTime,
        sleepHistory,
        actualCaffeineHistory,
        params.timeWindows,
      );
      currentStatusData.push({
        time: currentTime.toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        value: Math.max(5, Math.round(performance * 100)),
      });
    }

    const isRecommended = optimalSchedule && optimalSchedule.length > 0;

    const minPerformances = windowMinPerformances.map((v) => v);

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
      minPerformances,
      targetPerformance: params.targetPerformance,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("API /plan - Error occurred:", error);
    if (error instanceof Error) {
      console.error("API /plan - Error details:", {
        message: error.message,
        stack: error.stack
      });
      return NextResponse.json(
        { error: "サーバーでエラーが発生しました。", details: error.message },
        { status: 500 },
      );
    }
    console.error("API /plan - Unknown error:", error);
    return NextResponse.json(
      { error: "サーバーで不明なエラーが発生しました。" },
      { status: 500 },
    );
  }
}
