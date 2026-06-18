const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to http://localhost:3000/capitulos/82...');
    await page.goto('http://localhost:3000/capitulos/82', { waitUntil: 'networkidle' });
    
    // Wait for the active tab to be present
    await page.waitForSelector('.av2-entity-reader-tab[data-active="true"]');
    
    console.log('\n--- TABS HTML ---');
    const tabsHtml = await page.evaluate(() => {
      const container = document.querySelector('.av2-entity-reader-index');
      return container ? container.outerHTML : 'Not found';
    });
    console.log(tabsHtml);
    
    console.log('\n--- PAGE CARD HTML ---');
    const pageHtml = await page.evaluate(() => {
      const el = document.querySelector('.av2-entity-reader-page');
      return el ? el.outerHTML : 'Not found';
    });
    console.log(pageHtml);
    
    console.log('\n--- COMPUTED STYLES ---');
    const computed = await page.evaluate(() => {
      const tab = document.querySelector('.av2-entity-reader-tab[data-active="true"]');
      const pageEl = document.querySelector('.av2-entity-reader-page');
      const connector = document.querySelector('.av2-entity-reader-connector');
      const innerBorder = document.querySelector('.av2-entity-reader-inner-border');
      
      const styles = {};
      if (tab) {
        const s = window.getComputedStyle(tab);
        styles.activeTab = {
          marginLeft: s.marginLeft,
          width: s.width,
          transform: s.transform,
          zIndex: s.zIndex,
          display: s.display
        };
      } else {
        styles.activeTab = 'Not found';
      }
      
      if (pageEl) {
        const s = window.getComputedStyle(pageEl);
        styles.pageCard = {
          borderRadius: s.borderRadius,
          borderLeft: s.borderLeft,
          marginLeft: s.marginLeft
        };
      } else {
        styles.pageCard = 'Not found';
      }
      
      if (connector) {
        const s = window.getComputedStyle(connector);
        styles.connector = {
          display: s.display,
          position: s.position,
          right: s.right,
          width: s.width,
          background: s.background
        };
      } else {
        styles.connector = 'Not found';
      }
      
      if (innerBorder) {
        const s = window.getComputedStyle(innerBorder);
        styles.innerBorder = {
          display: s.display,
          inset: s.top + ' ' + s.right + ' ' + s.bottom + ' ' + s.left,
          border: s.border
        };
      } else {
        styles.innerBorder = 'Not found';
      }
      
      return styles;
    });
    
    console.log(JSON.stringify(computed, null, 2));
    
  } catch (err) {
    console.error('Error during inspection:', err);
  } finally {
    await browser.close();
  }
})();
