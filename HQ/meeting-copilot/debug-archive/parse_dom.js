const fs = require('fs');
const html = fs.readFileSync('/Users/krdeeksha/ELE-MEET/dom_dump.html', 'utf-8');
// remove script and style tags
const clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                  .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
// extract all text inside elements
const matches = clean.match(/>([^<]+)</g);
if (matches) {
  const texts = matches.map(m => m.slice(1, -1).trim()).filter(t => t.length > 0);
  console.log([...new Set(texts)].join('\n'));
}
