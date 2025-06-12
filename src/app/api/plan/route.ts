import { NextResponse } from "next/server";
import { calcFocusData } from "../../../lib/calcFocusData";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wake_time, bed_time, focus_periods } = body;

    if (
      !wake_time ||
      !bed_time ||
      !focus_periods ||
      focus_periods.length === 0
    ) {
      return NextResponse.json(
        { error: "必要なデータが不足しています。" },
        { status: 400 },
      );
    }

    // 現在のcalcFocusDataは引数を4つしか取れないため、
    // ひとまず最初の集中時間帯のみ利用します。
    // いずれ、複数の集中時間帯を考慮したアルゴリズムへ置き換える必要があります。
    const firstFocusPeriod = focus_periods[0];

    const focusData = calcFocusData(
      wake_time,
      bed_time,
      firstFocusPeriod.start,
      firstFocusPeriod.end,
    );

    return NextResponse.json({ data: focusData });
  } catch (error) {
    console.error("APIエラー:", error);
    return NextResponse.json(
      { error: "サーバー内部でエラーが発生しました。" },
      { status: 500 },
    );
  }
}
