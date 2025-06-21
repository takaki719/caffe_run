import { NextResponse } from "next/server";

export async function GET() {
  try {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      return NextResponse.json(
        { error: "VAPID public key not configured" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      publicKey: vapidPublicKey,
    });
  } catch (error) {
    console.error("VAPID key fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
