import { NextRequest, NextResponse } from "next/server";

// Translation service is disabled per configuration to avoid external AI latency/503 errors
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = body?.title || "";
    const text = body?.text || "";

    return NextResponse.json({
      translatedTitle: title,
      translatedText: text,
      status: "disabled",
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload structure." },
      { status: 400 }
    );
  }
}
