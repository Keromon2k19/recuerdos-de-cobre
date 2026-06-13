import fs from 'fs';
import path from 'path';

const layoutPath = 'app/(atlas)/atlas-layout.css';
const ATLAS_DIR = 'app/(atlas)';
const COMPONENTS_DIR = 'components/atlas';

function getFiles(dir, ext) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath, ext));
    } else if (filePath.endsWith(ext)) {
      results.push(filePath);
    }
  });
  return results;
}

const tsxFiles = [
  ...getFiles(ATLAS_DIR, '.tsx'),
  ...getFiles(COMPONENTS_DIR, '.tsx')
];

const tsxContents = tsxFiles.map(file => ({
  name: path.basename(file),
  content: fs.readFileSync(file, 'utf8')
}));

// Find all classes defined in atlas-layout.css
const content = fs.readFileSync(layoutPath, 'utf8');
const classRegex = /\.av2-([a-zA-Z0-9_-]+)/g;
const classes = new Set();
let match;
while ((match = classRegex.exec(content)) !== null) {
  classes.add(`av2-${match[1]}`);
}

console.log(`Auditing ${classes.size} classes defined in atlas-layout.css...`);

const unused = [];
const dynamicPrefixes = [
  'av2-btn--',
  'av2-add-tone--',
  'av2-reward--',
  'av2-god-profile-art--',
  'av2-god-detail-sigil--',
  'av2-gear-wrap--'
];

for (const className of classes) {
  let isUsed = false;
  
  // Check exact word boundaries in any TSX file
  for (const tsx of tsxContents) {
    // Escape className for regex
    const escClass = className.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    // Word boundary regex that matches inside quotes, template literals, or class lists
    const regex = new RegExp(`(^|\\s|'|"|\`|{)${escClass}(?=$|\\s|'|"|\`|})`);
    
    if (regex.test(tsx.content)) {
      isUsed = true;
      break;
    }
  }

  // Check if it matches a known dynamic pattern
  if (!isUsed) {
    for (const prefix of dynamicPrefixes) {
      if (className.startsWith(prefix)) {
        isUsed = true; // assume dynamic
        break;
      }
    }
  }

  if (!isUsed) {
    unused.push(className);
  }
}

console.log(`\nFound ${unused.length} UNUSED classes out of ${classes.size}:`);
console.log(unused);
