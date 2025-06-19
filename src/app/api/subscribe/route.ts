// src/app/api/subscribe/route.ts
import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import webpush from "web-push";

// VAPIDキーの設定
if (
  !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  !process.env.VAPID_PRIVATE_KEY
) {
  throw new Error("VAPID keys are not set in environment variables.");
}

webpush.setVapidDetails(
  "mailto:hituyonai@gmail.com", //開発者のメールアドレス
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

export async function POST(request: Request) {
  try {
    const { userId, subscription } = await request.json();

    if (!userId || !subscription) {
      return NextResponse.json(
        { error: "Missing userId or subscription" },
        { status: 400 },
      );
    }

    // Vercel KVにユーザーIDをキーとして購読情報を保存
    await kv.set(`user:${userId}`, subscription);

    // 購読成功のウェルカム通知を送信
    const payload = JSON.stringify({
      title: "Caffe-Runへようこそ！",
      body: "通知設定が完了しました。",
    });

    await webpush.sendNotification(subscription, payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving subscription:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return new NextResponse(errorMessage, { status: 500 });
  }
}
