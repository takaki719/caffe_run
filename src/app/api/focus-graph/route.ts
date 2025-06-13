import { NextResponse } from "next/server";
import { calcCurrentStatus } from "@/lib/calcCurrentStatus"; // ★変更
import { calcFocusData } from "@/lib/calcFocusData"; // ★変更
import type { CaffeineLogEntry } from "@/components/CaffeineLogTable"; // ★変更

// フロントエンドから送られてくるリクエストボディの型を定義
interface RequestBody {
  wake_time: string;
  bed_time: string;
  focus_periods: { start: string; end: string }[];
  caffeine_logs: CaffeineLogEntry[];
}

export async function POST(request: Request) {
  try {
    // リクエストのbodyから必要なデータを全て取得
    const body: RequestBody = await request.json();
    const { wake_time, bed_time, focus_periods, caffeine_logs } = body;

    // --- 1. 「現在の状態」のグラフデータを計算 ---
    const currentStatusData = calcCurrentStatus(
      caffeine_logs,
      wake_time,
      bed_time,
    );

    // --- 2. 「シミュレーション結果」のグラフデータを計算 ---
    const firstFocusPeriod = focus_periods.find((p) => p.start && p.end);
    let simulationData: any[] = [];
    if (firstFocusPeriod) {
      const rawSimulationData = calcFocusData(
        wake_time,
        bed_time,
        firstFocusPeriod.start,
        firstFocusPeriod.end,
      );
      // 'focus' というキーをグラフで使えるように 'value' に変換
      simulationData = rawSimulationData.map((d) => ({
        time: d.time,
        value: d.focus,
      }));
    }

    // --- 2種類のデータをまとめて返却 ---
    return NextResponse.json({
      currentStatusData,
      simulationData,
    });
  } catch (error) {
    console.error("API Error:", error);
    // エラーが発生した場合は、500エラーとエラーメッセージを返す
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
