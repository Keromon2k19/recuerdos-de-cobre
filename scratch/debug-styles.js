const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to http://localhost:3000/capitulos...');
    await page.goto('http://localhost:3000/capitulos', { waitUntil: 'networkidle' });
    
    // Select the first preview card
    const cardSelector = '.av2-chapter-preview';
    await page.waitForSelector(cardSelector);
    
    console.log('\n--- DOM HIERARCHY ---');
    const hierarchy = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return 'Not found';
      
      function getTree(node, depth = 0) {
        let str = '  '.repeat(depth) + `<${node.tagName.toLowerCase()} class="${node.className}">\n`;
        for (const child of node.children) {
          str += getTree(child, depth + 1);
        }
        return str;
      }
      return getTree(el);
    }, cardSelector);
    console.log(hierarchy);
    
    console.log('--- COMPUTED STYLES ---');
    const styles = await page.evaluate((sel) => {
      const preview = document.querySelector(sel);
      if (!preview) return null;
      
      const elements = {
        preview: preview,
        head: preview.querySelector('.av2-chapter-head'),
        body: preview.querySelector('.av2-chapter-resumen-body'),
        summary: preview.querySelector('.av2-chapter-summary'),
        details: preview.querySelector('.av2-chapter-resumen-details'),
        meta: preview.querySelector('.av2-chapter-meta'),
        media: preview.querySelector('.av2-chapter-resumen-media'),
        scene: preview.querySelector('.av2-chapter-scene'),
        img: preview.querySelector('.av2-chapter-scene img')
      };
      
      const result = {};
      for (const [name, el] of Object.entries(elements)) {
        if (!el) {
          result[name] = 'NOT FOUND';
          continue;
        }
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        result[name] = {
          tagName: el.tagName.toLowerCase(),
          className: el.className,
          display: style.display,
          position: style.position,
          width: rect.width + 'px',
          height: rect.height + 'px',
          gridArea: style.gridArea,
          gridTemplateColumns: style.gridTemplateColumns,
          gridTemplateAreas: style.gridTemplateAreas,
          minHeight: style.minHeight,
          maxHeight: style.maxHeight,
          flexDirection: style.flexDirection,
          top: style.top,
          left: style.left
        };
      }
      return result;
    }, cardSelector);
    
    console.log(JSON.stringify(styles, null, 2));
    
  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await browser.close();
  }
})();
