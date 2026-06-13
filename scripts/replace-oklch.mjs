import fs from 'fs';
import path from 'path';

const OKLCH_MAP = {
  // Copper and its alpha variations
  '0.715 0.118 56 / 0.08': 'var(--av2-copper-08)',
  '0.715 0.118 56 / 0.16': 'var(--av2-copper-16)',
  '0.715 0.118 56 / 0.18': 'var(--av2-copper-18)',
  '0.715 0.118 56 / 0.22': 'var(--av2-copper-22)',
  '0.715 0.118 56 / 0.28': 'var(--av2-copper-28)',
  '0.715 0.118 56 / 0.42': 'var(--av2-copper-42)',
  '0.715 0.118 56 / 0.55': 'var(--av2-copper-55)',
  '0.715 0.118 56': 'var(--av2-copper)',
  '0.808 0.126 62': 'var(--av2-copper-hi)',
  '0.49 0.075 53': 'var(--av2-copper-dim)',
  '0.328 0.052 51': 'var(--av2-copper-deep)',
  '0.49 0.075 53 / 0.12': 'var(--av2-copper-dim-12)',
  '0.715 0.118 56 / 0.1': 'var(--av2-copper-10)',
  '0.715 0.118 56 / 0.055': 'var(--av2-copper-05)',

  // Bg and its alpha variations
  '0.092 0.01 58 / 0.85': 'var(--av2-bg-opacity-85)',
  '0.092 0.01 58 / 0.55': 'var(--av2-bg-opacity-55)',
  '0.092 0.01 58 / 0.35': 'var(--av2-bg-opacity-35)',
  '0.092 0.01 58 / 0.92': 'var(--av2-bg-opacity-92)',
  '0.092 0.01 58': 'var(--av2-bg)',
  '0.138 0.013 57': 'var(--av2-bg-raised)',
  '0.29 0.04 58 / 0.16': 'var(--av2-bg-gradient-start)',
  '0.11 0.016 58': 'var(--av2-bg-empty)',

  // Panel
  '0.07 0.009 58 / 0.3': 'var(--av2-bg-panel-30)',
  '0.06 0.007 58 / 0.3': 'var(--av2-bg-panel-30)', // Standardized
  '0.07 0.009 58 / 0.48': 'var(--av2-bg-panel-48)',
  '0.065 0.008 58 / 0.72': 'var(--av2-bg-panel-72)',
  '0.172 0.016 56': 'var(--av2-bg-panel)',
  '0.21 0.019 56': 'var(--av2-bg-panel-up)',
  '0.24 0.044 55 / 0.1': 'var(--av2-bg-panel-10)',
  '0.1 0.014 58': 'var(--av2-bg-input)',
  '0.08 0.01 58 / 0.75': 'var(--av2-bg-panel-75)',
  '0.13 0.018 58 / 0.5': 'var(--av2-bg-raised-50)',

  // Dark Bg opacities
  '0.06 0.01 58 / 0.55': 'var(--av2-bg-dark-55)',
  '0.06 0.01 58 / 0.65': 'var(--av2-bg-dark-65)',
  '0.04 0.01 58 / 0.85': 'var(--av2-bg-dark-85)',
  '0.06 0.01 58 / 0.85': 'var(--av2-bg-dark-85)', // Standardized
  '0.06 0.01 58 / 0.96': 'var(--av2-bg-dark-96)',
  '0.04 0.01 58 / 0.95': 'var(--av2-bg-dark-95)',
  '0.04 0.01 55 / 0.32': 'var(--av2-bg-dark-32)',

  // Gold and Gold dim
  '0.826 0.097 82': 'var(--av2-gold)',
  '0.698 0.068 78': 'var(--av2-gold-dim)',
  '0.66 0.088 68': 'var(--av2-brass)',
  '0.745 0.146 73': 'var(--av2-amber)',

  // Rules & Shadows
  '0.268 0.021 55': 'var(--av2-rule)',
  '0.365 0.038 55': 'var(--av2-rule-up)',
  '0.49 0.072 54 / 0.18': 'var(--av2-rule-copper-18)',
  '0.49 0.072 54 / 0.34': 'var(--av2-rule-copper-34)',
  '0.9 0.05 70 / 0.05': 'var(--av2-rule-inset)',
  '0.03 0.01 55 / 0.96': 'var(--av2-shadow-base)',

  // Ink & Black
  '0.908 0.014 78': 'var(--av2-ink)',
  '0.71 0.014 76': 'var(--av2-ink-soft)',
  '0.472 0.011 70': 'var(--av2-ink-faint)',
  '0.472 0.011 70 / 0.4': 'var(--av2-ink-faint-opacity)',
  '0 0 0 / 0.36': 'var(--av2-black-36)'
};

function normalizeOklchParams(paramsStr) {
  const tokens = paramsStr.split(/[\s,]+/);
  const normalizedTokens = tokens.map(t => {
    if (t === '/') return '/';
    const num = parseFloat(t);
    if (isNaN(num)) return t;
    return num.toString();
  });
  return normalizedTokens.join(' ');
}

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

const cssFiles = getFiles('app/(atlas)', '.css');

cssFiles.forEach(file => {
  if (file.endsWith('atlas-tokens.css')) return; // skip tokens definition itself
  
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Find oklch(...) call patterns
  const oklchRegex = /oklch\(([^)]+)\)/g;
  
  content = content.replace(oklchRegex, (match, paramsStr) => {
    const normalized = normalizeOklchParams(paramsStr);
    const replacement = OKLCH_MAP[normalized];
    if (replacement) {
      return replacement;
    }
    return match; // keep original if no match in design tokens
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Replaced oklch declarations in ${path.basename(file)}`);
  }
});

console.log('OKLCH replacement execution complete!');
