import { NextRequest, NextResponse } from "next/server";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface UserPreferences {
  city?: string;
  budget?: string;
  moveInDate?: string;
  roomType?: string;
  amenities: string[];
  otherNotes: string[];
}

// Extract preferences from user message
function extractPreferences(text: string, existing: UserPreferences): UserPreferences {
  const lower = text.toLowerCase();
  const updated = { ...existing };

  // City extraction - more comprehensive
  const cityPatterns = [
    /(?:in|at|near|around)\s+([a-z\s]+?)(?:\s+(?:area|city|town|uni|university|campus)|[,.]|$)/i,
    /(?:looking for|want|need|searching)\s+(?:a\s+)?(?:room|place|flat|apartment)\s+(?:in|at|near)\s+([a-z\s]+)/i,
    /(?:manchester|london|birmingham|leeds|sheffield|nottingham|bristol|liverpool|newcastle|edinburgh|glasgow|cardiff|oxford|cambridge)/i,
  ];
  
  for (const pattern of cityPatterns) {
    const match = text.match(pattern);
    if (match) {
      updated.city = match[1]?.trim() || match[0]?.trim();
      break;
    }
  }

  // Budget extraction - more flexible
  const budgetPatterns = [
    /(?:budget|spend|afford|pay|paying)\s*(?:is|of|around|about|up to)?\s*[£$]?\s*(\d{2,4})/i,
    /[£$]\s*(\d{2,4})\s*(?:per|a|\/)\s*(?:week|month|mo|wk)/i,
    /(\d{2,4})\s*(?:pounds?|dollars?|£|\$)\s*(?:per|a|\/)\s*(?:week|month)/i,
    /(?:around|about|roughly)\s*[£$]?\s*(\d{2,4})/i,
  ];

  for (const pattern of budgetPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = match[1];
      // Determine if weekly or monthly based on context
      if (lower.includes("week") || parseInt(amount) < 400) {
        updated.budget = `£${amount}/week`;
      } else {
        updated.budget = `£${amount}/month`;
      }
      break;
    }
  }

  // Move-in date
  const datePatterns = [
    /(?:move|moving|start|from)\s*(?:in)?\s*(?:on|by|around|in)?\s*(january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{4})?/i,
    /(?:september|october|january|february)\s*(?:\d{4})?/i,
    /(next\s+(?:week|month|semester|year))/i,
    /(asap|immediately|as soon as possible)/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      updated.moveInDate = match[1] || match[0];
      break;
    }
  }

  // Room type
  if (lower.includes("studio")) updated.roomType = "studio";
  else if (lower.includes("en-suite") || lower.includes("ensuite")) updated.roomType = "en-suite";
  else if (lower.includes("shared")) updated.roomType = "shared";
  else if (lower.includes("private") || lower.includes("own room")) updated.roomType = "private room";

  // Amenities
  const amenityKeywords = [
    "bills included", "wifi", "gym", "parking", "garden", "balcony",
    "furnished", "washing machine", "dishwasher", "near campus",
    "quiet", "social", "modern", "clean", "safe", "security"
  ];
  
  for (const amenity of amenityKeywords) {
    if (lower.includes(amenity) && !updated.amenities.includes(amenity)) {
      updated.amenities.push(amenity);
    }
  }

  return updated;
}

// Generate contextual response based on conversation
function generateResponse(
  userMessage: string,
  preferences: UserPreferences,
  messageCount: number
): { response: string; shouldFinalize: boolean } {
  const lower = userMessage.toLowerCase();
  
  // Check for greetings
  if (messageCount === 1 && (lower.includes("hi") || lower.includes("hello") || lower.includes("hey"))) {
    return {
      response: "Hey there! I'm your Housr housing assistant. I'll help you find the perfect student accommodation. What city are you looking in, and when do you need to move?",
      shouldFinalize: false
    };
  }

  // Check what info we're missing
  const missing: string[] = [];
  if (!preferences.city) missing.push("city");
  if (!preferences.budget) missing.push("budget");
  if (!preferences.moveInDate) missing.push("move-in date");
  if (!preferences.roomType) missing.push("room type preference");

  // Build acknowledgment of what we understood
  const understood: string[] = [];
  if (preferences.city) understood.push(`${preferences.city}`);
  if (preferences.budget) understood.push(`budget of ${preferences.budget}`);
  if (preferences.moveInDate) understood.push(`moving in ${preferences.moveInDate}`);
  if (preferences.roomType) understood.push(`${preferences.roomType} room`);
  if (preferences.amenities.length > 0) understood.push(preferences.amenities.slice(0, 2).join(", "));

  // If user is asking a question
  if (lower.includes("?") || lower.startsWith("what") || lower.startsWith("how") || lower.startsWith("do you")) {
    if (lower.includes("bills") || lower.includes("utilities")) {
      return {
        response: "Great question! Many of our properties include bills in the rent - that covers electricity, gas, water, and wifi. I can filter for bills-included options. " + 
          (missing.length > 0 ? `By the way, what's your ${missing[0]}?` : "Shall I show you some options?"),
        shouldFinalize: false
      };
    }
    if (lower.includes("viewing") || lower.includes("visit") || lower.includes("see")) {
      return {
        response: "Absolutely! We can arrange virtual tours or in-person viewings. Once I find some matches for you, I'll set that up. " +
          (missing.length > 0 ? `First, let me know your ${missing[0]}.` : "Let me pull up some options for you!"),
        shouldFinalize: missing.length === 0
      };
    }
  }

  // Check if we have enough info to finalize
  if (missing.length === 0 || (messageCount >= 4 && missing.length <= 1)) {
    const summary = understood.length > 0 
      ? `Perfect! I've got: ${understood.join(", ")}. ` 
      : "";
    return {
      response: `${summary}Let me find the best matches for you!`,
      shouldFinalize: true
    };
  }

  // Build contextual follow-up
  let response = "";
  
  if (understood.length > 0) {
    response = `Got it - ${understood.join(", ")}. `;
  } else {
    response = "Thanks for that. ";
  }

  // Ask for missing info naturally
  if (missing.length >= 3) {
    response += `To find you the perfect place, could you tell me which city you're looking in and roughly what budget you're working with?`;
  } else if (missing.includes("city")) {
    response += "Which city or area are you looking to live in?";
  } else if (missing.includes("budget")) {
    response += "What's your budget range per week or month?";
  } else if (missing.includes("moveInDate")) {
    response += "When are you looking to move in?";
  } else if (missing.includes("room type preference")) {
    response += "Do you prefer a studio, en-suite, or shared accommodation?";
  }

  return { response, shouldFinalize: false };
}

// Generate property recommendations
function generateRecommendations(preferences: UserPreferences) {
  const city = preferences.city || "your area";
  const budget = preferences.budget || "your budget";
  
  return [
    {
      title: `${preferences.roomType === "studio" ? "Modern Studio" : "En-Suite Room"} in ${city}`,
      price: preferences.budget || "£180/week",
      summary: `Bills included, 5 min to campus, ${preferences.amenities.includes("quiet") ? "quiet street" : "lively area"}.`,
    },
    {
      title: `Shared House near University`,
      price: "£150/week",
      summary: `3-bed shared, ${preferences.amenities.includes("garden") ? "with garden" : "modern kitchen"}, great for socializing.`,
    },
    {
      title: `Premium ${preferences.roomType || "En-Suite"} Apartment`,
      price: "£210/week",
      summary: `Gym onsite, furnished, flexible move-in dates available.`,
    },
  ];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory = [], preferences: existingPrefs = { amenities: [], otherNotes: [] } } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Missing message" },
        { status: 400 }
      );
    }

    // Extract/update preferences from user message
    const preferences = extractPreferences(message, existingPrefs);
    
    // Count user messages
    const userMessageCount = conversationHistory.filter((m: Message) => m.role === "user").length + 1;

    // Generate response
    const { response, shouldFinalize } = generateResponse(message, preferences, userMessageCount);

    // Generate recommendations if finalizing
    const recommendations = shouldFinalize ? generateRecommendations(preferences) : null;

    return NextResponse.json({
      response,
      preferences,
      shouldFinalize,
      recommendations,
    });

  } catch (error) {
    console.error("[Voice Concierge Chat] Error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}

