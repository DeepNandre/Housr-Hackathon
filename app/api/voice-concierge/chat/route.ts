import { NextRequest, NextResponse } from "next/server";

interface UserPreferences {
  city?: string;
  budget?: string;
  vibe?: string;
  moveInDate?: string;
  roomType?: string;
  amenities: string[];
}

// Conversation steps in order
type ConversationStep = "location" | "budget" | "vibe" | "finalize";

// Known UK cities for matching
const UK_CITIES = [
  "manchester", "london", "birmingham", "leeds", "sheffield", "nottingham",
  "bristol", "liverpool", "newcastle", "edinburgh", "glasgow", "cardiff",
  "oxford", "cambridge", "brighton", "bath", "exeter", "york", "durham",
  "southampton", "portsmouth", "reading", "leicester", "coventry", "hull",
  "warwick", "lancaster", "norwich", "canterbury", "belfast", "aberdeen"
];

// Vibe keywords mapping
const VIBE_KEYWORDS: Record<string, string[]> = {
  "social & lively": ["social", "lively", "party", "fun", "outgoing", "vibrant", "exciting", "nightlife", "active"],
  "quiet & studious": ["quiet", "studious", "peaceful", "calm", "study", "focused", "academic", "library"],
  "balanced & flexible": ["balanced", "flexible", "mix", "both", "moderate", "chill", "relaxed", "easy-going"],
  "modern & upscale": ["modern", "upscale", "luxury", "premium", "high-end", "new", "fancy", "nice"],
  "budget-friendly": ["budget", "cheap", "affordable", "value", "economic", "basic", "simple"]
};

// Extract preferences from user message
function extractPreferences(text: string, existing: UserPreferences): UserPreferences {
  const lower = text.toLowerCase();
  const updated = { 
    ...existing,
    amenities: [...(existing.amenities || [])]
  };

  // CITY EXTRACTION - Check for known cities
  if (!existing.city) {
    for (const city of UK_CITIES) {
      if (lower.includes(city)) {
        updated.city = city.charAt(0).toUpperCase() + city.slice(1);
        break;
      }
    }
    
    // Also try pattern matching for other cities
    if (!updated.city) {
      const cityPatterns = [
        /(?:in|at|near|around|to|live in|moving to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
        /([A-Z][a-z]+)\s+(?:city|centre|center|area|university|uni)/i,
      ];
      
      for (const pattern of cityPatterns) {
        const match = text.match(pattern);
        if (match && match[1] && match[1].length > 2) {
          const potentialCity = match[1].trim();
          if (!["the", "for", "and", "with", "near", "want", "need", "looking"].includes(potentialCity.toLowerCase())) {
            updated.city = potentialCity;
            break;
          }
        }
      }
    }
  }

  // BUDGET EXTRACTION
  if (!existing.budget) {
    const budgetPatterns = [
      /(\d{2,4})\s*(?:pounds?|£|gbp)?\s*(?:per|a|\/|each)?\s*(?:week|wk|pw)/i,
      /(?:£|gbp)?\s*(\d{2,4})\s*(?:per|a|\/|each)?\s*(?:week|wk|pw)/i,
      /(?:budget|afford|pay|spend|around|about|roughly|max|maximum)\s*(?:is|of|at)?\s*(?:£|gbp)?\s*(\d{2,4})/i,
      /(\d{2,4})\s*(?:pounds?|£|gbp)\s*(?:per|a)?\s*(?:month|mo|pm|monthly)/i,
      /(?:£|gbp)\s*(\d{2,4})/i,
    ];

    for (const pattern of budgetPatterns) {
      const match = lower.match(pattern);
      if (match && match[1]) {
        const amount = parseInt(match[1]);
        if (amount >= 50 && amount <= 3000) {
          if (lower.includes("month") || lower.includes("pm") || lower.includes("monthly") || amount > 600) {
            updated.budget = `£${amount}/month`;
          } else {
            updated.budget = `£${amount}/week`;
          }
          break;
        }
      }
    }
  }

  // VIBE EXTRACTION
  if (!existing.vibe) {
    for (const [vibe, keywords] of Object.entries(VIBE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lower.includes(keyword)) {
          updated.vibe = vibe;
          break;
        }
      }
      if (updated.vibe) break;
    }
  }

  // MOVE-IN DATE EXTRACTION (bonus info)
  if (!existing.moveInDate) {
    const months = ["january", "february", "march", "april", "may", "june", 
                    "july", "august", "september", "october", "november", "december"];
    
    for (const month of months) {
      if (lower.includes(month)) {
        updated.moveInDate = month.charAt(0).toUpperCase() + month.slice(1);
        break;
      }
    }
    
    if (!updated.moveInDate) {
      if (lower.includes("asap") || lower.includes("immediately") || lower.includes("as soon as")) {
        updated.moveInDate = "ASAP";
      } else if (lower.includes("next month")) {
        updated.moveInDate = "Next month";
      }
    }
  }

  // ROOM TYPE (bonus info)
  if (!existing.roomType) {
    if (lower.includes("studio")) {
      updated.roomType = "studio";
    } else if (lower.includes("en-suite") || lower.includes("ensuite")) {
      updated.roomType = "en-suite";
    } else if (lower.includes("shared")) {
      updated.roomType = "shared";
    } else if (lower.includes("private") || lower.includes("own room")) {
      updated.roomType = "private";
    }
  }

  // AMENITIES (bonus info)
  const amenityMap: Record<string, string> = {
    "bills included": "bills included",
    "bills inc": "bills included",
    "all bills": "bills included",
    "wifi": "WiFi",
    "gym": "gym",
    "parking": "parking",
    "furnished": "furnished",
    "near campus": "near campus",
    "close to uni": "near campus",
  };
  
  for (const [keyword, amenity] of Object.entries(amenityMap)) {
    if (lower.includes(keyword) && !updated.amenities.includes(amenity)) {
      updated.amenities.push(amenity);
    }
  }

  return updated;
}

// Determine current conversation step
function getCurrentStep(prefs: UserPreferences): ConversationStep {
  if (!prefs.city) return "location";
  if (!prefs.budget) return "budget";
  if (!prefs.vibe) return "vibe";
  return "finalize";
}

// Generate contextual response based on step
function generateResponse(
  userMessage: string,
  prefs: UserPreferences
): { response: string; shouldFinalize: boolean; step: ConversationStep } {
  
  const step = getCurrentStep(prefs);
  let response = "";

  switch (step) {
    case "location":
      response = "Which city are you looking to live in? I can help you find accommodation in cities like Manchester, London, Birmingham, Leeds, and more!";
      break;
      
    case "budget":
      response = `Great choice, ${prefs.city}! 🏙️ Now, what's your budget? You can tell me per week or per month - for example, "around £150 per week" or "£600 a month".`;
      break;
      
    case "vibe":
      response = `Got it - ${prefs.budget} budget in ${prefs.city}. 👍 Last question: What vibe are you looking for? Are you after somewhere social and lively, quiet and studious, or a balanced mix of both?`;
      break;
      
    case "finalize":
      // Build the summary
      const vibeEmoji = prefs.vibe?.includes("social") ? "🎉" : 
                        prefs.vibe?.includes("quiet") ? "📚" : 
                        prefs.vibe?.includes("modern") ? "✨" : "🏠";
      
      response = `Perfect! ${vibeEmoji} I've found some great ${prefs.vibe || "matching"} accommodations in ${prefs.city} within your ${prefs.budget} budget. Here are my top picks for you!`;
      
      return { response, shouldFinalize: true, step };
  }

  return { response, shouldFinalize: false, step };
}

// City-specific student accommodation database
const STUDENT_ACCOMMODATIONS: Record<string, Array<{
  name: string;
  type: "social" | "quiet" | "premium" | "budget";
  basePrice: number;
  features: string[];
  distance: string;
}>> = {
  "Manchester": [
    { name: "iQ Manchester Gardens", type: "social", basePrice: 189, features: ["Rooftop terrace", "Cinema room", "24/7 gym"], distance: "5 min to MMU" },
    { name: "Unite Students - Oxford Place", type: "quiet", basePrice: 159, features: ["Study rooms", "Quiet floors", "Bills included"], distance: "8 min to UoM" },
    { name: "Vita Student - First Street", type: "premium", basePrice: 219, features: ["En-suite", "Spa", "Sky lounge"], distance: "City centre" },
    { name: "Liberty Living - Liberty Point", type: "budget", basePrice: 139, features: ["Bills included", "Laundry", "Common room"], distance: "10 min to campus" },
    { name: "Student Roost - Lambert & Fairfield", type: "social", basePrice: 175, features: ["Events team", "Games room", "Courtyard"], distance: "Fallowfield" },
  ],
  "London": [
    { name: "Unite Students - Emily Bowes Court", type: "social", basePrice: 289, features: ["400+ rooms", "Events", "Near tube"], distance: "Zone 3" },
    { name: "iQ Shoreditch", type: "premium", basePrice: 349, features: ["Rooftop", "Gym", "Study pods"], distance: "East London" },
    { name: "Urbanest King's Cross", type: "quiet", basePrice: 269, features: ["Quiet study", "Library", "24/7 security"], distance: "5 min to UCL" },
    { name: "Chapter Portobello", type: "premium", basePrice: 319, features: ["Cinema", "Spa", "Concierge"], distance: "Notting Hill" },
    { name: "Nido Spitalfields", type: "social", basePrice: 279, features: ["Social events", "Sky lounge", "Gym"], distance: "East End" },
  ],
  "Leeds": [
    { name: "iQ Leeds", type: "social", basePrice: 159, features: ["Events", "Gym", "Cinema"], distance: "City centre" },
    { name: "Unite Students - The Tannery", type: "quiet", basePrice: 139, features: ["Study spaces", "Bills included"], distance: "Near campus" },
    { name: "Vita Student Leeds", type: "premium", basePrice: 189, features: ["En-suite", "Breakfast included", "Spa"], distance: "Headrow" },
    { name: "Student Roost - Pennine House", type: "budget", basePrice: 119, features: ["Affordable", "Good location"], distance: "10 min walk" },
  ],
  "Birmingham": [
    { name: "Unite Students - Staniforth House", type: "social", basePrice: 165, features: ["Social spaces", "Events"], distance: "Near BCU" },
    { name: "iQ Birmingham", type: "premium", basePrice: 199, features: ["Brand new", "Gym", "Cinema"], distance: "City centre" },
    { name: "The Toybox", type: "quiet", basePrice: 149, features: ["Study rooms", "Quiet environment"], distance: "Digbeth" },
    { name: "Nature House", type: "budget", basePrice: 129, features: ["Bills included", "Garden"], distance: "Selly Oak" },
  ],
  "default": [
    { name: "Student Village", type: "social", basePrice: 155, features: ["Community events", "Common room"], distance: "Near campus" },
    { name: "Campus Lodge", type: "quiet", basePrice: 135, features: ["Study spaces", "Quiet hours"], distance: "5 min walk" },
    { name: "The Student Hub", type: "premium", basePrice: 185, features: ["En-suite", "Gym", "Modern"], distance: "City centre" },
    { name: "Budget Studios", type: "budget", basePrice: 115, features: ["Affordable", "Bills included"], distance: "10 min to uni" },
  ],
};

// Generate realistic property recommendations
function generateRecommendations(prefs: UserPreferences) {
  const city = prefs.city || "the city";
  
  // Parse budget for pricing
  let budgetNum = 180;
  let isWeekly = true;
  if (prefs.budget) {
    const match = prefs.budget.match(/(\d+)/);
    if (match) budgetNum = parseInt(match[1]);
    isWeekly = prefs.budget.includes("week");
  }

  // Convert monthly to weekly for comparison
  const weeklyBudget = isWeekly ? budgetNum : Math.round(budgetNum / 4.3);
  
  // Determine preferred type based on vibe
  const isQuiet = prefs.vibe?.includes("quiet") || prefs.vibe?.includes("studious");
  const isSocial = prefs.vibe?.includes("social") || prefs.vibe?.includes("lively");
  const isModern = prefs.vibe?.includes("modern") || prefs.vibe?.includes("upscale");
  const isBudget = prefs.vibe?.includes("budget");

  const preferredType = isBudget ? "budget" : isQuiet ? "quiet" : isSocial ? "social" : isModern ? "premium" : "social";

  // Get accommodations for city (or default)
  const cityKey = Object.keys(STUDENT_ACCOMMODATIONS).find(
    k => k.toLowerCase() === city.toLowerCase()
  ) || "default";
  
  const accommodations = STUDENT_ACCOMMODATIONS[cityKey];

  // Sort by preference match and budget fit
  const scored = accommodations.map(acc => {
    let score = 0;
    // Type match
    if (acc.type === preferredType) score += 50;
    // Budget fit (closer to budget = better)
    const priceDiff = Math.abs(acc.basePrice - weeklyBudget);
    score += Math.max(0, 50 - priceDiff);
    // Within budget bonus
    if (acc.basePrice <= weeklyBudget + 20) score += 20;
    
    return { ...acc, score };
  }).sort((a, b) => b.score - a.score);

  // Take top 3
  const top3 = scored.slice(0, 3);

  // Format for display
  return top3.map(acc => {
    const displayPrice = isWeekly ? `£${acc.basePrice}/week` : `£${Math.round(acc.basePrice * 4.3)}/month`;
    const cityName = cityKey === "default" ? city : cityKey;
    
    return {
      title: cityKey === "default" ? `${acc.name} - ${city}` : acc.name,
      price: displayPrice,
      summary: `${acc.features.slice(0, 2).join(", ")}. ${acc.distance}. ${prefs.moveInDate ? `Available ${prefs.moveInDate}.` : "Flexible dates."}`,
    };
  });
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

    console.log("[Chat] User said:", message);
    console.log("[Chat] Current prefs:", existingPrefs);

    // Extract/update preferences from user message
    const preferences = extractPreferences(message, existingPrefs);
    
    console.log("[Chat] Updated prefs:", preferences);

    // Generate response based on current step
    const { response, shouldFinalize, step } = generateResponse(message, preferences);

    console.log("[Chat] Step:", step, "| Response:", response.substring(0, 50) + "...");

    // Generate recommendations if finalizing
    const recommendations = shouldFinalize ? generateRecommendations(preferences) : null;

    return NextResponse.json({
      response,
      preferences,
      shouldFinalize,
      recommendations,
      currentStep: step,
    });

  } catch (error) {
    console.error("[Voice Concierge Chat] Error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
