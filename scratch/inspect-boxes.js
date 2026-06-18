const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to http://localhost:3000/capitulos/82...');
    await page.goto('http://localhost:3000/capitulos/82', { waitUntil: 'networkidle' });
    
    await page.waitForSelector('.av2-entity-reader-tab[data-active="true"]');
    
    const boxes = await page.evaluate(() => {
      const frame = document.querySelector('.av2-chapter-detail-reader');
      const nav = document.querySelector('.av2-entity-reader-index');
      const activeTab = document.querySelector('.av2-entity-reader-tab[data-active="true"]');
      const inactiveTab = document.querySelector('.av2-entity-reader-tab:not([data-active="true"])');
      const pageCard = document.querySelector('.av2-entity-reader-page');
      
      const getBox = (el) => {
        if (!el) return 'Not found';
        const rect = el.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          width: rect.width,
          top: rect.top,
          bottom: rect.bottom,
          height: rect.height
        };
      };
      
      return {
        frame: getBox(frame),
        nav: getBox(nav),
        activeTab: getBox(activeTab),
        inactiveTab: getBox(inactiveTab),
        pageCard: getBox(pageCard)
      };
    });
    
    console.log('\n--- BOUNDING BOXES (PIXELS) ---');
    console.log(JSON.stringify(boxes, null, 2));
    
  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await browser.close();
  }
})();
