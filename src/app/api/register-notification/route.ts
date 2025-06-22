import { NextRequest, NextResponse } from "next/server";
import { NotificationSubscription } from "@/types/notifications";

interface NotificationRequest {
  userId: string;
  notificationTime: string;
  subscription: NotificationSubscription;
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== Notification Registration Debug ===");
    const body: NotificationRequest = await request.json();
    console.log("Request body:", JSON.stringify(body, null, 2));
    
    const { userId, notificationTime, subscription } = body;

    // バリデーション
    if (!userId || !notificationTime || !subscription) {
      console.log("Validation failed - missing fields:", { 
        hasUserId: !!userId, 
        hasNotificationTime: !!notificationTime, 
        hasSubscription: !!subscription 
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 通知時刻が未来の時刻であることを確認
    const notificationDate = new Date(notificationTime);
    const now = new Date();
    console.log("Time validation:", {
      notificationTime,
      notificationDate: notificationDate.toISOString(),
      now: now.toISOString(),
      isFuture: notificationDate > now
    });
    
    if (notificationDate <= now) {
      console.log("Validation failed - time is not in future");
      return NextResponse.json(
        { error: "Notification time must be in the future" },
        { status: 400 },
      );
    }

    // Upstash Redisに保存
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    console.log("Redis configuration check:", {
      hasRedisUrl: !!redisUrl,
      hasRedisToken: !!redisToken,
      redisUrlPrefix: redisUrl ? redisUrl.substring(0, 20) + "..." : "undefined",
      redisTokenPrefix: redisToken ? redisToken.substring(0, 10) + "..." : "undefined"
    });

    if (!redisUrl || !redisToken) {
      console.error("Redis configuration missing:", {
        hasRedisUrl: !!redisUrl,
        hasRedisToken: !!redisToken,
      });
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    // Redis保存用のデータ
    const notificationData = {
      userId,
      notificationTime,
      subscription,
      createdAt: new Date().toISOString(),
    };

    // TTLを計算（通知時刻から1時間後に自動削除）
    const ttlSeconds = Math.floor(
      (notificationDate.getTime() + 3600000 - Date.now()) / 1000,
    );

    // Redisに保存（キー: notification:{userId}:{timestamp}）
    const redisKey = `notification:${userId}:${notificationDate.getTime()}`;
    
    console.log("Redis save attempt:", {
      redisKey,
      ttlSeconds,
      dataSize: JSON.stringify(notificationData).length
    });

    // Upstash Redis REST APIの正しい形式でTTLを設定
    const redisPayload = [redisKey, JSON.stringify(notificationData), "EX", ttlSeconds];

    console.log("Redis payload:", redisPayload);

    const url = `${redisUrl}/set/${encodeURIComponent(redisKey)}?EX=${ttlSeconds}&value=${encodeURIComponent(JSON.stringify(notificationData))}`;

    const redisResponse = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${redisToken}`,
      },
    });
    console.log("Redis response status:", redisResponse.status);
    console.log("Redis response headers:", Object.fromEntries(redisResponse.headers.entries()));

    if (!redisResponse.ok) {
      const errorText = await redisResponse.text();
      console.error("Redis save failed:", {
        status: redisResponse.status,
        statusText: redisResponse.statusText,
        errorText,
        url: `${redisUrl}/set`
      });
      return NextResponse.json(
        { error: "Failed to save notification", details: errorText },
        { status: 500 },
      );
    }

    const redisResult = await redisResponse.json();
    console.log("Redis save success:", redisResult);

    console.log(`Notification registered: ${redisKey}`);

    return NextResponse.json({
      success: true,
      notificationId: redisKey,
      scheduledTime: notificationTime,
    });
  } catch (error) {
    console.error("Notification registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
