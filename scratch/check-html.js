const http = require('http');

http.get('http://localhost:3000/capitulos', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    // Find the section for capitulos or article tags
    const articles = [];
    let idx = 0;
    while (true) {
      idx = data.indexOf('<article', idx);
      if (idx === -1) break;
      const endIdx = data.indexOf('</article>', idx);
      articles.push(data.slice(idx, endIdx + 10));
      idx = endIdx + 10;
    }
    console.log(`Found ${articles.length} articles.`);
    if (articles.length > 0) {
      console.log('--- FIRST ARTICLE MARKUP ---');
      console.log(articles[0].slice(0, 1500)); // print first 1500 chars
    }
  });
}).on('error', (err) => {
  console.error('Error fetching:', err.message);
});
