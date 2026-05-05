import "dotenv/config";
import { GoogleGenAI, Type } from "@google/genai";
import { writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Resolve project root relative to this script file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

// Dynamically import constants from the src directory
const { NJ_ENRICHED, NJ_COUNTIES } = await import(
  resolve(projectRoot, "src/constants.ts")
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const BATCH_SIZE = 3;
const BATCH_DELAY_MS = 1500;

// Build a lookup map from town name -> county name using NJ_COUNTIES
function buildTownCountyMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [county, data] of Object.entries(NJ_COUNTIES as Record<string, { towns: string[]; heat: number }>)) {
    for (const town of data.towns) {
      map[town] = county;
    }
  }
  return map;
}

async function fetchFreshTownData(townName: string, county: string): Promise<Record<string, any> | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Search for the most recent 2025/2026 real estate and demographic data for ${townName}, ${county} County, New Jersey.
      Provide the following fields as a JSON object:
      - income (median household income in dollars)
      - homeVal (median home value in dollars)
      - commute (average travel time in minutes)
      - pop (population)
      - saleToList (current sale-to-list percentage, e.g. 104.5)
      - eduPct (percentage of adults with bachelor's degree or higher)
      - schoolRating (1-10 scale)
      - schoolLabel (e.g. "A+", "B")
      - safetyScore (1-100 scale, 100 = safest)
      - safetyLabel (e.g. "Very Safe", "Moderate")
      - taxRate (property tax rate as a percentage)
      - avgTax (average annual property tax in dollars)
      - walkScore (1-100 scale)
      - walkLabel (e.g. "Very Walkable", "Car-Dependent")
      - hottestThings (array of 3-5 trending local spots, restaurants, parks, or attractions)
      - marketHistory (object with keys "90d", "1y", "3y" and their sale-to-list percentages as numbers)
      - commuteMetros (object with keys "NYC", "PHI", "JC" and their commute times in minutes as numbers)
      - taxHistory (object with keys "1y", "3y", "5y" and their historical property tax rates as numbers)
      - highway (0-100 score for regional highway access based on proximity to major NJ interstates such as GSP, Turnpike, I-78, I-80, I-287, Route 1, Route 9, Route 18, Route 206, Route 202)
      - localScene (0-100 score for quality of local restaurants, downtown scene, and nightlife)`,
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
                "3y": { type: Type.NUMBER },
              },
            },
            commuteMetros: {
              type: Type.OBJECT,
              properties: {
                NYC: { type: Type.NUMBER },
                PHI: { type: Type.NUMBER },
                JC: { type: Type.NUMBER },
              },
            },
            taxHistory: {
              type: Type.OBJECT,
              properties: {
                "1y": { type: Type.NUMBER },
                "3y": { type: Type.NUMBER },
                "5y": { type: Type.NUMBER },
              },
            },
            highway: { type: Type.NUMBER },
            localScene: { type: Type.NUMBER },
          },
          required: [
            "income",
            "homeVal",
            "commute",
            "pop",
            "saleToList",
            "eduPct",
            "schoolRating",
            "schoolLabel",
            "safetyScore",
            "safetyLabel",
            "taxRate",
            "avgTax",
            "walkScore",
            "walkLabel",
            "hottestThings",
            "marketHistory",
            "commuteMetros",
            "taxHistory",
            "highway",
            "localScene",
          ],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text.trim());
    }
    return null;
  } catch (error) {
    throw error;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const townCountyMap = buildTownCountyMap();
  const allTowns = Object.keys(NJ_ENRICHED as Record<string, any>);
  const total = allTowns.length;

  console.log(`Starting refresh for ${total} towns in batches of ${BATCH_SIZE}...\n`);

  const result: Record<string, any> = {};

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = allTowns.slice(i, i + BATCH_SIZE);

    const batchPromises = batch.map(async (townName, batchIdx) => {
      const globalIdx = i + batchIdx + 1;
      const county = townCountyMap[townName] ?? "Unknown";
      console.log(`[${globalIdx}/${total}] Fetching ${townName}, ${county}...`);

      try {
        const freshData = await fetchFreshTownData(townName, county);
        if (freshData) {
          result[townName] = freshData;
        } else {
          console.warn(`  -> No data returned for ${townName}, keeping original.`);
          result[townName] = (NJ_ENRICHED as Record<string, any>)[townName];
        }
      } catch (error) {
        console.error(`  -> Error fetching ${townName}:`, error);
        console.warn(`  -> Keeping original data for ${townName}.`);
        result[townName] = (NJ_ENRICHED as Record<string, any>)[townName];
      }
    });

    await Promise.all(batchPromises);

    // Delay between batches (but not after the last batch)
    if (i + BATCH_SIZE < total) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  // Write output file
  const outDir = resolve(projectRoot, "src/data");
  mkdirSync(outDir, { recursive: true });

  const outPath = resolve(outDir, "njEnriched.generated.ts");
  const timestamp = new Date().toISOString();
  const fileContent = `// Auto-generated by scripts/refreshData.ts — ${timestamp}
export const NJ_ENRICHED_FRESH: Record<string, any> = ${JSON.stringify(result, null, 2)};
`;

  writeFileSync(outPath, fileContent, "utf-8");

  console.log(`\nWrote ${Object.keys(result).length} towns to src/data/njEnriched.generated.ts`);
  console.log(
    "\nDone. Copy the export from src/data/njEnriched.generated.ts into src/constants.ts to apply the refresh."
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
