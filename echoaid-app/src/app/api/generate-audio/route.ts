import { NextRequest, NextResponse } from "next/server";

// Sarah voice — confirmed free-tier compatible (EXAVITQu4vr4xnSDxMaL)
const VOICE_ID = "EXAVITQu4vr4xnSDxMaL";
const ELEVENLABS_API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

export async function POST(req: NextRequest) {
  // ── 1. Parse request body ───────────────────────────────────────────────
  let text: string;
  try {
    const body = await req.json();
    text = body?.text;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body. Expected { text: string }." },
      { status: 400 }
    );
  }

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing or empty `text` field in request body." },
      { status: 400 }
    );
  }

  // ── 2. Read API key from server-side environment ────────────────────────
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("[EchoAid] ELEVENLABS_API_KEY is not set.");
    return NextResponse.json(
      { error: "Server misconfiguration: ElevenLabs API key is missing." },
      { status: 500 }
    );
  }

  // ── 3. Call ElevenLabs TTS API ──────────────────────────────────────────
  let elevenLabsRes: Response;
  try {
    elevenLabsRes = await fetch(ELEVENLABS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });
  } catch (networkErr) {
    console.error("[EchoAid] Network error reaching ElevenLabs:", networkErr);
    return NextResponse.json(
      { error: "Failed to reach ElevenLabs API. Check your network." },
      { status: 502 }
    );
  }

  // ── 4. Forward non-2xx errors from ElevenLabs ──────────────────────────
  if (!elevenLabsRes.ok) {
    const errText = await elevenLabsRes.text();
    console.error(
      `[EchoAid] ElevenLabs returned ${elevenLabsRes.status}:`,
      errText
    );
    return NextResponse.json(
      {
        error: `ElevenLabs error (${elevenLabsRes.status})`,
        detail: errText,
      },
      { status: elevenLabsRes.status }
    );
  }

  // ── 5. Stream audio bytes back to the client ───────────────────────────
  // We pipe the ReadableStream directly so large responses don't buffer
  // entirely in memory on the server.
  const audioStream = elevenLabsRes.body;
  if (!audioStream) {
    return NextResponse.json(
      { error: "ElevenLabs returned an empty audio body." },
      { status: 502 }
    );
  }

  return new Response(audioStream, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      // Tell browsers not to cache API responses that depend on the key
      "Cache-Control": "no-store",
    },
  });
}
