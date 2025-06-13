// /src/app/api/plan/route.ts
// --------------------------------------------------
// APIエンドポイントのメイン処理

import { SleepPeriod, CaffeineDose, OptimizationParams } from '@/lib/optimizer/interfaces';
import { PerformanceModel} from '@/lib/optimizer/PerformanceModel';
import { CaffeineOptimizer } from '@/lib/optimizer/CaffeineOptimizer';
import { NextResponse } from 'next/server';

// --- 型定義（フロントエンドからのリクエストボディ） ---
export type FocusPeriodRequest = {
  start: string; // "09:00"
  end: string;   // "17:00"
};

/**
 * "HH:mm" 形式の時刻文字列を、指定された日付のDateオブジェクトに変換する
 * @param timeStr "HH:mm"
 * @param date 基準となる日付
 */
const timeToDate = (timeStr: string, date: Date): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bed_time, wake_time, focus_periods } = body;

    // --- バリデーション ---
    if (!bed_time || !wake_time || !focus_periods || focus_periods.length === 0) {
      return NextResponse.json({ error: '必須の時刻データが不足しています。' }, { status: 400 });
    }
    const firstFocusPeriod = focus_periods.find((p: FocusPeriodRequest) => p.start && p.end);
    if (!firstFocusPeriod) {
      return NextResponse.json({ error: '有効な集中時間がありません。' }, { status: 400 });
    }

    // --- データの前処理 ---
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const sleepHistory: SleepPeriod[] = [{
        start: timeToDate(bed_time, yesterday), // 就寝は昨日
        end: timeToDate(wake_time, today)       // 起床は今日
    }];
    
    const params: OptimizationParams = {
        timeWindow: {
            start: timeToDate(firstFocusPeriod.start, today),
            end: timeToDate(firstFocusPeriod.end, today),
        },
        targetPerformance: 0.6,
        maxDosePerIntake: 200,
        minTimeBetweenDosesHours: 0.5,
    };

    // --- 最適化の実行 ---
    const optimizer = new CaffeineOptimizer();
    const optimalSchedule = optimizer.findOptimalSchedule(sleepHistory, params) || [];

    // --- パフォーマンス予測グラフの生成 ---
    const model = new PerformanceModel();
    const predictedFocusData: { time: string, focus: number }[] = [];
    const dayStart = timeToDate(wake_time, today);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(dayEnd.getHours() + 18);

    for (let t = dayStart.getTime(); t <= dayEnd.getTime(); t += 15 * 60 * 1000) {
    const currentTime = new Date(t);
    const performance = model.predict(currentTime, sleepHistory, optimalSchedule);
    predictedFocusData.push({
        time: currentTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        focus: Math.round(performance * 100), // キーを "focus" に変更し、値を0-100の範囲にする
    });
    }

    // --- ここから変更点 ---

    /**
     * カフェイン摂取量(mg)を具体的な飲み物に変換するヘルパー関数
     * @param dose カフェイン摂取情報 { time: Date, mg: number }
     * @returns 変換後のオブジェクト { time: string, item: string, amount: string }
     */
    const doseToPlanItem = (dose: CaffeineDose) => {
        const mg = dose.mg;
        let item = "カフェインサプリ"; // デフォルト値
        let amount = `${mg} mg`;

        // カフェイン量に応じた代表的な飲み物のマッピング例
        if (mg > 0 && mg <= 70) { // 例: 50mg
            item = "緑茶";
            amount = "約2杯";
        } else if (mg > 70 && mg <= 120) { // 例: 100mg
            item = "ドリップコーヒー";
            amount = "約1杯";
        } else if (mg > 120 && mg <= 170) { // 例: 150mg
            item = "ドリップコーヒー (濃いめ)";
            amount = "約1杯";
        } else if (mg > 170) { // 例: 200mg
            item = "エナジードリンク";
            amount = "約1本";
        }
        //ここで辞書型で{time: string; // "08:00",item: string; // "ドリップコーヒー",amount: string; // 例: 1杯}返してるお
        return {
            time: dose.time.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
            item,
            amount,
        };
    };

    // --- 最終的なレスポンス ---
    const responseData = {
      caffeinePlan: optimalSchedule.map(dose => doseToPlanItem(dose)), // ヘルパー関数を使って変換
      data: predictedFocusData,
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: 'サーバーでエラーが発生しました。', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'サーバーで不明なエラーが発生しました。' }, { status: 500 });
  }
}
