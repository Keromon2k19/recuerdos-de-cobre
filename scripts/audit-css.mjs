import fs from 'fs';
import path from 'path';

const ATLAS_DIR = 'app/(atlas)';
const COMPONENTS_DIR = 'components/atlas';

// Helper to list files recursively
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

// 1. Audit oklch usages
function auditOklch(cssFiles) {
  const oklchMap = new Map();
  const oklchRegex = /oklch\([^)]+\)/g;

  cssFiles.forEach((file) => {
    if (file.endsWith('atlas-tokens.css')) return; // skip tokens file
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = oklchRegex.exec(content)) !== null) {
      const val = match[0].replace(/\s+/g, ' ');
      if (!oklchMap.has(val)) {
        oklchMap.set(val, []);
      }
      oklchMap.get(val).push(path.basename(file));
    }
  });

  return oklchMap;
}

// 2. Audit defined vs used CSS classes
function auditClasses(cssFiles, tsxFiles) {
  const definedClasses = new Map(); // className -> { file, count }
  const classRegex = /\.av2-([a-zA-Z0-9_-]+)/g;

  cssFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      const className = `av2-${match[1]}`;
      if (!definedClasses.has(className)) {
        definedClasses.set(className, { file: path.basename(file), occurrences: 0 });
      }
      definedClasses.get(className).occurrences++;
    }
  });

  // Read all TSX files and look for matches
  const tsxContents = tsxFiles.map(file => ({
    name: path.basename(file),
    content: fs.readFileSync(file, 'utf8')
  }));

  const unusedClasses = [];
  const usedClasses = new Map();

  for (const [className, info] of definedClasses.entries()) {
    let used = false;
    for (const tsx of tsxContents) {
      if (tsx.content.includes(className)) {
        used = true;
        if (!usedClasses.has(className)) {
          usedClasses.set(className, []);
        }
        usedClasses.get(className).push(tsx.name);
      }
    }
    if (!used) {
      unusedClasses.push({ className, cssFile: info.file });
    }
  }

  return { definedClasses, unusedClasses, usedClasses };
}

function run() {
  console.log('=== CSS Audit: Recuerdos de Cobre ===');
  
  const cssFiles = getFiles(ATLAS_DIR, '.css');
  const tsxFiles = [
    ...getFiles(ATLAS_DIR, '.tsx'),
    ...getFiles(COMPONENTS_DIR, '.tsx')
  ];

  console.log(`Found ${cssFiles.length} CSS files.`);
  console.log(`Found ${tsxFiles.length} TSX files.`);

  // Audit OKLCH
  const oklchMap = auditOklch(cssFiles);
  console.log('\n--- Unique OKLCH declarations outside atlas-tokens.css ---');
  const sortedOklch = Array.from(oklchMap.entries()).sort((a, b) => b[1].length - a[1].length);
  console.log(`Total unique raw oklch calls: ${sortedOklch.length}`);
  console.log('Top 15 most frequent raw colors:');
  sortedOklch.slice(0, 15).forEach(([color, files]) => {
    console.log(`  - ${color} (${files.length} times in: ${[...new Set(files)].join(', ')})`);
  });

  // Audit Classes
  const { definedClasses, unusedClasses } = auditClasses(cssFiles, tsxFiles);
  console.log('\n--- CSS Class Usage Audit ---');
  console.log(`Total unique .av2- classes defined: ${definedClasses.size}`);
  console.log(`Unused .av2- classes: ${unusedClasses.length}`);
  
  // Group unused by file
  const unusedByFile = new Map();
  unusedClasses.forEach(({ className, cssFile }) => {
    if (!unusedByFile.has(cssFile)) unusedByFile.set(cssFile, []);
    unusedByFile.get(cssFile).push(className);
  });

  console.log('\nUnused classes by file:');
  for (const [file, classes] of unusedByFile.entries()) {
    console.log(`  - ${file}: ${classes.length} unused classes`);
    console.log(`    [${classes.join(', ')}]`);
  }
}

run();
