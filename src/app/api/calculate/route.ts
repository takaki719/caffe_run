import { NextResponse } from 'next/server';
// これまで作成した計算ロジックをインポートします
import { calcFocusData } from '@/lib/calcFocusData'; // パスは環境に合わせて調整してください

// フロントエンドからのPOSTリクエストを処理する関数
export async function POST(request: Request) {
  try {
    // 送られてきたデータ（body）をJSONとして受け取る
    const { bedTime, wakeTime, focusStart, focusEnd } = await request.json();

    // データが不足している場合はエラーを返す
    if (!bedTime || !wakeTime || !focusStart || !focusEnd) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 受け取ったデータを使って、計算を実行する
    const result = calcFocusData(
      wakeTime,
      bedTime,
      focusStart,
      focusEnd
    );

    // 計算結果をフロントエンドに返す
    return NextResponse.json(result);

  } catch (error) {
    console.error("Calculation Error:", error);
    return NextResponse.json({ error: 'An error occurred during calculation.' }, { status: 500 });
  }
}