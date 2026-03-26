import fs from 'fs';

const reverseReplacements = {
  '#EDE9DC': '#F7FBFF',
  '#E7E5D9': '#E8F4FB',
  '#867DB9': '#0471A4',
  '#CAC5B0': '#D4E8F0',
  '#C1BED2': '#C8E6F5',
  '#7A7596': '#6E8A96',
  '#2A2833': '#1A1C1E',
  '#4A4754': '#3D4347',
  '#6B639B': '#035480'
};

// Portfolio.tsx specific restorations
let portfolio = fs.readFileSync('src/components/Portfolio.tsx', 'utf8');
portfolio = portfolio.replace(/from-\[#C1BED2\]/g, 'from-[#A8CDD9]');
portfolio = portfolio.replace(/hover:border-\[#C1BED2\]/g, 'hover:border-[#A8CDD9]');
portfolio = portfolio.replace(/border-\[#C1BED2\] rounded-\[2px\]/g, 'border-[#A8CDD9] rounded-[2px]');

for (const [newColor, oldColor] of Object.entries(reverseReplacements)) {
  const regex = new RegExp(newColor, 'gi');
  portfolio = portfolio.replace(regex, oldColor);
}
fs.writeFileSync('src/components/Portfolio.tsx', portfolio);

// TownComparator.tsx specific restorations
let town = fs.readFileSync('src/components/TownComparator.tsx', 'utf8');
town = town.replace(/bg-\[#867DB9\] text-\[#2A2833\] text-\[10px\]/g, 'bg-[#FFD700] text-[#1A1C1E] text-[10px]');
town = town.replace(/bg-\[#867DB9\] text-\[#2A2833\] text-\[9px\]/g, 'bg-[#FFD700] text-[#1A1C1E] text-[9px]');

// F1F3F4 was used in empty state backgrounds and D1D5DB in borders, but mapping them to E8F4FB and D4E8F0 is close enough to the original blue-tinted gray theme.
// Let's just apply the main reverse replacements.
for (const [newColor, oldColor] of Object.entries(reverseReplacements)) {
  const regex = new RegExp(newColor, 'gi');
  town = town.replace(regex, oldColor);
}
fs.writeFileSync('src/components/TownComparator.tsx', town);

console.log('Reverted colors');
