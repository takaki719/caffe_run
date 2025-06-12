// src/app/api/calculate/route.ts

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // フロントエンドから送信されたJSONデータを取得
    const body = await request.json();
    const { bedTime, wakeTime, focusStart, focusEnd } = body;

    // 必須データが揃っているかチェック
    if (!bedTime || !wakeTime || !focusStart || !focusEnd) {
      return NextResponse.json(
        { error: '必須の時刻データが不足しています。' },
        { status: 400 }
      );
    }

    // ここでは受け取ったデータをそのまま返す
    // 将来的にはここでカフェイン摂取計画などの計算処理を行う
    const responseData = {
      bedTime,
      wakeTime,
      focusStart,
      focusEnd,
      // 必要であれば他の計算結果もここに追加
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