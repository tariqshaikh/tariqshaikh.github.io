const fs = require('fs');

const content = fs.readFileSync('src/constants.ts', 'utf8');

// A simple pseudo-random function based on town name
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const lines = content.split('\n');
let inEnriched = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export const NJ_ENRICHED')) {
    inEnriched = true;
    continue;
  }
  if (inEnriched && lines[i].startsWith('};')) {
    inEnriched = false;
    continue;
  }
  if (inEnriched) {
    // Match lines like: 'Westfield':       {income:142000,...},
    const match = lines[i].match(/^(\s*'[^']+'\s*:\s*{)(.*)(},?)$/);
    if (match) {
      const prefix = match[1];
      const inner = match[2];
      const suffix = match[3];
      
      // Extract town name
      const townMatch = lines[i].match(/^\s*'([^']+)'/);
      if (townMatch && !inner.includes('highway:')) {
        const townName = townMatch[1];
        // Generate a score between 45 and 98
        const score = 45 + (hashString(townName) % 54);
        lines[i] = `${prefix}${inner},highway:${score}${suffix}`;
      }
    }
  }
}

fs.writeFileSync('src/constants.ts', lines.join('\n'));
console.log('Done');
