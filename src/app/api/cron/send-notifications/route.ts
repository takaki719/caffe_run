// src/app/api/cron/send-notifications/route.ts
import { kv } from "@/lib/kv";
import { NextResponse } from "next/server";
import webpush from "web-push";

// VAPIDキーの設定
if (
  !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  !process.env.VAPID_PRIVATE_KEY
) {
  console.warn("VAPID keys are not set. Push notifications are disabled.");
} else {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_MAILTO || "admin@example.com"}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

// Cron Jobが叩くためのGETハンドラ
export async function GET() {
  if (!process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json(
      { success: false, message: "VAPID keys not configured." },
      { status: 500 },
    );
  }

  try {
    // 1. 全ユーザーのスケジュールキーを取得 ("schedules:...")
    const scheduleKeys = [];
    let cursor = 0;
    do {
      const [nextCursor, keys] = await kv.scan(cursor, {
        match: "schedules:*",
      });
      cursor = Number(nextCursor);
      scheduleKeys.push(...keys);
    } while (cursor !== 0);

    if (scheduleKeys.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No schedules to process.",
      });
    }

    const now = Math.floor(Date.now() / 1000); // 現在時刻をUnixタイムスタンプ（秒）で取得
    let sentCount = 0;

    // 2. 各ユーザーのスケジュールをチェック
    for (const key of scheduleKeys) {
      // 実行時間になったタスクを取得 (scoreが現在時刻以前のもの)
      const tasks = await kv.zrange(key, 0, now, { byScore: true });

      if (tasks.length === 0) {
        continue;
      }

      // 3. 取得したタスクに対して通知を送信
      const promises = tasks.map((task) => {
        const { userId, message, subscription } = JSON.parse(task as string);
        console.log(`Sending notification to userId: ${userId}`);
        return webpush
          .sendNotification(subscription, JSON.stringify(message))
          .catch((err) => {
            // もし購読が無効になっていたら（例：ユーザーが通知をブロック）、DBから削除する
            if (err.statusCode === 410 || err.statusCode === 404) {
              console.log(
                `Subscription for userId: ${userId} is expired or invalid. Deleting.`,
              );
              return kv.del(`user:${userId}`);
            }
            console.error(`Error sending notification to ${userId}:`, err);
          });
      });

      await Promise.all(promises);

      // 4. 送信済みのタスクをリストから削除
      await kv.zremrangebyscore(key, 0, now);
      sentCount += tasks.length;
    }

    return NextResponse.json({ success: true, sentCount });
  } catch (error) {
    console.error("Cron job failed:", error);
    const message =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return new NextResponse(message, { status: 500 });
  }
}
