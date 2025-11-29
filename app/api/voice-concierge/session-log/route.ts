import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // In a real app, we'd save this to a database
    // For now, we'll just log it to the server console which Netlify captures
    console.log("[Voice Concierge] Session Log:", JSON.stringify(body, null, 2));
    
    return NextResponse.json({ status: "ok", stored: true });
  } catch (error) {
    console.error("[Voice Concierge] Log Error:", error);
    return NextResponse.json(
      { error: "Failed to log session" },
      { status: 500 }
    );
  }
}

