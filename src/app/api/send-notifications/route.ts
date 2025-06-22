import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

// VAPID設定（環境変数がある場合のみ）
const vapidDetails = {
  subject: process.env.VAPID_SUBJECT || "mailto:your-email@example.com",
  publicKey: process.env.VAPID_PUBLIC_KEY || "",
  privateKey: process.env.VAPID_PRIVATE_KEY || "",
};

// 環境変数が設定されている場合のみVAPID設定を初期化
if (vapidDetails.publicKey && vapidDetails.privateKey) {
  webpush.setVapidDetails(
    vapidDetails.subject,
    vapidDetails.publicKey,
    vapidDetails.privateKey,
  );
} else {
  console.warn("VAPID keys not found in environment variables");
}

export async function GET(request: NextRequest) {
  try {
    // セキュリティ: cronジョブから
    // のクエリパラメータでトークンチェック
    console.log("📥 Request received:", {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
    });
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    const expectedToken = process.env.CRON_SECRET;

    console.log("Debug auth check:", {
      token: token ? `${token.substring(0, 5)}...` : "undefined",
      expectedToken: expectedToken
        ? `${expectedToken.substring(0, 5)}...`
        : "undefined",
      hasExpectedToken: !!expectedToken,
    });

    if (!expectedToken || token !== expectedToken) {
      console.log("Auth failed:", {
        reason: !expectedToken ? "No CRON_SECRET" : "Token mismatch",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
      return NextResponse.json(
        { error: "Redis configuration missing" },
        { status: 500 },
      );
    }

    // 現在時刻の前後1分以内の通知を取得
    const now = new Date();
    const oneMinuteBefore = new Date(now.getTime() - 60000);
    const oneMinuteAfter = new Date(now.getTime() + 60000);

    // Redisからすべての通知キーを取得
    const keysResponse = await fetch(
      `${redisUrl}/keys/${encodeURIComponent("notification:*")}`,
      {
        headers: {
          Authorization: `Bearer ${redisToken}`,
        },
      },
    );

    if (!keysResponse.ok) {
      throw new Error("Failed to fetch notification keys");
    }

    const keysData = await keysResponse.json();
    const keys = keysData.result || [];

    let sentCount = 0;
    let errorCount = 0;

    // 各通知をチェックして送信
    for (const key of keys) {
      try {
        // 通知データを取得
        const dataResponse = await fetch(
          `${redisUrl}/get/${key}`,
          {
            headers: {
              Authorization: `Bearer ${redisToken}`,
            },
          },
        );

        if (!dataResponse.ok) continue;

        const dataResult = await dataResponse.json();
        if (!dataResult.result) continue;

        const notificationData = JSON.parse(dataResult.result);
        const notificationTime = new Date(notificationData.notificationTime);

        // 通知時刻が現在時刻の前後1分以内かチェック
        if (
          notificationTime >= oneMinuteBefore &&
          notificationTime <= oneMinuteAfter
        ) {
          // Push通知送信
          const payload = JSON.stringify({
            title: "カフェイン摂取リマインダー",
            body: "5分後にカフェイン摂取を推奨します ☕",
            url: "/",
          });

          await webpush.sendNotification(
            notificationData.subscription,
            payload,
          );

          // 送信後にRedisから削除
          await fetch(`${redisUrl}/del/${key}`, {
            headers: {
              Authorization: `Bearer ${redisToken}`,
            },
          });

          sentCount++;
          console.log(`Notification sent and deleted: ${key}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Failed to process notification ${key}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      errorCount,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Batch notification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
