import { NextResponse } from "next/server";

export async function GET() {
  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
      return NextResponse.json(
        { error: "Redis configuration missing" },
        { status: 500 }
      );
    }

    const testKey = `test:${Date.now()}`;
    const testValue = { message: "Hello Redis", timestamp: new Date().toISOString() };

    console.log("Testing Redis write...");
    
    // 書き込みテスト
    const writeResponse = await fetch(`${redisUrl}/set/${testKey}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        value: JSON.stringify(testValue),
        ex: 60, // 60秒で自動削除
      }),
    });

    console.log("Write response status:", writeResponse.status);
    
    if (!writeResponse.ok) {
      const writeError = await writeResponse.text();
      console.error("Write failed:", writeError);
      return NextResponse.json(
        { error: "Write failed", details: writeError },
        { status: 500 }
      );
    }

    const writeResult = await writeResponse.json();
    console.log("Write result:", writeResult);

    // 読み込みテスト
    const readResponse = await fetch(`${redisUrl}/get/${testKey}`, {
      headers: {
        Authorization: `Bearer ${redisToken}`,
      },
    });

    console.log("Read response status:", readResponse.status);

    if (!readResponse.ok) {
      const readError = await readResponse.text();
      console.error("Read failed:", readError);
      return NextResponse.json(
        { error: "Read failed", details: readError },
        { status: 500 }
      );
    }

    const readResult = await readResponse.json();
    console.log("Read result:", readResult);

    return NextResponse.json({
      success: true,
      testKey,
      writeResult,
      readResult: readResult.result ? JSON.parse(readResult.result) : null,
      message: "Redis read/write test completed"
    });

  } catch (error) {
    console.error("Redis test error:", error);
    return NextResponse.json(
      { error: "Test failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}