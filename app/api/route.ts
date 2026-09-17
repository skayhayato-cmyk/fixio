import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: true,
    message: "Fixio API Gateway is online (Next.js App Router)",
    timestamp: new Date().toISOString(),
  });
}
