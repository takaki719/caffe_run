import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    console.log("=== Manual Notification Send Test ===");
    console.log("VAPID check:", {
      hasPublicKey: !!vapidDetails.publicKey,
      hasPrivateKey: !!vapidDetails.privateKey,
      publicKeyPrefix: vapidDetails.publicKey
        ? vapidDetails.publicKey.substring(0, 10) + "..."
        : "undefined",
    });

    if (!vapidDetails.publicKey || !vapidDetails.privateKey) {
      return NextResponse.json(
        { error: "VAPID keys not configured" },
        { status: 500 },
      );
    }

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
      return NextResponse.json(
        { error: "Redis configuration missing" },
        { status: 500 },
      );
    }

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

    console.log("Found notification keys:", keys);

    let sentCount = 0;
    let errorCount = 0;
    const results = [];

    // 各通知をチェックして送信
    for (const key of keys) {
      try {
        console.log(`Processing key: ${key}`);

        // 通知データを取得
        const dataResponse = await fetch(`${redisUrl}/get/${key}`, {
          headers: {
            Authorization: `Bearer ${redisToken}`,
          },
        });

        if (!dataResponse.ok) {
          results.push({ key, status: "failed to get data" });
          continue;
        }

        const dataResult = await dataResponse.json();
        if (!dataResult.result) {
          results.push({ key, status: "no data" });
          continue;
        }

        const notificationData = JSON.parse(
          decodeURIComponent(dataResult.result),
        );
        console.log(`Notification data for ${key}:`, notificationData);

        // Push通知送信
        const payload = JSON.stringify({
          title: "テスト通知 - カフェイン摂取リマインダー",
          body: "手動送信テスト: 5分後にカフェイン摂取を推奨します ☕",
          url: "/",
        });

        console.log(`Sending notification for ${key}...`);
        await webpush.sendNotification(notificationData.subscription, payload);

        sentCount++;
        results.push({ key, status: "sent successfully" });
        console.log(`✓ Notification sent: ${key}`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Failed to process notification ${key}:`, error);
        results.push({
          key,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalKeys: keys.length,
      sentCount,
      errorCount,
      results,
      message: "Manual notification send test completed",
    });
  } catch (error) {
    console.error("Manual notification send error:", error);
    return NextResponse.json(
      {
        error: "Manual send failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
