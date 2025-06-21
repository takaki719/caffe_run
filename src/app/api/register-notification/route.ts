import { NextRequest, NextResponse } from "next/server";
import { NotificationSubscription } from "@/types/notifications";

interface NotificationRequest {
  userId: string;
  notificationTime: string;
  subscription: NotificationSubscription;
}

export async function POST(request: NextRequest) {
  try {
    const body: NotificationRequest = await request.json();
    const { userId, notificationTime, subscription } = body;

    // バリデーション
    if (!userId || !notificationTime || !subscription) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 通知時刻が未来の時刻であることを確認
    const notificationDate = new Date(notificationTime);
    if (notificationDate <= new Date()) {
      return NextResponse.json(
        { error: "Notification time must be in the future" },
        { status: 400 },
      );
    }

    // Upstash Redisに保存
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
      console.error("Redis configuration missing:", { 
        hasRedisUrl: !!redisUrl, 
        hasRedisToken: !!redisToken 
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

    const redisResponse = await fetch(
      `${redisUrl}/setex/${redisKey}/${ttlSeconds}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notificationData),
      },
    );

    if (!redisResponse.ok) {
      const errorText = await redisResponse.text();
      console.error("Redis save failed:", errorText);
      return NextResponse.json(
        { error: "Failed to save notification" },
        { status: 500 },
      );
    }

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
