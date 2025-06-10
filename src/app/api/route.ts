// src/app/api/route.ts
//一旦エラー回避で追加しているので、APIの実装時に消して
// 正しい API route の例
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello from API!" });
}
