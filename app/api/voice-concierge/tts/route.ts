import { NextRequest, NextResponse } from "next/server";
import { generateVoiceReply } from "@/lib/eleven";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, agent_id } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Missing text parameter" },
        { status: 400 }
      );
    }

    // Use the voice ID from env or the passed agent_id (if it's a voice ID)
    // In this implementation, we'll prefer the env var ELEVENLABS_VOICE_ID if available,
    // otherwise fall back to the default in lib/eleven.ts
    // Note: agent_id from frontend might be an ElevenLabs Agent ID or a Voice ID.
    // The generateVoiceReply function expects a Voice ID.
    // If agent_id is actually an Agent ID, we might need different logic, 
    // but for simple TTS, we just need a Voice ID.
    
    // Let's check if we have a specific voice ID in env to override
    const voiceId = process.env.ELEVENLABS_VOICE_ID || undefined;

    console.log("[Voice Concierge] Generating speech for:", text.substring(0, 50) + "...");

    const audioBuffer = await generateVoiceReply(text, voiceId);

    // Convert Node.js Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(audioBuffer);

    return new NextResponse(uint8Array, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("[Voice Concierge] TTS Error:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}

