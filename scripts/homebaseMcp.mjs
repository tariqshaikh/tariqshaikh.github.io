/**
 * Homebase MCP server — exposes the NJ housing dataset as model-callable tools.
 *
 * Design notes (this is the interesting part):
 *
 * Three curated tools cover the questions actually worth asking, and one raw
 * `query` tool is the escape hatch. That split matters: curated tools are cheap,
 * predictable, and hard to get wrong, but they can't anticipate everything.
 * Raw SQL can express anything but costs a round-trip of the model guessing at
 * your schema. Most real MCP servers need both.
 *
 * The tool *descriptions* below are the actual interface. They're the only thing
 * the model sees when deciding what to call, so they carry the domain knowledge
 * a human would need: that periods are rolling 3-month windows, that low-volume
 * towns produce noise, that some towns share a name.
 *
 * Run: node scripts/homebaseMcp.mjs
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../src/data/homebase.db');

const db = new DatabaseSync(DB_PATH, { readOnly: true });

const LATEST = db.prepare('SELECT MAX(period) p FROM market_periods').get().p;

/** Compact TSV beats JSON here — same information, roughly a third the tokens. */
function tsv(rows) {
  if (!rows.length) return 'No rows matched.';
  const cols = Object.keys(rows[0]);
  return [
    cols.join('\t'),
    ...rows.map(r => cols.map(c => (r[c] ?? '')).join('\t')),
  ].join('\n');
}

const server = new McpServer({ name: 'homebase', version: '1.0.0' });

server.registerTool(
  'town_trend',
  {
    title: 'Town trend',
    description:
      `Rolling 3-month market history for one NJ town. Each period is labelled by ` +
      `its FIRST month, so "${LATEST}" covers ${LATEST}-01 through two months later. ` +
      `Accepts a town name or slug. Data spans 2023-01 to ${LATEST}. ` +
      `Note: "Silver Lake", "Fairview", "Greenwich" and "Springfield" each name ` +
      `multiple distinct NJ places — this returns all matches with their region_id.`,
    inputSchema: {
      town: z.string().describe('Town name or slug, e.g. "Fanwood" or "fanwood"'),
      periods: z.number().int().min(1).max(42).default(12)
        .describe('How many recent periods to return (default 12)'),
    },
  },
  async ({ town, periods }) => {
    // Rank within each region_id so `periods` counts per town, not across all
    // matches — otherwise a shared name silently truncates the newest rows.
    const rows = db.prepare(`
      SELECT town, region_id, period, homes_sold, median_price, days_on_market,
             new_listings, active_listings, pending_sales
      FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY region_id ORDER BY period DESC) AS rn
        FROM market
        WHERE slug = ? OR LOWER(town) = LOWER(?)
      )
      WHERE rn <= ?
      ORDER BY region_id, period DESC
    `).all(town.toLowerCase().replace(/\s+/g, '-'), town, periods);
    return { content: [{ type: 'text', text: tsv(rows) }] };
  }
);

server.registerTool(
  'find_markets',
  {
    title: 'Screen markets',
    description:
      `Screen NJ towns by year-over-year price and inventory direction for a given ` +
      `period. YoY is computed from the dataset itself (same period, 12 windows back), ` +
      `so it works across the whole history. Always set min_homes_sold — towns selling ` +
      `2-3 homes a quarter swing wildly and will dominate any sort otherwise.`,
    inputSchema: {
      period: z.string().default(LATEST)
        .describe(`Period as YYYY-MM (default "${LATEST}", the most recent)`),
      price_direction: z.enum(['falling', 'rising', 'any']).default('any')
        .describe('Filter on YoY median price direction'),
      inventory_direction: z.enum(['falling', 'rising', 'any']).default('any')
        .describe('Filter on YoY active-listings direction'),
      min_homes_sold: z.number().int().min(0).default(20)
        .describe('Minimum homes sold in the window, to filter out noise (default 20)'),
      sort_by: z.enum(['price_yoy', 'inventory_yoy', 'homes_sold', 'median_price'])
        .default('price_yoy').describe('Sort key'),
      limit: z.number().int().min(1).max(100).default(15),
    },
  },
  async ({ period, price_direction, inventory_direction, min_homes_sold, sort_by, limit }) => {
    const dir = (col, d) =>
      d === 'falling' ? `AND ${col} < 0` : d === 'rising' ? `AND ${col} > 0` : '';
    const order = {
      price_yoy: 'price_yoy_pct ASC',
      inventory_yoy: 'inventory_yoy_pct DESC',
      homes_sold: 'homes_sold DESC',
      median_price: 'median_price DESC',
    }[sort_by];

    const rows = db.prepare(`
      SELECT town, median_price, price_yoy_pct, active_listings,
             inventory_yoy_pct, homes_sold, days_on_market
      FROM market_yoy
      WHERE period = ?
        AND homes_sold >= ?
        AND price_yoy_pct IS NOT NULL
        AND inventory_yoy_pct IS NOT NULL
        ${dir('price_yoy_pct', price_direction)}
        ${dir('inventory_yoy_pct', inventory_direction)}
      ORDER BY ${order}
      LIMIT ?
    `).all(period, min_homes_sold, limit);

    return {
      content: [{
        type: 'text',
        text: `period ${period} · price ${price_direction} · inventory ${inventory_direction} · min ${min_homes_sold} sold\n\n${tsv(rows)}`,
      }],
    };
  }
);

server.registerTool(
  'compare_towns',
  {
    title: 'Compare towns',
    description:
      'Side-by-side snapshot of several NJ towns for one period, including ' +
      'year-over-year price and inventory change. Use for "how does X stack up ' +
      'against Y" questions rather than calling town_trend repeatedly.',
    inputSchema: {
      towns: z.array(z.string()).min(2).max(12)
        .describe('Town names or slugs to compare'),
      period: z.string().default(LATEST).describe(`Period as YYYY-MM (default "${LATEST}")`),
    },
  },
  async ({ towns, period }) => {
    const slugs = towns.map(t => t.toLowerCase().replace(/\s+/g, '-'));
    const rows = db.prepare(`
      SELECT town, median_price, price_yoy_pct, homes_sold,
             active_listings, inventory_yoy_pct, days_on_market
      FROM market_yoy
      WHERE period = ? AND slug IN (${slugs.map(() => '?').join(',')})
      ORDER BY median_price DESC
    `).all(period, ...slugs);
    return { content: [{ type: 'text', text: `period ${period}\n\n${tsv(rows)}` }] };
  }
);

server.registerTool(
  'query',
  {
    title: 'Read-only SQL',
    description:
      `Escape hatch: run a read-only SELECT against the database. Use only when the ` +
      `other tools can't express the question.\n\n` +
      `Tables:\n` +
      `  towns(region_id PK, name, slug, state)\n` +
      `  market_periods(region_id, period, period_begin, period_end, homes_sold,\n` +
      `    median_price, days_on_market, new_listings, active_listings, pending_sales,\n` +
      `    price_per_sqft, *_yoy variants, source)  PK (region_id, period)\n` +
      `Views:\n` +
      `  market       — market_periods joined to town name/slug\n` +
      `  market_yoy   — adds self-computed price_yoy_pct, inventory_yoy_pct\n\n` +
      `'period' is the window's first month (YYYY-MM). Range 2023-01..${LATEST}. ` +
      `Redfin's own *_yoy columns are only populated for 2026 periods; prefer ` +
      `market_yoy for anything historical. Results capped at 200 rows.`,
    inputSchema: {
      sql: z.string().describe('A single SELECT statement'),
    },
  },
  async ({ sql }) => {
    const cleaned = sql.trim().replace(/;\s*$/, '');
    if (!/^(SELECT|WITH)\b/i.test(cleaned)) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'Only SELECT / WITH statements are allowed.' }],
      };
    }
    if (/;/.test(cleaned)) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'Multiple statements are not allowed.' }],
      };
    }
    try {
      const rows = db.prepare(cleaned).all().slice(0, 200);
      return { content: [{ type: 'text', text: tsv(rows) }] };
    } catch (err) {
      return { isError: true, content: [{ type: 'text', text: `SQL error: ${err.message}` }] };
    }
  }
);

await server.connect(new StdioServerTransport());
