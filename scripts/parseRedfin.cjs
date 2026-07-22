const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../src/data/redfin_market_tracker.csv');
const outputPath = path.join(__dirname, '../src/data/njSeasonality.json');

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

const raw = fs.readFileSync(csvPath, 'utf-8');
const lines = raw.split('\n').filter(l => l.trim());

const header = parseCSVLine(lines[0]);
const col = {};
header.forEach((c, i) => { col[c.trim()] = i; });

console.log('Columns found:', header.map(h => h.trim()));

const result = {};

for (let i = 1; i < lines.length; i++) {
  const fields = parseCSVLine(lines[i]);
  if (fields.length < 8) continue;

  const regionType = fields[col['REGION TYPE']];
  const regionName = fields[col['REGION NAME']];

  if (regionType !== 'City') continue;
  if (!regionName.endsWith(', NJ')) continue;

  const townName = regionName.replace(', NJ', '');
  const slug = nameToSlug(townName);
  const periodBegin = fields[col['PERIOD BEGIN']];
  if (!periodBegin) continue;

  const month = periodBegin.substring(0, 7); // "2024-01"
  const year = parseInt(periodBegin.substring(0, 4));

  // Keep 2023–2026
  if (year < 2023 || year > 2026) continue;

  const entry = {
    period: month,
    newListings: parseNum(fields[col['NEW LISTINGS']]),
    homesSold: parseNum(fields[col['HOMES SOLD']]),
    daysOnMarket: parseNum(fields[col['MEDIAN DAYS ON MARKET (DAYS)']]),
    medianPrice: parseNum(fields[col['MEDIAN SALE PRICE NSA ($)']]),
    activeListings: parseNum(fields[col['ACTIVE LISTINGS']]),
  };

  if (!result[slug]) {
    result[slug] = { name: townName, months: [] };
  }
  result[slug].months.push(entry);
}

// Sort each town's months chronologically
for (const slug in result) {
  result[slug].months.sort((a, b) => a.period.localeCompare(b.period));
}

const count = Object.keys(result).length;
console.log(`\nParsed ${count} NJ cities`);

// Spot check a few key towns
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
