const fs = require('fs');
const path = require('path');

// Sources are merged in order — later entries win on overlapping periods.
// The base tracker carries 2023 history; the refresh carries revised 2026 data
// plus periods the base file predates.
const SOURCES = [
  { file: 'redfin_market_tracker.csv', dates: 'iso' },      // 2023-01-01
  { file: 'redfin_Jan_to_2026_Aug.csv', dates: 'us-short' }, // 1/1/26
];

const dataDir = path.join(__dirname, '../src/data');
const outputPath = path.join(dataDir, 'njSeasonality.json');

function nameToSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
}

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseNum(v) {
  if (!v || v === 'NA' || v.trim() === '') return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : Math.round(n * 10) / 10;
}

// Both formats reduce to a "YYYY-MM" period key.
function toPeriod(raw, format) {
  if (!raw) return null;
  if (format === 'iso') {
    return /^\d{4}-\d{2}/.test(raw) ? raw.substring(0, 7) : null;
  }
  // us-short: M/D/YY → 20YY-MM
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (!m) return null;
  return `20${m[3]}-${m[1].padStart(2, '0')}`;
}

// slug -> { name, regions: Map(regionId -> Map(period -> entry)) }
//
// Two levels, deliberately. Keying only on "<regionId>|<period>" in a single
// flat map stopped same-named towns from OVERWRITING each other, but then let
// them COEXIST under one slug instead: NJ has three Silver Lakes, two
// Springfields, two Greenwiches and two Fairviews, so those slugs ended up
// with 2-3 entries per month — 209 duplicate month-rows in total. The app
// looks data up by name-slug and charts every row it finds, so those towns
// rendered several unrelated markets as one jagged series.
//
// Grouping by region first keeps each real market intact and makes the
// collision explicit, so flattening can pick exactly one region per slug.
const towns = {};
const stats = [];

for (const source of SOURCES) {
  const csvPath = path.join(dataDir, source.file);
  if (!fs.existsSync(csvPath)) {
    console.warn(`  ! skipping missing source: ${source.file}`);
    continue;
  }

  const lines = fs.readFileSync(csvPath, 'utf-8').split('\n').filter(l => l.trim());
  const header = parseCSVLine(lines[0]);
  const col = {};
  header.forEach((c, i) => { col[c.trim()] = i; });

  const required = [
    'REGION TYPE', 'REGION NAME', 'REGION ID', 'PERIOD BEGIN',
    'NEW LISTINGS', 'HOMES SOLD', 'MEDIAN DAYS ON MARKET (DAYS)',
    'MEDIAN SALE PRICE NSA ($)', 'ACTIVE LISTINGS',
  ];
  const missing = required.filter(c => col[c] === undefined);
  if (missing.length) {
    throw new Error(`${source.file} is missing columns: ${missing.join(', ')}`);
  }

  let added = 0;
  let replaced = 0;

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < required.length) continue;

    if (fields[col['REGION TYPE']] !== 'City') continue;

    const regionName = fields[col['REGION NAME']];
    if (!regionName.endsWith(', NJ')) continue;

    const period = toPeriod(fields[col['PERIOD BEGIN']], source.dates);
    if (!period) continue;

    const year = parseInt(period.substring(0, 4), 10);
    if (year < 2023 || year > 2026) continue;

    const townName = regionName.replace(', NJ', '');
    const slug = nameToSlug(townName);
    const regionId = fields[col['REGION ID']];

    if (!towns[slug]) towns[slug] = { name: townName, regions: new Map() };
    if (!towns[slug].regions.has(regionId)) towns[slug].regions.set(regionId, new Map());
    const months = towns[slug].regions.get(regionId);
    if (months.has(period)) replaced++; else added++;

    months.set(period, {
      period,
      newListings: parseNum(fields[col['NEW LISTINGS']]),
      homesSold: parseNum(fields[col['HOMES SOLD']]),
      daysOnMarket: parseNum(fields[col['MEDIAN DAYS ON MARKET (DAYS)']]),
      medianPrice: parseNum(fields[col['MEDIAN SALE PRICE NSA ($)']]),
      activeListings: parseNum(fields[col['ACTIVE LISTINGS']]),
    });
  }

  stats.push({ file: source.file, added, replaced });
  console.log(`  ${source.file}: +${added} new, ${replaced} refreshed`);
}

// Flatten to the shape the app consumes, sorted chronologically, exactly one
// region per slug.
//
// Where a name is shared, we have to choose: the app resolves a town to a slug
// by name and has nowhere to put a second market under it. Redfin's export has
// no county column (only LAST UPDATED, FREQUENCY, PERIOD BEGIN/END, REGION
// ID/TYPE/NAME and the metrics), so there is no honest way to label which
// Springfield is which — inventing a county would be worse than choosing one.
// Ranked by coverage, then market size, then id so the pick is stable across
// rebuilds rather than dependent on CSV row order. regionId is recorded in the
// output so the choice is auditable.
const result = {};
const collisions = [];

for (const slug in towns) {
  const { name, regions } = towns[slug];
  const ranked = [...regions.entries()]
    .map(([id, months]) => ({
      id,
      months,
      periods: months.size,
      sold: [...months.values()].reduce((a, m) => a + (m.homesSold || 0), 0),
    }))
    .sort((a, b) => b.periods - a.periods || b.sold - a.sold || String(a.id).localeCompare(String(b.id)));

  const winner = ranked[0];
  if (ranked.length > 1) collisions.push({ name, kept: winner, dropped: ranked.slice(1) });

  result[slug] = {
    name,
    regionId: Number(winner.id),
    months: [...winner.months.values()].sort((a, b) => a.period.localeCompare(b.period)),
  };
}

const slugs = Object.keys(result);
const allPeriods = [...new Set(slugs.flatMap(s => result[s].months.map(m => m.period)))].sort();
console.log(`\nParsed ${slugs.length} NJ cities`);
console.log(`Coverage: ${allPeriods[0]} → ${allPeriods[allPeriods.length - 1]} (${allPeriods.length} periods)`);

// The bug this script shipped with was silent: the JSON looked fine and only
// the chart was wrong. Fail the build instead of writing a file the app will
// render as a jagged line.
const dupes = slugs
  .map(s => {
    const periods = result[s].months.map(m => m.period);
    const seen = new Set();
    const repeated = [...new Set(periods.filter(p => seen.size === seen.add(p).size))];
    return { slug: s, repeated };
  })
  .filter(d => d.repeated.length);

if (dupes.length) {
  throw new Error(
    `${dupes.length} slug(s) have more than one row for the same month, which charts as a ` +
    `jagged line: ${dupes.slice(0, 5).map(d => `${d.slug} (${d.repeated.length})`).join(', ')}`
  );
}
console.log(`Verified: one row per month for all ${slugs.length} towns`);

if (collisions.length) {
  console.log(`\n${collisions.length} shared town name(s) — Redfin's export has no county column, so one region was kept per name:`);
  for (const c of collisions) {
    console.log(`  ${c.name}: kept region ${c.kept.id} (${c.kept.periods} months, ${c.kept.sold} homes sold)`);
    for (const d of c.dropped) {
      console.log(`     dropped region ${d.id} (${d.periods} months, ${d.sold} homes sold)`);
    }
  }
}

['montclair', 'ridgewood', 'westfield', 'hoboken', 'princeton'].forEach(slug => {
  const t = result[slug];
  if (t) {
    const sample = t.months.slice(-3).map(m => `${m.period}: ${m.newListings} listings`).join(', ');
    console.log(`  ✓ ${t.name} (${t.months.length} months): ${sample}`);
  } else {
    console.log(`  ✗ ${slug} NOT FOUND`);
  }
});

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log(`\nSaved → ${outputPath}`);
