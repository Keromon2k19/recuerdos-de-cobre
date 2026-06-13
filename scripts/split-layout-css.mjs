import fs from 'fs';
import path from 'path';

const layoutPath = 'app/(atlas)/atlas-layout.css';
const personajesPath = 'app/(atlas)/atlas-personajes.css';
const narrativePath = 'app/(atlas)/atlas-narrative.css';
const layoutTsxPath = 'app/(atlas)/layout.tsx';

console.log('Reading layout stylesheet...');
const layoutContent = fs.readFileSync(layoutPath, 'utf8');
const layoutLines = layoutContent.split('\n');

// Part 1: Core Layout (lines 1 to 212, index 0 to 212)
const coreLayoutPart = layoutLines.slice(0, 212).join('\n');

// Part 2: Personajes Layout (lines 213 to 456, index 212 to 456)
const personajesLayoutPart = layoutLines.slice(212, 456).join('\n');

// Part 3: Consolidated Narrative System (lines 457 to end, index 456 to end)
const narrativeLayoutPart = layoutLines.slice(456).join('\n');

console.log(`Core Layout lines: ${coreLayoutPart.split('\n').length}`);
console.log(`Personajes Layout lines: ${personajesLayoutPart.split('\n').length}`);
console.log(`Narrative Layout lines: ${narrativeLayoutPart.split('\n').length}`);

// 1. Write core back to atlas-layout.css
fs.writeFileSync(layoutPath, coreLayoutPart, 'utf8');

// 2. Append personajes layout to atlas-personajes.css
const personajesContent = fs.readFileSync(personajesPath, 'utf8');
fs.writeFileSync(personajesPath, personajesContent + '\n\n' + personajesLayoutPart, 'utf8');
console.log('Appended personajes layout to atlas-personajes.css');

// 3. Write narrative layout to atlas-narrative.css
fs.writeFileSync(narrativePath, narrativeLayoutPart, 'utf8');
console.log('Created app/(atlas)/atlas-narrative.css');

// 4. Update app/(atlas)/layout.tsx to import atlas-narrative.css
let layoutTsx = fs.readFileSync(layoutTsxPath, 'utf8');
if (!layoutTsx.includes('atlas-narrative.css')) {
  layoutTsx = layoutTsx.replace(
    'import "./atlas-layout.css";',
    'import "./atlas-layout.css";\nimport "./atlas-narrative.css";'
  );
  fs.writeFileSync(layoutTsxPath, layoutTsx, 'utf8');
  console.log('Updated app/(atlas)/layout.tsx to import atlas-narrative.css');
}

console.log('Split and reorganization completed successfully!');
