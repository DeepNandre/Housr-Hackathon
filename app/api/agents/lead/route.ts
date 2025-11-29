import { NextRequest, NextResponse } from "next/server";
import { createLead, CreateLeadInput } from "@/lib/leads";

/**
 * POST /api/agents/lead
 * 
 * Webhook endpoint for ElevenLabs Agent to create leads.
 * Called when the voice agent's create_lead tool is invoked.
 * 
 * Expected payload from ElevenLabs Agent:
 * {
 *   "name": "Rahul Sharma",
 *   "phone": "+44 7xxx",
 *   "email": "rahul@example.com",
 *   "city": "Manchester",
 *   "budget": "160 per week",
 *   "moveInDate": "September 2025",
 *   "preferences": "near UoM, bills included, quiet street"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Verify shared secret token for security
    const authHeader = request.headers.get("x-agent-secret");
    const expectedSecret = process.env.AGENT_WEBHOOK_SECRET;
    
    if (expectedSecret && authHeader !== expectedSecret) {
      console.warn("[Agent Lead API] Invalid or missing auth token");
      return NextResponse.json(
        { status: "error", message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse the incoming payload
    const body = await request.json();
    
    console.log("[Agent Lead API] Received create_lead request:", {
      name: body.name,
      phone: body.phone ? "***" + body.phone.slice(-4) : "not provided",
      email: body.email ? "***@" + body.email.split("@")[1] : "not provided",
      city: body.city,
    });

    // Validate required fields
    if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
      return NextResponse.json(
        { status: "error", message: "Name is required" },
        { status: 400 }
      );
    }

    if (!body.phone && !body.email) {
      return NextResponse.json(
        { status: "error", message: "Either phone or email is required" },
        { status: 400 }
      );
    }

    // Create the lead input
    const leadInput: CreateLeadInput = {
      name: body.name,
      phone: body.phone,
      email: body.email,
      city: body.city,
      budget: body.budget,
      moveInDate: body.moveInDate,
      preferences: body.preferences,
      source: "voice-agent", // Mark as coming from voice agent
    };

    // Create the lead
    const lead = await createLead(leadInput);

    console.log("[Agent Lead API] Lead created successfully:", {
      leadId: lead.id,
      name: lead.name,
    });

    // Return success response that ElevenLabs Agent can use
    return NextResponse.json({
      status: "ok",
      leadId: lead.id,
      message: `Lead created successfully for ${lead.name}`,
    });

  } catch (error) {
    console.error("[Agent Lead API] Error creating lead:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { status: "error", message: "Failed to create lead" },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 * Needed if ElevenLabs Agent calls from a different origin
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-agent-secret",
    },
  });
}

