// src/app/api/plan/route.ts

import { NextResponse } from 'next/server';
// 仮のダミーデータを返す関数（CaffeineOptimizerが完成するまでの代替）
import { calcFocusData } from '@/lib/calcFocusData'; 

// --- 型定義（本来は interfaces.ts からインポート） ---
export type FocusPeriod = {
  start: string; // "09:00"
  end: string;   // "17:00"
};

// --- APIのメイン処理 ---
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // フロントエンドから渡されるデータ形式に合わせる
    const { bed_time, wake_time, focus_periods } = body;

    // バリデーション
    if (!bed_time || !wake_time || !focus_periods || focus_periods.length === 0) {
      return NextResponse.json(
        { error: '必須の時刻データが不足しています。' },
        { status: 400 }
      );
    }
    
    // --- 本来ここで CaffeineOptimizer を使ってカフェイン計画を計算する ---
    // const optimizer = new CaffeineOptimizer();
    // const optimalSchedule = optimizer.findOptimalSchedule(...);
    // const caffeinePlan = ...;

    // --- カフェイン計画に基づき、集中度予測データを生成する ---
    // 現状はCaffeineOptimizerがないため、calcFocusDataでダミーのグラフデータを生成して返す
    // 最初の有効な集中時間帯をフォールバックとして使用
    const firstFocusPeriod = focus_periods.find((p: FocusPeriod) => p.start && p.end);
    if (!firstFocusPeriod) {
      return NextResponse.json(
        { error: '有効な集中時間がありません。' },
        { status: 400 }
      );
    }

    const predictedFocusData = calcFocusData(
      wake_time,
      bed_time,
      firstFocusPeriod.start,
      firstFocusPeriod.end
    );
    
    // 最終的なレスポンス
    // APIの責務として、グラフ用のデータも生成して返すとフロントが楽になる
    const responseData = {
      // caffeinePlan: [], // 本来はここに最適化された計画が入る
      data: predictedFocusData, // グラフ描画用のデータ
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'サーバーでエラーが発生しました。' },
      { status: 500 }
    );
  }
}