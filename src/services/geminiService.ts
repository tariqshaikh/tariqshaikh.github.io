import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface LiveTownData {
  income: number;
  homeVal: number;
  commute: number;
  pop: number;
  saleToList: number;
  eduPct: number;
  schoolRating: number;
  schoolLabel: string;
  safetyScore: number;
  safetyLabel: string;
  taxRate: number;
  avgTax: number;
  walkScore: number;
  walkLabel: string;
  hottestThings: string[];
  marketHistory: Record<string, number>;
  commuteMetros: Record<string, number>;
  taxHistory: Record<string, number>;
}

export async function fetchLiveTownData(townName: string, county: string): Promise<LiveTownData | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for the most recent 2025/2026 real estate and demographic data for ${townName}, ${county}, New Jersey. 
      Provide the following fields as a JSON object:
      - income (median household)
      - homeVal (median home value)
      - commute (avg travel time in mins)
      - pop (population)
      - saleToList (current sale-to-list percentage, e.g. 104.5)
      - eduPct (percentage with bachelor's or higher)
      - schoolRating (1-10 scale)
      - schoolLabel (e.g. "A+", "B")
      - safetyScore (1-100 scale)
      - safetyLabel (e.g. "Very Safe", "Moderate")
      - taxRate (property tax rate percentage)
      - avgTax (average annual property tax in dollars)
      - walkScore (1-100 scale)
      - walkLabel (e.g. "Very Walkable", "Car Dependent")
      - hottestThings (array of 3-5 trending local spots/restaurants/parks)
      - marketHistory (object with keys "90d", "1y", "3y" and their sale-to-list percentages)
      - commuteMetros (object with keys "NYC", "PHI", "JC" and their commute times in mins)
      - taxHistory (object with keys "1y", "3y", "5y" and their historical tax rates)`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            income: { type: Type.NUMBER },
            homeVal: { type: Type.NUMBER },
            commute: { type: Type.NUMBER },
            pop: { type: Type.NUMBER },
            saleToList: { type: Type.NUMBER },
            eduPct: { type: Type.NUMBER },
            schoolRating: { type: Type.NUMBER },
            schoolLabel: { type: Type.STRING },
            safetyScore: { type: Type.NUMBER },
            safetyLabel: { type: Type.STRING },
            taxRate: { type: Type.NUMBER },
            avgTax: { type: Type.NUMBER },
            walkScore: { type: Type.NUMBER },
            walkLabel: { type: Type.STRING },
            hottestThings: { type: Type.ARRAY, items: { type: Type.STRING } },
            marketHistory: { 
              type: Type.OBJECT,
              properties: {
                "90d": { type: Type.NUMBER },
                "1y": { type: Type.NUMBER },
                "3y": { type: Type.NUMBER }
              }
            },
            commuteMetros: { 
              type: Type.OBJECT,
              properties: {
                "NYC": { type: Type.NUMBER },
                "PHI": { type: Type.NUMBER },
                "JC": { type: Type.NUMBER }
              }
            },
            taxHistory: { 
              type: Type.OBJECT,
              properties: {
                "1y": { type: Type.NUMBER },
                "3y": { type: Type.NUMBER },
                "5y": { type: Type.NUMBER }
              }
            }
          },
          required: ["income", "homeVal", "commute", "pop", "saleToList", "eduPct", "schoolRating", "schoolLabel", "safetyScore", "safetyLabel", "taxRate", "avgTax", "walkScore", "walkLabel", "hottestThings", "marketHistory", "commuteMetros", "taxHistory"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text.trim());
    }
    return null;
  } catch (error) {
    console.error(`Error fetching live data for ${townName}:`, error);
    return null;
  }
}
