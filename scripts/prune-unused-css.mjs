import fs from 'fs';
import path from 'path';

const UNUSED_CLASSES = {
  'atlas-cronicas.css': [
    'av2-chapter-body',
    'av2-chapter-paragraph'
  ],
  'atlas-dioses.css': [
    'av2-god-detail-sigil',
    'av2-god-detail-head'
  ],
  'atlas-home.css': [
    'av2-latest-pagination',
    'av2-latest-pag-arrow',
    'av2-latest-pag-count'
  ],
  'atlas-layout.css': [
    'av2-wrap',
    'av2-sr-only',
    'av2-nav-links',
    'av2-shortcut',
    'av2-shortcut-blurb',
    'av2-hero-top',
    'av2-dock-label',
    'av2-dock-item',
    'av2-dock-item--medallion',
    'av2-dock-icon--medallion',
    'av2-entity-detail-artifact',
    'av2-domain-detail-link',
    'av2-domain-context',
    'av2-domain-context-body',
    'av2-page-scene-head',
    'av2-page-scene-eyebrow',
    'av2-page-scene-subtitle',
    'av2-domain-stage',
    'av2-domain-stage-frame',
    'av2-title-copper'
  ],
  'atlas-lugares.css': [
    'av2-immersive-bg--soft',
    'av2-immersive-bg--normal',
    'av2-immersive-bg--strong',
    'av2-ld-hero',
    'av2-ld-hero-img',
    'av2-ld-hero-veil',
    'av2-ld-hero-text',
    'av2-ld-title',
    'av2-ld-tagline',
    'av2-ld-grid',
    'av2-ld-grid--single',
    'av2-ld-prose',
    'av2-ld-section-title',
    'av2-ld-card',
    'av2-ld-card-title',
    'av2-ld-dl',
    'av2-ld-gallery-wrap',
    'av2-ld-gallery-head',
    'av2-ld-gallery-sub',
    'av2-ld-gallery',
    'av2-ld-gthumb',
    'av2-ld-gthumb-link',
    'av2-ld-gthumb-cap',
    'av2-ld-gthumb-name',
    'av2-ld-gthumb-sub'
  ],
  'atlas-nav.css': [
    'av2-nav-link',
    'av2-nav-link--soon',
    'av2-nav-action--medallion'
  ],
  'atlas-personajes.css': [
    'av2-card-initials',
    'av2-detail-portrait-initials'
  ],
  'atlas-reproductor.css': [
    'av2-music--float',
    'av2-music--bar'
  ],
  'atlas-tokens.css': [
    'av2-gear-layer',
    'av2-gear-wrap',
    'av2-gear-wrap--left',
    'av2-gear-wrap--right',
    'av2-gear-wrap--right-sm'
  ]
};

// A very robust parser that walks CSS and removes rules matching unused classes.
// Handles media queries by preserving their structure.
function pruneCSS(content, classesToRemove) {
  const targets = new Set(classesToRemove.map(c => `.${c}`));
  
  // We parse CSS into chunks: either comments, top-level rules, or @media blocks
  // For top-level rules and nested rules, we filter selectors.
  
  let i = 0;
  let result = '';
  
  function skipWhitespaceAndComments() {
    let start = i;
    while (i < content.length) {
      if (content[i] === '/' && content[i+1] === '*') {
        i += 2;
        while (i < content.length && !(content[i] === '*' && content[i+1] === '/')) {
          i++;
        }
        i += 2;
      } else if (/\s/.test(content[i])) {
        i++;
      } else {
        break;
      }
    }
    return content.slice(start, i);
  }

  function parseBlock() {
    let start = i;
    let braceCount = 0;
    let inBraces = false;
    
    while (i < content.length) {
      const char = content[i];
      if (char === '/' && content[i+1] === '*') {
        // Skip comment inside block
        i += 2;
        while (i < content.length && !(content[i] === '*' && content[i+1] === '/')) {
          i++;
        }
        i += 2;
        continue;
      }
      
      if (char === '{') {
        braceCount++;
        inBraces = true;
      } else if (char === '}') {
        braceCount--;
      }
      
      i++;
      
      if (inBraces && braceCount === 0) {
        break;
      }
    }
    return content.slice(start, i);
  }

  while (i < content.length) {
    const ws = skipWhitespaceAndComments();
    result += ws;
    
    if (i >= content.length) break;
    
    const blockStart = i;
    const block = parseBlock();
    
    if (block.trim().startsWith('@media') || block.trim().startsWith('@keyframes')) {
      // It's a media query or keyframe block, recursively prune its contents!
      // Find the first { and last }
      const firstBrace = block.indexOf('{');
      const lastBrace = block.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        const header = block.slice(0, firstBrace + 1);
        const inner = block.slice(firstBrace + 1, lastBrace);
        const footer = block.slice(lastBrace);
        const prunedInner = pruneCSS(inner, classesToRemove);
        
        // If the query became empty (no rules left inside), we can discard the media query entirely!
        if (prunedInner.trim() === '') {
          // Discard
        } else {
          result += header + prunedInner + footer;
        }
      } else {
        result += block;
      }
    } else {
      // It's a normal CSS rule
      // Split the block into selector and declaration body
      const firstBrace = block.indexOf('{');
      if (firstBrace !== -1) {
        const selectorsStr = block.slice(0, firstBrace);
        const declaration = block.slice(firstBrace);
        
        // Split selectors by comma
        const selectors = selectorsStr.split(',').map(s => s.trim());
        
        // Filter out selectors that match any of the targets
        const remainingSelectors = selectors.filter(sel => {
          // Check if selector contains any of the targets as a distinct class token
          for (const target of targets) {
            // Check if selector contains target class, e.g. .av2-wrap
            // Use regex to match target class with word boundaries or start/end
            const escTarget = target.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const targetRegex = new RegExp(`(^|\\s|\\.|#|:)${escTarget.substring(1)}(\\s|\\.|#|:|,|\\[|$)`);
            if (targetRegex.test(sel)) {
              return false;
            }
          }
          return true;
        });
        
        if (remainingSelectors.length > 0) {
          result += remainingSelectors.join(', ') + ' ' + declaration;
        } else {
          // Discarded the entire rule block!
          // We can also skip trailing newline/spaces if we want, but letting them stay is fine
        }
      } else {
        result += block;
      }
    }
  }
  
  return result;
}

for (const [file, classes] of Object.entries(UNUSED_CLASSES)) {
  const filePath = path.join('app/(atlas)', file);
  if (!fs.existsSync(filePath)) {
    console.warn(`File ${filePath} does not exist. Skipping.`);
    continue;
  }
  console.log(`Pruning ${classes.length} classes from ${file}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  const prunedContent = pruneCSS(content, classes);
  fs.writeFileSync(filePath, prunedContent, 'utf8');
}

console.log('Unused classes successfully pruned!');
