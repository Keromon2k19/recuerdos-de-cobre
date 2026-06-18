const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to http://localhost:3000/capitulos/82...');
    await page.goto('http://localhost:3000/capitulos/82', { waitUntil: 'networkidle' });
    
    await page.waitForSelector('.av2-entity-reader-tab[data-active="true"]');
    
    const clippingChain = await page.evaluate(() => {
      let el = document.querySelector('.av2-entity-reader-tab[data-active="true"]');
      const chain = [];
      
      while (el) {
        const style = window.getComputedStyle(el);
        chain.push({
          tagName: el.tagName.toLowerCase(),
          className: el.className,
          id: el.id,
          overflow: style.overflow,
          overflowX: style.overflowX,
          overflowY: style.overflowY,
          position: style.position,
          display: style.display,
          clip: style.clip,
          clipPath: style.clipPath
        });
        el = el.parentElement;
      }
      return chain;
    });
    
    console.log('\n--- CLIPPING ANCESTOR CHAIN ---');
    clippingChain.forEach((item, index) => {
      console.log(`${index}: <${item.tagName} class="${item.className}" id="${item.id}">`);
      console.log(`   Overflow: ${item.overflow} (X: ${item.overflowX}, Y: ${item.overflowY})`);
      console.log(`   Position: ${item.position}, Display: ${item.display}`);
      if (item.clip && item.clip !== 'auto') console.log(`   Clip: ${item.clip}`);
      if (item.clipPath && item.clipPath !== 'none') console.log(`   ClipPath: ${item.clipPath}`);
    });
    
  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await browser.close();
  }
})();
