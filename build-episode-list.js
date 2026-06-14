/**
 * build-episode-list.js
 * Erzeugt aus der vollen episodes.json eine schlanke episodes-list.json nur mit
 * den Feldern, die der Browser fuer die Episodenliste braucht (Titel, Datum,
 * Kategorie, Slug, Kurztext). Spart ~90% Groesse, da die langen HTML-Beschreibungen
 * (content/seo_content/itunes.summary) wegfallen.
 *
 * Laeuft im Build nach update-episodes.js. Die volle episodes.json bleibt fuer
 * generate-episode-pages.js erhalten.
 */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'assets', 'js', 'episodes.json');
const dst = path.join(__dirname, 'assets', 'js', 'episodes-list.json');

function truncate(t, n) {
  t = (t || '').replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : t.slice(0, n).replace(/\s+\S*$/, '') + '…';
}

const data = JSON.parse(fs.readFileSync(src, 'utf-8'));
const items = (data.items || []).map(ep => {
  const snippet = truncate(ep.contentSnippet || ep.description || '', 220);
  return {
    title: ep.title,
    pubDate: ep.pubDate,
    category: ep.category,
    safe_title: ep.safe_title,
    description: snippet,
    contentSnippet: snippet
  };
});

const out = { status: 'ok', count: items.length, items };
fs.writeFileSync(dst, JSON.stringify(out), 'utf-8');
const kb = (fs.statSync(dst).size / 1024).toFixed(0);
console.log(`[build-episode-list] ${items.length} Episoden -> episodes-list.json (${kb} KB)`);
