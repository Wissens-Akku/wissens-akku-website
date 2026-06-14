/**
 * stamp-date.js
 * Setzt das "Stand:"-Datum in der Datenschutzerklaerung beim Build auf den
 * aktuellen Monat (z.B. "Stand: Juni 2026"). Laeuft als Teil von `npm run build`.
 */
const fs = require('fs');
const path = require('path');

const monate = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const now = new Date();
const stand = `Stand: ${monate[now.getMonth()]} ${now.getFullYear()}`;

const p = path.join(__dirname, 'datenschutz.html');
let html = fs.readFileSync(p, 'utf-8');
// Ersetzt "Stand: ..." bis zum naechsten "<" (idempotent – auch wenn das Datum schon stimmt)
const re = /Stand:[^<]*/;
if (re.test(html)) {
  fs.writeFileSync(p, html.replace(re, stand), 'utf-8');
  console.log('[stamp-date]', stand);
} else {
  console.error('[stamp-date] WARNUNG: "Stand:" nicht gefunden – nichts geaendert.');
}
