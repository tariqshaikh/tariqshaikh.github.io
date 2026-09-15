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

// slug -> Map("<regionId>|<period>" -> entry). Keying on REGION ID keeps towns
// that share a name (three "Silver Lake, NJ") from overwriting each other while
// still collapsing the same region reported in both files.
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
    const key = `${fields[col['REGION ID']]}|${period}`;

    if (!towns[slug]) towns[slug] = { name: townName, entries: new Map() };
    if (towns[slug].entries.has(key)) replaced++; else added++;

    towns[slug].entries.set(key, {
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

// Flatten to the shape the app consumes, sorted chronologically.
const result = {};
for (const slug in towns) {
  result[slug] = {
    name: towns[slug].name,
    months: [...towns[slug].entries.values()].sort((a, b) => a.period.localeCompare(b.period)),
  };
}

const slugs = Object.keys(result);
const allPeriods = [...new Set(slugs.flatMap(s => result[s].months.map(m => m.period)))].sort();
console.log(`\nParsed ${slugs.length} NJ cities`);
console.log(`Coverage: ${allPeriods[0]} → ${allPeriods[allPeriods.length - 1]} (${allPeriods.length} periods)`);

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
