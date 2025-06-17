// src/app/api/cron/check-notifications/route.ts
import { NextResponse } from "next/server";
import { schedules } from "@/lib/store";
import webpush from "web-push";

export async function GET() {
  const now = new Date();

  // 送信すべき通知をフィルタリング
  const dueSchedules = schedules.filter((s) => s.notifyAt <= now);
  if (dueSchedules.length === 0) {
    return NextResponse.json({ message: "送信する通知はありません。" });
  }

  console.log(`${dueSchedules.length}件の通知を送信します...`);

  // VAPIDキーを設定
  webpush.setVapidDetails(
    "hituyonai@gmail.com", // プッシュサービスがサーバーから問題のある通知が大量に送られた場合に、サーバーの管理者に連絡するための連絡先
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  // 通知を送信
  const sendPromises = dueSchedules.map((schedule) =>
    webpush
      .sendNotification(schedule.subscription, schedule.payload)
      .catch((err) =>
        console.error(
          `ID ${schedule.subscription.endpoint.slice(-5)} への送信に失敗:`,
          err,
        ),
      ),
  );

  await Promise.all(sendPromises);

  // 送信済みのスケジュールを削除
  const remainingSchedules = schedules.filter((s) => s.notifyAt > now);
  schedules.length = 0; // 配列をクリア
  schedules.push(...remainingSchedules); // 未送信のものだけを戻す

  return NextResponse.json({ success: true, sent: dueSchedules.length });
}
