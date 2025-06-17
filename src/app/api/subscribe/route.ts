// src/app/api/subscribe/route.ts
import { NextResponse } from "next/server";
import { subscriptions } from "@/lib/store"; // 作成したストアをインポート

export async function POST(request: Request) {
  try {
    const subscription = await request.json();

    // TODO: 本来はここでデータベースに購読情報を保存します
    console.log("受け取った購読情報:", subscription);

    // Setを使うことで重複を気にせず追加できる
    subscriptions.add(subscription);

    console.log("現在の全購読情報数:", subscriptions.size);

    return NextResponse.json({
      success: true,
      message: "購読情報を受け取りました。",
    });
  } catch (error) {
    console.error("購読情報の保存中にエラー:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
