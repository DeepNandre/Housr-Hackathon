import { NextRequest, NextResponse } from "next/server";

interface UserPreferences {
  city?: string;
  budget?: string;
  moveInDate?: string;
  roomType?: string;
  amenities: string[];
}

// Known UK cities for matching
const UK_CITIES = [
  "manchester", "london", "birmingham", "leeds", "sheffield", "nottingham",
  "bristol", "liverpool", "newcastle", "edinburgh", "glasgow", "cardiff",
  "oxford", "cambridge", "brighton", "bath", "exeter", "york", "durham",
  "southampton", "portsmouth", "reading", "leicester", "coventry", "hull"
];

// Extract preferences from user message - IMPROVED
function extractPreferences(text: string, existing: UserPreferences): UserPreferences {
  const lower = text.toLowerCase();
  const updated = { 
    ...existing,
    amenities: [...(existing.amenities || [])]
  };

  // CITY EXTRACTION - Check for known cities first (most reliable)
  for (const city of UK_CITIES) {
    if (lower.includes(city)) {
      // Capitalize first letter
      updated.city = city.charAt(0).toUpperCase() + city.slice(1);
      break;
    }
  }
  
  // Also try pattern matching for other cities
  if (!updated.city) {
    const cityPatterns = [
      /(?:in|at|near|around|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(?:city|centre|center|area)?/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:city|centre|center|area)/i,
    ];
    
    for (const pattern of cityPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        const potentialCity = match[1].trim();
        // Filter out common false positives
        if (!["the", "for", "and", "with", "near"].includes(potentialCity.toLowerCase())) {
          updated.city = potentialCity;
          break;
        }
      }
    }
  }

  // BUDGET EXTRACTION - More patterns
  const budgetPatterns = [
    /(\d{2,4})\s*(?:pounds?|£|gbp)?\s*(?:per|a|\/|each)?\s*(?:week|wk|pw)/i,
    /(?:£|gbp)?\s*(\d{2,4})\s*(?:per|a|\/|each)?\s*(?:week|wk|pw)/i,
    /(?:budget|afford|pay|spend|around|about|roughly)\s*(?:is|of)?\s*(?:£|gbp)?\s*(\d{2,4})/i,
    /(\d{2,4})\s*(?:pounds?|£|gbp)\s*(?:per|a)?\s*(?:month|mo|pm)/i,
  ];

  for (const pattern of budgetPatterns) {
    const match = lower.match(pattern);
    if (match && match[1]) {
      const amount = parseInt(match[1]);
      if (amount >= 50 && amount <= 2000) {
        // Determine weekly vs monthly
        if (lower.includes("month") || lower.includes("pm") || amount > 500) {
          updated.budget = `£${amount}/month`;
        } else {
          updated.budget = `£${amount}/week`;
        }
        break;
      }
    }
  }

  // MOVE-IN DATE EXTRACTION
  const months = ["january", "february", "march", "april", "may", "june", 
                  "july", "august", "september", "october", "november", "december"];
  
  for (const month of months) {
    if (lower.includes(month)) {
      updated.moveInDate = month.charAt(0).toUpperCase() + month.slice(1);
      break;
    }
  }
  
  // Other date patterns
  if (!updated.moveInDate) {
    if (lower.includes("asap") || lower.includes("immediately") || lower.includes("as soon as")) {
      updated.moveInDate = "ASAP";
    } else if (lower.includes("next month")) {
      updated.moveInDate = "Next month";
    } else if (lower.includes("next week")) {
      updated.moveInDate = "Next week";
    }
  }

  // ROOM TYPE
  if (lower.includes("studio")) {
    updated.roomType = "studio";
  } else if (lower.includes("en-suite") || lower.includes("ensuite") || lower.includes("en suite")) {
    updated.roomType = "en-suite";
  } else if (lower.includes("shared") || lower.includes("share")) {
    updated.roomType = "shared";
  } else if (lower.includes("private") || lower.includes("own room") || lower.includes("single")) {
    updated.roomType = "private room";
  }

  // AMENITIES
  const amenityMap: Record<string, string> = {
    "bills included": "bills included",
    "bills inc": "bills included",
    "all bills": "bills included",
    "wifi": "WiFi",
    "internet": "WiFi",
    "gym": "gym access",
    "parking": "parking",
    "car park": "parking",
    "garden": "garden",
    "balcony": "balcony",
    "furnished": "furnished",
    "near campus": "near campus",
    "close to uni": "near campus",
    "quiet": "quiet area",
    "modern": "modern",
  };
  
  for (const [keyword, amenity] of Object.entries(amenityMap)) {
    if (lower.includes(keyword) && !updated.amenities.includes(amenity)) {
      updated.amenities.push(amenity);
    }
  }

  return updated;
}

// Determine what to ask next
function getNextQuestion(prefs: UserPreferences, messageCount: number): string | null {
  // Priority order: city, budget, move-in date, room type
  if (!prefs.city) return "city";
  if (!prefs.budget) return "budget";
  if (!prefs.moveInDate && messageCount < 5) return "moveInDate";
  if (!prefs.roomType && messageCount < 6) return "roomType";
  return null;
}

// Generate natural response
function generateResponse(
  userMessage: string,
  prefs: UserPreferences,
  messageCount: number
): { response: string; shouldFinalize: boolean } {
  
  // Build acknowledgment of NEW info we just learned
  const newInfo: string[] = [];
  if (prefs.city) newInfo.push(prefs.city);
  if (prefs.budget) newInfo.push(prefs.budget);
  if (prefs.moveInDate) newInfo.push(prefs.moveInDate);
  if (prefs.roomType) newInfo.push(`${prefs.roomType} room`);
  if (prefs.amenities.length > 0) newInfo.push(prefs.amenities.slice(-2).join(" and "));

  // Check what's next
  const nextQuestion = getNextQuestion(prefs, messageCount);
  
  // If we have city AND budget, we can finalize (move-in and room type are optional)
  const hasEnoughInfo = prefs.city && prefs.budget;
  const shouldFinalize = hasEnoughInfo && (messageCount >= 3 || !nextQuestion);

  if (shouldFinalize) {
    let summary = "Perfect! ";
    const details: string[] = [];
    if (prefs.city) details.push(`looking in ${prefs.city}`);
    if (prefs.budget) details.push(`budget of ${prefs.budget}`);
    if (prefs.moveInDate) details.push(`moving in ${prefs.moveInDate}`);
    if (prefs.roomType) details.push(`wanting a ${prefs.roomType}`);
    
    summary += `So you're ${details.join(", ")}. `;
    summary += "I've found some great options for you!";
    
    return { response: summary, shouldFinalize: true };
  }

  // Build response with acknowledgment + next question
  let response = "";
  
  // Acknowledge what we understood
  if (newInfo.length > 0) {
    response = `Great, ${newInfo.join(", ")}! `;
  }

  // Ask the next natural question
  switch (nextQuestion) {
    case "city":
      response += "Which city or area are you looking to live in?";
      break;
    case "budget":
      response += "What's your budget per week?";
      break;
    case "moveInDate":
      response += "When are you looking to move in?";
      break;
    case "roomType":
      response += "Would you prefer a studio, en-suite, or shared accommodation?";
      break;
    default:
      response += "Anything else you'd like in your accommodation?";
  }

  return { response, shouldFinalize: false };
}

// Generate property recommendations based on preferences
function generateRecommendations(prefs: UserPreferences) {
  const city = prefs.city || "the city";
  
  // Parse budget for display
  let budgetNum = 180;
  if (prefs.budget) {
    const match = prefs.budget.match(/(\d+)/);
    if (match) budgetNum = parseInt(match[1]);
  }
  
  const isWeekly = prefs.budget?.includes("week");
  const priceLow = isWeekly ? `£${budgetNum - 30}/week` : `£${budgetNum - 100}/month`;
  const priceMid = prefs.budget || "£180/week";
  const priceHigh = isWeekly ? `£${budgetNum + 20}/week` : `£${budgetNum + 50}/month`;

  return [
    {
      title: `${prefs.roomType === "studio" ? "Modern Studio" : "En-Suite Room"} in ${city}`,
      price: priceMid,
      summary: `${prefs.amenities.includes("bills included") ? "Bills included, " : ""}5 min walk to campus${prefs.amenities.includes("quiet area") ? ", quiet street" : ""}.`,
    },
    {
      title: `Cozy ${prefs.roomType || "Room"} near ${city} University`,
      price: priceLow,
      summary: `Great value, ${prefs.moveInDate ? `available from ${prefs.moveInDate}` : "flexible move-in"}, friendly housemates.`,
    },
    {
      title: `Premium ${prefs.roomType || "Apartment"} - ${city} Centre`,
      price: priceHigh,
      summary: `${prefs.amenities.includes("gym access") ? "Gym onsite, " : ""}fully furnished, modern building.`,
    },
  ];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      message, 
      conversationHistory = [], 
      preferences: existingPrefs = { amenities: [] } 
    } = body;

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    console.log("[Chat] Incoming:", message);
    console.log("[Chat] Existing prefs:", existingPrefs);

    // Extract/update preferences from user message
    const preferences = extractPreferences(message, existingPrefs);
    
    console.log("[Chat] Updated prefs:", preferences);

    // Count messages (user messages only)
    const userMsgCount = conversationHistory.filter(
      (m: { role: string }) => m.role === "user"
    ).length + 1;

    // Generate response
    const { response, shouldFinalize } = generateResponse(
      message, 
      preferences, 
      userMsgCount
    );

    console.log("[Chat] Response:", response, "Finalize:", shouldFinalize);

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
