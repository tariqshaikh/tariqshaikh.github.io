import fs from 'fs';

const files = ['src/components/TownComparator.tsx', 'src/components/Portfolio.tsx'];

const replacements = {
  '#F7FBFF': '#EDE9DC',
  '#E8F4FB': '#E7E5D9',
  '#0471A4': '#867DB9',
  '#D4E8F0': '#CAC5B0',
  '#C8E6F5': '#C1BED2',
  '#6E8A96': '#7A7596',
  '#1A1C1E': '#2A2833',
  '#3D4347': '#4A4754',
  '#035480': '#6B639B'
};

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  for (const [oldColor, newColor] of Object.entries(replacements)) {
    // Case insensitive replacement for hex colors
    const regex = new RegExp(oldColor, 'gi');
    content = content.replace(regex, newColor);
  }
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
}
