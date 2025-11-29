import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "API working", timestamp: new Date().toISOString() });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ 
    message: "POST working", 
    received: body,
    timestamp: new Date().toISOString() 
  });
}