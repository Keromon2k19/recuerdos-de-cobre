import fs from 'fs';
import path from 'path';

const faccionesPath = 'app/(atlas)/atlas-facciones.css';
const layoutPath = 'app/(atlas)/atlas-layout.css';

console.log('Reading files...');
const faccionesContent = fs.readFileSync(faccionesPath, 'utf8');
const layoutContent = fs.readFileSync(layoutPath, 'utf8');

const faccionesLines = faccionesContent.split('\n');

// Line 789 is at index 788 (0-indexed)
const faccionesPart = faccionesLines.slice(0, 788).join('\n');
const layoutPart = faccionesLines.slice(788).join('\n');

console.log(`Facciones lines before split: ${faccionesLines.length}`);
console.log(`Writing Facciones part: ${faccionesPart.split('\n').length} lines`);
console.log(`Appending layout part: ${layoutPart.split('\n').length} lines`);

fs.writeFileSync(faccionesPath, faccionesPart, 'utf8');
fs.writeFileSync(layoutPath, layoutContent + '\n\n' + layoutPart, 'utf8');

console.log('Successfully moved narrative and global styles to atlas-layout.css');
