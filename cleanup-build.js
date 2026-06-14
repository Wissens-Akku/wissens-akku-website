/**
 * cleanup-build.js
 * Letzter Build-Schritt: entfernt die volle episodes.json aus dem Deploy.
 *
 * Sie wird ausschließlich beim Build gebraucht (von build-episode-list.js und
 * generate-episode-pages.js). Der Browser lädt nur die schlanke episodes-list.json.
 * So liegen die rohen Feed-/Audio-URLs nicht öffentlich auf der Website.
 */
const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'assets', 'js', 'episodes.json');
if (fs.existsSync(p)) {
  fs.unlinkSync(p);
  console.log('[cleanup-build] episodes.json (nur Build-Quelle) aus dem Deploy entfernt.');
} else {
  console.log('[cleanup-build] episodes.json nicht vorhanden – nichts zu tun.');
}
