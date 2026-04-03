import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { NJ_COUNTIES, NJ_ENRICHED } from "./src/constants";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Route for Town Data
  app.get("/api/towns", (req, res) => {
    const enrichedData = { ...NJ_ENRICHED };
    
    // 1. Ensure EVERY town in NJ_COUNTIES exists in enrichedData
    Object.entries(NJ_COUNTIES).forEach(([county, info]) => {
      info.towns.forEach(town => {
        if (!enrichedData[town]) {
          // Generate synthetic data for missing towns
          const baseHeat = info.heat || 100;
          const seed = town.length; // simple seed
          enrichedData[town] = {
            income: 65000 + (seed * 1500) % 100000,
            homeVal: 350000 + (seed * 5000) % 800000,
            commute: 30 + (seed * 2) % 45,
            pop: 5000 + (seed * 1000) % 50000,
            saleToList: baseHeat + (seed % 5) - 2,
            eduPct: 25 + (seed * 3) % 50,
            schoolRating: 40 + (seed * 4) % 55,
            schoolLabel: (seed % 3 === 0) ? 'A' : (seed % 3 === 1 ? 'B' : 'C'),
            safetyScore: 40 + (seed * 5) % 55,
            safetyLabel: (seed % 2 === 0) ? 'Safe' : 'Average',
            taxRate: 1.5 + (seed * 0.1) % 2.5,
            avgTax: 8000 + (seed * 200) % 15000,
            walkScore: 10 + (seed * 7) % 80,
            walkLabel: (seed % 2 === 0) ? 'Car-Dependent' : 'Walkable',
            highway: 30 + (seed * 6) % 65,
          };
        }
      });
    });

    // 2. Enrich all towns with hottestThings, marketHistory, commuteMetros, and taxHistory
    Object.keys(enrichedData).forEach(town => {
      const d = enrichedData[town];
      const seed = town.length;

      if (!d.hottestThings) {
        d.hottestThings = [
          "Local Farmers Market",
          "Historic Downtown Walk",
          "Community Park Events",
          "Seasonal Town Festivals",
          "Highly-rated Local Bistro",
          "New Arts Center",
          "Boutique Shopping District"
        ];
      }

      if (!d.marketHistory) {
        const base = d.saleToList || 100;
        d.marketHistory = {
          '90d': base,
          '6m': base - 1,
          '1y': base - 3,
          '3y': base - 8,
          '5y': base - 12
        };
      }

      // Add Commute Metros
      if (!d.commuteMetros) {
        const baseCommute = d.commute || 45;
        d.commuteMetros = {
          'NYC': baseCommute,
          'PHI': Math.max(20, 120 - baseCommute), // Inverse-ish for demo
          'JC': Math.max(10, baseCommute - 15)
        };
      }

      // Add Tax History
      if (!d.taxHistory) {
        const baseTax = d.taxRate || 2.2;
        d.taxHistory = {
          '1y': baseTax,
          '3y': Math.max(1.0, baseTax - 0.2),
          '5y': Math.max(1.0, baseTax - 0.5)
        };
      }
    });
    
    res.json(enrichedData);
  });

  // API Route for Hottest Things (specific town)
  app.get("/api/hottest-things/:town", (req, res) => {
    const town = req.params.town;
    const data = NJ_ENRICHED[town];
    if (data && data.hottestThings) {
      res.json({ town, hottestThings: data.hottestThings });
    } else {
      res.status(404).json({ error: "Town not found or no data available" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
