/**
 * Builds src/data/homebase.db from the Redfin CSVs.
 *
 * This is deliberately richer than njSeasonality.json:
 *   - keyed on REGION ID, so towns sharing a name stay distinct
 *   - keeps pending sales + price/sqft, which the chart pipeline drops
 *   - keeps Redfin's own YoY columns where the source has them
 *   - records which CSV each row came from
 *
 * Run: node scripts/buildHomebaseDb.cjs
 */
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

// Later sources win on overlapping (region_id, period) — same precedence as parseRedfin.cjs.
const SOURCES = [
  { file: 'redfin_market_tracker.csv', dates: 'iso' },
  { file: 'redfin_Jan_to_2026_Aug.csv', dates: 'us-short' },
];

const STATE = 'NJ';
const dataDir = path.join(__dirname, '../src/data');
const dbPath = path.join(dataDir, 'homebase.db');

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) { fields.push(current.trim()); current = ''; }
    else current += char;
  }
  fields.push(current.trim());
  return fields;
}

const num = v => {
  if (!v || v === 'NA' || !v.trim()) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
};
const int = v => { const n = num(v); return n === null ? null : Math.round(n); };

function isoDate(raw, format) {
  if (!raw) return null;
  if (format === 'iso') return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (!m) return null;
  return `20${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}

const slugify = s => s.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');

if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE towns (
    region_id INTEGER PRIMARY KEY,
    name      TEXT NOT NULL,
    slug      TEXT NOT NULL,
    state     TEXT NOT NULL
  );

  -- One row per town per rolling 3-month window.
  -- 'period' is the window's first month, e.g. 2026-06 spans Jun 1 - Aug 31.
  CREATE TABLE market_periods (
    region_id           INTEGER NOT NULL REFERENCES towns(region_id),
    period              TEXT    NOT NULL,
    period_begin        TEXT    NOT NULL,
    period_end          TEXT    NOT NULL,
    homes_sold          INTEGER,
    homes_sold_yoy      REAL,
    median_price        INTEGER,
    median_price_yoy    REAL,
    days_on_market      INTEGER,
    days_on_market_yoy  REAL,
    new_listings        INTEGER,
    new_listings_yoy    REAL,
    active_listings     INTEGER,
    active_listings_yoy REAL,
    pending_sales       INTEGER,
    pending_sales_yoy   REAL,
    price_per_sqft      REAL,
    price_per_sqft_yoy  REAL,
    source              TEXT    NOT NULL,
    PRIMARY KEY (region_id, period)
  );

  CREATE INDEX idx_mp_period ON market_periods(period);
  CREATE INDEX idx_towns_slug ON towns(slug);
`);

const upsertTown = db.prepare(
  `INSERT INTO towns (region_id, name, slug, state) VALUES (?, ?, ?, ?)
   ON CONFLICT(region_id) DO UPDATE SET name = excluded.name`
);

const upsertPeriod = db.prepare(`
  INSERT INTO market_periods (
    region_id, period, period_begin, period_end,
    homes_sold, homes_sold_yoy, median_price, median_price_yoy,
    days_on_market, days_on_market_yoy, new_listings, new_listings_yoy,
    active_listings, active_listings_yoy, pending_sales, pending_sales_yoy,
    price_per_sqft, price_per_sqft_yoy, source
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  ON CONFLICT(region_id, period) DO UPDATE SET
    period_begin=excluded.period_begin, period_end=excluded.period_end,
    homes_sold=excluded.homes_sold, homes_sold_yoy=excluded.homes_sold_yoy,
    median_price=excluded.median_price, median_price_yoy=excluded.median_price_yoy,
    days_on_market=excluded.days_on_market, days_on_market_yoy=excluded.days_on_market_yoy,
    new_listings=excluded.new_listings, new_listings_yoy=excluded.new_listings_yoy,
    active_listings=excluded.active_listings, active_listings_yoy=excluded.active_listings_yoy,
    pending_sales=excluded.pending_sales, pending_sales_yoy=excluded.pending_sales_yoy,
    price_per_sqft=excluded.price_per_sqft, price_per_sqft_yoy=excluded.price_per_sqft_yoy,
    source=excluded.source
`);

for (const source of SOURCES) {
  const csvPath = path.join(dataDir, source.file);
  if (!fs.existsSync(csvPath)) { console.warn(`  ! missing source: ${source.file}`); continue; }

  const lines = fs.readFileSync(csvPath, 'utf-8').split('\n');
  const col = {};
  parseCSVLine(lines[0]).forEach((c, i) => { col[c.trim()] = i; });
  const g = (f, name) => (col[name] === undefined ? null : f[col[name]]);

  let rows = 0;
  db.exec('BEGIN');
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const f = parseCSVLine(lines[i]);

    if (g(f, 'REGION TYPE') !== 'City') continue;
    const regionName = g(f, 'REGION NAME') || '';
    if (!regionName.endsWith(`, ${STATE}`)) continue;

    const begin = isoDate(g(f, 'PERIOD BEGIN'), source.dates);
    if (!begin) continue;
    const year = +begin.substring(0, 4);
    if (year < 2023 || year > 2026) continue;

    const regionId = int(g(f, 'REGION ID'));
    if (regionId === null) continue;

    const name = regionName.replace(`, ${STATE}`, '');
    upsertTown.run(regionId, name, slugify(name), STATE);

    upsertPeriod.run(
      regionId, begin.substring(0, 7), begin, isoDate(g(f, 'PERIOD END'), source.dates) || '',
      int(g(f, 'HOMES SOLD')), num(g(f, 'HOMES SOLD YOY (%)')),
      int(g(f, 'MEDIAN SALE PRICE NSA ($)')), num(g(f, 'MEDIAN SALE PRICE NSA YOY (%)')),
      int(g(f, 'MEDIAN DAYS ON MARKET (DAYS)')), num(g(f, 'MEDIAN DAYS ON MARKET YOY (DAYS)')),
      int(g(f, 'NEW LISTINGS')), num(g(f, 'NEW LISTINGS YOY (%)')),
      int(g(f, 'ACTIVE LISTINGS')), num(g(f, 'ACTIVE LISTINGS YOY (%)')),
      int(g(f, 'PENDING SALES')), num(g(f, 'PENDING SALES YOY (%)')),
      num(g(f, 'MEDIAN NEW LISTING PRICE PER SQ.FT. ($)')),
      num(g(f, 'MEDIAN NEW LISTING PRICE PER SQ.FT. YOY (%)')),
      source.file
    );
    rows++;
  }
  db.exec('COMMIT');
  console.log(`  ${source.file}: ${rows.toLocaleString()} rows`);
}

// Flat view for ad-hoc querying, plus self-computed YoY so the whole history
// has year-over-year numbers, not just the periods Redfin shipped them for.
db.exec(`
  CREATE VIEW market AS
  SELECT t.name AS town, t.slug, t.region_id, m.*
  FROM market_periods m JOIN towns t USING (region_id);

  CREATE VIEW market_yoy AS
  SELECT
    t.name AS town, t.slug, m.region_id, m.period,
    m.homes_sold, m.median_price, m.days_on_market,
    m.new_listings, m.active_listings,
    LAG(m.median_price,    12) OVER w AS median_price_ly,
    LAG(m.active_listings, 12) OVER w AS active_listings_ly,
    ROUND(100.0 * (m.median_price - LAG(m.median_price, 12) OVER w)
          / NULLIF(LAG(m.median_price, 12) OVER w, 0), 1) AS price_yoy_pct,
    ROUND(100.0 * (m.active_listings - LAG(m.active_listings, 12) OVER w)
          / NULLIF(LAG(m.active_listings, 12) OVER w, 0), 1) AS inventory_yoy_pct
  FROM market_periods m
  JOIN towns t USING (region_id)
  WINDOW w AS (PARTITION BY m.region_id ORDER BY m.period);
`);

const one = sql => db.prepare(sql).get();
const stats = one(`
  SELECT (SELECT COUNT(*) FROM towns) AS towns,
         (SELECT COUNT(*) FROM market_periods) AS rows,
         (SELECT COUNT(DISTINCT period) FROM market_periods) AS periods,
         (SELECT MIN(period) FROM market_periods) AS first,
         (SELECT MAX(period) FROM market_periods) AS last
`);
console.log(`\n${stats.towns} towns · ${stats.rows.toLocaleString()} rows · ${stats.periods} periods (${stats.first} → ${stats.last})`);

const dupes = db.prepare(
  `SELECT slug, COUNT(*) n FROM towns GROUP BY slug HAVING n > 1 ORDER BY n DESC`
).all();
if (dupes.length) {
  console.log(`shared names kept distinct: ${dupes.map(d => `${d.slug}×${d.n}`).join(', ')}`);
}

db.close();
console.log(`\nSaved → ${dbPath}`);
