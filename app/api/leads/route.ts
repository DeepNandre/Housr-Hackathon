import { NextResponse } from "next/server";
import { getAllLeads, getLeadCount } from "@/lib/leads";

/**
 * GET /api/leads
 * 
 * Returns all leads sorted by createdAt descending (newest first).
 * Used by the dashboard to display captured leads.
 */
export async function GET() {
  try {
    const leads = await getAllLeads();
    const count = await getLeadCount();

    console.log("[Leads API] Fetching leads:", { count });

    return NextResponse.json({
      status: "ok",
      count,
      leads,
    });

  } catch (error) {
    console.error("[Leads API] Error fetching leads:", error);

    return NextResponse.json(
      { status: "error", message: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

/**
 * Enable CORS for cross-origin requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

