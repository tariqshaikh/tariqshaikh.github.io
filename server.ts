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

  // API Route for Market Heat
  app.get("/api/market-heat", (req, res) => {
    const liveHeat: Record<string, number> = {};
    
    Object.entries(NJ_ENRICHED as Record<string, any>).forEach(([town, data]) => {
      if (data.saleToList) {
        // Add a random jitter of +/- 0.8% to simulate live market fluctuations
        const jitter = (Math.random() - 0.5) * 1.6;
        liveHeat[town] = Number((data.saleToList + jitter).toFixed(1));
      }
    });

    res.json({
      timestamp: new Date().toISOString(),
      source: "Simulated Real-Time Feed",
      data: liveHeat
    });
  });

  // API Route for Town Data
  app.get("/api/towns", (req, res) => {
    const enrichedData = { ...NJ_ENRICHED };
    
    // Ensure every town has some hottestThings and marketHistory for the demo
    Object.keys(enrichedData).forEach(town => {
      if (!enrichedData[town].hottestThings) {
        enrichedData[town].hottestThings = [
          "Local Farmers Market",
          "Historic Downtown Walk",
          "Community Park Events",
          "Seasonal Town Festivals",
          "Highly-rated Local Bistro"
        ];
      }
      if (!enrichedData[town].marketHistory) {
        const base = enrichedData[town].saleToList || 100;
        enrichedData[town].marketHistory = {
          '90d': base,
          '6m': base - 1,
          '1y': base - 3,
          '3y': base - 8,
          '5y': base - 12
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
